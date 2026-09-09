"use client";

import { useCallback, useEffect, useState } from "react";

const PROXY = "0xc652d3602d255c58c9e1a9658ad64dc5636c1707";
const CHAIN_ID_HEX = "0xb626";
const OWNER_SELECTOR = "0x8da5cb5b";
const WITHDRAW_SELECTOR = "0x51cff8d9";

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const eth = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!eth?.request) throw new Error("No EVM wallet found.");
  return (await eth.request({ method, params })) as T;
}

export default function VaultAdmin() {
  const [account, setAccount] = useState("");
  const [owner, setOwner] = useState("");
  const [balance, setBalance] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("Not connected.");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (acct: string) => {
    const [ownerHex, balHex] = await Promise.all([
      rpc<string>("eth_call", [{ to: PROXY, data: OWNER_SELECTOR }, "latest"]),
      rpc<string>("eth_getBalance", [PROXY, "latest"]),
    ]);
    setOwner(`0x${ownerHex.slice(-40)}`);
    setBalance(`${Number(BigInt(balHex)) / 1e18} tETH`);
    setTo(acct);
  }, []);

  const connect = async () => {
    try {
      setBusy(true);
      setStatus("Requesting accounts…");
      const accounts = (await rpc<string[]>("eth_requestAccounts", [])) as string[];
      if (!accounts[0]) throw new Error("No account.");
      try {
        await rpc("wallet_switchEthereumChain", [{ chainId: CHAIN_ID_HEX }]);
      } catch {
        setStatus("Switch wallet to Hood Testnet (46630), then retry.");
        setBusy(false);
        return;
      }
      setAccount(accounts[0]);
      setStatus("Reading vault…");
      await refresh(accounts[0]);
      setStatus("Ready.");
    } catch (e) {
      setStatus(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
  };

  const withdraw = async () => {
    if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
      setStatus("Destination address invalid.");
      return;
    }
    try {
      setBusy(true);
      setStatus("Confirm in wallet…");
      const data = `${WITHDRAW_SELECTOR}${"0".repeat(24)}${to.slice(2).toLowerCase()}`;
      const hash = (await rpc<string>("eth_sendTransaction", [{ from: account, to: PROXY, value: "0x0", data }])) as string;
      setStatus(`Sent: ${hash} — refreshing…`);
      setTimeout(() => void refresh(account), 12000);
    } catch (e) {
      setStatus(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
  };

  useEffect(() => {
    if (!account || !owner) return;
  }, [account, owner]);

  const isOwner = account && owner && account.toLowerCase() === owner.toLowerCase();

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <main className="w-full max-w-md rounded border border-zinc-800 bg-zinc-950 p-6">
        <p className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 uppercase">Restricted · owner only</p>
        <h1 className="font-display mt-1 text-2xl font-black text-white">Fee vault</h1>
        {!account ? (
          <button
            type="button"
            onClick={() => void connect()}
            disabled={busy}
            className="mt-5 w-full cursor-pointer rounded border border-[#22c55e] bg-[#22c55e] px-4 py-2.5 font-mono text-sm font-bold text-black transition-colors hover:bg-transparent hover:text-[#22c55e] disabled:opacity-50"
          >
            {busy ? "Working…" : "Connect wallet"}
          </button>
        ) : (
          <div className="mt-5 flex flex-col gap-3 font-mono text-xs">
            <p className="text-zinc-400">
              You: <span className="text-zinc-100 break-all">{account}</span>
            </p>
            <p className="text-zinc-400">
              Owner: <span className="text-zinc-100 break-all">{owner || "…"}</span>
            </p>
            <p className="text-zinc-400">
              Vault balance: <span className="font-bold text-[#22c55e]">{balance || "…"}</span>
            </p>
            {isOwner ? (
              <>
                <label htmlFor="vault-to" className="mt-1 text-[11px] tracking-widest text-zinc-500 uppercase">
                  Withdraw to
                </label>
                <input
                  id="vault-to"
                  value={to}
                  onChange={(e) => setTo(e.target.value.trim())}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="0x…"
                  className="w-full rounded border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#22c55e] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void withdraw()}
                  disabled={busy}
                  className="cursor-pointer rounded border border-[#22c55e] bg-[#22c55e] px-4 py-2.5 font-mono text-sm font-bold text-black transition-colors hover:bg-transparent hover:text-[#22c55e] disabled:opacity-50"
                >
                  {busy ? "Working…" : "Withdraw all"}
                </button>
              </>
            ) : (
              <p role="alert" className="rounded border border-[#ef4444]/50 px-3 py-2 text-[#ef4444]">
                Connected wallet is not the owner. Withdraw hidden.
              </p>
            )}
          </div>
        )}
        <p aria-live="polite" className="mt-4 font-mono text-xs break-all text-zinc-500">
          {status}
        </p>
      </main>
    </div>
  );
}
