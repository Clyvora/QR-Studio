import { describe, it, expect } from "vitest";
import { parseBatch, readProject } from "../src/lib/workspace.js";
import { DEFAULT_DESIGN } from "../src/lib/design.js";

describe("project and batch boundaries", () => {
  it("reads quoted one-column CSV with escaped quotes and embedded newlines", () => {
    expect(parseBatch('"Hello, world"\r\n"A ""quote""\nnext line"\n')).toEqual([
      "Hello, world",
      'A "quote"\nnext line',
    ]);
    expect(() => parseBatch("https://a.test,https://b.test")).toThrow(/single column/);
    expect(() => parseBatch('"unterminated')).toThrow(/closing quote/);
    expect(() => parseBatch(Array(101).fill("hello").join("\n"))).toThrow(/100/);
  });

  it("restores supported settings and rejects nonlocal logos and malformed projects", () => {
    const project = {
      version: 1,
      type: "wifi",
      name: "Guests",
      values: { ssid: "Guest", password: "secret", encryption: "WPA", hidden: false },
      design: { ...DEFAULT_DESIGN, moduleStyle: "dots" },
    };
    expect(readProject(JSON.parse(JSON.stringify(project)))).toEqual(project);
    expect(() => readProject({ ...project, type: "unknown" })).toThrow();
    expect(() =>
      readProject({
        ...project,
        design: { ...project.design, logo: { src: "https://example.com/logo.png" } },
      }),
    ).toThrow(/logo/);
    expect(() => readProject({ ...project, values: { password: {} } })).toThrow(/content/);
  });
});
