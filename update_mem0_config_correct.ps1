$configPath = "$env:USERPROFILE\.codeium\windsurf\mcp_config.json"

# Read the JSON file
$configJson = Get-Content -Path $configPath -Raw | ConvertFrom-Json

# Update the mem0 configuration with the correct format
$configJson.mcpServers.mem0 = @{
    serverUrl = "https://mcp.mem0.ai/v1"
    token = "m0-ESVcaWbMPZi4FPK9939CPAxAPVmyVSKnJKUELzUD"
}

# Convert back to JSON and save
$configJson | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath

Write-Host "Mem0 MCP configuration updated successfully with the correct format!" -ForegroundColor Green
Write-Host "Please restart Windsurf/Cascade to reload the MCP configuration." -ForegroundColor Yellow
