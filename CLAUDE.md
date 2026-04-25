# CLAUDE.md - Project Context for AI Assistant

## Project Overview
This is a **Measurement Converter** PWA - a standalone web application for converting between different units of measurement (weight, distance, volume, temperature, etc.).

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **PWA** | Service Worker (`sw.js`), Web App Manifest |
| **Fonts** | Google Fonts (Inter) |
| **Build System** | None (pure static files) |
| **Hosting** | Any static host (GitHub Pages, Netlify, Vercel, etc.) |

---

## Commands

### Run Local Development Server
Since this is a static site with no build step, you need a simple HTTP server to test it locally:

```bash
# Option 1: Python (pre-installed on macOS/Linux)
python3 -m http.server 8000

# Option 2: Node.js (if installed)
npx serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8000` in your browser.

### Build
**No build step required.** This project is pure static HTML/CSS/JS. All files are ready to deploy as-is.

### Deploy
Since there's no build system, deployment depends on your hosting choice:

```bash
# Example: Deploy to GitHub Pages
# 1. Push code to GitHub repository
# 2. Go to Settings → Pages → Select "main" branch → Save

# Example: Deploy to Netlify
# Drag and drop the entire folder to Netlify Drop zone

# Example: Deploy to Vercel
# vercel --prod
```

---

## PM Rules (Non-Technical)

1. **I am a non-technical Product Manager.** Explain all errors or required decisions in plain English.
2. **Prefer small, pure functions.** Keep code modular and easy to understand.
3. **Execute multi-step blueprints one step at a time.** Ask for approval before proceeding to the next step.

---

## Off-Limits Zones (DO NOT TOUCH)

The following files are critical for deployment and should not be modified without explicit approval:

| File | Reason |
|------|--------|
| `manifest.json` | PWA manifest - controls how the app installs |
| `manifest.webmanifest` | Web manifest linked in HTML |
| `sw.js` | Service worker - controls caching and offline behavior |

> **Note:** This project does NOT contain sensitive files like `.env`, `firebase.json`, or API keys. The above files are "off-limits" because they control deployment behavior, not security.

---

## Project Structure

```
/measurement-converter
├── index.html          # Main HTML entry point
├── script.js           # Application logic (unit conversions)
├── style.css           # Styling (dark theme with green/blue accents)
├── sw.js               # Service worker for offline support
├── manifest.json       # Chrome extension manifest
├── manifest.webmanifest # PWA web manifest
├── app-icon.svg        # App icon
└── icons-preview.html  # Icon preview page
```

---

## Key Features

- Category-based unit conversion (Weight, Distance, Volume, Temperature, etc.)
- Real-time conversion as user types
- Swap button to quickly reverse from/to units
- PWA installable (works offline via Service Worker)
- Dark theme UI with gradient accents