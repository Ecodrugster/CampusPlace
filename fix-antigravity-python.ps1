# Fix Antigravity / Antigravity IDE Python interpreter discovery on Windows.
# Marketplace updates often reinstall "universal" Python extensions that break env detection.
# This script removes universal builds and copies win32-x64 builds from VS Code.

$ErrorActionPreference = "Stop"

$vscodeExt = Join-Path $env:USERPROFILE ".vscode\extensions"
$targets = @(
  (Join-Path $env:USERPROFILE ".antigravity\extensions"),
  (Join-Path $env:USERPROFILE ".antigravity-ide\extensions")
)

$pythonSrc = Get-ChildItem $vscodeExt -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like "ms-python.python-*-win32-x64" } |
  Sort-Object Name -Descending |
  Select-Object -First 1

$envsSrc = Get-ChildItem $vscodeExt -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like "ms-python.vscode-python-envs-*-win32-x64" } |
  Sort-Object Name -Descending |
  Select-Object -First 1

if (-not $pythonSrc -or -not $envsSrc) {
  Write-Host "[ERROR] win32-x64 Python extensions not found in VS Code:"
  Write-Host "  $vscodeExt"
  Write-Host "Open VS Code -> Extensions -> Python / Python Environments -> ensure installed."
  exit 1
}

Write-Host "Source Python : $($pythonSrc.Name)"
Write-Host "Source Envs   : $($envsSrc.Name)"

foreach ($dst in $targets) {
  if (-not (Test-Path $dst)) {
    Write-Host "Skip missing: $dst"
    continue
  }

  Write-Host ""
  Write-Host "Fixing $dst"

  Get-ChildItem $dst -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "ms-python.python-*" -or $_.Name -like "ms-python.vscode-python-envs-*" } |
    ForEach-Object {
      Write-Host "  remove $($_.Name)"
      Remove-Item $_.FullName -Recurse -Force
    }

  Copy-Item $pythonSrc.FullName (Join-Path $dst $pythonSrc.Name) -Recurse -Force
  Copy-Item $envsSrc.FullName (Join-Path $dst $envsSrc.Name) -Recurse -Force
  Write-Host "  installed $($pythonSrc.Name)"
  Write-Host "  installed $($envsSrc.Name)"
}

Write-Host ""
Write-Host "Done. Fully quit Antigravity IDE and reopen CampusPlace."
Write-Host "Then: Ctrl+Shift+P -> Python: Select Interpreter -> .venv\\Scripts\\python.exe"
Write-Host "Do NOT update the Python extension from Antigravity marketplace (it reinstalls universal)."
