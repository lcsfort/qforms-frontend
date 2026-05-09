import { describe, expect, it } from "vitest";
import { getFieldComponent } from "./registry";
import { UnsupportedField } from "./UnsupportedField";

describe("field registry", () => {
  it("returns known field components", () => {
    const textComp = getFieldComponent("text");
    expect(typeof textComp).toBe("function");
  });

  it("falls back to UnsupportedField for unknown types", () => {
    const unknown = getFieldComponent("nonsense");
    expect(unknown).toBe(UnsupportedField);
  });
});

