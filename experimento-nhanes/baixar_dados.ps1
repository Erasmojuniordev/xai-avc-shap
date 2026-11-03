$ErrorActionPreference = 'Stop'
$experiment = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $experiment 'dados'
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

# Arquivos SAS Transport originais da página pública do CDC, sem cópias de Kaggle.
foreach ($cycle in @(@('2015', 'I'), @('2017', 'J'))) {
    foreach ($component in @('DEMO', 'MCQ', 'BPQ', 'BMX', 'SMQ', 'DIQ')) {
        $name = "${component}_$($cycle[1]).xpt"
        $target = Join-Path $dataDir $name
        if (-not (Test-Path -LiteralPath $target)) {
            $url = "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/$($cycle[0])/DataFiles/$name"
            Invoke-WebRequest -Uri $url -OutFile $target
        }
        Get-FileHash -LiteralPath $target -Algorithm SHA256 | Select-Object Path, Hash
    }
}
