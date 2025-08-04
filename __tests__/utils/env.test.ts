import { describe, it, expect, beforeEach, afterEach } from "vitest";

let isProduction: () => boolean;

describe("isProduction", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    const mod = await import("../../src/lib/utils/env");
    isProduction = mod.isProduction;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should return true when NODE_ENV is 'production'", async () => {
    process.env.NODE_ENV = "production";
    const mod = await import("../../src/lib/utils/env");
    expect(mod.isProduction()).toBe(true);
  });

  it("should return false when NODE_ENV is not 'production'", async () => {
    process.env.NODE_ENV = "development";
    const mod = await import("../../src/lib/utils/env");
    expect(mod.isProduction()).toBe(false);
  });

  it("should return false when NODE_ENV is undefined", async () => {
    delete process.env.NODE_ENV;
    const mod = await import("../../src/lib/utils/env");
    expect(mod.isProduction()).toBe(false);
  });
});
