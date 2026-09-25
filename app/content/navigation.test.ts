import { describe, expect, it } from "vitest";
import { getBacklinks, getOutgoingLinks, searchDocuments } from "./navigation";

describe("document navigation", () => {
  it("finds files by section, filename, and heading", () => {
    expect(searchDocuments("intro")[0]?.path).toBe("About/introduction.md");
    expect(searchDocuments("skills")[0]?.url).toBe("/skills");
  });

  it("lists linked files for keyboard navigation", () => {
    expect(getOutgoingLinks("README.md").map((document) => document.path)).toEqual([
      "About/introduction.md", "Projects/README.md", "Experience/timeline.md",
      "Education/education.md", "Skills/stack.md",
    ]);
  });
  it("derives backlinks from the Markdown links", () => {
    expect(getBacklinks("About/introduction.md").map((document) => document.path)).toContain("README.md");
  });
});
