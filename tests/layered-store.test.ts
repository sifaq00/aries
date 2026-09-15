import { describe, it, expect, vi, beforeEach } from "vitest";
import { runL4 } from "../lib/layered/l4";
import { mintChain } from "../lib/layered/chain";
import { loadReport, type SqlFn } from "../lib/layered/db";

const MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
const RISKS = { liquidity: "thin", rugpath: "auth revoked", concentration: "whales" };
const INPUT = {
  chain: "solana" as const,
  mint: MINT,
  model: "mimo-v2.5",
  token: { name: "Bonk", price: "0.00002", liquidity: 1000000, change24h: 5 },
  symbol: "BONK",
  reports: { onchain: "o", technical: "t", sentiment: "s", news: "n" },
  debate: [{ phase: "invest" as const, round: 1, side: "bull" as const, text: "up" }],
  risks: RISKS,
  chainToken: mintChain("l3", "solana", MINT, RISKS),
};

function mockSql(rows: unknown[] = [{ id: "11111111-1111-4111-8111-111111111111" }]): SqlFn {
  return vi.fn(async () => rows) as unknown as SqlFn;
}

beforeEach(() => {
  vi.stubEnv("LLM_API_URL", "https://llm.test/v1/chat/completions");
  vi.stubEnv("LLM_API_KEY", "k");
  vi.stubEnv("LLM_MODEL", "mimo-v2.5");
  vi.stubEnv("DATABASE_URL", "postgres://db.test/aries");
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: "RATING: Hold\nCONFIDENCE: Medium\nKEY RISKS:\n- thin\nEXECUTIVE SUMMARY\nok\nINVESTMENT THESIS\nfair" }, finish_reason: "stop" }] }),
  })) as unknown as typeof fetch;
});

describe("runL4", () => {
  it("decides, parses rating, saves, returns share id", async () => {
    const res = await runL4(INPUT, { sql: mockSql() });
    expect(res.rating).toBe("Hold");
    expect(res.confidence).toBe("Medium");
    expect(res.id).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("retries once when decider returns blank, then succeeds", async () => {
    let calls = 0;
    global.fetch = vi.fn(async () => {
      calls += 1;
      const content = calls === 1 ? "   " : "RATING: Hold\nCONFIDENCE: Medium\nKEY RISKS:\n- thin\nEXECUTIVE SUMMARY\nok\nINVESTMENT THESIS\nfair";
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content }, finish_reason: "stop" }] }) };
    }) as unknown as typeof fetch;
    const res = await runL4(INPUT, { sql: mockSql() });
    expect(res.rating).toBe("Hold");
  });

  it("throws honest error without saving when decider is empty", async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "   " }, finish_reason: "stop" }] }) })) as unknown as typeof fetch;
    const sql = vi.fn(async () => {
      throw new Error("must not save");
    }) as unknown as SqlFn;
    await expect(runL4(INPUT, { sql })).rejects.toThrow("empty decision");
  });
});

describe("loadReport", () => {
  it("returns row from Neon", async () => {
    const sql = mockSql([{ id: "11111111-1111-4111-8111-111111111111", decision: "RATING: Hold" }]);
    const row = await loadReport("11111111-1111-4111-8111-111111111111", { sql });
    expect((row as { decision: string }).decision).toContain("RATING:");
  });

  it("returns null when nothing matches", async () => {
    const sql = mockSql([]);
    await expect(loadReport("11111111-1111-4111-8111-111111111111", { sql })).resolves.toBeNull();
  });

  it("returns null without config instead of throwing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(loadReport("11111111-1111-4111-8111-111111111111")).resolves.toBeNull();
  });
});
