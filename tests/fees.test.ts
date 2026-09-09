import { describe, it, expect, vi } from "vitest";
import { verifyAndConsumePayment } from "../lib/layered/fees";

const WALLET = "0xCdbdc82A021071eE445d9f897433a7E4B4EAfD8d";
const TX = "0x" + "ab".repeat(32);
const DEPS = { rpcUrl: "https://rpc.test", vault: "0xc652d3602d255c58c9e1a9658ad64dc5636c1707", minWei: BigInt("100000000000000"), supabaseUrl: "https://db.test", serviceKey: "srv" };

function mockFetch(o: { receipt?: object | null; value?: string; seen?: unknown[]; insertStatus?: number }) {
  return vi.fn(async (url: unknown, init?: RequestInit) => {
    const u = String(url);
    if (u === "https://rpc.test") {
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (body.method === "eth_getTransactionReceipt") return { ok: true, status: 200, json: async () => ({ result: o.receipt ?? null }) };
      return { ok: true, status: 200, json: async () => ({ result: { value: o.value ?? "0x0" } }) };
    }
    if (String(init?.method ?? "GET") === "POST" || u.includes("/payments") && init?.body) {
      return { ok: (o.insertStatus ?? 201) < 300, status: o.insertStatus ?? 201, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => o.seen ?? [] };
  }) as unknown as typeof fetch;
}

const GOOD_RC = { status: "0x1", to: "0xc652d3602d255c58c9e1a9658ad64dc5636c1707", from: WALLET };

describe("verifyAndConsumePayment", () => {
  it("accepts a fresh valid payment", async () => {
    const r = await verifyAndConsumePayment(TX, WALLET, { ...DEPS, fetchFn: mockFetch({ receipt: GOOD_RC, value: "0x16345785d8a0000" }) });
    expect(r).toEqual({ ok: true });
  });

  it("rejects missing tx, failed tx, wrong vault, low value", async () => {
    expect((await verifyAndConsumePayment("x", WALLET, DEPS)).ok).toBe(false);
    const f = (receipt: object | null, value = "0x16345785d8a0000") =>
      verifyAndConsumePayment(TX, WALLET, { ...DEPS, fetchFn: mockFetch({ receipt, value }) });
    expect((await f(null)).reason).toMatch(/not found/);
    expect((await f({ ...GOOD_RC, status: "0x0" })).reason).toMatch(/failed/);
    expect((await f({ ...GOOD_RC, to: WALLET })).reason).toMatch(/vault/);
    expect((await f(GOOD_RC, "0x1")).reason).toMatch(/below price/);
  });

  it("rejects reused payments", async () => {
    const r = await verifyAndConsumePayment(TX, WALLET, { ...DEPS, fetchFn: mockFetch({ receipt: GOOD_RC, value: "0x16345785d8a0000", seen: [{ tx_hash: TX }] }) });
    expect(r.reason).toMatch(/already used/);
  });

  it("fails closed without config", async () => {
    const r = await verifyAndConsumePayment(TX, WALLET, { rpcUrl: "https://rpc.test", vault: "", supabaseUrl: undefined, serviceKey: undefined });
    expect(r.reason).toMatch(/not configured/);
  });
});

