# Lab 0 — Vérification du poste de travail — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

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

## 4. Node.js (labs 4 et suivants — barrière de tests)

```bash
node --version
```

## 5. Les ressources des labs

```bash
git clone https://github.com/mkhafague/apimhero-wso2-apim-labs.git WSO2-APIM-training
```

```bash
cd WSO2-APIM-training/labs
ls docker-compose.yml
```

## 6. Les ports

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

## 7. L'incident — le port déjà pris

```bash
node -e "require('http').createServer().listen(9443, () => console.log('port 9443 occupe - Ctrl+C pour liberer'))"
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
