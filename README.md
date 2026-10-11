# Northbound — agency website

A static marketing site: six pages, no framework, no build step, no dependencies.
Open `index.html` in a browser and it works.

```
index.html       Landing page
services.html    What we build — 5 services, engagement models, comparison table
solutions.html   Start from the problem — 6 situations, who we work with
reviews.html     Client reviews  (placeholder content — see checklist)
about.html       The founders, how we work, handover  (placeholder bios)
contact.html     Booking panel + contact form
privacy.html     Privacy notice  (template — needs your details)
404.html         Not-found page
```

---

## 1. Before you launch — the checklist

Five things need your input. Everything else already works.

| # | What | Where | Until you do it |
|---|------|-------|-----------------|
| 1 | **Contact-form key** | `assets/js/config.js` → `web3formsKey` | Form opens the visitor's email app instead of sending |
| 2 | **Booking link** | `assets/js/config.js` → `bookingUrl` | "Book a call" buttons scroll to the contact form |
| 3 | **Founder bios** | `about.html` → `FOUNDERS` comment block, plus the two cards on `index.html` | Says "edit me" on the page |
| 4 | **Real reviews** | `reviews.html`, plus two cards on `index.html` | Page says the reviews are placeholders |
| 5 | **Privacy details** | `privacy.html` — the `to add` / `to check` badges | Legal name and processors are missing |

Each of those pages carries a visible dashed-border notice explaining what to do.
**Delete the notice once you've done the thing** — that's how you know you're finished.

### 1.1 Make the contact form send

1. Go to <https://web3forms.com> and enter the inbox you want enquiries in.
2. Confirm the email they send you.
3. Paste the access key into `assets/js/config.js`:

```js
web3formsKey: "paste-your-key-here",
```

That's it. The form posts straight to Web3Forms from the browser — there's no
server to run and no key that needs hiding (a Web3Forms access key is designed
to be public; it only ever delivers to the address you verified).

The form already has: inline validation, a honeypot spam trap, a screen-reader
status message, and a fallback that opens the visitor's email client if the
request ever fails.

### 1.2 Make "Book a call" open a calendar

Paste your scheduling link into the same file:

```js
bookingUrl: "https://cal.com/your-handle/intro",
```

Every button marked `data-book` across the whole site picks it up — you only set
it once. Works with Cal.com, Calendly, TidyCal, Google Appointment Schedule, or
anything else with a public URL.

Prefer the calendar embedded in the page instead of a link? There's a commented-out
iframe in `contact.html`, just under the booking card.

---

## 2. Publishing to GitHub Pages

The site lives at the repository root, so Pages needs no build step:

1. **Settings → Pages**
2. **Source:** *Deploy from a branch*
3. **Branch:** your default branch, folder **`/ (root)`** → **Save**

A minute later it's live at `https://<user>.github.io/<repo>/`.

`.nojekyll` is already committed, which stops GitHub's Jekyll step from ignoring
files and folders that begin with an underscore.

> There's also `.github/workflows/pages.yml` if you'd rather deploy through
> GitHub Actions. It only runs when you trigger it by hand (Actions → Deploy to
> GitHub Pages → Run workflow), so it will never fail quietly in the background.
> To make it automatic, uncomment the `push:` trigger at the top of the file.

### Using your own domain

Once you've bought one:

```bash
./scripts/set-domain.sh https://your-domain.com
```

That rewrites every canonical URL, Open Graph URL, `sitemap.xml` and `robots.txt`,
and writes the `CNAME` file Pages needs. Then point your DNS at GitHub and tick
*Enforce HTTPS* in Settings → Pages.

### Renaming the studio

"Northbound" is a placeholder.

```bash
./scripts/rename-brand.sh "Your Studio Name"
```

It replaces the name everywhere — pages, manifest, config comments, this README.
Afterwards, redraw `assets/img/logo.svg` and `assets/img/favicon.svg`, and
regenerate the social preview image (see §5).

---

## 3. Editing the site

Plain HTML. No templating, no compile step — edit the file, refresh the browser.

**One thing to know:** the header and footer are repeated in each HTML file
rather than pulled from a shared partial, because that's the price of having no
build step. If you change a nav link, change it in all eight files. The checker
in §4 will catch a link you break, though not one you forget to update.

### Common edits

| You want to | Open |
|-------------|------|
| Change colours, spacing, fonts | `assets/css/main.css` — everything is a CSS variable in section 1 |
| Change nav or footer links | Each `.html` file (`<header class="header">` / `<footer class="footer">`) |
| Add a service | `services.html` + the nav mega-menu + the footer list |
| Change the response-time promise | `assets/js/config.js` → `responseTime` |
| Add LinkedIn / GitHub links | `assets/js/config.js` — they stay hidden while empty |
| Change behaviour (menus, form, reveals) | `assets/js/main.js` |

### Claims worth a second look

A few numbers are sensible defaults rather than measured facts. Read them and
make them true, or change them:

- "4–6 weeks" typical first launch — hero, about, OG image
- "within 1 business day" reply — `config.js`
- The timings on each service in `services.html`
- "1 project at a time per founder" — `about.html`

---

## 4. Checking your changes

```bash
node tools/check.mjs
```

No install required. It finds broken links and assets, `#anchors` pointing at
IDs that don't exist, duplicate `id` attributes, `aria-controls` / `for=`
wiring that points at nothing, images with no `alt`, pages missing a title or
`<h1>`, and absolute `/paths` (which break when the site is served from a
subfolder like `/Agency-website/`).

Run it before every push. It exits non-zero on failure, so it drops into CI
unchanged if you ever want that.

To preview locally:

```bash
python3 -m http.server 8777
# then open http://127.0.0.1:8777
```

Use a server rather than opening the file directly — `file://` breaks the
font loading and the `?service=` prefill.

---

## 5. Assets

| File | What it is |
|------|------------|
| `assets/img/favicon.svg` | Browser tab icon |
| `assets/img/logo.svg` | Mark + wordmark, for invoices and email signatures |
| `assets/img/og-image.png` | 1200×630 social preview (Slack, LinkedIn, WhatsApp, X) |
| `assets/img/icon-*.png` | Home-screen icons referenced by `site.webmanifest` |
| `assets/fonts/` | Inter Tight + JetBrains Mono, self-hosted |

The fonts are served from this repository rather than from Google's CDN. That
removes a third-party connection (so the page paints sooner) and means no
visitor IP addresses are handed to anyone — which is why the privacy notice is
able to say "no third-party fonts" and be telling the truth. Both families are
SIL Open Font Licence 1.1; see `assets/fonts/OFL.txt`.

To regenerate `og-image.png` after a rebrand, screenshot the hero at 1200×630,
or ask any LLM coding tool to rebuild it from `assets/img/logo.svg`.

---

## 6. What this site deliberately does not do

- **No analytics and no cookies.** Nothing is stored on a visitor's device,
  which is why there's no consent banner. Adding Google Analytics or a chat
  widget will almost certainly require one — and `privacy.html` would need
  updating to match.
- **No fabricated social proof.** The reviews are visibly templates rather than
  invented quotes, and the "trusted by" strip lists the technologies we build
  with rather than client logos we don't have.
- **No prices.** Every service page says the quote follows a call, by design.

---

## 7. Accessibility

Built to WCAG 2.2 AA as a target: skip link, visible focus rings, `aria-expanded`
on every disclosure, keyboard-operable menus and accordions, Escape to close,
scroll lock while the mobile drawer is open, labelled form fields with inline
errors tied via `aria-describedby`, a polite live region for form status, and
full support for `prefers-reduced-motion` and `prefers-contrast: more`.

Worth re-testing with a screen reader after you edit content — automated checks
can only catch the mechanical half.
