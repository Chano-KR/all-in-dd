# install-fonts.ps1 - register the house type library (ENGINE 5.1) user-scope.
# Idempotent: a font already registered AND present on disk is skipped, so
# re-running on any machine only installs what is missing. No admin required.
#   usage:  pwsh -File scripts/install-fonts.ps1 [-Force]
#   -Force  re-copy and re-register everything (repairs a broken install)

param([switch]$Force)

$ErrorActionPreference = 'Stop'

$src = Join-Path $PSScriptRoot '..\fonts'
if (-not (Test-Path $src)) {
    Write-Error "font pool not found: $src - clone/copy the fonts/ dir first (it is gitignored; see dev_log_260729_04 for sources)"
}
# Shell.Application refuses unresolved '..' paths - normalize before COM sees it
$src = (Resolve-Path $src).Path

$dst = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Fonts'
$reg = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'
New-Item -ItemType Directory -Force $dst | Out-Null
if (-not (Test-Path $reg)) { New-Item -Path $reg -Force | Out-Null }

$shell = New-Object -ComObject Shell.Application
$existing = Get-ItemProperty -Path $reg
$installed = 0; $skipped = 0; $repaired = 0

Get-ChildItem (Join-Path $src '*.ttf'), (Join-Path $src '*.otf') -ErrorAction SilentlyContinue | ForEach-Object {
    $target = Join-Path $dst $_.Name

    # font display name from the file's own metadata; fall back to basename
    $title = ($shell.Namespace($src).ParseName($_.Name)).ExtendedProperty('System.Title')
    if (-not $title) { $title = $_.BaseName }
    $regName = "$title (TrueType)"

    $regValue = $existing.PSObject.Properties[$regName]?.Value
    $onDisk = (Test-Path $target) -and ((Get-Item $target).Length -eq $_.Length)

    if (-not $Force -and $regValue -and $onDisk) {
        $skipped++
        return
    }

    Copy-Item $_.FullName $target -Force
    New-ItemProperty -Path $reg -Name $regName -Value $target -PropertyType String -Force | Out-Null
    if ($regValue -or $onDisk) { $repaired++ } else { $installed++ }
    Write-Host "  + $title"
}

Write-Host "fonts: $installed installed, $repaired repaired, $skipped already present"
Write-Host "note: running apps (browsers, editors) see new fonts after restart; Typst sees them immediately"
