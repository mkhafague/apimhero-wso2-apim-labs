# Lab 7 — Logs corrélés de bout en bout — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

## Étape 0 — L'état de départ, en trois commandes

```bash
cd labs
export CONSUMER_KEY=votre_consumer_key CONSUMER_SECRET=votre_consumer_secret
export TOKEN=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read invoices:write" https://localhost:9443/oauth2/token | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
```

```powershell
cd labs
$env:CONSUMER_KEY = "votre_consumer_key"; $env:CONSUMER_SECRET = "votre_consumer_secret"
$env:TOKEN = (curl.exe -k -s -u "$($env:CONSUMER_KEY):$($env:CONSUMER_SECRET)" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read invoices:write" https://localhost:9443/oauth2/token | ConvertFrom-Json).access_token
```

```bash
docker compose ps
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  https://localhost:8243/invoices/1.0.0/invoices
docker compose exec wso2am sh -c "grep -c invoices /home/wso2carbon/wso2am-4.7.0/repository/logs/correlation.log"
```

```powershell
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/invoices/1.0.0/invoices
```

## Étape 1 — Activer les correlation logs (si l'étape 0 affiche `0`)

```bash
docker compose cp wso2am:/home/wso2carbon/wso2am-4.7.0/bin/api-manager.sh ./conf-api-manager.sh
```

```bash
sed -i 's/\r$//' conf-api-manager.sh        # macOS : sed -i '' 's/\r$//' conf-api-manager.sh
chmod +x conf-api-manager.sh
```

```powershell
# L'écriture DOIT se faire en LF, sinon le script ne démarre pas
$p = "conf-api-manager.sh"
[IO.File]::WriteAllText((Resolve-Path $p), ((Get-Content $p) -join "`n"))
```

## Étape 2 — Voir la chaîne complète

```bash
curl -k -s -i \
  -H "Authorization: Bearer $TOKEN" \
  -H "activityID: demo-7f3a2b90" \
  -H "X-Correlation-Id: demo-7f3a2b90" \
  https://localhost:8243/invoices/1.0.0/invoices
```

```powershell
curl.exe -k -s -i -H "Authorization: Bearer $env:TOKEN" -H "activityID: demo-7f3a2b90" -H "X-Correlation-Id: demo-7f3a2b90" https://localhost:8243/invoices/1.0.0/invoices
```

```bash
docker compose exec wso2am sh -c "grep demo-7f3a2b90 /home/wso2carbon/wso2am-4.7.0/repository/logs/correlation.log"
docker compose logs --no-log-prefix invoices | grep demo-7f3a2b90
```

```powershell
docker compose logs --no-log-prefix invoices | Select-String demo-7f3a2b90
```

## Étape 3 — Le défi de Thomas (incident chronométré)

```bash
cd lab07_correlation_logs
./incident.sh start
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  https://localhost:8243/invoices/1.0.0/invoices
cd ..
```

```bash
curl -k -s -i -H "Authorization: Bearer $TOKEN" \
  -H "activityID: incident-001" -H "X-Correlation-Id: incident-001" \
  https://localhost:8243/invoices/1.0.0/invoices
```

```powershell
curl.exe -k -s -i -H "Authorization: Bearer $env:TOKEN" -H "activityID: incident-001" -H "X-Correlation-Id: incident-001" https://localhost:8243/invoices/1.0.0/invoices
```

```bash
docker compose exec wso2am sh -c "grep incident-001 /home/wso2carbon/wso2am-4.7.0/repository/logs/correlation.log"
```

```bash
cd lab07_correlation_logs && ./incident.sh stop && cd ..
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  -H "activityID: controle-001" -H "X-Correlation-Id: controle-001" \
  https://localhost:8243/invoices/1.0.0/invoices
docker compose logs --no-log-prefix invoices | grep controle-001
```

```powershell
cd lab07_correlation_logs; .\incident.cmd stop; cd ..
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" -H "activityID: controle-001" -H "X-Correlation-Id: controle-001" https://localhost:8243/invoices/1.0.0/invoices
docker compose logs --no-log-prefix invoices | Select-String controle-001
```

## Corrigé du défi — à ne lire qu'après avoir nommé la cause

```bash
docker compose logs --no-log-prefix invoices | grep incident-001
docker compose logs --no-log-prefix invoices | grep -i gestprest
curl -s -i http://localhost:8082/health
```

```powershell
docker compose logs --no-log-prefix invoices | Select-String incident-001
docker compose logs --no-log-prefix invoices | Select-String gestprest
curl.exe -s -i http://localhost:8082/health
```

## Fin du lab — désamorcer, contrôler, arrêter

```bash
cd lab07_correlation_logs && ./incident.sh stop && cd ..
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
  https://localhost:8243/invoices/1.0.0/invoices
docker compose --profile core --profile apps stop
```

```powershell
cd lab07_correlation_logs; .\incident.cmd stop; cd ..
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/invoices/1.0.0/invoices
docker compose --profile core --profile apps stop
```
