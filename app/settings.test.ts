import { describe, expect, it } from "vitest";
import { defaultSettings, parseStoredSettings } from "./settings";

describe("saved appearance settings", () => {
  it("restores supported values", () => {
    expect(parseStoredSettings('{"theme":"light","font":"ibm-plex","fontSize":18,"lineHeight":1.7,"accent":"violet","wrap":false,"readingWidth":92}')).toEqual({
      theme: "light", font: "ibm-plex", fontSize: 18, lineHeight: 1.7, accent: "violet", wrap: false, readingWidth: 92, sidebarPosition: "left",
    });
  });

  it("falls back safely when storage is malformed or out of range", () => {
    expect(parseStoredSettings("not-json")).toEqual(defaultSettings);
    expect(parseStoredSettings('{"theme":"unknown","fontSize":900,"wrap":"no"}')).toEqual(defaultSettings);
  });

  it("restores added themes, fonts, accents and the explorer position", () => {
    expect(parseStoredSettings('{"theme":"mocha","font":"system","fontSize":18,"lineHeight":1.7,"accent":"mint","wrap":false,"readingWidth":92,"sidebarPosition":"right"}')).toEqual({
      theme: "mocha", font: "system", fontSize: 18, lineHeight: 1.7, accent: "mint", wrap: false, readingWidth: 92, sidebarPosition: "right",
    });
  });

  it("keeps saved preferences from before the layout setting was added", () => {
    expect(parseStoredSettings('{"theme":"light","font":"ibm-plex","fontSize":18,"lineHeight":1.7,"accent":"violet","wrap":false,"readingWidth":92}')).toEqual({
      theme: "light", font: "ibm-plex", fontSize: 18, lineHeight: 1.7, accent: "violet", wrap: false, readingWidth: 92, sidebarPosition: "left",
    });
  });
});
