# Lab 0 — Check your workstation — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

## 1. Docker

```bash
docker --version
docker compose version
docker run --rm hello-world
```

## 3. curl

```bash
curl --version
```

## 4. Node.js (lab 4 onwards — test harness)

```bash
node --version
```

## 5. The lab resources

```bash
git clone https://github.com/mkhafague/apimhero-wso2-apim-labs.git WSO2-APIM-training
```

```bash
cd WSO2-APIM-training/labs
ls docker-compose.yml
```

## 6. The ports

```powershell
# Windows PowerShell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 9443,9444,9445,8243,8244,8280,8281,8081,8082,8083,8290,9164,9091 }
```

```bash
# Linux / macOS
for p in 9443 9444 9445 8243 8244 8280 8281 8081 8082 8083 8290 9164 9091; do
  lsof -nP -iTCP:$p -sTCP:LISTEN
done
```

## 7. The incident — the port is already taken

```bash
node -e "require('http').createServer().listen(9443, () => console.log('port 9443 occupied - Ctrl+C to release'))"
```

```bash
docker run --rm -p 9443:9443 hello-world
```

```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 9443 -State Listen | Select-Object LocalPort, OwningProcess
Get-Process -Id <PID> | Select-Object Id, ProcessName, Path
```

```bash
# Linux / macOS
lsof -nP -iTCP:9443 -sTCP:LISTEN
```

```powershell
Stop-Process -Id <PID>      # Windows PowerShell
```

```bash
kill <PID>                  # Linux / macOS
```
