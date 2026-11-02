$ErrorActionPreference = 'Stop'
$experiment = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $experiment
$cache = Join-Path $root '.tmp'
New-Item -ItemType Directory -Force -Path $cache | Out-Null

# Versões fixas: WEKA igual ao artigo, pacote SMOTE separado e dependência do núcleo.
$artifacts = @(
    @('weka-stable-3.8.6.jar', 'https://repo.maven.apache.org/maven2/nz/ac/waikato/cms/weka/weka-stable/3.8.6/weka-stable-3.8.6.jar'),
    @('SMOTE-1.0.3.jar', 'https://repo.maven.apache.org/maven2/nz/ac/waikato/cms/weka/SMOTE/1.0.3/SMOTE-1.0.3.jar'),
    @('bounce-0.18.jar', 'https://repo.maven.apache.org/maven2/nz/ac/waikato/cms/weka/thirdparty/bounce/0.18/bounce-0.18.jar')
)
foreach ($artifact in $artifacts) {
    $path = Join-Path $cache $artifact[0]
    if (-not (Test-Path -LiteralPath $path)) {
        Invoke-WebRequest -Uri $artifact[1] -OutFile $path
    }
}

# Apenas a conversão de formato é em Python; SMOTE e MLP são executados no WEKA.
python (Join-Path $experiment 'exportar_arff.py')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar ARFF' }
$classpath = (Join-Path $cache 'weka-stable-3.8.6.jar') + ';' +
    (Join-Path $cache 'SMOTE-1.0.3.jar') + ';' + (Join-Path $cache 'bounce-0.18.jar')
$build = Join-Path $experiment '.build'
New-Item -ItemType Directory -Force -Path $build | Out-Null
javac -cp $classpath -d $build (Join-Path $experiment 'ExperimentoWeka.java')
if ($LASTEXITCODE -ne 0) { throw 'Falha na compilacao Java' }
java -Xmx4g -cp ($build + ';' + $classpath) ExperimentoWeka `
    (Join-Path $experiment 'dados/adultos.arff') `
    (Join-Path $experiment 'resultados/metricas.json')
if ($LASTEXITCODE -ne 0) { throw 'Falha no experimento WEKA' }
