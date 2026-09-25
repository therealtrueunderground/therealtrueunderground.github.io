import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { cropAsciiMargins } from "./asciiArt";

const artPath = fileURLToPath(new URL("../art/hero.txt", import.meta.url));

describe("README ASCII artwork", () => {
  it("removes only blank outer margins and preserves internal spacing", () => {
    expect(cropAsciiMargins("        \n  X   Y \n  .     \n        \n")).toBe("X   Y\n.    ");
    expect(cropAsciiMargins("   \n \n")).toBe("");
  });

  it("contains the complete owner-supplied 400-column drawing", () => {
    const lines = readFileSync(artPath, "utf8").replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
    expect(lines).toHaveLength(165);
    expect(lines.every((line) => line.length === 400)).toBe(true);
    expect(lines.every((line) => /^[ .:\-=+*#%@]*$/.test(line))).toBe(true);
    expect(lines.slice(130).filter((line) => line.trim().length > 0).length).toBeGreaterThan(30);
    const cropped = cropAsciiMargins(lines.join("\n"));
    expect(cropped.split("\n")).toHaveLength(160);
    expect(Math.max(...cropped.split("\n").map((line) => line.length))).toBe(248);
    expect(cropped.replace(/[ \n]/g, "")).toBe(lines.join("\n").replace(/[ \n]/g, ""));
  });
});
