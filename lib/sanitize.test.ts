import { describe, it, expect } from "vitest";
import { sanitize, containsProfanity } from "@/lib/sanitize";

describe("sanitize", () => {
  it("strips HTML tags", () => {
    expect(sanitize("<script>alert(1)</script>hello")).toBe("alert(1)hello");
  });

  it("trims whitespace", () => {
    expect(sanitize("  spaced  ")).toBe("spaced");
  });

  it("enforces max length", () => {
    expect(sanitize("abcdef", 3)).toBe("abc");
  });
});

describe("containsProfanity", () => {
  it("flags a banned word", () => {
    expect(containsProfanity("this is bullshit")).toBe(true);
  });

  it("passes clean text", () => {
    expect(containsProfanity("lost my blue water bottle")).toBe(false);
  });
});
