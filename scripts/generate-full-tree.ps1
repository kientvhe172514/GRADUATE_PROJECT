$root = "D:\projects\GRADUATE_PROJECT"
$out = Join-Path $root 'full-tree.txt'
if (Test-Path $out) { Remove-Item $out -Force }

function Write-Tree($path, $indent) {
    $items = Get-ChildItem -LiteralPath $path -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -ne 'node_modules' -and $_.Name -ne '.git' } |
        Sort-Object @{Expression={$_.PSIsContainer};Descending=$true}, Name

    foreach ($it in $items) {
        if ($it.PSIsContainer) {
            "$indent- $($it.Name)/" | Out-File -FilePath $out -Append -Encoding utf8
            Write-Tree $it.FullName ("$indent    ")
        } else {
            # Exclude example config files (like *.example, .env.example)
            if ($it.Name -notlike '*.example' -and $it.Name -notlike '*.env*') {
                "$indent- $($it.Name)" | Out-File -FilePath $out -Append -Encoding utf8
            }
        }
    }
}

# First line: project root
"- $(Split-Path $root -Leaf)/" | Out-File -FilePath $out -Encoding utf8
Write-Tree $root ''

Write-Host "Saved tree to: $out"