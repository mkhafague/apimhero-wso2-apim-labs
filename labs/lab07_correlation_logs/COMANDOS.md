# Lab 7 — Logs correlados de extremo a extremo — comandos

> Chuleta para copiar y pegar. Las explicaciones, los resultados esperados y el incidente están en la ficha del lab.

## Paso 0 — El estado de partida, en tres comandos

```bash
cd labs
export CONSUMER_KEY=tu_consumer_key CONSUMER_SECRET=tu_consumer_secret
export TOKEN=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read invoices:write" https://localhost:9443/oauth2/token | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
```

```powershell
cd labs
$env:CONSUMER_KEY = "tu_consumer_key"; $env:CONSUMER_SECRET = "tu_consumer_secret"
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

## Paso 1 — Activar los correlation logs (si el paso 0 muestra `0`)

```bash
docker compose cp wso2am:/home/wso2carbon/wso2am-4.7.0/bin/api-manager.sh ./conf-api-manager.sh
```

```bash
sed -i 's/\r$//' conf-api-manager.sh        # macOS: sed -i '' 's/\r$//' conf-api-manager.sh
chmod +x conf-api-manager.sh
```

```powershell
# La escritura DEBE hacerse en LF, si no el script no arranca
$p = "conf-api-manager.sh"
[IO.File]::WriteAllText((Resolve-Path $p), ((Get-Content $p) -join "`n"))
```

## Paso 2 — Ver la cadena completa

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

## Paso 3 — El desafío de Thomas (incidente cronometrado)

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

## Solución del desafío — léela solo después de haber nombrado la causa

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

## Fin del lab — desactivar, comprobar, parar

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
