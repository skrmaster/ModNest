$processName = "YuanShen"  
$ruleName = "badnetwork" 
$programPath = "Z:\miHoYo Launcher\games\Genshin Impact Game\YuanShen.exe"

$rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if (-not $rule) {
    Write-Host "Firewall rule does not exist, creating rule: $ruleName"
    New-NetFirewallRule -DisplayName $ruleName `
                        -Direction Outbound `
                        -Action Block `
                        -Program $programPath `
                        -Profile Any `
                        -Enabled False
} else {
    Write-Host "Firewall rules already exist: $ruleName"
}

Write-Host "Waiting for the program to run..."
while (-not (Get-Process -Name $processName -ErrorAction SilentlyContinue)) {
    Start-Sleep -Seconds 1
}


for ($i = 120; $i -ge 0; $i--) {
    Write-Host -NoNewline "`rCountdown (Activation Rules): $i s   "
    Start-Sleep -Seconds 1
}

Write-Host "`nEnable outbound rules: $ruleName"
Set-NetFirewallRule -DisplayName $ruleName -Enabled True

for ($i = 45; $i -ge 0; $i--) {
    Write-Host -NoNewline "`rCountdown (Close rules and terminate program): $i s   "
    Start-Sleep -Seconds 1
}


Set-NetFirewallRule -DisplayName $ruleName -Enabled False
Write-Host "`nOutbound rules have been disabled."
