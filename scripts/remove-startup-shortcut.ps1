<#
.SYNOPSIS
  create-startup-shortcut.ps1 로 등록한 픽셀 플래너 자동 실행 바로가기를 제거합니다.
#>

$startupFolder = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "PixelPlanner.lnk"

if (Test-Path $shortcutPath) {
  Remove-Item $shortcutPath -Confirm:$false
  Write-Host "시작프로그램 바로가기를 제거했어요: $shortcutPath"
} else {
  Write-Host "등록된 바로가기가 없어요."
}
