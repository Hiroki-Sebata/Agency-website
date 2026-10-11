#!/usr/bin/env bash
# Rename the studio everywhere.
#
#   ./scripts/rename-brand.sh "Your Studio Name"
#
# Replaces the placeholder brand in every HTML page, the web manifest, the
# config comments and the README. Afterwards you still need to redraw
# assets/img/logo.svg, assets/img/favicon.svg and assets/img/og-image.png.

set -euo pipefail

OLD="Northbound"
NEW="${1:-}"

if [ -z "$NEW" ]; then
  echo "Usage: $0 \"Your Studio Name\"" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

if ! grep -rq "$OLD" --include='*.html' .; then
  echo "No occurrences of \"$OLD\" found — has this already been renamed?" >&2
  exit 1
fi

count=$(grep -ro "$OLD" --include='*.html' --include='*.js' --include='*.webmanifest' --include='*.md' --include='*.txt' . | wc -l)

# -i '' is a BSD/macOS quirk; GNU sed wants no argument at all.
if sed --version >/dev/null 2>&1; then SEDI=(-i); else SEDI=(-i ''); fi

while IFS= read -r -d '' file; do
  sed "${SEDI[@]}" "s/${OLD}/${NEW}/g" "$file"
done < <(find . \
  -path ./.git -prune -o \
  \( -name '*.html' -o -name '*.js' -o -name '*.webmanifest' -o -name '*.md' -o -name '*.txt' -o -name '*.xml' \) \
  -type f -print0)

echo "Renamed ${count} occurrences: ${OLD} -> ${NEW}"
echo
echo "Still to do by hand:"
echo "  - assets/img/logo.svg      (mark + wordmark)"
echo "  - assets/img/favicon.svg   (mark only)"
echo "  - assets/img/og-image.png  (1200x630 social preview)"
echo "  - scripts/rename-brand.sh  (update OLD= if you rename again)"
echo
echo "Then run: node tools/check.mjs"
