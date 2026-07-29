<#
.SYNOPSIS
  픽셀 플래너를 Windows 부팅/로그인 시 앱 창으로 자동 실행되도록 시작프로그램에 등록합니다.

.PARAMETER Url
  자동으로 열릴 픽셀 플래너 주소. 배포 후에는 Vercel URL을, 로컬 테스트 중에는
  http://localhost:3000 을 넘겨주세요.

.EXAMPLE
  .\create-startup-shortcut.ps1 -Url "https://your-app.vercel.app"
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$Url
)

function Get-BrowserPath {
  $candidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
  )

  foreach ($path in $candidates) {
    if (Test-Path $path) { return $path }
  }

  return $null
}

$browserPath = Get-BrowserPath

if (-not $browserPath) {
  Write-Error "Chrome 또는 Edge를 찾지 못했어요. 둘 중 하나를 설치한 뒤 다시 실행해주세요."
  exit 1
}

$startupFolder = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "PixelPlanner.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $browserPath
$shortcut.Arguments = "--app=`"$Url`" --window-size=480,720"
$shortcut.Description = "픽셀 플래너 자동 실행"
$shortcut.WorkingDirectory = Split-Path $browserPath
$shortcut.Save()

Write-Host "시작프로그램에 등록했어요: $shortcutPath"
Write-Host "다음 로그인부터 '$Url' 주소가 앱 창으로 자동 실행돼요."
