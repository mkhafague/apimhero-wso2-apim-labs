# Lab 0 — Verificación de su equipo — comandos

> Chuleta para copiar y pegar. Las explicaciones, los resultados esperados y el incidente están en la ficha del lab.

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

## 4. Node.js (a partir del lab 4 — suite de pruebas)

```bash
node --version
```

## 5. Los recursos de las prácticas

```bash
git clone https://github.com/mkhafague/apimhero-wso2-apim-labs.git WSO2-APIM-training
```

```bash
cd WSO2-APIM-training/labs
ls docker-compose.yml
```

## 6. Los puertos

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

## 7. El incidente — el puerto ya está ocupado

```bash
node -e "require('http').createServer().listen(9443, () => console.log('puerto 9443 ocupado - Ctrl+C para liberar'))"
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
