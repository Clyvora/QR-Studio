import { DEFAULT_DESIGN } from "./design.js";

const definitions = [
  ["minimal", "Classic", "square", "square", "none"],
  ["mono-soft", "Soft", "soft", "rounded", "none"],
  ["mono-dots", "Dots", "dots", "circle", "none"],
  ["mono-outline", "Outline", "square", "square", "box"],
  ["mono-label", "Label", "square", "square", "banner"],
  ["mono-rounded", "Rounded", "rounded", "rounded", "none"],
  ["mono-studio", "Studio", "soft", "square", "none"],
  ["mono-orbit", "Orbit", "square", "circle", "none"],
  ["mono-pebble", "Pebble", "soft", "circle", "none"],
  ["mono-flow", "Flow", "rounded", "circle", "none"],
  ["mono-grid", "Grid", "rounded", "square", "none"],
  ["mono-pixel", "Pixel", "dots", "square", "none"],
  ["mono-bubble", "Bubble", "dots", "rounded", "none"],
  ["mono-ticket", "Ticket", "soft", "rounded", "box"],
  ["mono-gallery", "Gallery", "rounded", "rounded", "box"],
  ["mono-stamp", "Stamp", "dots", "circle", "box"],
  ["mono-window", "Window", "square", "rounded", "box"],
  ["mono-signal", "Signal", "soft", "square", "banner"],
  ["mono-note", "Note", "soft", "rounded", "banner"],
  ["mono-poster", "Poster", "rounded", "rounded", "banner"],
  ["mono-spot", "Spot", "dots", "circle", "banner"],
  ["mono-badge", "Badge", "square", "circle", "banner"],
  ["mono-smooth", "Smooth", "square", "rounded", "none"],
  ["mono-porthole", "Porthole", "square", "circle", "box"],
  ["mono-blueprint", "Blueprint", "soft", "square", "box"],
  ["mono-capsule", "Capsule", "soft", "circle", "box"],
  ["mono-circuit", "Circuit", "rounded", "square", "box"],
  ["mono-medallion", "Medallion", "rounded", "circle", "box"],
  ["mono-confetti", "Confetti", "dots", "square", "box"],
  ["mono-halo", "Halo", "dots", "rounded", "box"],
  ["mono-editorial", "Editorial", "square", "rounded", "banner"],
  ["mono-beacon", "Beacon", "soft", "circle", "banner"],
  ["mono-headline", "Headline", "rounded", "square", "banner"],
  ["mono-marquee", "Marquee", "rounded", "circle", "banner"],
  ["mono-bulletin", "Bulletin", "dots", "square", "banner"],
  ["mono-speckle", "Speckle", "dots", "rounded", "banner"],
  ["mono-footnote", "Footnote", "square", "square", "none", "SCAN ME"],
  ["mono-byline", "Byline", "square", "rounded", "none", "SCAN ME"],
  ["mono-letterpress", "Letterpress", "soft", "square", "none", "SCAN ME"],
  ["mono-whisper", "Whisper", "soft", "rounded", "none", "SCAN ME"],
  ["mono-signature", "Signature", "rounded", "rounded", "none", "SCAN ME"],
  ["mono-colophon", "Colophon", "rounded", "circle", "none", "SCAN ME"],
  ["mono-morse", "Morse", "dots", "square", "none", "SCAN ME"],
  ["mono-stipple", "Stipple", "dots", "circle", "none", "SCAN ME"],
];

export const MONO_STYLES = definitions.map(
  ([id, name, moduleStyle, cornerStyle, frame, caption], index) => ({
    id,
    name,
    isNew: index >= 22,
    category:
      frame !== "none"
        ? "frames"
        : caption
          ? "captions"
          : moduleStyle === "dots"
            ? "dots"
            : "clean",
    design: {
      ...DEFAULT_DESIGN,
      preset: id,
      moduleStyle,
      cornerStyle,
      cornerDotStyle: cornerStyle,
      frame,
      label: caption ?? (frame === "none" ? "" : "SCAN ME"),
    },
  }),
);

export function applyMonoStyle(current, style) {
  return {
    ...current,
    ...style.design,
    logo: current.logo,
    ecc: current.logo ? "H" : current.ecc,
    label: style.design.label ? current.label || style.design.label : "",
  };
}
