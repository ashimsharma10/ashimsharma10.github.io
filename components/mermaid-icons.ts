/**
 * Icon pack for mermaid architecture diagrams.
 *
 * Hand-authored rather than pulled from @iconify-json/* on purpose: the packs
 * ship megabytes of JSON to render a handful of glyphs, and the site's CSP
 * blocks fetching them from a CDN at render time. Everything here is a plain
 * 24x24 path, so it inlines into the SVG and works offline.
 *
 * Use in an MDX mermaid fence as:
 *   NODE@{ icon: "sd:database", form: "square", label: "legacy OLTP", pos: "b" }
 */
export const SD_ICON_PACK = {
  prefix: 'sd',
  width: 24,
  height: 24,
  icons: {
    // relational source system
    database: {
      body: '<path fill="currentColor" d="M12 2c-4.42 0-8 1.79-8 4v12c0 2.21 3.58 4 8 4s8-1.79 8-4V6c0-2.21-3.58-4-8-4m0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2s-6-1.5-6-2s2.13-2 6-2M6 8.61c1.43.86 3.5 1.39 6 1.39s4.57-.53 6-1.39V12c0 .5-2.13 2-6 2s-6-1.5-6-2zm0 6c1.43.86 3.5 1.39 6 1.39s4.57-.53 6-1.39V18c0 .5-2.13 2-6 2s-6-1.5-6-2z"/>',
    },
    // the cloud platform
    cloud: {
      body: '<path fill="currentColor" d="M6.5 20q-2.28 0-3.89-1.57Q1 16.86 1 14.58q0-1.95 1.17-3.48q1.18-1.53 3.08-1.95q.63-2.3 2.5-3.73T12 4q2.63 0 4.46 1.83T18.3 10.3q1.55.18 2.58 1.34q1.02 1.16 1.02 2.71q0 1.7-1.18 2.88T17.85 20z"/>',
    },
    // ingestion, a stream of changes
    stream: {
      body: '<path fill="currentColor" d="M2 5h20v2.5H2zm0 5.75h13.5v2.5H2zM2 16.5h20V19H2zm15.5-5.75h4.5v2.5h-4.5z"/>',
    },
    // bronze, raw stacked landing files
    layers: {
      body: '<path fill="currentColor" d="M12 2L2 7l10 5l10-5zM2 12l10 5l10-5l-2.6-1.3L12 14.4l-7.4-3.7zm0 5l10 5l10-5l-2.6-1.3L12 19.4l-7.4-3.7z"/>',
    },
    // silver, cleaned and filtered
    filter: {
      body: '<path fill="currentColor" d="M3 4h18v2.5l-7 7V21l-4-2.5v-5l-7-7z"/>',
    },
    // gold, the modeled star schema
    star: {
      body: '<path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"/>',
    },
    // reporting
    chart: {
      body: '<path fill="currentColor" d="M4 20h16v2H2V2h2zm3-2V9h3v9zm5 0V4h3v14zm5 0v-6h3v6z"/>',
    },
    // a model, nodes and edges
    model: {
      body: '<path fill="currentColor" d="M12 2a3 3 0 0 1 1 5.83V9h4a2 2 0 0 1 2 2v1.17a3 3 0 1 1-2 0V11h-4v1.17a3 3 0 1 1-2 0V11H7v1.17a3 3 0 1 1-2 0V11a2 2 0 0 1 2-2h4V7.83A3 3 0 0 1 12 2"/>',
    },
    // orchestration
    cog: {
      body: '<path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 1 15.5 12a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.3 7.3 0 0 0-1.69-.98l-.37-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65A.5.5 0 0 0 10 22h4a.5.5 0 0 0 .5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01a.5.5 0 0 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64z"/>',
    },
    // governance and security
    shield: {
      body: '<path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5zm-1.2 14.2L7 11.4l1.4-1.4l2.4 2.4l4.8-4.8L17 9z"/>',
    },
  },
} as const
