import { describe, it, expect } from "vitest";
import { sanitize, containsProfanity, escapeHtml } from "@/lib/sanitize";

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

  it("flags spaced-out phrases as substrings", () => {
    expect(containsProfanity("what the f u c k")).toBe(true);
  });

  it("matches single words only on word boundaries", () => {
    expect(containsProfanity("class assignment in the basement")).toBe(false);
  });

  it("sees through leetspeak and separators", () => {
    expect(containsProfanity("b.1.t.c.h")).toBe(true);
  });

  it("gives the same answer on repeated calls", () => {
    expect(containsProfanity("this is bullshit")).toBe(true);
    expect(containsProfanity("this is bullshit")).toBe(true);
  });
});

describe("escapeHtml", () => {
  it("escapes all five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#039;Jerry&#039;&lt;/a&gt;",
    );
  });
});
