# ezEdit Digital Ocean Deployment Script
# This PowerShell script deploys ezEdit to a Digital Ocean droplet with 16GB RAM

# Configuration
$config = @{
    # Digital Ocean API configuration
    digitalOcean = @{
        apiKey = $null  # Will be loaded from .env
        apiUrl = "api.digitalocean.com"
        apiVersion = "v2"
    }
    
    # Droplet configuration
    droplet = @{
        name = "ezedit-app"
        region = "nyc1"  # New York 1
        size = "s-4vcpu-16gb"  # 4 vCPUs, 16GB RAM
        image = "ubuntu-20-04-x64"  # Ubuntu 20.04 LTS
        backups = $false
        ipv6 = $true
        monitoring = $true
        tags = @("ezedit", "production")
    }
    
    # Application configuration
    app = @{
        repoUrl = "https://github.com/Swimhack/ezEdit2025.git"
        branch = "main"
    }
}

# Load API key from .env file
function Load-EnvFile {
    param (
        [string]$envFilePath
    )
    
    Write-Host "Loading environment variables from $envFilePath..."
    
    if (Test-Path $envFilePath) {
        Get-Content $envFilePath | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                # Remove quotes if present
                if ($value -match '^"(.*)"$' -or $value -match "^'(.*)'$") {
                    $value = $matches[1]
                }
                
                # Set as environment variable
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "Set $key environment variable"
            }
        }
    } else {
        Write-Error "Environment file not found: $envFilePath"
        exit 1
    }
    
    # Set API key from environment variable
    $config.digitalOcean.apiKey = [Environment]::GetEnvironmentVariable("DO_API_KEY")
    
    if (-not $config.digitalOcean.apiKey -or $config.digitalOcean.apiKey -eq "your-digital-ocean-api-key-here") {
        Write-Error "Digital Ocean API key not found in .env file or is set to the default value."
        Write-Host "Please update the .env file with your actual Digital Ocean API key."
        exit 1
    }
}

# Make a request to the Digital Ocean API
function Invoke-DigitalOceanApi {
    param (
        [string]$Method,
        [string]$Endpoint,
        $Body = $null
    )
    
    $uri = "https://$($config.digitalOcean.apiUrl)/$($config.digitalOcean.apiVersion)/$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $($config.digitalOcean.apiKey)"
    }
    
    $params = @{
        Method = $Method
        Uri = $uri
        Headers = $headers
        UseBasicParsing = $true
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        
        Write-Error "API Error: $statusCode - $statusDescription"
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Error "Response Body: $responseBody"
        } catch {
            Write-Error "Could not read error response body: $_"
        }
        
        exit 1
    }
}

# Create a new SSH key
function New-SshKey {
    Write-Host "Creating SSH key..."
    
    # Generate SSH key
    $sshKeyName = "ezedit-deploy-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $sshKeyPath = Join-Path $PSScriptRoot ".ssh"
    
    if (-not (Test-Path $sshKeyPath)) {
        New-Item -ItemType Directory -Path $sshKeyPath | Out-Null
    }
    
    $keyPath = Join-Path $sshKeyPath $sshKeyName
    
    # Check if ssh-keygen is available
    try {
        $null = Get-Command ssh-keygen -ErrorAction Stop
        
        # Generate key
        ssh-keygen -t rsa -b 4096 -C "ezedit-deploy" -f $keyPath -N '""'
        
        # Read public key
        $publicKey = Get-Content "$keyPath.pub" -Raw
        
        # Add SSH key to Digital Ocean
        $body = @{
            name = $sshKeyName
            public_key = $publicKey
        }
        
        $response = Invoke-DigitalOceanApi -Method "POST" -Endpoint "account/keys" -Body $body
        
        Write-Host "SSH key created with ID: $($response.ssh_key.id)"
        
        return @{
            id = $response.ssh_key.id
            name = $sshKeyName
            path = $keyPath
        }
    } catch {
        Write-Error "Failed to create SSH key: $_"
        Write-Host "ssh-keygen may not be installed or accessible. Please install OpenSSH client tools."
        exit 1
    }
}

# Create a new droplet
function New-Droplet {
    param (
        [int]$SshKeyId
    )
    
    Write-Host "Creating droplet..."
    
    $dropletConfig = $config.droplet.Clone()
    $dropletConfig.ssh_keys = @($SshKeyId)
    
    $response = Invoke-DigitalOceanApi -Method "POST" -Endpoint "droplets" -Body $dropletConfig
    
    Write-Host "Droplet creation initiated with ID: $($response.droplet.id)"
    
    return $response.droplet
}

# Wait for droplet to be active
function Wait-ForDroplet {
    param (
        [int]$DropletId
    )
    
    Write-Host "Waiting for droplet to be active..."
    
    $attempts = 0
    $maxAttempts = 30  # 5 minutes (10 seconds per attempt)
    
    while ($attempts -lt $maxAttempts) {
        $response = Invoke-DigitalOceanApi -Method "GET" -Endpoint "droplets/$DropletId"
        $droplet = $response.droplet
        
        if ($droplet.status -eq "active") {
            Write-Host "Droplet is active!"
            return $droplet
        }
        
        Write-Host "Droplet status: $($droplet.status). Waiting 10 seconds..."
        Start-Sleep -Seconds 10
        $attempts++
    }
    
    Write-Error "Timeout waiting for droplet to be active"
    exit 1
}

# Get droplet IP address
function Get-DropletIp {
    param (
        $Droplet
    )
    
    $ipv4Networks = $Droplet.networks.v4
    $publicNetwork = $ipv4Networks | Where-Object { $_.type -eq "public" }
    
    if (-not $publicNetwork) {
        Write-Error "No public IP address found for droplet"
        exit 1
    }
    
    return $publicNetwork.ip_address
}

# Deploy application to droplet
function Deploy-Application {
    param (
        [string]$Ip,
        [string]$SshKeyPath
    )
    
    Write-Host "Deploying application to $Ip..."
    
    # Check if ssh is available
    try {
        $null = Get-Command ssh -ErrorAction Stop
    } catch {
        Write-Error "SSH command not found. Please install OpenSSH client tools."
        exit 1
    }
    
    # Wait for SSH to be available
    $sshReady = $false
    $attempts = 0
    $maxAttempts = 12  # 2 minutes (10 seconds per attempt)
    
    while (-not $sshReady -and $attempts -lt $maxAttempts) {
        try {
            $null = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i $SshKeyPath "root@$Ip" "echo 'SSH connection successful'"
            $sshReady = $true
        } catch {
            Write-Host "SSH not ready yet. Waiting 10 seconds..."
            Start-Sleep -Seconds 10
            $attempts++
        }
    }
    
    if (-not $sshReady) {
        Write-Error "Timeout waiting for SSH to be available"
        exit 1
    }
    
    # Install dependencies
    Write-Host "Installing dependencies..."
    ssh -o StrictHostKeyChecking=no -i $SshKeyPath "root@$Ip" "apt-get update && apt-get install -y nginx git nodejs npm"
    
    # Clone repository
    Write-Host "Cloning repository..."
    ssh -o StrictHostKeyChecking=no -i $SshKeyPath "root@$Ip" "git clone $($config.app.repoUrl) /var/www/ezedit"
    
    # Configure Nginx
    Write-Host "Configuring Nginx..."
    $nginxConfig = @"
server {
    listen 80;
    server_name _;

    root /var/www/ezedit/public;
    index index.html index.php;

    location / {
        try_files `$uri `$uri/ /index.html;
    }

    location ~ \.php`$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
"@
    
    # Write Nginx config to a temporary file
    $tempNginxConfig = Join-Path $PSScriptRoot "nginx-ezedit.conf"
    Set-Content -Path $tempNginxConfig -Value $nginxConfig
    
    # Copy Nginx config to server
    scp -o StrictHostKeyChecking=no -i $SshKeyPath $tempNginxConfig "root@${Ip}:/etc/nginx/sites-available/ezedit"
    
    # Enable site and restart Nginx
    ssh -o StrictHostKeyChecking=no -i $SshKeyPath "root@$Ip" "ln -sf /etc/nginx/sites-available/ezedit /etc/nginx/sites-enabled/ && systemctl restart nginx"
    
    # Install PHP if needed
    Write-Host "Installing PHP..."
    ssh -o StrictHostKeyChecking=no -i $SshKeyPath "root@$Ip" "apt-get install -y php7.4-fpm php7.4-cli php7.4-curl php7.4-json php7.4-common"
    
    # Clean up temporary files
    Remove-Item -Path $tempNginxConfig -Force
    
    Write-Host "Application deployed successfully!"
}

# Main deployment function
function Start-Deployment {
    try {
        Write-Host "Starting ezEdit deployment to Digital Ocean..."
        
        # Load environment variables
        Load-EnvFile -envFilePath (Join-Path $PSScriptRoot ".env")
        
        # Create SSH key
        $sshKey = New-SshKey
        
        # Create droplet
        $droplet = New-Droplet -SshKeyId $sshKey.id
        
        # Wait for droplet to be active
        $activeDroplet = Wait-ForDroplet -DropletId $droplet.id
        
        # Get droplet IP
        $ip = Get-DropletIp -Droplet $activeDroplet
        Write-Host "Droplet IP: $ip"
        
        # Deploy application
        Deploy-Application -Ip $ip -SshKeyPath $sshKey.path
        
        Write-Host @"

=======================================================
ezEdit has been successfully deployed to Digital Ocean!
=======================================================

Access your application at: http://$ip/

Droplet Information:
- Name: $($config.droplet.name)
- ID: $($activeDroplet.id)
- Region: $($activeDroplet.region.name)
- Size: $($activeDroplet.size.slug) (4 vCPUs, 16GB RAM)
- IP Address: $ip

SSH Access:
- User: root
- Key: $($sshKey.path)
- Command: ssh -i $($sshKey.path) root@$ip

Remember to secure your server by:
1. Setting up a firewall
2. Configuring SSL/TLS with Let's Encrypt
3. Creating a non-root user for daily operations
4. Disabling root SSH access

For production use, consider setting up:
- Domain name pointing to this IP
- SSL/TLS certificate
- Regular backups
"@
        
    } catch {
        Write-Error "Deployment failed: $_"
        exit 1
    }
}

# Start deployment
Start-Deployment
