## VXN Website

Modern static site with light JavaScript enhancements, bilingual i18n (English/French), and a Netlify Function for Google reCAPTCHA server-side verification. Deploy-ready for Netlify, with no build step required.

### Tech Stack
- **Frontend**: HTML + CSS + vanilla JS in `vxn/`
- **Serverless**: Netlify Functions (Node) in `netlify/functions/`
- **Hosting/CI**: Netlify
- **i18n**: JSON dictionaries in `vxn/assets/i18n/` applied via `vxn/assets/js/i18n.js`

### Repo Layout
```
.
├─ netlify/
│  └─ functions/
│     └─ verify-recaptcha.js     # Server-side verification for reCAPTCHA v2
├─ netlify.toml                   # Netlify config (publish dir, functions dir, env name)
└─ vxn/                           # Site root (published)
   ├─ assets/
   │  ├─ css/                    # Global and page CSS
   │  ├─ img/                    # Images and icons
   │  └─ js/
   │     ├─ main.js             # UX behaviors (transitions, nav, forms, SEO)
   │     └─ i18n.js             # Language switching and translation application
   ├─ assets/i18n/
   │  ├─ en.json                # English strings
   │  └─ fr.json                # French strings
   ├─ index.html                # Home
   ├─ blog.html + blog-post-*.html
   ├─ contact.html
   ├─ services.html, solutions.html, about.html
   ├─ privacy.html, security.html
   ├─ robots.txt, sitemap.xml
   └─ ...
```

### Quick Start (Local)
You can run the site either with Netlify Dev (recommended: enables serverless functions) or any static server (no functions).

1) Prerequisites
- Node 18+ recommended
- Netlify CLI for full local parity

2) Run with Netlify Dev
```bash
npm i -g netlify-cli   # or: npx netlify-cli --version
netlify dev            # serves from vxn/ and mounts functions at /.netlify/functions
```
The site will be available at a local URL printed by the CLI. The function `verify-recaptcha` will be available at `/.netlify/functions/verify-recaptcha`.

3) Run as a pure static site (no functions)
```bash
npx serve vxn          # or any static file server of your choice
```

### Deployment (Netlify)
The repository is already configured for Netlify:
- Publish directory: `vxn`
- Functions directory: `netlify/functions`
- Build command: none (static)

Steps:
1. Create a new site on Netlify and connect this repo, or drag-and-drop the `vxn/` folder in a manual deploy.
2. In Site settings → Environment variables, set `RECAPTCHA_SECRET` (see below).
3. Deploy. Netlify will serve `vxn/` and expose functions under `/.netlify/functions/*`.

### Environment Variables
- **RECAPTCHA_SECRET**: Google reCAPTCHA v2 secret used by the Netlify function.

Set it in Netlify UI (recommended) or locally for Netlify Dev:
```bash
# Using Netlify CLI (persists for the site)
netlify env:set RECAPTCHA_SECRET <your-secret>

# Or in a local .env file in the repo root (read by netlify dev)
echo RECAPTCHA_SECRET=<your-secret> > .env
```

### reCAPTCHA Server Verification
File: `netlify/functions/verify-recaptcha.js`
- Accepts POST `{"token":"<g-recaptcha-response>"}`
- Verifies with Google at `https://www.google.com/recaptcha/api/siteverify`
- Response shape:
```json
{ "success": true, "errorCodes": [], "hostname": "example.com" }
```

Frontend integration (in `vxn/assets/js/main.js`):
- Client-side validation runs on `contact.html` for forms marked `data-validate="contact"`.
- When the form also has `data-verify-recaptcha`, the script will:
  - Read `grecaptcha.getResponse()`
  - POST to `/.netlify/functions/verify-recaptcha`
  - On success, proceed with normal submit (Netlify Forms or your backend)

Ensure the page includes the reCAPTCHA v2 script and your site key, for example:
```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
<div class="g-recaptcha" data-sitekey="<your-site-key>"></div>
```

### Internationalization (i18n)
File: `vxn/assets/js/i18n.js`
- Default language is `en`. Dictionaries live in `vxn/assets/i18n/`.
- Text is applied to elements with `data-i18n="some.key"`.
- Basic value-based fallback helps for elements without `data-i18n` between English and French.

Switch language in the UI using buttons inside a `.lang-switch` container with `data-lang` attributes, e.g.:
```html
<div class="lang-switch">
  <button type="button" data-lang="en">EN</button>
  <button type="button" data-lang="fr">FR</button>
  <!-- add more as needed -->
  </div>
```

Add or update translations:
1. Edit `vxn/assets/i18n/en.json` and `fr.json` keys used by your markup.
2. Annotate your HTML with `data-i18n` using those keys, for example:
```html
<h1 data-i18n="value.index.title.part1"></h1>
<span class="accent" data-i18n="value.index.title.part2"></span>
```
3. To add a new language, create `vxn/assets/i18n/<code>.json` and add a friendly name in `LANG_NAME` inside `i18n.js`. Key-based translation will work; the value-based fallback is optimized for en↔fr.

### Frontend Behaviors (main.js)
`vxn/assets/js/main.js` wires several UX helpers:
- **Page transitions**: fade-out on internal navigation
- **Mobile drawer**: single toggle, body scroll lock, escape-to-close
- **Scroll reveal**: intersection observer + metric count-up animation
- **Typing effect**: typewriter effect for hero elements; cancelable on language switch
- **Form UX**: inline validation, top alert, progress bar, message length hint
- **SEO meta**: canonical link + basic OG/Twitter tags auto-filled per page

To opt a hero or text into typing, add `data-typed` or rely on hero heuristics.

### SEO and Discoverability
This site ships with sensible defaults and a few JS helpers to reduce manual meta work.

- **Canonical URL**: On page load, `main.js` sets a canonical `<link rel="canonical">` to `origin + pathname` (with `/index.html` collapsed to `/`). Prefer also hardcoding absolute canonicals per page for stability in environments where JS is limited.
  - Example in `index.html` currently has an empty canonical that is then filled by JS.

- **Open Graph/Twitter meta (fallback)**: `main.js` will populate `og:title`, `og:description`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description` from the page `<title>` and `<meta name="description">` when missing. Provide an absolute `og:image` per page for optimal sharing.
  - `index.html` includes `og:image`/`twitter:image` but uses relative paths; switch to absolute URLs in production (e.g., `https://your-domain/assets/...`).
  - `blog.html` includes comprehensive OG/Twitter tags and absolute images.

- **Structured data**: `blog.html` embeds JSON‑LD (`@type: Blog` + example `BlogPosting`). Consider per‑post JSON‑LD in each `blog-post-*.html` to improve article rich results.

- **i18n and `hreflang`**: Content is language‑switched client‑side via JS and updates `<html lang>` dynamically. `index.html` includes `rel="alternate" hreflang` links, but both point to the same URL. For proper international SEO, expose unique URLs per language (e.g., `/en/` and `/fr/` or `?lang=`) and point each `hreflang` to its language‑specific URL. Otherwise, remove `hreflang` to avoid ambiguity.

- **Robots and Sitemap**:
  - `vxn/robots.txt` allows all crawling and points to `https://www.example.com/sitemap.xml` (placeholder). Update to your live domain.
  - `vxn/sitemap.xml` lists core pages but also uses the `example.com` placeholder. Replace with your live absolute URLs.

- **Accessibility signals that help SEO**: skip link, meaningful `alt` attributes for images, and semantic headings are present across pages.

- **Performance hints**: preconnects on `blog.html` and minimal JS/CSS without a bundler help Core Web Vitals. Keep images optimized and prefer `width/height` attributes for CLS stability.

Production checklist:
1. Set absolute canonical URLs in each HTML head (JS will still keep them consistent).
2. Use absolute `og:image` per page; verify with social debuggers.
3. Update `robots.txt` and `sitemap.xml` to your real domain and full URL list.
4. Decide on language URL strategy and fix `hreflang` accordingly or remove it.
5. Mirror `blog.html` meta patterns on each `blog-post-*.html` (title, description, canonical, OG/Twitter, JSON‑LD).

### Blogging
Blog index is `vxn/blog.html`. Individual posts are `vxn/blog-post-*.html`.
- To add a post: duplicate an existing `blog-post-N.html`, update content and metadata, then link it from `blog.html`.

### Notes & Conventions
- No bundler or build step; keep JS/CSS modular and small.
- Keep secrets out of git. Use Netlify environment variables for production.
- Prefer `data-i18n` for all translatable text; avoid hard-coding strings in markup.

### Useful Links
- Google reCAPTCHA v2 docs: `https://developers.google.com/recaptcha/docs/display`
- Netlify Functions: `https://docs.netlify.com/functions/overview/`
- Netlify Dev: `https://docs.netlify.com/cli/local-development/`

### Contact
For questions or enhancements, open an issue or contact the project maintainer.


