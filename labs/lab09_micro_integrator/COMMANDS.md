# Lab 9 — Expose the GestPrest legacy with Micro Integrator — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

## Step 1 — Start the integration

```bash
docker compose ps -a
docker compose --profile staging --profile iam stop
docker compose --profile core --profile apps --profile integration up -d
docker compose ps
```

```bash
until curl -k -s -o /dev/null https://localhost:9443/publisher; do sleep 5; done; echo "APIM pret"
until curl -s -o /dev/null http://localhost:9091/health; do sleep 2; done; echo "legacy pret"
until curl -s -f -o /dev/null http://localhost:8290/legacy/claims/1042; do sleep 5; done; echo "facade prete"
```

```powershell
while ($true) { curl.exe -k -s -o NUL https://localhost:9443/publisher; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 5 }; "APIM pret"
while ($true) { curl.exe -s -o NUL http://localhost:9091/health; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 2 }; "legacy pret"
while ($true) { curl.exe -s -f -o NUL http://localhost:8290/legacy/claims/1042; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 5 }; "facade prete"
```

```bash
docker compose logs wso2mi | grep -i "started in"
```

```powershell
docker compose logs wso2mi | Select-String -Pattern "started in"
```

```bash
docker compose logs wso2mi | grep -i LegacyClaimsFacade
docker compose logs --tail 50 wso2mi
```

```powershell
docker compose logs wso2mi | Select-String -Pattern LegacyClaimsFacade
docker compose logs --tail 50 wso2mi
```

## Step 2 — Listen to the legacy dialect (direct)

```bash
curl -s "http://localhost:9091/GESTPREST/RMBT?id=1042"
```

```bash
curl -s "http://localhost:9091/GESTPREST/RMBT?id=7777"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:9091/GESTPREST/RMBT?id=7777"
```

## Step 3 — The Micro Integrator facade

```bash
docker compose logs wso2mi | grep -i LegacyClaimsFacade
```

```powershell
docker compose logs wso2mi | Select-String -Pattern LegacyClaimsFacade
```

```bash
curl -s http://localhost:8290/legacy/claims/1042
```

```bash
curl -s -i http://localhost:8290/legacy/claims/7777
```

## Step 4 — Publish the facade in APIM

```bash
export CONSUMER_KEY=your_consumer_key CONSUMER_SECRET=your_consumer_secret
TOKEN=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" https://localhost:9443/oauth2/token | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
curl -k -s -H "Authorization: Bearer $TOKEN" https://localhost:8243/claims/1.0.0/1042
```

```powershell
$env:CONSUMER_KEY = "your_consumer_key"; $env:CONSUMER_SECRET = "your_consumer_secret"
$TOKEN = (curl.exe -k -s -u "$($env:CONSUMER_KEY):$($env:CONSUMER_SECRET)" -d "grant_type=client_credentials" https://localhost:9443/oauth2/token | ConvertFrom-Json).access_token
curl.exe -k -s -H "Authorization: Bearer $TOKEN" https://localhost:8243/claims/1.0.0/1042
```

## Step 5 — The three-storey rule, in a real outage

```bash
docker compose stop legacy-mock
curl -k -s -i -H "Authorization: Bearer $TOKEN" https://localhost:8243/claims/1.0.0/1042
curl -s -i http://localhost:8290/legacy/claims/1042
curl -sS -i "http://localhost:9091/GESTPREST/RMBT?id=1042"
docker compose ps -a legacy-mock
```

```bash
docker compose start legacy-mock
until curl -s -o /dev/null http://localhost:9091/health; do sleep 2; done; echo "legacy pret"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:9091/GESTPREST/RMBT?id=1042"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8290/legacy/claims/1042
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/claims/1.0.0/1042
```

```powershell
while ($true) { curl.exe -s -o NUL http://localhost:9091/health; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 2 }; "legacy pret"
```

## Step 6 — Give the memory back

```bash
docker compose --profile integration stop
docker compose ps -a
docker stats --no-stream wso2am petstore invoices
```
