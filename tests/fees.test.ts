import { describe, it, expect, vi } from "vitest";
import { verifyAndConsumePayment, verifyPayment, consumePayment } from "../lib/layered/fees";
import type { SqlFn } from "../lib/layered/db";

const WALLET = "0xCdbdc82A021071eE445d9f897433a7E4B4EAfD8d";
const TX = "0x" + "ab".repeat(32);

function mockRpc(o: { receipt?: object | null; value?: string }) {
  return vi.fn(async (url: unknown, init?: RequestInit) => {
    const u = String(url);
    if (u === "https://rpc.test") {
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (body.method === "eth_getTransactionReceipt") return { ok: true, status: 200, json: async () => ({ result: o.receipt ?? null }) };
      return { ok: true, status: 200, json: async () => ({ result: { value: o.value ?? "0x0" } }) };
    }
    throw new Error(`unexpected fetch ${u}`);
  }) as unknown as typeof fetch;
}

function mockSql(o: { seen?: unknown[]; insertOk?: boolean } = {}): SqlFn {
  return vi.fn(async (strings: TemplateStringsArray) => {
    const text = strings.join("?");
    if (text.includes("insert into payments")) {
      return o.insertOk === false ? [] : [{ tx_hash: TX }];
    }
    return o.seen ?? [];
  }) as unknown as SqlFn;
}

function deps(o: { receipt?: object | null; value?: string; seen?: unknown[]; insertOk?: boolean } = {}) {
  return {
    rpcUrl: "https://rpc.test",
    vault: "0xc652d3602d255c58c9e1a9658ad64dc5636c1707",
    minWei: BigInt("100000000000000"),
    fetchFn: mockRpc(o),
    sql: mockSql(o),
  };
}

const GOOD_RC = { status: "0x1", to: "0xc652d3602d255c58c9e1a9658ad64dc5636c1707", from: WALLET };

describe("verifyAndConsumePayment", () => {
  it("accepts a fresh valid payment", async () => {
    const r = await verifyAndConsumePayment(TX, WALLET, deps({ receipt: GOOD_RC, value: "0x16345785d8a0000" }));
    expect(r).toEqual({ ok: true });
  });

  it("rejects missing tx, failed tx, wrong vault, low value", async () => {
    expect((await verifyAndConsumePayment("x", WALLET, deps())).ok).toBe(false);
    const f = (receipt: object | null, value = "0x16345785d8a0000") => verifyAndConsumePayment(TX, WALLET, deps({ receipt, value }));
    expect((await f(null)).reason).toMatch(/not found/);
    expect((await f({ ...GOOD_RC, status: "0x0" })).reason).toMatch(/failed/);
    expect((await f({ ...GOOD_RC, to: WALLET })).reason).toMatch(/vault/);
    expect((await f(GOOD_RC, "0x1")).reason).toMatch(/below price/);
  });

  it("rejects reused payments", async () => {
    const r = await verifyAndConsumePayment(TX, WALLET, deps({ receipt: GOOD_RC, value: "0x16345785d8a0000", seen: [{ tx_hash: TX }] }));
    expect(r.reason).toMatch(/already used/);
  });

  it("fails closed without config", async () => {
    const r = await verifyAndConsumePayment(TX, WALLET, { rpcUrl: "https://rpc.test", vault: "", fetchFn: mockRpc({}), sql: undefined });
    expect(r.reason).toMatch(/not configured/);
  });
});

describe("verify then consume", () => {
  it("allows retry before burn, blocks after", async () => {
    const d = deps({ receipt: GOOD_RC, value: "0x16345785d8a0000" });
    expect((await verifyPayment(TX, WALLET, d)).ok).toBe(true);
    expect((await verifyPayment(TX, WALLET, d)).ok).toBe(true); // retry still valid
    expect((await consumePayment(TX, WALLET, "100000000000000", d)).ok).toBe(true);
  });
});
