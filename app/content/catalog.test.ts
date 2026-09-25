import { describe, expect, it } from "vitest";
import { fileToUrl, resolveFileLink } from "./catalog";

describe("portfolio document routes", () => {
  it("uses short public URLs while keeping Markdown paths in the IDE", () => {
    expect(fileToUrl("README.md")).toBe("/");
    expect(fileToUrl("About/introduction.md")).toBe("/about");
    expect(fileToUrl("Projects/README.md")).toBe("/projects");
    expect(fileToUrl("Experience/timeline.md")).toBe("/experience");
    expect(fileToUrl("Education/education.md")).toBe("/education");
    expect(fileToUrl("Skills/stack.md")).toBe("/skills");
  });

  it("resolves cross-file links from the source document", () => {
    expect(resolveFileLink("About/introduction.md", "../Skills/stack.md")).toBe("/skills");
  });

  it("rejects unknown local files rather than inventing routes", () => {
    expect(resolveFileLink("README.md", "Projects/missing.md")).toBeNull();
  });
});
