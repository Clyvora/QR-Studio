import { useEffect, useMemo, useRef, useState } from "react";
import { QRCode, downloadQR, useQRCode } from "@qrcode/react";
import { generateQR, toPNG, toSVG } from "@qrcode/core";
import { ArrowRight, Folder, Trash2 } from "lucide-react";
import { QR_TYPE_MAP, buildStudioPayload } from "../lib/qrTypes.js";
import { DEFAULT_DESIGN, designToOptions } from "../lib/design.js";
import { downloadBlob, parseBatch, readProject } from "../lib/workspace.js";
import MonoStudio from "../components/studio/MonoStudio.jsx";
import { useToast, Dialog } from "../components/ui/overlay.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const INITIAL = {
  type: "url",
  values: { url: "https://clyvora.tech" },
  design: { ...DEFAULT_DESIGN, foreground: "#000000" },
  name: "My QR code",
};
export default function Studio() {
  useDocumentTitle("QR Studio");
  const toast = useToast();
  const [history, setHistory] = useState({ past: [], present: INITIAL, future: [] });
  const project = history.present;
  const { type, values, design, name } = project;
  const [mode, setMode] = useState("create");
  const [touched, setTouched] = useState({});
  const [format, setFormat] = useState("png");
  const [size, setSize] = useState(1200);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("clyvora-qr-library") || "[]")
        .slice(0, 12)
        .map(readProject);
    } catch {
      return [];
    }
  });
  const [saveOpen, setSaveOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const importRef = useRef(null);
  const [batch, setBatch] = useState("https://clyvora.tech\nhttps://example.com");
  const [batchType, setBatchType] = useState("url");
  const [batchProgress, setBatchProgress] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [scanImage, setScanImage] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [scanCopy, setScanCopy] = useState(false);

  const change = (patch) =>
    setHistory((current) => ({
      past: [...current.past.slice(-49), current.present],
      present: { ...current.present, ...patch },
      future: [],
    }));
  const undo = () =>
    setHistory((current) =>
      !current.past.length
        ? current
        : {
            past: current.past.slice(0, -1),
            present: current.past.at(-1),
            future: [current.present, ...current.future],
          },
    );
  const redo = () =>
    setHistory((current) =>
      !current.future.length
        ? current
        : {
            past: [...current.past, current.present],
            present: current.future[0],
            future: current.future.slice(1),
          },
    );
  const { payload, error } = useMemo(() => buildStudioPayload(type, values), [type, values]);
  const options = useMemo(() => designToOptions(design), [design]);
  const { reliability, error: renderError } = useQRCode({
    ...options,
    value: payload || "https://example.com",
    size: 600,
  });
  const ready = Boolean(payload) && !renderError;
  const shownError =
    Object.keys(touched).length ||
    Object.values(values).some((value) => typeof value === "string" && value.trim())
      ? error
      : null;

  useEffect(
    () => () => {
      if (scanImage) URL.revokeObjectURL(scanImage);
    },
    [scanImage],
  );

  const attempt = async (action, success) => {
    try {
      await action();
      if (success) toast.success(success);
    } catch (err) {
      toast.error("Something needs attention", { description: err.message });
    }
  };

  const exportCode = async () => {
    setBusy(true);
    await attempt(
      () =>
        downloadQR(
          { ...options, data: payload, size },
          { format, filename: name.trim() || "qr-code" },
        ),
      "Your code is downloaded",
    );
    setBusy(false);
  };

  const copy = async (image = false) =>
    attempt(
      async () => {
        if (image) {
          if (typeof ClipboardItem === "undefined")
            throw new Error("Image copying is unavailable. Download PNG instead.");
          const bytes = await toPNG({ ...options, data: payload, size });
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": new Blob([bytes], { type: "image/png" }) }),
          ]);
        } else await navigator.clipboard.writeText(toSVG({ ...options, data: payload, size }));
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      image ? "Image copied" : "SVG copied",
    );

  const save = () =>
    attempt(async () => {
      const entry = readProject({ ...project, version: 1 });
      const next = [entry, ...saved].slice(0, 12);
      localStorage.setItem("clyvora-qr-library", JSON.stringify(next));
      setSaved(next);
      setSaveOpen(false);
    }, "Saved in this browser");

  const importProject = async (file) =>
    attempt(async () => {
      if (!file) return;
      if (file.size > 2000000) throw new Error("Project files must be under 2 MB.");
      const entry = readProject(JSON.parse(await file.text()));
      change(entry);
      setMode("create");
      setTouched({});
    }, "Project opened");

  const batchCodes = async () => {
    setBusy(true);
    setBatchProgress("Preparing batch…");
    await attempt(async () => {
      const rows = parseBatch(batch);
      if (!rows.length) throw new Error("Add at least one row.");
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const batchSize = Math.min(size, 2048);
      for (let i = 0; i < rows.length; i++) {
        const result = buildStudioPayload(
          batchType,
          batchType === "url" ? { url: rows[i] } : { text: rows[i] },
        );
        if (result.error) throw new Error("Row " + (i + 1) + ": " + result.error.message);
        const output = await generateQR({
          ...options,
          data: result.payload,
          size: batchSize,
          format,
        });
        zip.file("code-" + String(i + 1).padStart(3, "0") + "." + format, output);
        setBatchProgress("Creating " + (i + 1) + " of " + rows.length);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      zip.file("contents.txt", rows.map((row, i) => String(i + 1) + ": " + row).join("\n"));
      downloadBlob(await zip.generateAsync({ type: "blob" }), "qr-codes.zip");
      toast.success(rows.length + " codes downloaded");
    });
    setBusy(false);
    setBatchProgress("");
  };

  const scan = async (file) => {
    if (!file) return;
    setScanBusy(true);
    setScanError("");
    setScanResult("");
    try {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 10000000)
        throw new Error("Choose a PNG, JPEG or WebP image under 10 MB.");
      const bitmap = await createImageBitmap(file);
      try {
        if (bitmap.width * bitmap.height > 24000000)
          throw new Error("Choose an image under 24 megapixels.");
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const { default: jsQR } = await import("jsqr");
        const result = jsQR(pixels.data, pixels.width, pixels.height);
        setScanImage(URL.createObjectURL(file));
        if (!result)
          throw new Error("No QR code found. Try a sharper image with the whole code visible.");
        setScanResult(result.data);
      } finally {
        bitmap.close();
      }
    } catch (err) {
      setScanError(err.message);
    } finally {
      setScanBusy(false);
    }
  };

  const switchType = (next) => {
    change({ type: next, values: { ...QR_TYPE_MAP[next].defaults } });
    setTouched({});
  };

  return (
    <div className="mono-app">
      <MonoStudio
        state={{
          project,
          options,
          payload,
          ready,
          shownError,
          renderError,
          reliability,
          mode,
          touched,
          history,
          format,
          size,
          busy,
          copied,
          saved,
          batch,
          batchType,
          batchProgress,
          scanResult,
          scanImage,
          scanError,
          scanBusy,
          scanCopy,
        }}
        actions={{
          change,
          undo,
          redo,
          switchType,
          setMode,
          setFormat,
          setSize,
          setBatch,
          setBatchType,
          exportCode,
          copy,
          batchCodes,
          scan,
          touch: (key) => setTouched((current) => ({ ...current, [key]: true })),
          notice: (message) => toast.info(message),
          openSave: () => setSaveOpen(true),
          openLibrary: () => setLibraryOpen(true),
          openImport: () => importRef.current?.click(),
          downloadProject: () =>
            downloadBlob(
              new Blob([JSON.stringify({ ...project, version: 1 }, null, 2)], {
                type: "application/json",
              }),
              (name || "qr-code") + ".json",
            ),
          importBatch: (file) =>
            file &&
            attempt(async () => {
              if (file.size > 300000) throw new Error("Use a file under 300 KB.");
              setBatch(await file.text());
            }),
          copyScan: () =>
            attempt(async () => {
              await navigator.clipboard.writeText(scanResult);
              setScanCopy(true);
              setTimeout(() => setScanCopy(false), 1800);
            }),
        }}
      />
      <input
        type="file"
        accept="application/json,.json"
        ref={importRef}
        className="sr-only"
        aria-label="Import project"
        onChange={(event) => {
          importProject(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <Dialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save on this device"
        description="This saves the code’s content and design in this browser. Wi-Fi passwords and contact details are included if you entered them."
        footer={
          <>
            <button className="studio-dialog-button" onClick={() => setSaveOpen(false)}>
              Cancel
            </button>
            <button className="studio-dialog-button primary" onClick={save}>
              Save code
            </button>
          </>
        }
      >
        <p className="text-sm">
          Your library holds your latest 12 saved codes. Download a project file to keep a separate
          copy.
        </p>
      </Dialog>
      <Dialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="My codes"
        description="Saved in this browser. Clearing browser data removes this library."
        size="lg"
      >
        <div className="saved-codes">
          {!saved.length && (
            <div className="library-empty">
              <Folder size={30} />
              <strong>Your collection starts here.</strong>
              <p>Save a code to find it here next time.</p>
            </div>
          )}
          {saved.map((entry, index) => (
            <div key={index} className="saved-code">
              <QRCode
                value={
                  buildStudioPayload(entry.type, entry.values).payload || "https://example.com"
                }
                {...designToOptions(entry.design)}
                size={72}
              />
              <div>
                <strong>{entry.name}</strong>
                <small>{QR_TYPE_MAP[entry.type].label}</small>
              </div>
              <button
                onClick={() => {
                  change(entry);
                  setLibraryOpen(false);
                  setMode("create");
                  setTouched({});
                }}
                aria-label={"Open " + entry.name}
              >
                <ArrowRight size={16} />
              </button>
              <button
                aria-label={"Remove " + entry.name}
                onClick={() =>
                  attempt(async () => {
                    const next = saved.filter((_, i) => i !== index);
                    localStorage.setItem("clyvora-qr-library", JSON.stringify(next));
                    setSaved(next);
                  })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
