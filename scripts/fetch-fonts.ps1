# fetch-fonts.ps1 - download the house type library (ENGINE 5.1) into fonts/.
# The pool is gitignored (~52M), so a fresh clone runs this once, then
# install-fonts.ps1 registers them. Idempotent: skips a family whose files are
# already in fonts/. Requires: gh (authenticated), curl or Invoke-WebRequest.
#   usage:  pwsh -File scripts/fetch-fonts.ps1 [-Force]
# New-machine order:  npm run fetch:fonts && npm run install:fonts

param([switch]$Force)
$ErrorActionPreference = 'Stop'

$fonts = Join-Path $PSScriptRoot '..\fonts'
New-Item -ItemType Directory -Force $fonts | Out-Null
$fonts = (Resolve-Path $fonts).Path
$tmp = Join-Path $env:TEMP "ds-fonts-$PID"
New-Item -ItemType Directory -Force $tmp | Out-Null

function Have([string]$pattern) {
    -not $Force -and (Get-ChildItem (Join-Path $fonts $pattern) -ErrorAction SilentlyContinue).Count -gt 0
}

function FromRelease([string]$repo, [string]$tagPattern, [string]$asset, [string]$check) {
    if (Have $check) { Write-Host "  = $repo already present"; return }
    Write-Host "  + $repo ($asset)"
    # Download into a DIRECTORY (-D), never to a fixed path (-O): asset patterns carry
    # wildcards, and a wildcard inside an output filename is invalid on Windows. gh
    # keeps each asset's real name under -D. (Found by a fresh-clone test 2026-07-29 —
    # the local runs had always skipped this branch because the fonts were present.)
    $dl = Join-Path $tmp ($repo -replace '[/\\]', '_')
    New-Item -ItemType Directory -Force $dl | Out-Null
    gh release download -R $repo -p $asset -D $dl --clobber
    if ($LASTEXITCODE -ne 0) { throw "gh release download failed for $repo" }
    $ex = Join-Path $dl 'x'
    Get-ChildItem $dl -Filter '*.zip' | ForEach-Object { Expand-Archive $_.FullName $ex -Force }
    # -notlike '._*': macOS AppleDouble junk ships inside some release zips
    Get-ChildItem $ex -Recurse -Include '*.ttf' | Where-Object { $_.Name -notlike '._*' } | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $fonts $_.Name) -Force
    }
}

function FromGoogleFonts([string]$family, [string[]]$files, [string]$check) {
    if (Have $check) { Write-Host "  = $family already present"; return }
    Write-Host "  + $family (google/fonts)"
    foreach ($f in $files) {
        $out = Join-Path $fonts ($f -replace '%5B', '[' -replace '%5D', ']' -replace '\[wght\]', '')
        curl.exe -sL -o $out "https://raw.githubusercontent.com/google/fonts/main/ofl/$family/$f"
        # a 404 saves as a tiny text file - learned 2026-07-29 with Plex KR "Text"
        if ((Get-Item $out).Length -lt 100KB) { Remove-Item $out; throw "download failed (404?): $family/$f" }
    }
}

Write-Host "fetching house type library -> $fonts"

# Sans mains
FromRelease 'wanteddev/wanted-sans' 'v*' 'WantedSans-*.zip'   'WantedSans-*.ttf'
FromRelease 'sun-typeface/SUIT'     'v*' 'SUIT-ttf.zip'       'SUIT-*.ttf'
FromRelease 'sun-typeface/SUITE'    'v*' 'SUITE-ttf.zip'      'SUITE-*.ttf'
FromGoogleFonts 'ibmplexsanskr' @(
    'IBMPlexSansKR-Thin.ttf', 'IBMPlexSansKR-ExtraLight.ttf', 'IBMPlexSansKR-Light.ttf',
    'IBMPlexSansKR-Regular.ttf', 'IBMPlexSansKR-Medium.ttf', 'IBMPlexSansKR-SemiBold.ttf',
    'IBMPlexSansKR-Bold.ttf'   # NOTE: google/fonts has no "Text" weight for Plex KR
) 'IBMPlexSansKR-*.ttf'

# Serif main
FromGoogleFonts 'hahmlet' @('Hahmlet%5Bwght%5D.ttf') 'Hahmlet*.ttf'

# Mono main (family name is "Jetendard", no Mono suffix)
FromRelease 'kuskhan/jetendard' 'v*' 'Jetendard-TTF.zip' 'Jetendard*.ttf'

Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
$n = (Get-ChildItem (Join-Path $fonts '*.ttf')).Count
Write-Host "done - $n ttf in pool. Next: npm run install:fonts"
