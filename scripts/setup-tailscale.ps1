#requires -Version 5.1
<#
.SYNOPSIS
  One-shot Tailscale setup for Mia. Installs Tailscale, brings it online with a
  stable hostname, and optionally enables Funnel so your phone can install the
  app as a real PWA over HTTPS.

.DESCRIPTION
  Run on the laptop that hosts `npm run dev`. After this runs:
    - Your laptop is reachable from any device in your Tailnet at
      http://<hostname>:3000
    - With -Funnel, it's also reachable publicly at
      https://<hostname>.<tailnet>.ts.net  (iOS-installable PWA)

  You'll be prompted to sign in via browser once. Rerunning the script is safe.

.PARAMETER Hostname
  The Tailnet hostname for this laptop. Default: mia-laptop.

.PARAMETER Funnel
  Also enable a public HTTPS tunnel on port 3000.

.EXAMPLE
  pwsh -File scripts/setup-tailscale.ps1
  pwsh -File scripts/setup-tailscale.ps1 -Hostname scott-laptop -Funnel

.NOTES
  Install Tailscale on your phone too (App Store / Play Store) and sign in with
  the same account — then the hostname URL works from anywhere on any network.
#>

[CmdletBinding()]
param(
  [string]$Hostname = "mia-laptop",
  [switch]$Funnel,
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

function Has-Command($name) {
  $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

Write-Host ""
Write-Host "Mia · Tailscale setup" -ForegroundColor Cyan
Write-Host "---------------------"

# 1. Install if missing
if (-not (Has-Command "tailscale")) {
  if (-not (Has-Command "winget")) {
    Write-Host "winget not available. Install manually from https://tailscale.com/download" -ForegroundColor Yellow
    exit 1
  }
  Write-Host "Installing Tailscale via winget..."
  winget install --id=tailscale.tailscale -e --accept-source-agreements --accept-package-agreements --silent
  # winget puts tailscale.exe on PATH after a new shell; refresh for this session
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
              [System.Environment]::GetEnvironmentVariable("Path","User")
  if (-not (Has-Command "tailscale")) {
    Write-Host "Tailscale installed but not on PATH yet. Close and reopen PowerShell, then rerun this script." -ForegroundColor Yellow
    exit 0
  }
} else {
  Write-Host "Tailscale already installed."
}

# 2. Bring it up (interactive login on first run, no-op if already authed)
Write-Host "Bringing Tailscale online as '$Hostname'..."
Write-Host "  (If this is the first time, a browser will open for you to sign in.)"
tailscale up --hostname=$Hostname --accept-routes --reset | Out-Null

# 3. Confirm status
$status = tailscale status --json | ConvertFrom-Json
$self = $status.Self
if (-not $self) {
  Write-Host "Tailscale didn't come up cleanly. Check 'tailscale status'." -ForegroundColor Red
  exit 1
}

$tailnet = ($self.DNSName -replace "^$($self.HostName)\.","") -replace "\.$",""
$lanHost = $self.HostName
$lanUrl  = "http://${lanHost}:${Port}"
$publicUrl = "https://${lanHost}.${tailnet}"

Write-Host ""
Write-Host "Online." -ForegroundColor Green
Write-Host "  Tailnet hostname : $lanHost"
Write-Host "  Tailnet URL      : $lanUrl     (for devices signed into your Tailnet)"

# 4. Optional public Funnel for HTTPS PWA install
if ($Funnel) {
  Write-Host ""
  Write-Host "Enabling Funnel on port $Port (public HTTPS)..."
  # Serve the local dev server on HTTPS, then expose via Funnel.
  tailscale serve reset 2>$null
  tailscale serve --bg --https=443 http://127.0.0.1:$Port | Out-Null
  tailscale funnel --bg 443 | Out-Null
  Write-Host "Funnel active." -ForegroundColor Green
  Write-Host "  Public URL       : $publicUrl   (installable as a PWA on iOS)"
} else {
  Write-Host ""
  Write-Host "Funnel not enabled. Rerun with -Funnel to get a public HTTPS URL."
  Write-Host "  Potential URL    : $publicUrl"
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Install the Tailscale app on your phone and sign in with the same account."
Write-Host "  2. Start the dev server on this laptop:  cd app && npm run dev"
Write-Host "  3. On your phone, open $lanUrl (or the public URL above if -Funnel)."
Write-Host "  4. Safari/Chrome → Share → Add to Home Screen."
Write-Host ""
