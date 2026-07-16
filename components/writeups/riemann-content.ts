// Auto-derived from the standalone Riemann write-up: scoped CSS + prose HTML.
export const css = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Source+Code+Pro:wght@400;600&display=swap');
@scope (.riemann-root) {


  :scope {
    --bg: #ffffff;
    --bg-card: #faf9f6;
    --bg-code: #f1efe8;
    --text: #000000;
    --text-muted: #5f5e5a;
    --heading: #000000;
    --border: #e2e1dc;

    --c-green:   #1D9E75;  --c-green-bg:  #EAF3DE; --c-green-tx:  #27500A;
    --c-blue:    #1565c0;  --c-blue-bg:   #E6F1FB; --c-blue-tx:   #0C447C;
    --c-orange:  #e65100;  --c-orange-bg: #FAECE7; --c-orange-tx: #712B13;
    --c-gold:    #b8860b;  --c-gold-bg:   #fbf3df; --c-gold-tx:   #7a5a06;
    --c-purple:  #6a4c93;  --c-purple-bg: #f0ebf7; --c-purple-tx: #4a3468;
    --c-pink:    #ad1457;  --c-pink-bg:   #fbe7f0; --c-pink-tx:   #7a0e3d;

    --link-underline: #cfe0f2;
    --canvas-bg: #ffffff;
    --readout-bg: rgba(255,255,255,0.92);
    --city-grad-1: #eef3f8;
    --city-grad-2: #fbfaf7;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :scope { scroll-behavior: smooth; }

  :scope {
    background: var(--bg);
    color: var(--text);
    font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.75;
    max-width: none;
    margin: 0;
    padding: 0;
  }

  h1, h2, h3, h4 { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; color: var(--heading); line-height: 1.25; font-weight: 700; }
  h1 { font-size: 2.2em; margin-bottom: 0.5em; letter-spacing: -0.015em; }
  h2 { font-size: 1.25em; margin: 2.4em 0 0.7em; padding-bottom: 0.35em; border-bottom: 1px solid var(--border); }
  h3 { font-size: 1.1em; margin: 1.7em 0 0.5em; color: var(--text); }
  p { margin-bottom: 1.05em; }
  a { color: var(--c-blue); text-decoration: none; border-bottom: 1px solid var(--link-underline); }
  a:hover { color: var(--c-blue-tx); border-bottom-color: var(--c-blue); }
  strong { color: var(--heading); font-weight: 600; }
  em { color: var(--text); }

  .katex { font-size: 1.04em; }
  p.eq { text-align: center; margin: 1.5em 0; overflow-x: auto; padding: 0.2em 0; }
  p.eq .katex { font-size: 1.22em; }
  .katex .mathdefault, .katex .mathnormal { color: inherit; }

  blockquote {
    border-left: 4px solid var(--c-purple); background: var(--bg-card);
    padding: 0.9em 1.2em; margin: 1.2em 0; font-size: 1.1em; color: var(--text);
    border-radius: 0 8px 8px 0; font-weight: 500;
  }

  .callout { border-radius: 10px; padding: 0.9em 1.2em; margin: 1.3em 0; font-size: 0.96em; line-height: 1.6; }
  .callout.plain   { background: var(--c-green-bg);  color: var(--c-green-tx); }
  .callout.insight { background: var(--c-orange-bg); color: var(--c-orange-tx); }
  .callout.note    { background: var(--c-blue-bg);   color: var(--c-blue-tx); }
  .callout b { font-weight: 700; }

  /* ζ-value table */
  table.zt { border-collapse: collapse; width: 100%; margin: 1.2em 0; font-size: 0.92em; }
  table.zt th, table.zt td { border: 1px solid var(--border); padding: 7px 12px; text-align: left; }
  table.zt th { background: var(--bg-card); font-weight: 600; }
  table.zt td:first-child, table.zt th:first-child { font-family: 'Source Code Pro', monospace; }
  table.zt tr:nth-child(even) td { background: var(--bg-card); }

  /* the meme card */
  .meme { background: var(--c-orange-bg); border-radius: 14px; padding: 2em 1.4em 1.6em; margin: 1.6em 0; text-align: center; border: 1px solid var(--border); }
  .meme .top { color: var(--text); font-size: 1.4em; font-weight: 700; }
  .meme .bottom { color: var(--c-orange); font-size: 1.9em; font-weight: 800; margin-top: 0.15em; }
  .meme .note { color: var(--text-muted); font-size: 0.82em; margin-top: 1em; line-height: 1.6; }

  /* ---- Table of contents ---- */
  .toc { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 1.1em 1.4em; margin: 1.8em 0 2.2em; }
  .toc h3 { margin: 0 0 0.6em; font-size: 0.82em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.09em; font-weight: 700; }
  .toc ol { list-style: none; counter-reset: toc; columns: 2; column-gap: 2em; font-size: 0.93em; }
  .toc li { counter-increment: toc; margin: 0.3em 0; break-inside: avoid; }
  .toc li::before { content: counter(toc) "."; color: var(--c-blue); margin-right: 0.5em; font-weight: 600; }
  .toc a { border: none; color: var(--text); }
  .toc a:hover { color: var(--c-blue); }

  /* ---- City pictogram ---- */
  .city-wrap { background: linear-gradient(var(--city-grad-1), var(--city-grad-2)); border: 1px solid var(--border); border-radius: 12px; padding: 16px 10px 6px; margin: 1.6em 0; overflow-x: auto; }
  .city-wrap svg { display: block; min-width: 700px; width: 100%; height: auto; }
  .city-key { display: flex; gap: 20px; flex-wrap: wrap; padding: 8px 10px 2px; font-size: 12.5px; color: var(--text-muted); }
  .city-key .item { display: flex; align-items: center; gap: 6px; }
  .city-key .sw { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

  /* ---- Figure / plot ---- */
  figure.fig { margin: 1.8em 0; }
  .plotbox { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 14px 14px 12px; overflow: hidden; }
  .plot-title { font-weight: 600; font-size: 0.95em; color: var(--text); margin-bottom: 4px; }
  .plot-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; font-size: 12px; color: var(--text-muted); }
  .plot-toolbar .hint { opacity: .9; }
  .plot-canvas-wrap { position: relative; }
  canvas.plot { display: block; width: 100%; border-radius: 8px; cursor: grab; touch-action: pinch-zoom; background: var(--canvas-bg); border: 1px solid var(--border); }
  canvas.plot:active { cursor: grabbing; }
  .polar-canvas-col { width: 100%; }
  .readout { position: absolute; top: 8px; right: 10px; font-family: 'Source Code Pro', monospace; font-size: 11.5px; color: var(--text); background: var(--readout-bg); border: 1px solid var(--border); padding: 2px 7px; border-radius: 5px; pointer-events: none; opacity: 0; transition: opacity .15s; }
  .plot-canvas-wrap:hover .readout { opacity: 1; }
  .btn { font-family: inherit; font-size: 12px; color: var(--text); background: var(--bg); border: 1px solid var(--border); padding: 3px 11px; border-radius: 6px; cursor: pointer; }
  .btn:hover { border-color: var(--c-blue); color: var(--c-blue); }
  .btn.primary { background: var(--c-blue); color: #fff; border-color: var(--c-blue); }
  .btn.primary:hover { background: var(--c-blue-tx); color: #fff; }
  .ctrl { display: flex; align-items: center; gap: 8px; }
  .ctrl label { font-size: 12px; color: var(--text-muted); }
  .ctrl input[type=range] { width: 130px; accent-color: var(--c-blue); }
  .ctrl .val { font-family: 'Source Code Pro', monospace; color: var(--c-blue-tx); min-width: 2.2em; font-size: 12px; }
  figcaption { font-size: 0.86em; color: var(--text-muted); margin-top: 0.7em; padding: 0 4px; }

  .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 12px; }
  .legend .item { display: flex; align-items: center; gap: 6px; color: #5f5e5a; }
  .legend .swatch { width: 16px; height: 3px; border-radius: 2px; display: inline-block; }
  .legend .swatch.dot { width: 9px; height: 9px; border-radius: 50%; }

  ol.refs { font-size: 0.9em; color: var(--text-muted); padding-left: 1.4em; }
  ol.refs li { margin: 0.35em 0; }
  ul.plainlist { margin: 0 0 1em 1.4em; }
  ul.plainlist li { margin: 0.35em 0; }

  .status-timeline { list-style: none; margin: 0.6em 0; }
  .status-timeline li { position: relative; padding-left: 1.4em; margin: 0.7em 0; }
  .status-timeline li::before { content: "\\2023"; position: absolute; left: 0; color: var(--c-blue); font-weight: 700; }

  @media (max-width: 640px) {
    .toc ol { columns: 1; }
  }
  .tagline { font-size: 1.08em; color: var(--text-muted); margin: 0 0 1.1em; }
  blockquote.tldr { border-left-color: var(--c-blue); background: var(--c-blue-bg); color: var(--c-blue-tx); font-weight: 400; font-size: 1.0em; }
}

/* Dark theme (site toggles a \`.dark\` class on <html> via next-themes).
   Canvas plot backgrounds intentionally stay light/paper-white — the
   drawn axes, gridlines and data colors are calibrated for a white
   canvas, so re-theming just the surrounding chrome (and keeping each
   graph as a lit "card") reads better than dark canvases with
   low-contrast axis text. */
.dark .riemann-root {
  --bg: #14141f;
  --bg-card: #1c1c2b;
  --bg-code: #26263f;
  --text: oklch(70.7% 0.022 261.325);
  --text-muted: #9e9bab;
  --heading: oklch(96.7% 0.003 264.542);
  --border: #34324e;

  --c-green:   #4fd18f;  --c-green-bg:  #16301f; --c-green-tx:  #a9e8c3;
  --c-blue:    #6cb2f4;  --c-blue-bg:   #16283d; --c-blue-tx:   #a9d2f7;
  --c-orange:  #ff9a52;  --c-orange-bg: #3a2415; --c-orange-tx: #ffc79a;
  --c-gold:    #e0b23c;  --c-gold-bg:   #3a3016; --c-gold-tx:   #f0d585;
  --c-purple:  #b79bea;  --c-purple-bg: #2a2440; --c-purple-tx: #d9c8f7;
  --c-pink:    #ef8ab8;  --c-pink-bg:   #3a1e2c; --c-pink-tx:   #f7b8d5;

  --link-underline: #2b4f6b;
  --canvas-bg: #000000;
  --readout-bg: rgba(20,20,31,0.92);
  --city-grad-1: #1b2131;
  --city-grad-2: #181c28;
}
`

export const prose = `<blockquote class="tldr"><strong>The 30-second version.</strong> The primes look random, yet a single function \\(\\zeta(s)\\) encodes their exact distribution. Extend \\(\\zeta\\) to the complex plane and it sprouts special inputs, its <em>zeros</em>, that behave like tuning frequencies for the primes. The <strong>Riemann Hypothesis</strong> says every one of those zeros lands on a single vertical line, \\(\\operatorname{Re}(s) = \\tfrac12\\). If true, the primes are spread as evenly as mathematics allows. It has stood open for 167 years and carries a $1,000,000 prize.</blockquote>

<h2 style="margin-top:0">A City Made of Numbers</h2>

<p>Let's say we live in a numbered city. The buildings are lined up in order, building 1, building 2, building 3, and on forever. Every building is put up the same way: by stacking identical unit blocks into storeys.</p>

<p>Some buildings only ever get <strong>one storey</strong>. No smaller building's floor plan divides evenly into them (other than a single unit block). Call these buildings <strong>prime</strong>.</p>

<p>Every other building past the first is <strong>multi-storeyed</strong>, it can be built by repeating some smaller floor plan several times. Building 6 is two copies of building 3's plan stacked up, or three copies of building 2's. These are the <strong>composite</strong> buildings.</p>

<div class="city-wrap">
<svg viewBox="0 0 1220 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Skyline of numbered buildings; one-storey buildings are primes, taller buildings are composite">
<line x1="0" y1="250" x2="1220" y2="250" stroke="#c9c6bc" stroke-width="2"/>
<g>
<rect x="20" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="26" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="37" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="32.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="34.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">2</text>
</g>
<g>
<rect x="55" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="61" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="72" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="67.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="69.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">3</text>
</g>
<g>
<rect x="90" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="96" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="107" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="90" y1="224" x2="118" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="96" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="107" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="104.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">4</text>
</g>
<g>
<rect x="125" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="131" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="142" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="137.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="139.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">5</text>
</g>
<g>
<rect x="160" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="166" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="177" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="160" y1="224" x2="188" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="166" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="177" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="174.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">6</text>
</g>
<g>
<rect x="195" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="201" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="212" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="207.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="209.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">7</text>
</g>
<g>
<rect x="230" y="211" width="28" height="39" rx="2" fill="#4a6fa5"/>
<rect x="236" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="247" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="230" y1="224" x2="258" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="236" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="247" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="230" y1="211" x2="258" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="236" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="247" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="244.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">8</text>
</g>
<g>
<rect x="265" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="271" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="282" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="265" y1="224" x2="293" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="271" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="282" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="279.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">9</text>
</g>
<g>
<rect x="300" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="306" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="317" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="300" y1="224" x2="328" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="306" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="317" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="314.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">10</text>
</g>
<g>
<rect x="335" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="341" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="352" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="347.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="349.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">11</text>
</g>
<g>
<rect x="370" y="211" width="28" height="39" rx="2" fill="#4a6fa5"/>
<rect x="376" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="387" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="370" y1="224" x2="398" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="376" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="387" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="370" y1="211" x2="398" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="376" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="387" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="384.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">12</text>
</g>
<g>
<rect x="405" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="411" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="422" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="417.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="419.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">13</text>
</g>
<g>
<rect x="440" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="446" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="457" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="440" y1="224" x2="468" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="446" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="457" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="454.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">14</text>
</g>
<g>
<rect x="475" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="481" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="492" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="475" y1="224" x2="503" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="481" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="492" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="489.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">15</text>
</g>
<g>
<rect x="510" y="198" width="28" height="52" rx="2" fill="#4a6fa5"/>
<rect x="516" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="527" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="510" y1="224" x2="538" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="516" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="527" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="510" y1="211" x2="538" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="516" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="527" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="510" y1="198" x2="538" y2="198" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="516" y="202.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="527" y="202.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="524.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">16</text>
</g>
<g>
<rect x="545" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="551" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="562" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="557.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="559.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">17</text>
</g>
<g>
<rect x="580" y="211" width="28" height="39" rx="2" fill="#4a6fa5"/>
<rect x="586" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="597" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="580" y1="224" x2="608" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="586" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="597" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="580" y1="211" x2="608" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="586" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="597" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="594.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">18</text>
</g>
<g>
<rect x="615" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="621" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="632" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="627.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="629.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">19</text>
</g>
<g>
<rect x="650" y="211" width="28" height="39" rx="2" fill="#4a6fa5"/>
<rect x="656" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="667" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="650" y1="224" x2="678" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="656" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="667" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="650" y1="211" x2="678" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="656" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="667" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="664.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">20</text>
</g>
<g>
<rect x="685" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="691" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="702" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="685" y1="224" x2="713" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="691" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="702" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="699.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">21</text>
</g>
<g>
<rect x="720" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="726" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="737" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="720" y1="224" x2="748" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="726" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="737" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="734.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">22</text>
</g>
<g>
<rect x="755" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="761" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="772" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="767.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="769.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">23</text>
</g>
<g>
<rect x="790" y="198" width="28" height="52" rx="2" fill="#4a6fa5"/>
<rect x="796" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="807" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="790" y1="224" x2="818" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="796" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="807" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="790" y1="211" x2="818" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="796" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="807" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="790" y1="198" x2="818" y2="198" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="796" y="202.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="807" y="202.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="804.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">24</text>
</g>
<g>
<rect x="825" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="831" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="842" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="825" y1="224" x2="853" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="831" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="842" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="839.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">25</text>
</g>
<g>
<rect x="860" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="866" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="877" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="860" y1="224" x2="888" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="866" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="877" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="874.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">26</text>
</g>
<g>
<rect x="895" y="211" width="28" height="39" rx="2" fill="#4a6fa5"/>
<rect x="901" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="912" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="895" y1="224" x2="923" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="901" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="912" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="895" y1="211" x2="923" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="901" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="912" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="909.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">27</text>
</g>
<g>
<rect x="930" y="211" width="28" height="39" rx="2" fill="#4a6fa5"/>
<rect x="936" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="947" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="930" y1="224" x2="958" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="936" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="947" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="930" y1="211" x2="958" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="936" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="947" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="944.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">28</text>
</g>
<g>
<rect x="965" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="971" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="982" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="977.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="979.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">29</text>
</g>
<g>
<rect x="1000" y="211" width="28" height="39" rx="2" fill="#4a6fa5"/>
<rect x="1006" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1017" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="1000" y1="224" x2="1028" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="1006" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1017" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="1000" y1="211" x2="1028" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="1006" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1017" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="1014.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">30</text>
</g>
<g>
<rect x="1035" y="237" width="28" height="13" rx="2" fill="#c98a13"/>
<rect x="1041" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="1052" y="241.5" width="5" height="5" fill="#e8c15a" opacity="0.9"/>
<rect x="1047.5" y="230" width="3" height="7" fill="#c98a13"/>
<text x="1049.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">31</text>
</g>
<g>
<rect x="1070" y="185" width="28" height="65" rx="2" fill="#4a6fa5"/>
<rect x="1076" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1087" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="1070" y1="224" x2="1098" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="1076" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1087" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="1070" y1="211" x2="1098" y2="211" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="1076" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1087" y="215.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="1070" y1="198" x2="1098" y2="198" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="1076" y="202.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1087" y="202.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="1070" y1="185" x2="1098" y2="185" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="1076" y="189.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1087" y="189.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="1084.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">32</text>
</g>
<g>
<rect x="1105" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="1111" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1122" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="1105" y1="224" x2="1133" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="1111" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1122" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="1119.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">33</text>
</g>
<g>
<rect x="1140" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="1146" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1157" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="1140" y1="224" x2="1168" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="1146" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1157" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="1154.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">34</text>
</g>
<g>
<rect x="1175" y="224" width="28" height="26" rx="2" fill="#4a6fa5"/>
<rect x="1181" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1192" y="241.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<line x1="1175" y1="224" x2="1203" y2="224" stroke="#7d9dc4" stroke-width="1" opacity="0.55"/>
<rect x="1181" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<rect x="1192" y="228.5" width="5" height="5" fill="#7d9dc4" opacity="0.9"/>
<text x="1189.0" y="266" text-anchor="middle" font-size="11" font-family="ui-monospace,monospace" fill="#5f5e5a">35</text>
</g>
</svg>
<div class="city-key">
  <span class="item"><span class="sw" style="background:#c98a13"></span>prime, exactly one storey</span>
  <span class="item"><span class="sw" style="background:#4a6fa5"></span>composite, smaller floor plans stacked</span>
</div>
</div>

<p>Every building from 2 onward is either prime, or a stack of primes multiplied together, and that stack is <strong>unique</strong>. Building 12 is always two of building&nbsp;2's plan and one of building&nbsp;3's (\\(12 = 2\\times2\\times3\\)), and nothing else. This is the <strong>Fundamental Theorem of Arithmetic</strong>: the primes are the atoms, and every number has exactly one atomic recipe. It is the single fact this whole page rests on.</p>

<p>The question that runs through everything below: as the city stretches to infinity, <strong>where are the one-storey buildings?</strong> They thin out, but never on a schedule. 2, 3, 5, 7, 11, 13, 17, 19… sometimes neighbours, sometimes far apart, never repeating. The tool that turns that chaos into a precise, testable law is a strange function called \\(\\zeta(s)\\), and the deepest unsolved question about it is the <strong>Riemann Hypothesis</strong>, the destination of this page.</p>

<div class="callout note">
  <b>How to read the graphs.</b> Every plot below is live. <strong>Scroll</strong> to zoom, <strong>drag</strong> to pan, <strong>double&#8209;click</strong> to reset. Some have sliders or a <em>Play</em> button, move them and watch the mathematics respond.
</div>

<div class="toc">
  <h3>Contents</h3>
  <ol>
    <li><a href="#sec1">What the zeta function is</a></li>
    <li><a href="#sec2">Watching a sum spiral</a></li>
    <li><a href="#sec3">The zeta transformation</a></li>
    <li><a href="#sec4">Euler's product, the bridge to primes</a></li>
    <li><a href="#sec5">Analytic continuation &amp; the zeros</a></li>
    <li><a href="#sec6">Counting primes: &pi;(x)</a></li>
    <li><a href="#sec7">Primes as a chorus of waves</a></li>
    <li><a href="#sec8">The Riemann Hypothesis</a></li>
    <li><a href="#sec9">Where it stands (2026)</a></li>
  </ol>
</div>


<!-- ======== SECTION 1 ======== -->
<h2 id="sec1">1. What the Zeta Function Is</h2>

<p>Take a number \\(s\\), and add up the reciprocals of every whole number raised to the power \\(s\\). That infinite sum <em>is</em> the zeta function:</p>

<p class="eq">\\[ \\zeta(s) = \\sum_{n=1}^{\\infty}\\frac{1}{n^s} = 1+\\frac{1}{2^s}+\\frac{1}{3^s}+\\frac{1}{4^s}+\\cdots \\]</p>

<p>Think of it as a machine: feed in \\(s\\), and it returns the total of that sum. Whether the machine gives a sensible answer depends entirely on \\(s\\):</p>

<ul class="plainlist">
  <li>If \\(s > 1\\), the terms shrink fast enough that the sum <strong>converges</strong> to a finite number. \\(\\zeta(2) = 1+\\tfrac14+\\tfrac19+\\cdots = \\tfrac{\\pi^2}{6} \\approx 1.645\\) (Euler's Basel Problem, 1734).</li>
  <li>At \\(s = 1\\) we get the harmonic series \\(1 + \\tfrac12 + \\tfrac13 + \\cdots\\), which <strong>diverges</strong> to infinity. This point is a <strong>pole</strong>, the function blows up there.</li>
  <li>If \\(s < 1\\), the raw sum diverges too. So how can \\(\\zeta(-1)\\) possibly equal a number? That's the story of Section&nbsp;5.</li>
</ul>

<table class="zt">
  <tr><th>\\(s\\)</th><th>\\(\\zeta(s)\\)</th><th>what it is</th></tr>
  <tr><td>\\(2\\)</td><td>\\(\\pi^2/6 \\approx 1.6449\\)</td><td>the Basel Problem</td></tr>
  <tr><td>\\(4\\)</td><td>\\(\\pi^4/90 \\approx 1.0823\\)</td><td>converges quickly</td></tr>
  <tr><td>\\(1\\)</td><td>\\(\\infty\\) (pole)</td><td>harmonic series diverges</td></tr>
  <tr><td>\\(0\\)</td><td>\\(-1/2\\)</td><td>only via continuation</td></tr>
  <tr><td>\\(-1\\)</td><td>\\(-1/12\\)</td><td>the famous &ldquo;1+2+3+&hellip;&rdquo; value</td></tr>
  <tr><td>\\(-2,-4,-6,\\dots\\)</td><td>\\(0\\)</td><td>the <em>trivial zeros</em></td></tr>
</table>

<figure class="fig" id="fig-real"></figure>

<div class="callout plain">
  <b>About that dashed purple half.</b> The defining sum only converges for \\(s>1\\). To the left of the pole, plugging numbers into \\(\\sum 1/n^s\\) just gives you a divergent mess. And yet the dashed purple curve is there, smooth and perfectly finite, giving values like \\(\\zeta(-1)=-\\tfrac1{12}\\). It isn't computed from the sum at all; it's the unique smooth continuation of the teal curve, the one function that agrees with \\(\\zeta\\) wherever the sum <em>does</em> converge and stays analytic everywhere else. That's <strong>analytic continuation</strong>, and it's how the entire left half of this picture, including every trivial zero, comes to exist. Section&nbsp;5 shows exactly how it's built and why it's the only possible extension.
</div>

<div class="callout plain">
  <b>The one big idea.</b> The zeta function packs the entire multiplicative structure of the integers into a single object. Because of a formula we'll meet next, everything about how the primes are distributed is hidden inside \\(\\zeta(s)\\), and the zeros of \\(\\zeta\\) are the key that unlocks it.
</div>


<!-- ======== SECTION 2 (spiral) ======== -->
<h2 id="sec2">2. Watching a Sum Spiral</h2>

<p>To go further we have to let \\(s\\) be a <strong>complex number</strong>, \\(s = \\sigma + it\\), a point on a 2D plane with a real part \\(\\sigma\\) and an imaginary part \\(t\\). Why? Because a complex power \\(n^{-s}\\) is not just a shrinking length; it also carries a <em>direction</em>. Writing \\(n^{-s} = n^{-\\sigma}\\cdot e^{-it\\ln n}\\), the factor \\(n^{-\\sigma}\\) sets the length and \\(e^{-it\\ln n}\\) sets the angle.</p>

<p>Add the terms nose-to-tail and, instead of creeping along a line, the running total <strong>spirals</strong> inward to its final value. That final point is \\(\\zeta(s)\\).</p>

<figure class="fig" id="fig-spiral"></figure>

<div class="callout plain">
  <b>Try it.</b> Drag the sliders or press <em>Play</em>. \\(\\sigma\\) controls how fast the terms shrink (bigger \\(\\sigma\\) = tighter, faster convergence); \\(t\\) controls how fast each term rotates relative to the last. Whatever you pick, the spiral always winds down onto one point, the value of \\(\\zeta(\\sigma+it)\\).
</div>


<!-- ======== SECTION 3 (transformation) ======== -->
<h2 id="sec3">3. The Zeta Transformation</h2>

<p>A single spiral shows \\(\\zeta\\) at one input. To see the whole function at once, watch what it does to an entire <em>grid</em> of inputs. Below, each faint straight line is a row or column of the input plane. Press <em>Play</em> and every point \\(s\\) slides to its output \\(\\zeta(s)\\), the rigid grid bends into a field of interlocking spirals.</p>

<figure class="fig" id="fig-transform"></figure>

<div class="callout plain">
  <b>What you're seeing.</b> This is the geometric personality of \\(\\zeta\\). Notice how the transformation is <em>smooth and angle-preserving</em> everywhere it's defined, a hallmark of a well-behaved ("analytic") complex function. That smoothness is exactly what lets Riemann extend \\(\\zeta\\) to places the original sum can't reach, in Section&nbsp;5. The point everything swirls around is the pole at \\(s = 1\\).
</div>


<!-- ======== SECTION 4 (Euler) ======== -->
<h2 id="sec4">4. Euler's Product, the Bridge to the Primes</h2>

<p>Here is why any of this touches the primes. In 1737 Euler proved that the same sum can be rewritten as a <strong>product over the prime buildings alone</strong>:</p>

<p class="eq">\\[ \\zeta(s) = \\sum_{n} \\frac{1}{n^s} = \\prod_{p\\ \\text{prime}} \\frac{1}{1-p^{-s}} \\]</p>

<p>The proof is our city in disguise. Expand each factor as a geometric series, \\(\\dfrac{1}{1-p^{-s}} = 1+p^{-s}+p^{-2s}+\\cdots\\), and multiply all the factors together. When you pick one term from each bracket and multiply, you get \\(1/n^s\\) for a number \\(n\\) built from those exact prime powers. Because every \\(n\\) has <em>one</em> unique prime recipe, every \\(1/n^s\\) appears <em>exactly once</em>. The product <em>is</em> unique factorization, written in analysis.</p>

<div class="callout plain">
  <b>In plain terms.</b> A sum over <em>every building</em> equals a product over <em>just the prime buildings</em>. That equals sign is the bridge, cross it in either direction and facts about primes become facts about a smooth function, and back. Below, switch on more primes and watch the product close in on the true curve.
</div>

<figure class="fig" id="fig-euler"></figure>

<div class="callout insight">
  <strong>First payoff: infinitely many primes.</strong> As \\(s \\to 1\\), the left side \\(\\zeta(s) \\to \\infty\\). If there were only finitely many primes, the right side would be a finite product of finite numbers, which is finite. Contradiction: there are <em>infinitely many primes</em>. Euler even showed \\(\\sum_p \\tfrac1p = \\infty\\): the primes are dense enough that their reciprocals still diverge.
</div>


<!-- ======== SECTION 5 (continuation) ======== -->
<h2 id="sec5">5. Analytic Continuation &amp; the Zeros</h2>

<p>The sum and the product both only make sense for \\(\\operatorname{Re}(s) > 1\\), that's the "wall." Riemann's decisive step (1859) was to show that \\(\\zeta\\) can be extended, <em>uniquely</em> and smoothly, to the entire complex plane, with the single exception of the pole at \\(s = 1\\). This is <strong>analytic continuation</strong>, the dashed purple half of Figure&nbsp;1, made rigorous.</p>

<div class="callout plain">
  <b>Why "unique."</b> A key theorem of complex analysis says a smooth (analytic) function is astonishingly rigid: if two such functions agree on any small patch, they agree <em>everywhere</em> they're both defined. So there is only one possible smooth extension of \\(\\zeta\\) past the wall. Riemann found it, and a whole landscape, full of zeros, appeared on the far side.
</div>

<p>The extension obeys a beautiful mirror symmetry. Define the <strong>completed zeta function</strong> by attaching a couple of standard factors:</p>

<p class="eq">\\[ \\xi(s) = \\pi^{-s/2}\\,\\Gamma\\!\\left(\\tfrac{s}{2}\\right)\\zeta(s), \\qquad \\xi(s) = \\xi(1-s) \\]</p>

<p>Here \\(\\Gamma\\) is the gamma function, the smooth version of the factorial. The identity \\(\\xi(s) = \\xi(1-s)\\) says the function is perfectly symmetric under reflection through the vertical line \\(\\operatorname{Re}(s) = \\tfrac12\\). That line, the <strong>critical line</strong>, is forced into the centre of the story by this symmetry alone.</p>

<p>The functional equation also explains the two families of zeros:</p>

<ul class="plainlist">
  <li><strong>Trivial zeros</strong> at \\(s = -2, -4, -6, \\dots\\). On the negative real axis the \\(\\Gamma(s/2)\\) factor forces \\(\\zeta\\) to vanish at every negative even integer. They're "trivial" because we understand them completely.</li>
  <li><strong>Nontrivial zeros</strong>: every <em>other</em> zero. The symmetry pins them inside the <strong>critical strip</strong> \\(0 \\le \\operatorname{Re}(s) \\le 1\\), and in mirror-image families: if \\(\\rho\\) is a zero, so are \\(\\bar\\rho\\), \\(1-\\rho\\), and \\(1-\\bar\\rho\\).</li>
</ul>

<p>And a famous byproduct of the continuation, the one that shows up all over the internet:</p>

<div class="meme">
  <div class="top">\\(1 + 2 + 3 + 4 + \\cdots\\)</div>
  <div class="bottom">\\(= -\\dfrac{1}{12}\\)&nbsp;?!</div>
  <div class="note">Not literally. The series obviously diverges to infinity. What's actually true is \\(\\zeta(-1) = -\\tfrac{1}{12}\\), the number the <em>analytically continued</em> function assigns to \\(s = -1\\). The continuation, not the naive sum, produces it (and physics, the Casimir effect, really does use this value).</div>
</div>


<!-- ======== SECTION 6 (pi(x)) ======== -->
<h2 id="sec6">6. Where Are the Primes? Counting with &pi;(x)</h2>

<p>Let \\(\\pi(x)\\) count the primes up to \\(x\\), the one-storey buildings up to house number \\(x\\). So \\(\\pi(10)=4\\), \\(\\pi(100)=25\\), \\(\\pi(10^6)=78{,}498\\). Plotted, it's a <strong>staircase</strong> that jumps by \\(+1\\) at each prime.</p>

<p>The teenage Gauss (c. 1792) noticed the staircase is closely shadowed by \\(x/\\ln x\\). A sharper companion is the <strong>logarithmic integral</strong> \\(\\operatorname{Li}(x) = \\int_2^x \\frac{dt}{\\ln t}\\). The <strong>Prime Number Theorem</strong> (Hadamard and de la Vall&eacute;e Poussin, 1896) proved these really are the right growth rate: \\(\\pi(x) \\sim x/\\ln x\\). Their proof worked precisely by using the zeros of \\(\\zeta\\).</p>

<figure class="fig" id="fig-pi"></figure>

<p>The staircase is the exact truth; the smooth curves are the approximations, and \\(\\operatorname{Li}(x)\\) hugs it tightly. The entire Riemann Hypothesis is, at heart, a statement about the <em>size of the gap</em> between the staircase and \\(\\operatorname{Li}(x)\\).</p>


<!-- ======== SECTION 7 (waves) ======== -->
<h2 id="sec7">7. Primes as a Chorus of Waves</h2>

<p>Riemann's paper made the zeros-control-primes link exact. Using a weighted prime count, the Chebyshev function \\(\\psi(x) = \\sum_{p^k \\le x} \\ln p\\), the <strong>explicit formula</strong> (von Mangoldt, 1895) reads:</p>

<p class="eq">\\[ \\psi(x) = x - \\sum_{\\rho} \\frac{x^{\\rho}}{\\rho} - \\ln(2\\pi) - \\tfrac12\\ln\\!\\left(1-x^{-2}\\right) \\]</p>

<p>Read it as: a smooth trend \\(x\\), corrected by one term per nontrivial zero \\(\\rho\\). Since \\(\\rho = \\beta + i\\gamma\\) gives \\(x^{\\rho} = x^{\\beta} e^{i\\gamma \\ln x}\\), each zero contributes an oscillating <strong>wave</strong> whose amplitude is set by \\(x^{\\beta}\\), the real part of the zero. Stack the waves and you rebuild the prime staircase exactly. This is the literal "music of the primes": the zeros are its frequencies.</p>

<div class="callout plain">
  <b>Drag the slider.</b> Start with the bare trend line \\(y = x\\), then add zeros one pair at a time. A few pairs give a loose wobble; add more and the curve snaps onto the true staircase, step by step.
</div>

<figure class="fig" id="fig-psi"></figure>

<p>The punchline is in that amplitude \\(x^{\\beta}\\). A zero with \\(\\beta\\) close to 1 would inject a violent, prime-scrambling wave; a zero with \\(\\beta = \\tfrac12\\) keeps its wave as quiet as the symmetry allows. So the question "how regular are the primes?" becomes, precisely, "how far right can a zero sit?"</p>


<!-- ======== SECTION 8 (RH) ======== -->
<h2 id="sec8">8. The Riemann Hypothesis</h2>

<blockquote>Every nontrivial zero of \\(\\zeta(s)\\) has real part exactly \\(\\tfrac12\\).</blockquote>

<p>That's the whole conjecture. Every one of the infinitely many nontrivial zeros, despite only being <em>known</em> to live somewhere in the strip \\(0 \\le \\operatorname{Re}(s) \\le 1\\), should sit precisely on the critical line \\(\\operatorname{Re}(s) = \\tfrac12\\).</p>

<h3>The single most important picture on this page</h3>

<p>Walk straight up the critical line and trace the value of \\(\\zeta(\\tfrac12+it)\\) itself as a curve in the complex plane, its real part on the horizontal axis, its imaginary part on the vertical axis, \\(t\\) increasing continuously. The result is a looping, spiralling curve, and <strong>every single time it passes through the origin, that crossing is a nontrivial zero.</strong> This is the classical "polar graph of \\(\\zeta(\\tfrac12+it)\\)," and it is arguably the most direct way to <em>see</em> the Riemann Hypothesis: not a list of coordinates, but a real curve, live in the plane, threading the needle at the origin again and again.</p>

<figure class="fig" id="fig-polar"></figure>

<p>Every loop that swings out and curls back through the centre is one nontrivial zero. Drag the \\(t\\) slider or press Play and watch the curve grow, lobe by lobe, the deeper it winds, the more zeros it has already threaded.</p>

<p>The map below shows the same zeros from a different angle: trivial zeros marching along the negative real axis, and every nontrivial zero (as far as anyone has ever calculated) balanced exactly on the yellow line.</p>

<figure class="fig" id="fig-zeros"></figure>

<h3>The landscape of \\(|\\zeta(s)|\\)</h3>

<p>One more way to see it, in three dimensions this time. Treat \\(\\sigma=\\operatorname{Re}(s)\\) and \\(t=\\operatorname{Im}(s)\\) as a flat map, and raise a landscape above it whose height is \\(|\\zeta(\\sigma+it)|\\). The pole at \\(s=1\\) becomes a mountain that shoots off the top of the chart; every nontrivial zero becomes a valley that drops all the way to sea level. Rotate the terrain below and look for the trench of zero-valleys running along \\(\\sigma=\\tfrac12\\), the critical line, seen as topography.</p>

<figure class="fig" id="fig-surface"></figure>

<h3>Why \\(\\tfrac12\\), and why it matters</h3>

<p>The functional equation \\(\\xi(s)=\\xi(1-s)\\) already forces the nontrivial zeros to be symmetric about \\(\\operatorname{Re}(s)=\\tfrac12\\): they come in pairs \\(\\rho\\) and \\(1-\\rho\\) straddling the line. RH is the claim that every pair has actually <em>collapsed onto</em> the line, that there are no off-line pairs at all. Through the explicit formula of Section&nbsp;7, this is exactly equivalent to the primes being as evenly spread as mathematically possible. Concretely, von Koch proved in 1901 that RH is the same statement as:</p>

<p class="eq">\\[ \\left|\\pi(x) - \\operatorname{Li}(x)\\right| \\le C\\sqrt{x}\\,\\ln x \\]</p>

<p>The error between the true prime count and its smooth estimate stays as small as \\(\\sqrt{x}\\), the size of the fluctuation you'd get from flipping a fair coin \\(x\\) times. RH says the primes, for all their local unpredictability, are globally as <em>pseudorandom and well-behaved</em> as they could ever be. An off-line zero at real part \\(\\beta > \\tfrac12\\) would blow this error up to size \\(x^{\\beta}\\), a detectable clumping of the primes.</p>

<div class="callout insight">
  <strong>Why anyone cares.</strong> RH is not one isolated puzzle. Hundreds of published theorems begin "assume the Riemann Hypothesis…", results on prime gaps, on fast primality testing, on the growth of arithmetic functions. It sits under so much of number theory that a proof would instantly upgrade an entire library of conditional results to unconditional ones. It is Problem&nbsp;8 on Hilbert's 1900 list and a Clay Millennium Prize Problem carrying a <strong>$1,000,000</strong> reward.
</div>

<h3>Visual evidence: the gaps between primes</h3>

<p>Zoom back into the street and measure the distance between consecutive one-storey buildings, the <strong>prime gaps</strong>. On average the gap near \\(x\\) is about \\(\\ln x\\) (primes near a million sit ~14 apart; near a billion, ~21). But the average hides real structure:</p>

<ul class="plainlist">
  <li><strong>Gaps are almost always even.</strong> Past 2, every prime is odd, so consecutive primes differ by an even number, so odd gaps simply can't occur (bar the lone \\(2\\to 3\\)).</li>
  <li><strong>Small gaps never run out.</strong> Gap 2 (twin primes like 11 &amp; 13) keeps recurring as far as anyone computes; whether it happens <em>infinitely</em> often is the still-open Twin Prime Conjecture.</li>
  <li><strong>Large gaps stay rare, predictably.</strong> Cramér's conjecture guesses the biggest gap near \\(x\\) is about \\((\\ln x)^2\\), unproven, but matching every gap ever measured.</li>
</ul>

<figure class="fig" id="fig-gaps"></figure>

<p>Individually the gaps look like noise, no formula fits that scatter. But taken as a whole they obey the tight statistical law RH predicts: locally unpredictable, globally lawful. That is the fingerprint of the critical line.</p>


<!-- ======== SECTION 9 (status) ======== -->
<h2 id="sec9">9. Where It Stands (mid&#8209;2026)</h2>

<p>The Riemann Hypothesis is still <strong>open</strong>, no proof, no counterexample. But "open" is a long way from "quiet":</p>

<ul class="status-timeline">
  <li><strong>Numerical verification.</strong> Rigorous computation (Platt &amp; Trudgian, 2020) confirms every zero up to height \\(\\sim 3\\times10^{12}\\) lies exactly on the critical line; large runs push verified counts into the tens of trillions. Not one stray zero has ever appeared.</li>
  <li><strong>Proportion on the line.</strong> Hardy (1914) proved infinitely many zeros satisfy \\(\\operatorname{Re}=\\tfrac12\\); Selberg (1942) a positive fraction; Conrey (1989) over 40%; recent work nudges it just past 41%.</li>
  <li><strong>Guth&ndash;Maynard (2024).</strong> Larry Guth and James Maynard sharpened Ingham's 1940 zero-density estimate from \\(3/5\\) to \\(13/25\\), the first real move in over 80 years, with direct consequences for primes in short intervals.</li>
  <li><strong>De Bruijn&ndash;Newman constant.</strong> RH is equivalent to \\(\\Lambda = 0\\) for a real constant \\(\\Lambda\\). Rodgers &amp; Tao proved \\(\\Lambda \\ge 0\\) (2018); Polymath&nbsp;15 showed \\(\\Lambda \\le 0.2\\). If RH holds, it holds "just barely."</li>
  <li><strong>Connes' program (2026).</strong> A February 2026 survey by Alain Connes outlines a strategy via Weil's quadratic form and trace formulas; using only primes below 13 it reproduces the first 50 zeros, provably on the line.</li>
  <li><strong>Formalization.</strong> The Prime Number Theorem is now machine-verified in Lean&nbsp;4's Mathlib, and analytic number theory is being formalized in earnest.</li>
</ul>

<div class="callout insight">
  <strong>The honest summary.</strong> After 167 years of overwhelming numerics, 40%+ of zeros provably on the line, the sharpest density bounds in nearly a century, an exact equivalent (\\(\\Lambda=0\\)) balanced on a knife's edge, and a fully proved analogue over finite fields, there is still no proof. Most experts expect the answer will need either a genuinely new idea in analysis, or the successful import of the spectral/geometric machinery that already settled the function-field case.
</div>


<!-- ======== REFERENCES ======== -->
<h2 id="refs">References</h2>
<ol class="refs">
  <li>B. Riemann, <em>&Uuml;ber die Anzahl der Primzahlen unter einer gegebenen Gr&ouml;sse</em>, 1859.</li>
  <li>H. M. Edwards, <em>Riemann's Zeta Function</em>, Dover, 2001.</li>
  <li>E. C. Titchmarsh (rev. D. R. Heath-Brown), <em>The Theory of the Riemann Zeta-Function</em>, 2nd ed., Oxford, 1986.</li>
  <li>J. B. Conrey, "The Riemann Hypothesis," <em>Notices of the AMS</em> 50, 341&ndash;353, 2003.</li>
  <li>L. Guth &amp; J. Maynard, "New large value estimates for Dirichlet polynomials," arXiv:2405.20552, 2024.</li>
  <li>B. Rodgers &amp; T. Tao, "The de Bruijn&ndash;Newman constant is non-negative," <em>Forum of Math, Pi</em>, 2020.</li>
  <li>D. Platt &amp; T. Trudgian, "The Riemann hypothesis is true up to 3&middot;10&sup1;&sup2;," <em>Bull. LMS</em>, 2021.</li>
  <li>A. Connes, "The Riemann Hypothesis: Past, Present and a Letter Through Time," arXiv:2602.04022, 2026.</li>
  <li>P. Borwein, "An Efficient Algorithm for the Riemann Zeta Function," 1995 (used for the live computations here).</li>
  <li>Clay Mathematics Institute, <a href="https://www.claymath.org/millennium/riemann-hypothesis/">Millennium Problem: Riemann Hypothesis</a>.</li>
  <li>Wikipedia, <a href="https://en.wikipedia.org/wiki/Riemann_hypothesis">Riemann Hypothesis</a> · <a href="https://en.wikipedia.org/wiki/Riemann_zeta_function">Riemann Zeta Function</a>.</li>
</ol>`
