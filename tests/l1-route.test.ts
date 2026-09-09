import { describe, it, expect, vi } from "vitest";
import { POST } from "../app/api/l1/route";

describe("POST /api/l1 validation", () => {
  it("400s invalid mint without LLM spend", async () => {
    vi.stubEnv("FEE_ENFORCED", "0");
    const res = await POST(new Request("http://x/api/l1", { method: "POST", body: JSON.stringify({ mint: "xxx" }) }));
    expect(res.status).toBe(400);
    vi.unstubAllEnvs();
  });

  it("400s malformed body", async () => {
    vi.stubEnv("FEE_ENFORCED", "0");
    const res = await POST(new Request("http://x/api/l1", { method: "POST", body: "not-json{" }));
    expect(res.status).toBe(400);
    vi.unstubAllEnvs();
  });

  it("402s valid mint without payment when enforced", async () => {
    vi.stubEnv("FEE_ENFORCED", "1");
    const res = await POST(
      new Request("http://x/api/l1", { method: "POST", body: JSON.stringify({ chainId: "solana", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" }) })
    );
    expect(res.status).toBe(402);
    vi.unstubAllEnvs();
  });
});
