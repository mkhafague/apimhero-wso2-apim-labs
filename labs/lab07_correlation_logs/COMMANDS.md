# Lab 7 — End-to-end correlated logs — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

## Step 0 — The starting state, in three commands

```bash
cd labs
export CONSUMER_KEY=your_consumer_key CONSUMER_SECRET=your_consumer_secret
export TOKEN=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read invoices:write" https://localhost:9443/oauth2/token | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
```

```powershell
cd labs
$env:CONSUMER_KEY = "your_consumer_key"; $env:CONSUMER_SECRET = "your_consumer_secret"
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

## Step 1 — Enable correlation logs (if step 0 shows `0`)

```bash
docker compose cp wso2am:/home/wso2carbon/wso2am-4.7.0/bin/api-manager.sh ./conf-api-manager.sh
```

```bash
sed -i 's/\r$//' conf-api-manager.sh        # macOS: sed -i '' 's/\r$//' conf-api-manager.sh
chmod +x conf-api-manager.sh
```

```powershell
# The file MUST be written with LF line endings, otherwise the script does not start
$p = "conf-api-manager.sh"
[IO.File]::WriteAllText((Resolve-Path $p), ((Get-Content $p) -join "`n"))
```

## Step 2 — See the full chain

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

## Step 3 — Thomas's challenge (timed incident)

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

## Challenge answer — read it only once you have named the cause

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

## End of the lab — clear, check, stop

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
