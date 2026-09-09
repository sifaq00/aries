export const FEE_VAULT_TESTNET = "0xc652d3602d255c58c9e1a9658ad64dc5636c1707";
export const FEE_PRICE_WEI = BigInt("100000000000000"); // 0.0001 ETH
export const FEE_CHAIN_ID = 46630;

export interface FeeCheck {
  ok: boolean;
  reason?: string;
}

interface FeeDeps {
  rpcUrl?: string;
  vault?: string;
  minWei?: bigint;
  supabaseUrl?: string;
  serviceKey?: string;
  fetchFn?: typeof fetch;
}

function cfg(deps: FeeDeps) {
  return {
    rpcUrl: deps.rpcUrl ?? process.env.HOOD_TESTNET_RPC ?? "https://robinhood-sepolia-rpc.publicnode.com",
    vault: (deps.vault ?? process.env.FEE_VAULT_ADDRESS ?? "").toLowerCase(),
    minWei: deps.minWei ?? BigInt(process.env.FEE_MIN_WEI ?? "100000000000000"),    supabaseUrl: deps.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: deps.serviceKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
    fetchFn: deps.fetchFn ?? fetch,
  };
}

async function rpc(fetchFn: typeof fetch, rpcUrl: string, method: string, params: unknown[]): Promise<unknown> {
  const res = await fetchFn(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  return (await res.json()) as unknown;
}

// Verify a vault payment tx, then burn it (single-use). Never throws.
export async function verifyAndConsumePayment(
  payTx: unknown,
  wallet: unknown,
  deps: FeeDeps = {}
): Promise<FeeCheck> {
  try {
    const c = cfg(deps);
    if (typeof payTx !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(payTx)) return { ok: false, reason: "Missing payment tx" };
    if (typeof wallet !== "string" || wallet.length < 20) return { ok: false, reason: "Missing wallet" };
    if (!c.vault || !c.supabaseUrl || !c.serviceKey) return { ok: false, reason: "Fee system not configured" };

    const data = (await rpc(c.fetchFn, c.rpcUrl, "eth_getTransactionReceipt", [payTx])) as {
      result?: { status?: string; to?: string; from?: string } | null;
    };
    const rc = data.result;
    if (!rc) return { ok: false, reason: "Payment not found (yet?)" };
    if (rc.status !== "0x1") return { ok: false, reason: "Payment tx failed" };
    if ((rc.to ?? "").toLowerCase() !== c.vault) return { ok: false, reason: "Payment not sent to vault" };
    if ((rc.from ?? "").toLowerCase() !== wallet.toLowerCase()) return { ok: false, reason: "Payment from different wallet" };

    const tx = (await rpc(c.fetchFn, c.rpcUrl, "eth_getTransactionByHash", [payTx])) as {
      result?: { value?: string } | null;
    };
    if (BigInt(tx.result?.value ?? "0x0") < c.minWei) return { ok: false, reason: "Payment below price" };

    const head = { apikey: c.serviceKey, Authorization: `Bearer ${c.serviceKey}` };
    const seen = await c.fetchFn(`${c.supabaseUrl}/rest/v1/payments?tx_hash=eq.${encodeURIComponent(payTx)}&select=tx_hash`, { headers: head });
    if (!seen.ok) return { ok: false, reason: "Payment ledger unreachable" };
    if (((await seen.json()) as unknown[]).length > 0) return { ok: false, reason: "Payment already used" };

    const ins = await c.fetchFn(`${c.supabaseUrl}/rest/v1/payments`, {
      method: "POST",
      headers: { ...head, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ tx_hash: payTx, wallet: wallet.toLowerCase(), amount_wei: BigInt(tx.result?.value ?? "0x0").toString(), used_at: new Date().toISOString() }),
    });
    if (!ins.ok && ins.status !== 409) return { ok: false, reason: "Payment ledger write failed" };
    if (ins.status === 409) return { ok: false, reason: "Payment already used" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "Payment verification failed" };
  }
}
