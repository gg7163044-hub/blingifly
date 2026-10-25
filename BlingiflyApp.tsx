"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, ImagePlus, LoaderCircle, Sparkles, WandSparkles, X, Zap } from "lucide-react";

type Mode = "generate" | "edit";
type Result = { image: string; mimeType: string; prompt: string; model: string };
const examples = [
  "A tiny glass greenhouse floating above a lavender ocean at sunset, dreamy editorial photography",
  "A futuristic Indian streetwear campaign, chrome textures, dramatic studio lighting, vivid magenta and cyan",
  "A whimsical claymation planet with tiny houses, soft shadows, tactile handmade details"
];

export default function BlingiflyApp() {
  const [mode, setMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");
  const [upload, setUpload] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [providerReady, setProviderReady] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/health").then(r => r.json()).then(d => setProviderReady(Boolean(d.providerConfigured))).catch(() => setProviderReady(false));
  }, []);

  useEffect(() => {
    if (!upload) { setUploadPreview(""); return; }
    const url = URL.createObjectURL(upload);
    setUploadPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [upload]);

  function selectFile(file?: File) {
    if (!file) return;
    setError(""); setNotice(""); setResult(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Choose a PNG, JPEG, or WebP image."); return; }
    if (file.size > 4 * 1024 * 1024) { setError("That image is over 4 MiB. Choose a smaller file."); return; }
    setUpload(file);
    setMode("edit");
  }
  function onFileChange(e: ChangeEvent<HTMLInputElement>) { selectFile(e.target.files?.[0]); e.target.value = ""; }
  function onDrop(e: DragEvent<HTMLDivElement>) { e.preventDefault(); selectFile(e.dataTransfer.files?.[0]); }

  async function run() {
    setError(""); setNotice(""); setResult(null);
    if (!prompt.trim()) { setError(mode === "generate" ? "Describe the image you want to create." : "Tell Blingifly what to change in your photo."); promptRef.current?.focus(); return; }
    if (mode === "edit" && !upload) { setError("Upload a photo first, then tell Blingifly what to change."); inputRef.current?.click(); return; }
    setLoading(true);
    try {
      let response: Response;
      if (mode === "generate") {
        response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt.trim() }) });
      } else {
        const form = new FormData();
        form.append("image", upload!);
        form.append("prompt", prompt.trim());
        response = await fetch("/api/edit", { method: "POST", body: form });
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong. Try again.");
      setResult(data as Result);
      setNotice("Your image is ready. Download it or try another prompt.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete the request. Please try again.");
    } finally { setLoading(false); }
  }

  function download() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.image;
    const ext = result.mimeType.includes("jpeg") ? "jpg" : result.mimeType.includes("webp") ? "webp" : "png";
    a.download = `blingifly-${mode}-${Date.now()}.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function setExample(value: string) { setPrompt(value); promptRef.current?.focus(); }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Blingifly home"><span className="brand-mark"><Sparkles size={18}/></span>blingifly<span className="brand-dot">.</span></a>
        <nav className="nav-links"><a href="#studio">Studio</a><a href="#how">How it works</a></nav>
        <a className="top-cta" href="#studio">Start creating <ArrowRight size={15}/></a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-pip"/> AI CREATIVE STUDIO <span className="eyebrow-line"/></div>
          <h1>Your ideas,<br/><span>out of this world.</span></h1>
          <p className="hero-desc">Dream it up. Type it out. Make it real. Generate original images or give your photos a whole new vibe.</p>
          <div className="hero-proof"><span><Check size={14}/> Text to image</span><span><Check size={14}/> Photo editing</span><span><Check size={14}/> Downloadable results</span></div>
          <a className="hero-link" href="#studio">Enter the studio <ArrowDownToLine size={16}/></a>
        </div>
        <div className="hero-art" aria-label="Abstract colorful 3D art illustration">
          <div className="art-glow glow-a"/><div className="art-glow glow-b"/>
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <div className="glass-orb"><div className="orb-shine"/></div>
          <div className="floating-tag tag-top"><Sparkles size={14}/> made of imagination</div>
          <div className="floating-tag tag-bottom"><span className="status-dot"/> your next idea starts here</div>
          <div className="art-stamp">BF<br/><small>001</small></div>
        </div>
      </section>

      <section className="studio-section" id="studio">
        <div className="section-heading"><div><div className="eyebrow">THE PLAYGROUND</div><h2>Make a little magic.</h2><p>One prompt away from something unexpected.</p></div><div className={`provider-status ${providerReady ? "ready" : providerReady === false ? "not-ready" : ""}`}><span/>{providerReady === null ? "Checking AI connection" : providerReady ? "AI connection configured" : "AI setup needed"}</div></div>

        <div className="studio-grid">
          <section className="control-panel">
            <div className="mode-switch" role="tablist" aria-label="Creation mode">
              <button className={mode === "generate" ? "mode-tab active" : "mode-tab"} onClick={() => {setMode("generate");setError("");setNotice("");}} role="tab" aria-selected={mode === "generate"}><Sparkles size={16}/> Generate</button>
              <button className={mode === "edit" ? "mode-tab active" : "mode-tab"} onClick={() => {setMode("edit");setError("");setNotice("");}} role="tab" aria-selected={mode === "edit"}><WandSparkles size={16}/> Edit photo</button>
            </div>

            {mode === "edit" && <div className="upload-zone" onDragOver={e => e.preventDefault()} onDrop={onDrop}>
              {uploadPreview ? <div className="upload-selected"><img src={uploadPreview} alt="Selected upload preview"/><div className="upload-file"><strong>{upload?.name}</strong><span>{((upload?.size || 0) / 1024 / 1024).toFixed(2)} MiB · ready to edit</span></div><button className="icon-button" onClick={() => setUpload(null)} aria-label="Remove uploaded photo"><X size={16}/></button></div> :
                <><div className="upload-icon"><ImagePlus size={21}/></div><strong>Drop your image here</strong><span>PNG, JPG or WebP · max 4 MiB</span><button className="upload-button" onClick={() => inputRef.current?.click()}>Choose an image</button><span className="or-text">or drag and drop</span></>}
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} hidden/>
            </div>}

            <div className="prompt-label-row"><label htmlFor="prompt">{mode === "generate" ? "Describe your image" : "What should change?"}</label><span>{prompt.length}/1800</span></div>
            <textarea id="prompt" ref={promptRef} maxLength={1800} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={mode === "generate" ? "A dreamy editorial photo of a tiny flower shop on Mars, warm sunset, 35mm film..." : "Replace the background with a dreamy sunset, keep the person natural and unchanged..."} rows={5}/>
            {mode === "generate" && <div className="examples"><span className="examples-label">TRY A PROMPT</span>{examples.map((example, i) => <button key={example} onClick={() => setExample(example)}>{["Dreamy world","Streetwear campaign","Claymation planet"][i]} <ArrowRight size={12}/></button>)}</div>}
            <button className="generate-button" onClick={run} disabled={loading}>{loading ? <><LoaderCircle className="spin" size={18}/> Creating your image...</> : <><Sparkles size={17}/> {mode === "generate" ? "Generate image" : "Edit my photo"} <ArrowRight size={17}/></>}</button>
            <p className="fine-print"><Zap size={12}/> AI generation may take a little while. Provider limits and availability apply.</p>
            {error && <div className="message error" role="alert">{error}</div>}
            {notice && <div className="message success" role="status">{notice}</div>}
          </section>

          <section className="result-panel" aria-live="polite">
            <div className="result-head"><div><span className="result-kicker">YOUR CANVAS</span><h3>{result ? "Look what you made." : "Your next masterpiece."}</h3></div>{result && <button className="download-button" onClick={download}><ArrowDownToLine size={15}/> Download</button>}</div>
            <div className={`canvas ${result ? "has-result" : ""}`}>
              {loading ? <div className="loading-state"><div className="loader-art"><Sparkles size={28}/></div><strong>Making a little magic...</strong><span>Giving your prompt a visual form.</span><div className="loading-bar"><i/></div></div> :
                result ? <img className="result-image" src={result.image} alt={`AI ${mode === "generate" ? "generated image" : "edited image"}`}/> :
                <div className="empty-state"><div className="empty-art"><div className="empty-sun"/><div className="empty-mountain mountain-a"/><div className="empty-mountain mountain-b"/><Sparkles className="empty-sparkle" size={22}/></div><span className="empty-label">A BLANK CANVAS, FULL OF POSSIBILITIES</span><strong>It starts with an idea.</strong><p>Your generated image will appear here, ready to download.</p></div>}
            </div>
            {result && <div className="result-meta"><span><Check size={13}/> Image created</span><span>{result.model}</span></div>}
            <div className="canvas-footer"><span><span className="tiny-star">✦</span> Made with imagination</span><span>BLINGIFLY STUDIO / 001</span></div>
          </section>
        </div>
      </section>

      <section className="how-section" id="how"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>From thought to <span>thing.</span></h2><div className="steps"><article><span className="step-num">01</span><Sparkles size={22}/><h3>Imagine it</h3><p>Describe what you see in your head. Specific details help shape the result.</p></article><article><span className="step-num">02</span><WandSparkles size={22}/><h3>Make it yours</h3><p>Generate from scratch or upload a photo and describe your edit.</p></article><article><span className="step-num">03</span><ArrowDownToLine size={22}/><h3>Take it with you</h3><p>Download the result and use it in your next creative project.</p></article></div></section>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Sparkles size={15}/></span>blingifly<span className="brand-dot">.</span></a><span>Made for the beautifully curious.</span><span>© {new Date().getFullYear()} Blingifly</span></footer>
    </main>
  );
}