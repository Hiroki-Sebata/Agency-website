#!/usr/bin/env bash
# Point the site at a different address.
#
#   ./scripts/set-domain.sh https://your-domain.com
#   ./scripts/set-domain.sh https://user.github.io/Repo-Name
#
# Rewrites every canonical link, Open Graph URL, sitemap entry and robots.txt
# line, and writes the CNAME file GitHub Pages needs for a custom domain.

set -euo pipefail

NEW="${1:-}"

if [ -z "$NEW" ]; then
  echo "Usage: $0 https://your-domain.com" >&2
  exit 1
fi

case "$NEW" in
  https://*|http://*) ;;
  *) echo "The URL needs to start with https:// or http://" >&2; exit 1 ;;
esac

NEW="${NEW%/}/"            # exactly one trailing slash

cd "$(dirname "$0")/.."

# Read the current base URL from index.html's canonical link. Do NOT scrape
# sitemap.xml — the first URL in it is the sitemaps.org XML namespace.
OLD=$(sed -n 's/.*<link rel="canonical" href="\([^"]*\)".*/\1/p' index.html | head -1)
OLD="${OLD%/}/"

if [ -z "$OLD" ] || [ "$OLD" = "/" ]; then
  echo "Could not find a canonical URL in index.html — aborting rather than guessing." >&2
  exit 1
fi

if [ "$OLD" = "$NEW" ]; then
  echo "Already set to $NEW — nothing to do."
  exit 0
fi

if sed --version >/dev/null 2>&1; then SEDI=(-i); else SEDI=(-i ''); fi

while IFS= read -r -d '' file; do
  sed "${SEDI[@]}" "s|${OLD}|${NEW}|g" "$file"
done < <(find . -path ./.git -prune -o \
  \( -name '*.html' -o -name '*.xml' -o -name '*.txt' \) -type f -print0)

# A custom domain needs a CNAME file; a github.io address must not have one.
HOST=$(printf '%s' "$NEW" | sed -E 's|^https?://||; s|/.*$||')
if printf '%s' "$HOST" | grep -q 'github\.io$'; then
  rm -f CNAME
  echo "Removed CNAME (github.io addresses must not have one)."
else
  printf '%s\n' "$HOST" > CNAME
  echo "Wrote CNAME -> $HOST"
  echo
  echo "DNS, at your registrar:"
  echo "  apex domain : four A records -> 185.199.108.153 .109.153 .110.153 .111.153"
  echo "  www.*       : one CNAME      -> <your-github-username>.github.io"
  echo
  echo "Then tick Settings -> Pages -> Enforce HTTPS once the certificate is issued."
fi

echo
echo "Rewrote $OLD -> $NEW"
echo "Run: node tools/check.mjs"
