@echo off

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit
)

echo Administrator privileges have been obtained.

powershell -Command "Set-ExecutionPolicy RemoteSigned -Scope LocalMachine -Force"

powershell -ExecutionPolicy Bypass -File ".\genshin_bad_network.ps1"

pause