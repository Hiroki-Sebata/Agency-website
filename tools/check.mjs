#!/usr/bin/env node
/* ==========================================================================
   Static site checker — no dependencies, no install.

       node tools/check.mjs

   Catches the things that actually break a hand-edited static site:
     - links and assets pointing at files that do not exist
     - #anchors pointing at IDs that are not on the target page
     - duplicate id attributes (invalid HTML, breaks label/aria wiring)
     - aria-controls / aria-labelledby / for= pointing at nothing
     - images without alt text
     - pages missing a title, description, canonical or <h1>
     - absolute /paths, which break when the site is served from a subfolder
       such as https://user.github.io/Agency-website/
   ========================================================================== */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const problems = [];
const warnings = [];

const fail = (file, msg) => problems.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const htmlFiles = readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
if (!htmlFiles.length) {
  console.error("No HTML files found in", ROOT);
  process.exit(1);
}

/* ---------------------------------------------------------------- parse */
const pages = new Map();

for (const file of htmlFiles) {
  const html = readFileSync(join(ROOT, file), "utf8");
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  pages.set(file, { html, ids, idSet: new Set(ids) });

  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(file, `duplicate id(s): ${[...new Set(dupes)].join(", ")}`);
}

/* ------------------------------------------------------------- per page */
for (const [file, { html, idSet }] of pages) {
  // --- required head elements
  if (!/<title>[^<]{5,}<\/title>/.test(html)) fail(file, "missing or empty <title>");
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) fail(file, "missing meta description");
  if (!/<link rel="canonical"/.test(html)) warn(file, "no canonical link");
  if (!/<html lang="/.test(html)) fail(file, "missing lang attribute on <html>");

  const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1s === 0) fail(file, "no <h1>");
  if (h1s > 1) warn(file, `${h1s} <h1> elements (one is usually right)`);

  // --- images need alt (decorative ones use alt="")
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(m[0])) fail(file, `<img> without alt: ${m[0].slice(0, 90)}`);
  }

  // --- links and assets
  const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((m) => m[1]);

  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(ref)) continue;

    if (ref.startsWith("/")) {
      fail(file, `absolute path "${ref}" — breaks when served from a subfolder; use a relative path`);
      continue;
    }

    const [beforeHash, hash] = ref.split("#");
    const path = beforeHash.split("?")[0];          // query strings are not part of the file name
    if (!path) continue;                             // pure "?query" with no path
    const target = resolve(ROOT, path);

    if (!existsSync(target) || !statSync(target).isFile()) {
      fail(file, `broken link or asset: ${ref}`);
      continue;
    }
    if (hash && path.endsWith(".html")) {
      const page = pages.get(relative(ROOT, target));
      if (page && !page.idSet.has(hash)) fail(file, `"${ref}" — #${hash} does not exist on that page`);
    }
  }

  // --- same-page anchors
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (!idSet.has(m[1])) fail(file, `href="#${m[1]}" has no matching id on this page`);
  }

  // --- aria wiring
  for (const attr of ["aria-controls", "aria-labelledby", "aria-describedby"]) {
    for (const m of html.matchAll(new RegExp(`${attr}="([^"]+)"`, "g"))) {
      for (const id of m[1].split(/\s+/)) {
        if (!idSet.has(id)) fail(file, `${attr}="${id}" points at an id that is not on the page`);
      }
    }
  }

  // --- label/for wiring
  for (const m of html.matchAll(/<label\b[^>]*\sfor="([^"]+)"/g)) {
    if (!idSet.has(m[1])) fail(file, `<label for="${m[1]}"> has no matching form control`);
  }

  // --- external links should not leak the opener
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(m[0])) warn(file, `target="_blank" without rel="noopener"`);
  }

  // --- leftover scaffolding
  if (/\bTODO\b|\bFIXME\b/.test(html) || /lorem ipsum/i.test(html)) {
    warn(file, "contains TODO/FIXME/Lorem ipsum");
  }
}

/* ------------------------------------------------- referenced-ness check */
const allRefs = new Set();
for (const { html } of pages.values()) {
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const clean = m[1].split("#")[0].split("?")[0];
    if (clean && !/^(https?:|mailto:|tel:|data:)/.test(clean)) allRefs.add(clean);
  }
}
for (const page of htmlFiles) {
  if (["index.html", "404.html"].includes(page)) continue;
  if (![...allRefs].some((r) => r.endsWith(page))) warn(page, "not linked from any other page");
}

/* ------------------------------------------------------------- required */
for (const f of ["assets/css/main.css", "assets/js/main.js", "assets/js/config.js",
                 "robots.txt", "sitemap.xml", ".nojekyll"]) {
  if (!existsSync(join(ROOT, f))) fail(f, "expected file is missing");
}

/* ---------------------------------------------------------------- report */
const label = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

if (warnings.length) {
  console.log(`\n⚠  ${label(warnings.length, "warning")}`);
  warnings.forEach((w) => console.log("   " + w));
}

if (problems.length) {
  console.log(`\n✗  ${label(problems.length, "problem")}`);
  problems.forEach((p) => console.log("   " + p));
  console.log("");
  process.exit(1);
}

console.log(`\n✓  ${label(htmlFiles.length, "page")} checked, no problems found.\n`);
