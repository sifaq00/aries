import { describe, it, expect, vi } from "vitest";
import { checkHold } from "../lib/layered/hold";

const TOKEN = "0x1111111111111111111111111111111111111111";
const WALLET = "0xCdbdc82A021071eE445d9f897433a7E4B4EAfD8d";
const DEPS = { rpcUrl: "https://rpc.test", token: TOKEN, tier1: BigInt("10000") * BigInt(10) ** BigInt(18), tier2: BigInt("100000") * BigInt(10) ** BigInt(18) };

// balanceOf(address) =
//   0x70a08231 + padded address; returns uint256.
function mockRpc(balance: bigint) {
  const hex = "0x" + balance.toString(16).padStart(64, "0");
  return vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ result: hex }) })) as unknown as typeof fetch;
}

describe("checkHold", () => {
  it("tiers at exact boundaries", async () => {
    const E = BigInt(10) ** BigInt(18);
    const t = (b: bigint) => checkHold(WALLET, { ...DEPS, fetchFn: mockRpc(b) });
    expect((await t(BigInt("9999") * E)).tier).toBe(0);
    expect((await t(BigInt("10000") * E)).tier).toBe(1);
    expect((await t(BigInt("99999") * E)).tier).toBe(1);
    expect((await t(BigInt("100000") * E)).tier).toBe(2);
  });

  it("fails closed without config or on RPC death", async () => {
    expect((await checkHold(WALLET, { rpcUrl: "https://rpc.test", token: "" })).tier).toBe(-1);
    const dead = vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;
    expect((await checkHold(WALLET, { ...DEPS, fetchFn: dead })).tier).toBe(-1);
    expect(await checkHold("xxx", DEPS)).toEqual({ tier: -1, balance: "0" });
  });
});


