import { checkHold, getTierConfig } from "@/lib/layered/hold";
import { dailyUsage } from "@/lib/layered/db";

export const dynamic = "force-dynamic";

// Tells the UI which gate is live: hold-to-access or pay-per-run.
export async function GET(req: Request) {
  if (!process.env.ARIES_TOKEN_ADDRESS) {
    return Response.json({ mode: "fee" as const });
  }
  const config = getTierConfig();
  const wallet = new URL(req.url).searchParams.get("wallet") ?? "";
  const hold = await checkHold(wallet);
  if (hold.tier === 1) {
    const used = await dailyUsage(wallet);
    return Response.json({
      mode: "hold" as const,
      tier: 1 as const,
      left: Math.max(0, config.dailyLimit - used),
      dailyLimit: config.dailyLimit,
      tier1Display: config.tier1Display,
      tier2Display: config.tier2Display,
    });
  }
  return Response.json({
    mode: "hold" as const,
    tier: hold.tier,
    dailyLimit: config.dailyLimit,
    tier1Display: config.tier1Display,
    tier2Display: config.tier2Display,
  });
}
