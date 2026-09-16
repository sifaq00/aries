export interface HoldResult {
  // 2 = unlimited, 1 = daily quota, 0 = below threshold, -1 = unknown (fail closed).
  tier: 2 | 1 | 0 | -1;
  balance: string;
}

interface HoldDeps {
  rpcUrl?: string;
  token?: string;
  tier1?: bigint;
  tier2?: bigint;
  fetchFn?: typeof fetch;
}

export function getTierConfig() {
  const tier1Amount = process.env.HOLD_TIER1 ?? "10000";
  const tier2Amount = process.env.HOLD_TIER2 ?? "100000";
  const rawDaily = parseInt(process.env.HOLD_TIER1_DAILY_LIMIT ?? "5", 10);
  const dailyLimit = Number.isFinite(rawDaily) && rawDaily > 0 ? rawDaily : 5;
  return {
    tier1Amount,
    tier2Amount,
    dailyLimit,
    tier1Name: "Plus",
    tier2Name: "Pro",
    tier1Display: Number(tier1Amount).toLocaleString("en-US"),
    tier2Display: Number(tier2Amount).toLocaleString("en-US"),
  };
}

function cfg(deps: HoldDeps) {
  const decimals = BigInt(process.env.HOLD_TOKEN_DECIMALS ?? "18");
  return {
    rpcUrl: deps.rpcUrl ?? process.env.HOOD_MAINNET_RPC ?? "https://rpc.mainnet.chain.robinhood.com",
    token: deps.token ?? process.env.ARIES_TOKEN_ADDRESS ?? "",
    tier1: deps.tier1 ?? BigInt(process.env.HOLD_TIER1 ?? "10000") * BigInt(10) ** decimals,
    tier2: deps.tier2 ?? BigInt(process.env.HOLD_TIER2 ?? "100000") * BigInt(10) ** decimals,
    fetchFn: deps.fetchFn ?? fetch,
  };
}

// Free on-chain read: does this wallet hold enough $ARIES? Never throws.
export async function checkHold(wallet: unknown, deps: HoldDeps = {}): Promise<HoldResult> {
  const fail: HoldResult = { tier: -1, balance: "0" };
  try {
    const c = cfg(deps);
    if (typeof wallet !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) return fail;
    if (!/^0x[0-9a-fA-F]{40}$/.test(c.token)) return fail;
    // balanceOf(address)
    const data = `0x70a08231${"0".repeat(24)}${wallet.slice(2).toLowerCase()}`;
    const res = await c.fetchFn(c.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: c.token, data }, "latest"] }),
    });
    if (!res.ok) return fail;
    const json = (await res.json()) as { result?: string };
    const balance = BigInt(json.result ?? "0x0").toString();
    if (BigInt(balance) >= c.tier2) return { tier: 2, balance };
    if (BigInt(balance) >= c.tier1) return { tier: 1, balance };
    return { tier: 0, balance };
  } catch {
    return fail;
  }
}
