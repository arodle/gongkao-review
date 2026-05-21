param(
    [string]$COZE_WORKSPACE_PATH = $PWD.Path
)

Write-Host "Changing to workspace directory: $COZE_WORKSPACE_PATH"
Set-Location $COZE_WORKSPACE_PATH

Write-Host "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

Write-Host "Building the Next.js project..."
pnpm next build

Write-Host "Running next-on-pages adapter..."
pnpm exec next-on-pages

Write-Host "Build completed successfully!"