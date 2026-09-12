import { runL1 } from "@/lib/layered/l1";
import { isChainId, validateAddress } from "@/lib/chains";
import { bumpDailyUsage, dailyUsage, logEvent } from "@/lib/layered/supabase";
import { checkHold } from "@/lib/layered/hold";
import { consumePayment, verifyPayment } from "@/lib/layered/fees";
import { emitResult, sseResponse } from "@/lib/layered/sse";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Best-effort demo throttle: 10 runs/hour/IP via Upstash Redis.
// Missing env or Redis error -> fail open (local dev has no Upstash).
async function upstashPipeline(cmds: unknown[][]): Promise<{ result: unknown }[]> {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    body: JSON.stringify(cmds),
  });
  return (await res.json()) as { result: unknown }[];
}

async function rateLimited(req: Request): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return false;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const hour = new Date().toISOString().slice(0, 13).replace(/[-T:]/g, "");
  const rlKey = `ratelimit-layered:${ip}:${hour}`;
  const rlRes = await upstashPipeline([["INCR", rlKey], ["EXPIRE", rlKey, 3600]]).catch(() => [{ result: 0 }]);
  return Number(rlRes[0]?.result ?? 0) > 10;
}

export async function POST(req: Request) {
  let chain: unknown;
  let mint: unknown;
  let wallet: unknown;
  let payTx: unknown;
  try {
    const body = await req.json();
    chain = body.chainId ?? "solana";
    mint = body.mint;
    wallet = body.wallet;
    payTx = body.payTx;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!isChainId(chain) || typeof mint !== "string" || !validateAddress(chain, mint)) {
    return Response.json({ error: "Invalid chain or address" }, { status: 400 });
  }
  // Hold-gate (opsi B) aktif otomatis saat token $ARIES ada.
  // Sebelum itu, pay-per-run ETH (opsi C) tetap jalan.
  let holdTier: 2 | 1 | 0 | -1 = -1;
  if (process.env.ARIES_TOKEN_ADDRESS) {
    if (typeof wallet !== "string") return Response.json({ error: "Wallet required" }, { status: 402 });
    const hold = await checkHold(wallet);
    holdTier = hold.tier;
    if (hold.tier === -1) return Response.json({ error: "Hold check unavailable, retry shortly" }, { status: 503 });
    if (hold.tier === 0) return Response.json({ error: "Hold at least 10,000 ARIES to analyze" }, { status: 402 });
    if (hold.tier === 1 && (await dailyUsage(wallet)) >= 5) {
      return Response.json({ error: "Daily limit reached (5/day). Hold 100,000 ARIES for unlimited." }, { status: 429 });
    }
  } else if (process.env.FEE_ENFORCED !== "0") {
    const fee = await verifyPayment(payTx, wallet);
    if (!fee.ok) return Response.json({ error: fee.reason ?? "Payment required" }, { status: 402 });
  }
  if (await rateLimited(req)) {
    return Response.json({ error: "Demo limit: 10 runs per hour per IP" }, { status: 429 });
  }
  void logEvent("run_started", wallet);
  return sseResponse((emit) =>
    emitResult(emit, async () => {
      const result = await runL1(chain, mint, { signal: req.signal, emit: (e) => emit({ ...e }) });
      if (process.env.ARIES_TOKEN_ADDRESS) {
        // Hold path: count quota AFTER success (retries stay free).
        if (holdTier === 1 && typeof wallet === "string") await bumpDailyUsage(wallet);
      } else if (process.env.FEE_ENFORCED !== "0" && typeof payTx === "string" && typeof wallet === "string") {
        // Fee path: burn the ticket only after L1 succeeds (retries stay free).
        const v = await verifyPayment(payTx, wallet);
        if (v.ok && v.amountWei) await consumePayment(payTx, wallet, v.amountWei);
      }
      return result;
    })
  );
}

