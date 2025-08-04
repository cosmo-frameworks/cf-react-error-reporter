import { describe, it, expect } from "vitest";
import { sha256 } from "js-sha256";

import { generateErrorFingerprint } from "../../src/lib/utils/fingerprint";

describe("generateErrorFingerprint", () => {
  const error = new Error("Something went wrong");
  error.name = "TypeError";
  error.stack = "at someFunction (file.js:10:5)";
  const info = {
    componentStack: "at MyComponent (App.js:5:3)",
  };

  it("should return a SHA-256 hash string", () => {
    const fingerprint = generateErrorFingerprint(error, info);
    expect(typeof fingerprint).toBe("string");
    expect(fingerprint).toHaveLength(64);
  });

  it("should generate consistent output for same inputs", () => {
    const fingerprint1 = generateErrorFingerprint(error, info);
    const fingerprint2 = generateErrorFingerprint(error, info);
    expect(fingerprint1).toBe(fingerprint2);
  });

  it("should generate different outputs for different errors", () => {
    const modifiedError = new Error("Different error");
    modifiedError.name = "ReferenceError";
    modifiedError.stack = "at otherFunction (file.js:20:10)";

    const fingerprint1 = generateErrorFingerprint(error, info);
    const fingerprint2 = generateErrorFingerprint(modifiedError, info);

    expect(fingerprint1).not.toBe(fingerprint2);
  });

  it("should generate different outputs for different componentStack", () => {
    const differentInfo = {
      componentStack: "at AnotherComponent (App.js:20:3)",
    };

    const fingerprint1 = generateErrorFingerprint(error, info);
    const fingerprint2 = generateErrorFingerprint(error, differentInfo);

    expect(fingerprint1).not.toBe(fingerprint2);
  });

  it("should match the expected SHA-256 hash for known input", () => {
    const raw = `${error.name}:${error.message}\n${error.stack}\n${info.componentStack}`;
    const expectedHash = sha256(raw);
    const actualHash = generateErrorFingerprint(error, info);
    expect(actualHash).toBe(expectedHash);
  });
});
