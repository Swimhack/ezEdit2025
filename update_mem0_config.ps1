$configPath = "$env:USERPROFILE\.codeium\windsurf\mcp_config.json"

# Read the JSON file
$configJson = Get-Content -Path $configPath -Raw | ConvertFrom-Json

# Update the mem0 configuration
$configJson.mcpServers.mem0 = @{
    command = "npx"
    args = @("-y", "@modelcontextprotocol/server-mem0")
    env = @{
        MEM0_API_KEY = "m0-ESVcaWbMPZi4FPK9939CPAxAPVmyVSKnJKUELzUD"
    }
}

# Convert back to JSON and save
$configJson | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath

Write-Host "Mem0 MCP configuration updated successfully!" -ForegroundColor Green
