Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$outputDir = Join-Path $PSScriptRoot '..\build'
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

function New-AppIconBitmap([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $cx = [double]$size / 2.0
  $cy = [double]$size / 2.0

  $bgPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  [void]$bgPath.AddEllipse(2, 2, $size - 4, $size - 4)
  $bgBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($bgPath)
  $bgBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 14, 165, 233)
  $bgBrush.SurroundColors = @( [System.Drawing.Color]::FromArgb(255, 3, 105, 161) )
  $g.FillPath($bgBrush, $bgPath)
  $bgBrush.Dispose()
  $bgPath.Dispose()

  $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(140, 255, 255, 255)), ([Math]::Max(1, $size / 200))
  $g.DrawEllipse($ringPen, [int]($size * 0.05), [int]($size * 0.05), [int]($size * 0.90), [int]($size * 0.90))
  $ringPen.Dispose()

  $hubX = [int]($cx - $size * 0.18)
  $hubY = [int]($cy - $size * 0.18)
  $hubW = [int]($size * 0.36)
  $hubH = [int]($size * 0.36)
  $hubRect = New-Object System.Drawing.Rectangle($hubX, $hubY, $hubW, $hubH)
  $hubPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  [void]$hubPath.AddEllipse($hubRect)
  $hubBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($hubPath)
  $hubBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 186, 230, 253)
  $hubBrush.SurroundColors = @( [System.Drawing.Color]::FromArgb(255, 56, 189, 248) )
  $g.FillPath($hubBrush, $hubPath)
  $hubBrush.Dispose()
  $hubPath.Dispose()

  $letterFont = New-Object System.Drawing.Font("Segoe UI", [single]($size * 0.30), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $letterBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $letterFormat = New-Object System.Drawing.StringFormat
  $letterFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $letterFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $letterX = 0
  $letterY = [float]($cy - $size * 0.22)
  $letterW = [float]$size
  $letterH = [float]($size * 0.44)
  $letterRect = New-Object System.Drawing.RectangleF($letterX, $letterY, $letterW, $letterH)
  $g.DrawString("M", $letterFont, $letterBrush, $letterRect, $letterFormat)
  $letterFont.Dispose()
  $letterBrush.Dispose()
  $letterFormat.Dispose()

  $g.Dispose()
  return $bmp
}

$mainPng = New-AppIconBitmap -size 1024
$pngPath = Join-Path $outputDir 'icon.png'
$mainPng.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$mainPng.Dispose()
Write-Host ("PNG gerado: {0} ({1} bytes)" -f $pngPath, (Get-Item $pngPath).Length)

$icoSizes = @(16, 24, 32, 48, 64, 128, 256)
$icoSources = @()
foreach ($s in $icoSizes) {
  $b = New-AppIconBitmap -size $s
  $icoSources += $b
}

$icoPath = Join-Path $outputDir 'icon.ico'

$stream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter $stream
$numImages = $icoSources.Count
$headerSize = 6
$directorySize = 16 * $numImages
$offset = $headerSize + $directorySize

$imageBytesList = New-Object System.Collections.Generic.List[byte[]]

foreach ($b in $icoSources) {
  $ms = New-Object System.IO.MemoryStream
  $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $imageBytesList.Add($ms.ToArray())
  $ms.Dispose()
}

$writer.Write([uint16]0)
$writer.Write([uint16]1)
$writer.Write([uint16]$numImages)

$dirStart = $stream.Position
$writer.Seek(0, [System.IO.SeekOrigin]::End) | Out-Null
$currentOffset = $headerSize + $directorySize
for ($i = 0; $i -lt $numImages; $i++) {
  $b = $icoSources[$i]
  $bytes = $imageBytesList[$i]
  $dim = $b.Width
  $w = if ($dim -ge 256) { 0 } else { [byte]$dim }
  $h = if ($dim -ge 256) { 0 } else { [byte]$dim }
  $writer.Write([byte]$w)
  $writer.Write([byte]$h)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([uint16]1)
  $writer.Write([uint16]32)
  $writer.Write([uint32]$bytes.Length)
  $writer.Write([uint32]$currentOffset)
  $currentOffset += $bytes.Length
}

foreach ($bytes in $imageBytesList) {
  $writer.Write($bytes)
}

[System.IO.File]::WriteAllBytes($icoPath, $stream.ToArray())
$writer.Dispose()
$stream.Dispose()
foreach ($b in $icoSources) { $b.Dispose() }

Write-Host ("ICO gerado: {0} ({1} bytes)" -f $icoPath, (Get-Item $icoPath).Length)
