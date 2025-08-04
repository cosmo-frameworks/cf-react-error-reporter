import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  savePending,
  getPending,
  flushPending,
} from "../../src/lib/utils/pendingQueue";

const PENDING_KEY = "__cf_error_pending__";

describe("Pending Error Queue", () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    });
  });

  describe("getPending", () => {
    it("returns an empty array if nothing is in localStorage", () => {
      expect(getPending()).toEqual([]);
    });

    it("returns the parsed array if present", () => {
      const errors = [{ msg: "error 1" }];
      localStorage.setItem(PENDING_KEY, JSON.stringify(errors));
      expect(getPending()).toEqual(errors);
    });

    it("returns empty array if JSON parsing fails", () => {
      localStorage.setItem(PENDING_KEY, "{invalid json");
      expect(getPending()).toEqual([]);
    });
  });

  describe("savePending", () => {
    it("adds a new error to localStorage", () => {
      const error = { msg: "new error" };
      savePending(error);

      const stored = JSON.parse(localStorageMock[PENDING_KEY]);
      expect(stored).toEqual([error]);
    });

    it("preserves existing errors and adds new one", () => {
      const existing = [{ msg: "old error" }];
      localStorage.setItem(PENDING_KEY, JSON.stringify(existing));

      const newError = { msg: "new error" };
      savePending(newError);

      const result = JSON.parse(localStorageMock[PENDING_KEY]);
      expect(result).toEqual([...existing, newError]);
    });
  });

  describe("flushPending", () => {
    it("sends all pending errors and clears the queue", async () => {
      const errors = [{ msg: "e1" }, { msg: "e2" }];
      localStorage.setItem(PENDING_KEY, JSON.stringify(errors));

      const send = vi.fn().mockResolvedValue(undefined);
      await flushPending(send);

      expect(send).toHaveBeenCalledTimes(2);
      expect(JSON.parse(localStorageMock[PENDING_KEY])).toEqual([]);
    });

    it("requeues failed sends", async () => {
      const errors = [{ msg: "ok" }, { msg: "fail" }];
      localStorage.setItem(PENDING_KEY, JSON.stringify(errors));

      const send = vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("send failed"));

      await flushPending(send);

      expect(send).toHaveBeenCalledTimes(2);
      const pending = JSON.parse(localStorageMock[PENDING_KEY]);
      expect(pending).toEqual([{ msg: "fail" }]);
    });

    it("handles empty queue gracefully", async () => {
      const send = vi.fn();
      await flushPending(send);
      expect(send).not.toHaveBeenCalled();
    });
  });
});
