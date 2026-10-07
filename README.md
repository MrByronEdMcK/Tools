# Educational Tools Suite

A modular, responsive web platform hosting interactive visualizers and educational tools for mathematics, statistics, and computer science.

Designed with a warm stationery aesthetic inspired by [Flash Cards](https://github.com/MrByronEdMcK/Flash_Cards), featuring high-contrast light and dark themes, 7 user-selectable accent colors, fluid mobile responsiveness, and zero bloated framework dependencies.

---

## Architecture Overview

```
Tools/
├── index.html                 # Main Tools Hub landing page
├── index.css                  # Hub grid layout, hero, filter bar styling
├── index.js                   # Client-side search, filtering, and tool card rendering
├── tools.json                 # Source of truth metadata catalog for all tools
│
├── shared/                    # Unified design system & shared runtime assets
│   ├── css/
│   │   ├── theme.css          # Design tokens (Warm Oat / Dark Walnut, 7 accents, typography)
│   │   ├── components.css     # Unified buttons, inputs, pills, cards, modal dialogs
│   │   └── tool-nav.css       # Persistent top navigation bar across all sub-tools
│   └── js/
│       ├── theme.js           # Theme (light/dark) & accent switcher with localStorage persistence
│       └── tools-data.js      # Offline / file:// protocol fallback metadata
│
├── Tools/                     # Individual subpage tool implementations
│   ├── Networks/              # Network Graph Studio (Dijkstra, Prim MST, Euler paths, matrix)
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   └── Regression/            # Least Squares Linear Regression Studio (OLS, SSE, R², Pearson r)
│       ├── index.html
│       ├── styles.css
│       └── app.js
│
├── tests/                     # Automated test suites
│   ├── run_tests.py           # Python CLI runner (smoke & full regression)
│   ├── test_hub.py            # Integrity tests (links, tokens, schema, branding)
│   ├── test_networks.py       # Graph theory algorithm & DOM unit tests
│   ├── test_regression.py     # Statistical computation & DOM unit tests
│   ├── index.html             # In-browser test dashboard
│   ├── runner.js              # Browser-based test engine
│   └── runner.css             # In-browser dashboard styling
│
└── .gitignore                 # Standard git exclusions (caches, bytecode)
```

---

## Design System & Theme Engine

### 1. Palette & Typography
- **Light Mode ("Warm Oat"):** Background canvas `#f6f3eb`, elevated card surfaces `#fdfbf7`, deep umber typography `#201d1a`.
- **Dark Mode ("Dark Walnut"):** Background canvas `#191715`, elevated card surfaces `#23201c`, crisp ivory typography `#f3ede2`.
- **Fonts:**
  - UI & Sans: `Plus Jakarta Sans`, system-ui
  - Headings / Editorial: `Lora`, serif
  - Code & Math: `JetBrains Mono`, monospace

### 2. User-Selectable Accent Themes
The suite includes 7 dynamic accent themes selectable via the Appearance modal:
- 🍊 **Orange** (Default) &mdash; `#ea580c`
- 🌿 **Green** &mdash; `#15803d`
- 🌊 **Blue** &mdash; `#2563eb`
- 🌸 **Pink** &mdash; `#db2777`
- ☀️ **Yellow / Amber** &mdash; `#d97706`
- 🍎 **Red** &mdash; `#dc2626`
- 🔮 **Purple** &mdash; `#7c3aed`

Selection persists across sessions via `localStorage` keys `tools-theme` and `tools-accent`.

---

## Adding a New Tool (Living Page Workflow)

To add a new tool to the pipeline:

### Step 1: Create the Tool Directory
Create a subfolder under `Tools/`, e.g., `Tools/Vectors/`:
```
Tools/Vectors/
├── index.html
├── styles.css
└── app.js
```

### Step 2: Wire Shared Assets in `index.html`
In your tool's `<head>`:
```html
<link rel="stylesheet" href="../../shared/css/theme.css">
<link rel="stylesheet" href="../../shared/css/components.css">
<link rel="stylesheet" href="../../shared/css/tool-nav.css">
<link rel="stylesheet" href="./styles.css">
<script src="../../shared/js/theme.js"></script>
```

Add the standard navbar at the top of your `<body>`:
```html
<header class="app-navbar">
  <div class="app-nav-left">
    <a href="../../index.html" class="btn-back-hub" title="Return to Tools Hub">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      <span>Tools</span>
    </a>
    <div class="app-nav-divider"></div>
    <div class="app-brand">
      <h1>Vector Calculus Visualizer</h1>
      <span class="badge badge-secondary">Calculus</span>
    </div>
  </div>
  <div class="app-nav-right">
    <button id="btn-theme-toggle" class="btn-icon" title="Toggle Light / Dark Mode">🌓</button>
  </div>
</header>
```

### Step 3: Register in `tools.json` and `shared/js/tools-data.js`
Add an entry to `tools.json`:
```json
{
  "id": "vectors",
  "title": "Vector Visualizer",
  "category": "Mathematics",
  "badge": "Vectors",
  "description": "Interactive 2D/3D vector arithmetic and dot/cross product visualization.",
  "path": "Tools/Vectors/index.html",
  "icon": "vector-icon.svg",
  "tags": ["vectors", "linear algebra", "physics"]
}
```
Mirror the entry in `shared/js/tools-data.js` to ensure the tool loads when running from local `file://` protocols without an active HTTP server.

---

## Verification & Testing

### Python CLI Test Runner
Run fast smoke checks (minor updates to files, schema, links, tokens, branding):
```bash
python tests/run_tests.py --quick
```

Run the full regression test suite (graph algorithms, statistical calculations, DOM anchors):
```bash
python tests/run_tests.py --full
```

### In-Browser Test Suite
Open `tests/index.html` in any browser to execute interactive runtime assertions and review diagnostic reports directly.
