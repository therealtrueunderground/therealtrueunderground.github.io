import { describe, expect, it } from "vitest";
import { moveTab } from "./workspace";

describe("moving open files", () => {
  const tabs = ["README.md", "About/introduction.md", "Skills/stack.md"];

  it("moves a tab to the chosen position without changing the files", () => {
    expect(moveTab(tabs, "README.md", "Skills/stack.md")).toEqual([
      "About/introduction.md", "Skills/stack.md", "README.md",
    ]);
    expect(tabs).toEqual(["README.md", "About/introduction.md", "Skills/stack.md"]);
  });

  it("can place a tab before another for keyboard and pointer movement", () => {
    expect(moveTab(tabs, "Skills/stack.md", "README.md", "before")).toEqual([
      "Skills/stack.md", "README.md", "About/introduction.md",
    ]);
  });
  it("ignores missing or identical targets", () => {
    expect(moveTab(tabs, "missing.md", "README.md")).toEqual(tabs);
    expect(moveTab(tabs, "README.md", "README.md")).toEqual(tabs);
  });
});
