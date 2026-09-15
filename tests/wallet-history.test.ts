import { describe, it, expect, vi } from "vitest";
import { listHistory, logEvent, walletStats, type SqlFn } from "../lib/layered/db";

const WALLET = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";

function mockSql(rows: unknown[]): SqlFn {
  return vi.fn(async () => rows) as unknown as SqlFn;
}

describe("listHistory", () => {
  it("maps rows to history items", async () => {
    const sql = mockSql([{ id: "a", mint: "m", token: { symbol: "BONK" }, rating: "Hold", created_at: "2026-09-05" }]);
    const items = await listHistory(WALLET, { sql });
    expect(items).toEqual([{ id: "a", mint: "m", symbol: "BONK", rating: "Hold", created_at: "2026-09-05" }]);
  });

  it("short-circuits invalid wallet without querying", async () => {
    const sql = vi.fn() as unknown as SqlFn;
    await expect(listHistory("xxx", { sql })).resolves.toEqual([]);
    expect(sql).not.toHaveBeenCalled();
  });

  it("returns [] on query error", async () => {
    const sql = vi.fn(async () => {
      throw new Error("db down");
    }) as unknown as SqlFn;
    await expect(listHistory(WALLET, { sql })).resolves.toEqual([]);
  });
});

describe("logEvent", () => {
  it("inserts started events, skips invalid wallets silently", async () => {
    const sql = mockSql([]);
    await logEvent("run_started", WALLET, undefined, { sql });
    expect(sql).toHaveBeenCalledTimes(1);
    const values = (sql as ReturnType<typeof vi.fn>).mock.calls[0].slice(1);
    expect(values).toEqual([WALLET, "run_started", null]);
    await logEvent("run_completed", "xxx", undefined, { sql });
    expect(sql).toHaveBeenCalledTimes(1);
  });
});

describe("walletStats", () => {
  it("counts completions plus latest date", async () => {
    const sql = mockSql([{ created_at: "2026-09-05T10:00:00Z" }, { created_at: "2026-09-04T10:00:00Z" }]);
    await expect(walletStats(WALLET, { sql })).resolves.toEqual({
      runs: 2,
      lastRun: "2026-09-05T10:00:00Z",
    });
  });

  it("falls back to zeros without config", async () => {
    const orig = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    await expect(walletStats(WALLET)).resolves.toEqual({ runs: 0, lastRun: null });
    if (orig !== undefined) process.env.DATABASE_URL = orig;
  });
});
