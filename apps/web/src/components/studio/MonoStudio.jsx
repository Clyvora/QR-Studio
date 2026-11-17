import { useRef, useState } from "react";
import { QRCode } from "@qrcode/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownToLine,
  Check,
  ChevronDown,
  Copy,
  FileUp,
  Folder,
  LockKeyhole,
  Redo2,
  Save,
  ScanLine,
  SlidersHorizontal,
  Undo2,
  X,
} from "lucide-react";
import { ContentForm } from "./ContentForm.jsx";
import { DesignPanel } from "./DesignPanel.jsx";
import { ColorField, Switch } from "../ui/controls.jsx";
import { Dialog } from "../ui/overlay.jsx";
import { QR_TYPE_DEFS } from "../../lib/qrTypes.js";
import { designToOptions } from "../../lib/design.js";
import { MONO_STYLES, applyMonoStyle } from "../../lib/monoStyles.js";
import "../../styles/mono-studio.css";

function StyleTile({ style, active, onClick }) {
  return (
    <button
      type="button"
      className={"mono-style-tile" + (active ? " selected" : "")}
      aria-pressed={active}
      onClick={onClick}
    >
      <QRCode
        value="https://clyvora.tech"
        {...designToOptions(style.design)}
        size={180}
        aria-hidden="true"
      />
      <span>{style.name}</span>
    </button>
  );
}

function PatternChoice({ value, active, onClick, label, corner = false }) {
  return (
    <button
      type="button"
      className={"mono-option" + (active ? " selected" : "")}
      aria-pressed={active}
      onClick={onClick}
    >
      <span aria-hidden="true" className={(corner ? "mono-corner " : "mono-pattern ") + value}>
        {corner ? (
          <i />
        ) : (
          <>
            <i />
            <i />
            <i />
            <i />
          </>
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function MonoStudio({ state: s, actions: a }) {
  const [customizing, setCustomizing] = useState(false);
  const [tab, setTab] = useState("style");
  const [more, setMore] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);
  const [styleSearch, setStyleSearch] = useState("");
  const [styleCategory, setStyleCategory] = useState("all");
  const visibleStyles = MONO_STYLES.filter(
    (style) =>
      (styleCategory === "all" ||
        (styleCategory === "new" ? style.isNew : style.category === styleCategory)) &&
      style.name.toLowerCase().includes(styleSearch.trim().toLowerCase()),
  );
  const customizeRef = useRef(null);
  const doneRef = useRef(null);
  const {
    project,
    options,
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
  } = s;
  const { type, values, design, name } = project;
  const setDesign = (patch) => a.change({ design: { ...design, preset: "custom", ...patch } });
  const selectStyle = (style) => a.change({ design: applyMonoStyle(design, style) });
  const enterCustomize = () => {
    setCustomizing(true);
    setTab("style");
    requestAnimationFrame(() => doneRef.current?.focus());
  };
  const leaveCustomize = () => {
    setCustomizing(false);
    requestAnimationFrame(() => customizeRef.current?.focus());
  };
  const changeMode = (next) => {
    setCustomizing(false);
    a.setMode(next);
  };
  const quickStyles = MONO_STYLES.slice(0, 5);
  const preview = (large = false) => (
    <div className={"mono-preview" + (large ? " large" : "")}>
      <div className={"mono-paper" + (!ready ? " incomplete" : "")}>
        <QRCode
          {...options}
          value={s.payload || "https://example.com"}
          logo={ready ? options.logo : null}
          size={720}
          className="mono-qr"
          title={ready ? "Your QR code" : "Example QR code"}
        />
      </div>
      {large && (
        <p className="mono-preview-caption">
          <span className="mono-circle-check">
            <Check size={15} />
          </span>
          Preview updates as you edit
        </p>
      )}
      {!large && (
        <p className="mono-live">
          <i />
          LIVE PREVIEW
        </p>
      )}
    </div>
  );
  const formats = (
    <div className="mono-formats" role="group" aria-label="Export format">
      {["png", "svg", "pdf"].map((item) => (
        <button
          type="button"
          key={item}
          aria-pressed={format === item}
          onClick={() => a.setFormat(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
      <label className="sr-only" htmlFor="mono-size">
        Export size
      </label>
      <select
        id="mono-size"
        value={size}
        onChange={(event) => a.setSize(Number(event.target.value))}
      >
        {[256, 512, 1200, 2048, 4096].map((value) => (
          <option key={value} value={value}>
            {value} px
          </option>
        ))}
      </select>
    </div>
  );
  const status = (
    <div className={"mono-feedback" + (!ready ? " incomplete" : "")} aria-live="polite">
      {ready ? <Check size={15} /> : <span aria-hidden="true">—</span>}
      <span>
        {!ready
          ? shownError?.message || renderError?.message || "Add your details to create a code."
          : reliability?.level !== "good"
            ? "Review your design before sharing."
            : "Your code is ready."}
      </span>
    </div>
  );
  const brand = (
    <button
      className="mono-brand"
      onClick={() => {
        leaveCustomize();
        a.setMode("create");
      }}
      aria-label="QR Studio home"
    >
      <span className="mono-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <strong>qr studio</strong>
      <span>by Clyvora</span>
    </button>
  );
  return (
    <>
      <header className="mono-header">
        {brand}
        {customizing ? (
          <>
            <h1>Customize your code</h1>
            <button ref={doneRef} className="mono-button black" onClick={leaveCustomize}>
              <Check size={18} />
              Done customizing
            </button>
          </>
        ) : (
          <nav aria-label="Workspace">
            <button className="mono-text-button" onClick={a.openLibrary}>
              <Folder size={20} />
              My codes{saved.length > 0 && <small>{saved.length}</small>}
            </button>
            <button
              className="mono-text-button"
              onClick={() => changeMode(mode === "scan" ? "create" : "scan")}
            >
              <ScanLine size={20} />
              {mode === "scan" ? "Create a code" : "Scan a code"}
            </button>
          </nav>
        )}
      </header>

      {customizing ? (
        <>
          <div className="mono-workspace-bar">
            <button onClick={leaveCustomize}>
              <ArrowLeft size={18} />
              Back to your code
            </button>
            <span className="mono-divider" />
            <label className="sr-only" htmlFor="mono-project-name">
              Project name
            </label>
            <input
              id="mono-project-name"
              value={name}
              maxLength={80}
              onChange={(event) => a.change({ name: event.target.value })}
            />
            <span className="mono-live-changes">Changes applied live</span>
            <div className="mono-history">
              <button disabled={!history.past.length} onClick={a.undo}>
                <Undo2 size={16} />
                Undo
              </button>
              <button disabled={!history.future.length} onClick={a.redo}>
                <Redo2 size={16} />
                Redo
              </button>
            </div>
          </div>
          <div className="mono-custom-grid">
            <section className="mono-canvas" aria-label="Live preview">
              {preview(true)}
              <div className="mono-starting-points">
                <div>
                  <h2>Choose a starting point</h2>
                  <button onClick={() => setStylesOpen(true)}>
                    View all {MONO_STYLES.length}
                    <ArrowRight size={14} />
                  </button>
                </div>
                <div className="mono-style-row">
                  {quickStyles.map((style) => (
                    <StyleTile
                      key={style.id}
                      style={style}
                      active={design.preset === style.id}
                      onClick={() => selectStyle(style)}
                    />
                  ))}
                </div>
              </div>
            </section>
            <aside className="mono-inspector" aria-label="Customize settings">
              <div className="mono-inspector-tabs" role="group" aria-label="Design sections">
                {["style", "logo", "frame"].map((value) => (
                  <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
              <h2>
                {tab === "style"
                  ? "The little details"
                  : tab === "logo"
                    ? "Make it recognizable"
                    : "Give it a little context"}
              </h2>
              {tab === "style" ? (
                <>
                  <section className="mono-setting">
                    <h3>Pattern</h3>
                    <div className="mono-options" role="group" aria-label="Pattern">
                      {[
                        ["square", "Square"],
                        ["soft", "Soft"],
                        ["rounded", "Rounded"],
                        ["dots", "Dots"],
                      ].map(([value, label]) => (
                        <PatternChoice
                          key={value}
                          value={value}
                          label={label}
                          active={design.moduleStyle === value}
                          onClick={() => setDesign({ moduleStyle: value })}
                        />
                      ))}
                    </div>
                  </section>
                  <section className="mono-setting">
                    <h3>Corners</h3>
                    <div className="mono-options three" role="group" aria-label="Corners">
                      {[
                        ["square", "Square"],
                        ["rounded", "Rounded"],
                        ["circle", "Circle"],
                      ].map(([value, label]) => (
                        <PatternChoice
                          key={value}
                          value={value}
                          label={label}
                          corner
                          active={design.cornerStyle === value && design.cornerDotStyle === value}
                          onClick={() => setDesign({ cornerStyle: value, cornerDotStyle: value })}
                        />
                      ))}
                    </div>
                  </section>
                  <section className="mono-setting">
                    <h3>Code &amp; background</h3>
                    <div className="mono-color-pair">
                      <ColorField
                        label="Code color"
                        value={design.foreground}
                        onChange={(value) => setDesign({ foreground: value })}
                      />
                      <ColorField
                        label="Background"
                        value={design.background}
                        onChange={(value) => setDesign({ background: value, transparent: false })}
                      />
                    </div>
                    <p className="mono-setting-hint">Black on white keeps things clear.</p>
                    <div className="mono-transparency">
                      <Switch
                        label="Transparent background"
                        checked={design.transparent}
                        onChange={(value) => setDesign({ transparent: value })}
                      />
                    </div>
                  </section>
                  <details className="mono-advanced">
                    <summary>
                      Spacing &amp; scan settings
                      <ChevronDown size={17} />
                    </summary>
                    <DesignPanel
                      sections={["Corners", "Advanced"]}
                      design={design}
                      onChange={(next) => a.change({ design: next })}
                      onNotice={a.notice}
                    />
                  </details>
                </>
              ) : (
                <DesignPanel
                  key={tab}
                  sections={tab === "logo" ? ["Logo"] : ["Frame & label"]}
                  design={design}
                  onChange={(next) => a.change({ design: next })}
                  onNotice={a.notice}
                />
              )}
              {(!ready || reliability?.warnings?.length > 0) && (
                <div className="mono-design-warnings">
                  {status}
                  {reliability?.warnings?.map((item) => (
                    <p key={item.code}>{item.message}</p>
                  ))}
                </div>
              )}
              <p className="mono-local-note">
                <LockKeyhole size={17} />
                Your content stays on this device.
              </p>
            </aside>
          </div>
        </>
      ) : mode === "create" ? (
        <>
          <section className="mono-create" aria-labelledby="mono-create-heading">
            <div className="mono-create-heading">
              <p className="mono-eyebrow">A LITTLE SOMETHING TO SHARE</p>
              <h1 id="mono-create-heading">What do you want to share?</h1>
              <p>A link, a Wi-Fi network, a little something.</p>
            </div>
            <div className="mono-create-grid">
              <div className="mono-create-controls">
                <div className="mono-type-tabs" role="group" aria-label="Content type">
                  {["url", "wifi", "vcard"].map((id) => (
                    <button
                      key={id}
                      aria-pressed={type === id}
                      onClick={() => {
                        a.switchType(id);
                        setMore(false);
                      }}
                    >
                      {id === "url" ? "Link" : id === "wifi" ? "Wi-Fi" : "Contact"}
                    </button>
                  ))}
                  <button aria-expanded={more} onClick={() => setMore(!more)}>
                    More
                    <ChevronDown size={16} />
                  </button>
                </div>
                {more && (
                  <div className="mono-more-types">
                    {QR_TYPE_DEFS.filter((item) => !["url", "wifi", "vcard"].includes(item.id)).map(
                      ({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          aria-pressed={type === id}
                          onClick={() => a.switchType(id)}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                )}
                {!["url", "wifi", "vcard"].includes(type) && (
                  <p className="mono-selected-type">
                    Sharing {QR_TYPE_DEFS.find((item) => item.id === type).label.toLowerCase()}
                  </p>
                )}
                <div className="mono-content-form">
                  <ContentForm
                    key={type}
                    type={type}
                    values={values}
                    onChange={(next) => a.change({ values: next })}
                    error={shownError}
                    touched={touched}
                    onBlur={a.touch}
                  />
                </div>
                {status}
                <div className="mono-main-actions">
                  <button ref={customizeRef} className="mono-button" onClick={enterCustomize}>
                    <SlidersHorizontal size={20} />
                    Customize
                  </button>
                  <button
                    className="mono-button black"
                    disabled={!ready || busy}
                    onClick={a.exportCode}
                    aria-label={"Download " + format.toUpperCase()}
                  >
                    <ArrowDownToLine size={21} />
                    {busy ? "Preparing…" : "Download QR"}
                  </button>
                </div>
                {formats}
                <div className="mono-secondary-actions">
                  <button onClick={a.openSave}>
                    <Save size={14} />
                    Save
                  </button>
                  <button disabled={!ready} onClick={() => a.copy(false)}>
                    <Copy size={14} />
                    {copied ? "Copied" : "Copy SVG"}
                  </button>
                  <button disabled={!ready} onClick={() => a.copy(true)}>
                    <Copy size={14} />
                    Copy image
                  </button>
                  <button onClick={a.openImport}>
                    <FileUp size={14} />
                    Open project
                  </button>
                  <button onClick={a.downloadProject}>
                    <ArrowDownToLine size={14} />
                    Project file
                  </button>
                  <button
                    onClick={a.undo}
                    disabled={!history.past.length}
                    aria-label="Undo"
                    title="Undo"
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    onClick={a.redo}
                    disabled={!history.future.length}
                    aria-label="Redo"
                    title="Redo"
                  >
                    <Redo2 size={15} />
                  </button>
                </div>
              </div>
              {preview()}
            </div>
          </section>
        </>
      ) : (
        <section className="mono-tool-screen">
          <button className="mono-text-button" onClick={() => changeMode("create")}>
            <ArrowLeft size={18} />
            Back to your code
          </button>
          <div className="mono-tool-grid">
            <div>
              <p className="mono-eyebrow">
                {mode === "batch" ? "BATCH CREATION" : "IMAGE SCANNER"}
              </p>
              <h1>{mode === "batch" ? "One style. Many codes." : "See what’s inside."}</h1>
              <p className="mono-tool-description">
                {mode === "batch"
                  ? "One link or text value per row. Your current design applies to every code."
                  : "Read a QR image on your device. Nothing opens automatically."}
              </p>
              {mode === "batch" ? (
                <div className="mono-tool-form">
                  <label>
                    Content type
                    <select
                      value={batchType}
                      onChange={(event) => a.setBatchType(event.target.value)}
                    >
                      <option value="url">Website links</option>
                      <option value="text">Plain text</option>
                    </select>
                  </label>
                  <label>
                    One value per row
                    <textarea
                      rows={8}
                      maxLength={300000}
                      value={batch}
                      onChange={(event) => a.setBatch(event.target.value)}
                    />
                  </label>
                  <label className="mono-upload-button">
                    <FileUp size={17} />
                    Import CSV
                    <input
                      type="file"
                      accept=".csv,.txt,text/plain,text/csv"
                      onChange={(event) => {
                        a.importBatch(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {formats}
                  <button
                    className="mono-button black"
                    disabled={busy || !batch.trim()}
                    onClick={a.batchCodes}
                  >
                    <ArrowDownToLine size={18} />
                    {batchProgress || "Download batch ZIP"}
                  </button>
                  <p>Up to 100 codes. PNG batch images are limited to 2048 px.</p>
                  <button
                    className="mono-text-button"
                    onClick={() => {
                      a.setMode("create");
                      enterCustomize();
                    }}
                  >
                    Customize batch style
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="mono-tool-form">
                  <label className="mono-scan-upload">
                    <ScanLine size={35} />
                    <strong>{scanBusy ? "Reading your image…" : "Choose a QR image"}</strong>
                    <span>PNG, JPEG or WebP · up to 10 MB</span>
                    <input
                      type="file"
                      disabled={scanBusy}
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        a.scan(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {scanError && <p role="alert">{scanError}</p>}
                  {scanResult && (
                    <>
                      <label>
                        Decoded content
                        <textarea readOnly value={scanResult} rows={4} />
                      </label>
                      <button className="mono-button" onClick={a.copyScan}>
                        <Copy size={17} />
                        {scanCopy ? "Copied" : "Copy content"}
                      </button>
                      <button
                        className="mono-button black"
                        onClick={() => {
                          a.change({ type: "text", values: { text: scanResult } });
                          changeMode("create");
                        }}
                      >
                        Create a code from this
                        <ArrowRight size={17} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="mono-tool-preview">
              {mode === "scan" && scanImage ? (
                <img src={scanImage} alt="Selected QR image" />
              ) : (
                preview(true)
              )}
            </div>
          </div>
        </section>
      )}

      {!customizing && (
        <footer className="mono-footer">
          <span>
            <LockKeyhole size={16} />
            Your details stay on this device.
          </span>
          <button onClick={() => changeMode(mode === "batch" ? "create" : "batch")}>
            {mode === "batch" ? "Create one code" : "Batch creation"}
            <ArrowRight size={14} />
          </button>
          <a href="https://github.com/Clyvora/QRCODE/blob/main/LICENSE" target="_blank" rel="noreferrer">
            Open source · MIT
          </a>
        </footer>
      )}
      <Dialog
        open={stylesOpen}
        onClose={() => setStylesOpen(false)}
        title="Find your starting point"
        description={
          MONO_STYLES.length + " black-and-white styles. Choose one, then make it yours."
        }
        size="lg"
      >
        <label className="sr-only" htmlFor="mono-style-search">
          Search styles
        </label>
        <input
          id="mono-style-search"
          className="mono-search"
          placeholder="Find a look…"
          value={styleSearch}
          onChange={(event) => setStyleSearch(event.target.value)}
        />
        <div className="mono-style-filters" role="group" aria-label="Style collection">
          {["all", "new", "clean", "dots", "frames", "captions"].map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={styleCategory === category}
              onClick={() => setStyleCategory(category)}
            >
              {category === "all"
                ? "All " + MONO_STYLES.length
                : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        <div className="mono-style-library">
          {visibleStyles.map((style) => (
            <StyleTile
              key={style.id}
              style={style}
              active={design.preset === style.id}
              onClick={() => {
                selectStyle(style);
                setStylesOpen(false);
              }}
            />
          ))}
        </div>
        {visibleStyles.length === 0 && (
          <p className="mono-empty">No matching styles. Try another name or collection.</p>
        )}
      </Dialog>
    </>
  );
}
