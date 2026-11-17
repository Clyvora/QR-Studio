import { normalizeOptions } from "@qrcode/core";
import { DEFAULT_DESIGN, designToOptions } from "./design.js";
import { QR_TYPE_MAP } from "./qrTypes.js";

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readProject(input) {
  if (!input || input.version !== 1 || !QR_TYPE_MAP[input.type])
    throw new Error("Choose a QR Studio project file.");
  const design = { ...DEFAULT_DESIGN };
  for (const key of Object.keys(DEFAULT_DESIGN)) {
    if (key === "logo" || input.design?.[key] == null) continue;
    if (typeof input.design[key] !== typeof DEFAULT_DESIGN[key])
      throw new Error("Invalid design settings.");
    design[key] = input.design[key];
  }
  if (input.design?.logo) {
    const logo = input.design.logo;
    if (
      typeof logo.src !== "string" ||
      logo.src.length > 1500000 ||
      !/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,/.test(logo.src)
    )
      throw new Error("Invalid embedded logo.");
    design.logo = {
      src: logo.src,
      name: String(logo.name || "Logo").slice(0, 120),
      size: Number(logo.size),
      padding: Number(logo.padding),
      background: Boolean(logo.background),
      bgColor: String(logo.bgColor || ""),
    };
  }
  normalizeOptions(designToOptions(design));
  const values = { ...QR_TYPE_MAP[input.type].defaults };
  for (const field of QR_TYPE_MAP[input.type].fields) {
    const value = input.values?.[field.name];
    if (value === undefined) continue;
    if (typeof value !== "string" && typeof value !== "boolean")
      throw new Error("Invalid project content.");
    if (typeof value === "string" && value.length > 12000)
      throw new Error("Project content is too large.");
    values[field.name] = value;
  }
  return {
    version: 1,
    type: input.type,
    design,
    values,
    name: String(input.name || "Untitled code").slice(0, 80),
  };
}

// A simple one-column CSV accepts quoted entries, including embedded newlines.
export function parseBatch(text) {
  const records = [];
  let value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "\n" && !quoted) {
      if (value.trim()) records.push(value.trim());
      value = "";
    } else if (char === "," && !quoted)
      throw new Error("Use a single column: one URL or text value per row.");
    else value += char;
  }
  if (quoted) throw new Error("A quoted CSV value is missing its closing quote.");
  if (value.trim()) records.push(value.trim());
  if (records.length > 100) throw new Error("Create up to 100 codes in one batch.");
  return records;
}
