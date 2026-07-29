#!/usr/bin/env bash
# fonts.sh — fetch + install the house type library on macOS / Linux.
# Idempotent both halves: families already in fonts/ are not re-downloaded,
# files already installed are not re-copied. No sudo.
#   usage:  bash scripts/fonts.sh [--force]
# Needs: curl, unzip. gh (authenticated) is used if present; plain curl otherwise.

set -euo pipefail
FORCE="${1:-}"

root="$(cd "$(dirname "$0")/.." && pwd)"
pool="$root/fonts"
mkdir -p "$pool"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

case "$(uname -s)" in
  Darwin) dest="$HOME/Library/Fonts" ;;
  *)      dest="$HOME/.local/share/fonts/all-in-dd" ;;
esac
mkdir -p "$dest"

have() { [ "$FORCE" != "--force" ] && ls "$pool"/$1 >/dev/null 2>&1; }

# GitHub release zip -> ttf files into the pool. Skips macOS AppleDouble junk.
release() { # repo asset check
  local repo="$1" asset="$2" check="$3"
  if have "$check"; then echo "  = $repo"; return; fi
  echo "  + $repo ($asset)"
  # Download into a DIRECTORY: asset patterns carry wildcards, so a fixed -O path
  # would contain a literal '*'. Same bug the PowerShell twin had.
  local dl="$tmp/${repo//\//_}"
  mkdir -p "$dl"
  if command -v gh >/dev/null 2>&1; then
    gh release download -R "$repo" -p "$asset" -D "$dl" --clobber
  else
    local tag url
    tag="$(curl -sL "https://api.github.com/repos/$repo/releases/latest" | grep -m1 '"tag_name"' | cut -d'"' -f4)"
    # resolve the real asset name from the API — the pattern may be a glob
    url="$(curl -sL "https://api.github.com/repos/$repo/releases/latest" \
      | grep '"browser_download_url"' | cut -d'"' -f4 \
      | grep -E "/${asset//\*/.*}$" | head -1)"
    [ -n "$url" ] || { echo "no asset matching $asset in $repo $tag" >&2; exit 1; }
    curl -sL -o "$dl/$(basename "$url")" "$url"
  fi
  for z in "$dl"/*.zip; do unzip -qo "$z" -d "$dl/x"; done
  find "$dl/x" -name '*.ttf' ! -name '._*' -exec cp {} "$pool/" \;
}

gfont() { # family file... — google/fonts raws, with a 404 size guard
  local family="$1"; shift
  for f in "$@"; do
    local out="$pool/$(basename "$f" | sed 's/%5B/[/g; s/%5D/]/g; s/\[wght\]//')"
    [ "$FORCE" != "--force" ] && [ -f "$out" ] && continue
    echo "  + $family/$f"
    curl -sL -o "$out" "https://raw.githubusercontent.com/google/fonts/main/ofl/$family/$f"
    if [ "$(wc -c < "$out")" -lt 102400 ]; then rm -f "$out"; echo "download failed (404?): $family/$f" >&2; exit 1; fi
  done
}

echo "fetching -> $pool"
release wanteddev/wanted-sans 'WantedSans-*.zip' 'WantedSans-*.ttf'
release sun-typeface/SUIT     'SUIT-ttf.zip'     'SUIT-*.ttf'
release sun-typeface/SUITE    'SUITE-ttf.zip'    'SUITE-*.ttf'
release kuskhan/jetendard     'Jetendard-TTF.zip' 'Jetendard*.ttf'
gfont ibmplexsanskr IBMPlexSansKR-Thin.ttf IBMPlexSansKR-ExtraLight.ttf \
  IBMPlexSansKR-Light.ttf IBMPlexSansKR-Regular.ttf IBMPlexSansKR-Medium.ttf \
  IBMPlexSansKR-SemiBold.ttf IBMPlexSansKR-Bold.ttf
gfont hahmlet 'Hahmlet%5Bwght%5D.ttf'

echo "installing -> $dest"
installed=0; skipped=0
for f in "$pool"/*.ttf; do
  base="$(basename "$f")"
  case "$base" in ._*) continue ;; esac
  if [ "$FORCE" != "--force" ] && [ -f "$dest/$base" ] && [ "$(wc -c < "$dest/$base")" = "$(wc -c < "$f")" ]; then
    skipped=$((skipped+1)); continue
  fi
  cp "$f" "$dest/$base"; installed=$((installed+1))
done

# Linux needs the font cache refreshed; macOS picks fonts up on its own.
command -v fc-cache >/dev/null 2>&1 && fc-cache -f "$dest" >/dev/null

echo "fonts: $installed installed, $skipped already present"
