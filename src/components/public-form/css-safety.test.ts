import { describe, expect, it } from "vitest";
import { scopeCustomCss, validateCustomCss } from "./css-safety";

describe("css-safety", () => {
  it("rejects clearly unsafe css directives", () => {
    expect(validateCustomCss('@import url("https://evil.com/a.css")').isValid).toBe(
      false,
    );
    expect(validateCustomCss("a{background:url(javascript:alert(1))}").isValid).toBe(
      false,
    );
  });

  it("keeps valid css", () => {
    expect(validateCustomCss(".x{color:red}").isValid).toBe(true);
  });

  it("scopes selectors to a root container", () => {
    const scoped = scopeCustomCss("#root", ".a, .b { color: red; }");
    expect(scoped).toContain("#root .a");
    expect(scoped).toContain("#root .b");
  });
});

