$ErrorActionPreference = 'Stop'
$frontend = Join-Path $PSScriptRoot 'frontend'

& conda run --no-capture-output --name studymatch-demo npm.cmd --prefix $frontend run build:demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& conda run --no-capture-output --name studymatch-demo npm.cmd --prefix $frontend run start:demo
exit $LASTEXITCODE
