export const dynamic = "force-dynamic";

const UPSTREAM = process.env.HOOD_TESTNET_RPC ?? "https://robinhood-sepolia-rpc.publicnode.com";

// Local RPC forwarder for wallets: some networks block the official RPC,
// point the wallet at http://localhost:3000/api/rpc instead.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
  try {
    const res = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Upstream unreachable" } });
  }
}
