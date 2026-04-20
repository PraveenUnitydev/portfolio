# Praveen Krishna — XR Portfolio
## Setup, Deployment & 3D Model Guide

---

## 📁 File Structure

```
portfolio/
├── index.html          ← Main page (edit content here)
├── css/
│   └── style.css       ← All styles (edit theme/layout here)
├── js/
│   ├── models.js       ← 3D card scenes + GLB loader
│   ├── background.js   ← Full-screen particle background
│   └── ui.js           ← Cursor, skill bars, glitch, nav badge
├── models/             ← PUT YOUR .GLB FILES HERE
│   ├── vr-headset.glb  (example)
│   ├── controller.glb  (example)
│   └── ar-glasses.glb  (example)
└── README.md
```

---

## 🚀 How to Publish

### Option A — GitHub Pages (Free, Recommended)
1. Create a new repo on GitHub (e.g. `praveen-portfolio`)
2. Upload all files keeping the folder structure intact
3. Go to **Settings → Pages → Source → main branch / root**
4. Your site will be live at `https://yourusername.github.io/praveen-portfolio`

### Option B — Netlify (Free, Drag & Drop)
1. Go to [netlify.com](https://netlify.com) and log in
2. Drag the entire `portfolio/` folder into the Netlify dashboard
3. Done — you get a live URL instantly
4. Connect your custom domain `praveenkrishna.dev` in Site Settings

### Option C — Vercel
1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. No build config needed — static site deploys automatically

### Option D — Your Own Hosting (cPanel / FTP)
1. Upload all files to `public_html/` on your server
2. Make sure folder structure is preserved

---

## 🥽 How to Add Your 3D Models

### Step 1 — Export your model as GLB
- In **Blender**: File → Export → glTF 2.0 → select **GLB** format
- In **Unity**: Use the [UnityGLTF](https://github.com/KhronosGroup/UnityGLTF) package or export via File → Export
- In **Maya / Max**: Use the glTF exporter plugin

**Tips for best results:**
- Keep file size under **5MB** for fast loading
- Bake textures if possible
- Use **Draco compression** for smaller files (Blender supports this natively)
- Remove unnecessary geometry/bones not visible in the card

### Step 2 — Put the file in /models/
```
portfolio/
└── models/
    ├── vr-headset.glb
    ├── controller.glb
    └── ar-glasses.glb
```

### Step 3 — Link it in index.html

Find the `.ccanvas` div for the card you want to update.
Set the `data-model` attribute to the path of your file:

```html
<!-- BEFORE (placeholder) -->
<div class="ccanvas"
     id="cc1"
     data-model=""
     data-color="#00f5ff"
     data-scale="1.0">
</div>

<!-- AFTER (your real model) -->
<div class="ccanvas"
     id="cc1"
     data-model="models/vr-headset.glb"
     data-color="#00f5ff"
     data-scale="1.2">
</div>
```

### data-* attributes explained

| Attribute     | What it does                                          | Example         |
|---------------|-------------------------------------------------------|-----------------|
| `data-model`  | Path to your `.glb` file. Leave empty for placeholder | `"models/vr-headset.glb"` |
| `data-color`  | Accent hex color for the ring, glow, particles        | `"#00f5ff"`     |
| `data-scale`  | Scale multiplier (1.0 = auto-fit, go higher if small) | `"1.4"`         |

### The three card IDs

| ID    | Card             | Suggested model       |
|-------|------------------|-----------------------|
| `cc1` | VR Headset       | `models/vr-headset.glb` |
| `cc2` | XR Controller    | `models/controller.glb` |
| `cc3` | AR Device        | `models/ar-glasses.glb` |

### Troubleshooting models

**Model is too big / too small**
→ Adjust `data-scale`. Try values between `0.5` and `3.0`

**Model loads but is pitch black**
→ Your GLB has no emissive material. Open in Blender, add a material with Emission, re-export.

**Model doesn't load at all**
→ Open browser DevTools (F12) → Console tab — you'll see the error.
→ Most common cause: wrong file path. Double-check spelling and case.

**Works locally but not on the live site**
→ File paths are case-sensitive on Linux servers. Make sure `models/VR-Headset.glb` and `data-model="models/vr-headset.glb"` match exactly.

**CORS error when loading from file://**
→ You must serve the site through a local server, not by opening index.html directly.
→ Easy fix: use VS Code Live Server extension, or run `npx serve .` in the portfolio folder.

---

## ✏️ How to Edit Content

### Change your name / contact
Open `index.html` and search for:
- `PRAVEEN` / `KRISHNA` → your name
- `praveenunitydev@gmail.com` → your email
- `praveenkrishna.dev` → your domain
- `+91 82486 60962` → your phone
- LinkedIn / GitHub `href` attributes → your profile URLs

### Add / remove a skill bar
In `index.html`, copy/paste a `.sk-item` block:
```html
<div class="sk-item" data-pct="85">
  <div class="sk-top">
    <span class="sk-name">YOUR SKILL NAME</span>
    <span class="sk-pct">85%</span>
  </div>
  <div class="sk-bar"><div class="sk-fill"></div></div>
</div>
```
Change `data-pct` and the `85%` text to your value.

### Add a project card
Copy a `.pcard` block in `index.html`, update:
- Tags inside `.ptags`
- `.ptitle` — project name
- `.pdesc` — description
- `.plink href` — link to your live project or case study
- `.pbg` background gradient (or replace with `background-image: url(...)`)

### Change the theme colors
Open `css/style.css` and edit the `:root` variables at the top:
```css
:root {
  --cyan:    #00f5ff;   /* main accent */
  --magenta: #ff00aa;   /* secondary accent */
  --green:   #39ff14;   /* badges, dots */
  --gold:    #ffd700;   /* achievements */
  --dark:    #020408;   /* background */
}
```

---

## 🔧 Running Locally

```bash
# Option 1 — Node (if you have it)
npx serve .

# Option 2 — Python
python -m http.server 8080

# Option 3 — VS Code
Install "Live Server" extension → right-click index.html → "Open with Live Server"
```
Then open `http://localhost:8080` in your browser.

> ⚠️ **Do not open index.html directly as a file:// URL** — the GLB loader will fail due to browser CORS restrictions.
