# Move generated images from Cursor assets folder into frontend/public/generated-products
$assetsDir = "C:\Users\Spine\.cursor\projects\c-Users-Spine-Prince-Esquare\assets"
$publicRoot = "C:\Users\Spine\Prince-Esquare\frontend\public\generated-products"
$manifest = @{}

Get-ChildItem $assetsDir -Filter "*-front.png" | ForEach-Object {
    $base = $_.BaseName -replace '-front$',''
    $slug = $base
    $destDir = Join-Path $publicRoot $slug
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null

    foreach ($angle in @('front','side','back')) {
        $src = Join-Path $assetsDir "$slug-$angle.png"
        if (Test-Path $src) {
            $dest = Join-Path $destDir "$angle.png"
            Copy-Item $src $dest -Force
        }
    }

    $front = "/generated-products/$slug/front.png"
    $side = "/generated-products/$slug/side.png"
    $back = "/generated-products/$slug/back.png"
    if ((Test-Path (Join-Path $destDir 'front.png')) -and (Test-Path (Join-Path $destDir 'side.png')) -and (Test-Path (Join-Path $destDir 'back.png'))) {
        $manifest[$slug] = @{ front = $front; side = $side; back = $back }
    }
}

$manifestPath = "C:\Users\Spine\Prince-Esquare\backend\scripts\angle-images-manifest.json"
$manifest | ConvertTo-Json -Depth 3 | Set-Content $manifestPath -Encoding UTF8
Write-Host "Manifest written with $($manifest.Count) products"
