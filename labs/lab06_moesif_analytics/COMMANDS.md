# Lab 6 — Analytics with Moesif — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

## Step 0 — The starting state, and the test that decides

```bash
cd labs
docker compose ps
until [ "$(curl -k -s -o /dev/null -w '%{http_code}' https://localhost:9443/services/Version)" = "200" ]; do sleep 5; done; echo "APIM pret"
docker compose exec wso2am curl -s -o /dev/null -w "%{http_code}\n" https://api.moesif.net
```

```powershell
cd labs
docker compose ps
do { Start-Sleep 5; $c = (curl.exe -k -s -o NUL -w "%{http_code}" https://localhost:9443/services/Version) } until ($c -eq "200"); "APIM pret"
docker compose exec wso2am curl -s -o /dev/null -w "%{http_code}\n" https://api.moesif.net
```

```bash
docker run --rm --network wso2-training_default curlimages/curl:8.8.0 -s -o /dev/null -w "%{http_code}\n" https://api.moesif.net
```

## Step 1 — The Moesif account, and the key you never show

```bash
ls -go .moesif.key
wc -c < .moesif.key
```

```powershell
Get-Item .moesif.key | Select-Object Name, Length
```

```bash
printf '%s\n' 'labs/.moesif.key' 'labs/conf-*' 'labs/docker-compose.override.yml' 'apis/tests/env.gateway.json' >> ../.gitignore
cat ../.gitignore
```

```powershell
Add-Content ..\.gitignore 'labs/.moesif.key','labs/conf-*','labs/docker-compose.override.yml','apis/tests/env.gateway.json'
Get-Content ..\.gitignore
```

## Step 2 — The configuration: copy, edit, substitute

```bash
docker compose cp wso2am:/home/wso2carbon/wso2am-4.7.0/repository/conf/deployment.toml ./conf-wso2am-deployment.toml
```

```bash
# Linux / Git Bash
sed -i "s|MOESIF_KEY_A_REMPLACER|$(tr -d '\r\n' < .moesif.key)|" conf-wso2am-deployment.toml
# macOS (BSD sed: the empty argument after -i is mandatory)
sed -i '' "s|MOESIF_KEY_A_REMPLACER|$(tr -d '\r\n' < .moesif.key)|" conf-wso2am-deployment.toml
# Checks: 0 occurrences of the marker, and the send_headers line
grep -c "MOESIF_KEY_A_REMPLACER" conf-wso2am-deployment.toml
grep -n "send_headers" conf-wso2am-deployment.toml
```

```powershell
$k = (Get-Content .moesif.key -Raw).Trim()
$t = (Get-Content conf-wso2am-deployment.toml -Raw) -replace 'MOESIF_KEY_A_REMPLACER', $k
# Written as UTF-8 without a BOM: a BOM at the start of the file can get in the way of reading the TOML
[IO.File]::WriteAllText((Resolve-Path conf-wso2am-deployment.toml), $t, (New-Object Text.UTF8Encoding $false))
(Select-String -Path conf-wso2am-deployment.toml -Pattern 'MOESIF_KEY_A_REMPLACER' | Measure-Object).Count
Select-String -Path conf-wso2am-deployment.toml -Pattern 'send_headers'
```

## Step 3 — The two mounts, and the recreation

```bash
docker compose cp wso2am:/home/wso2carbon/wso2am-4.7.0/bin/api-manager.sh ./conf-api-manager.sh
grep -n 'enableCorrelationLogs' conf-api-manager.sh
```

```bash
# macOS
sed -i '' 's/-DenableCorrelationLogs=false/-DenableCorrelationLogs=true/' conf-api-manager.sh
grep -n "enableCorrelationLogs" conf-api-manager.sh
sed -i '' 's/\r$//' conf-api-manager.sh
chmod +x conf-api-manager.sh
```

```bash
# Linux / Git Bash
sed -i 's/-DenableCorrelationLogs=false/-DenableCorrelationLogs=true/' conf-api-manager.sh
grep -n "enableCorrelationLogs" conf-api-manager.sh
sed -i 's/\r$//' conf-api-manager.sh
chmod +x conf-api-manager.sh
```

```powershell
# The file MUST be written with LF line endings, otherwise the script does not start
$p = "conf-api-manager.sh"
$c = (Get-Content $p) -replace '-DenableCorrelationLogs=false', '-DenableCorrelationLogs=true'
[IO.File]::WriteAllText((Resolve-Path $p), ($c -join "`n"))
Select-String -Path $p -Pattern 'enableCorrelationLogs'
```

```bash
cat > docker-compose.override.yml <<'EOF'
services:
  wso2am:
    volumes:
      - ./conf-wso2am-deployment.toml:/home/wso2carbon/wso2am-4.7.0/repository/conf/deployment.toml
      - ./conf-api-manager.sh:/home/wso2carbon/wso2am-4.7.0/bin/api-manager.sh
EOF
cat docker-compose.override.yml
```

```powershell
@"
services:
  wso2am:
    volumes:
      - ./conf-wso2am-deployment.toml:/home/wso2carbon/wso2am-4.7.0/repository/conf/deployment.toml
      - ./conf-api-manager.sh:/home/wso2carbon/wso2am-4.7.0/bin/api-manager.sh
"@ | Set-Content docker-compose.override.yml
Get-Content docker-compose.override.yml
```

```bash
docker compose --profile core --profile apps up -d --force-recreate wso2am
until [ "$(curl -k -s -o /dev/null -w '%{http_code}' https://localhost:9443/services/Version)" = "200" ]; do sleep 5; done; echo "APIM pret"
```

## Step 4 — Republish: the two APIs, the application, the keys

```bash
cd ..
apictl login dev -u admin -p admin -k
apictl import api -f Petstore -e dev -k
apictl init Invoices --oas apis/specs/invoices.yaml --definition labs/lab06_moesif_analytics/definition-invoices.yaml --force=true
apictl import api -f Invoices -e dev -k
apictl change-status api -a Publish -n "Invoices API" -v 1.0.0 -e dev -k
```

```bash
sed -E 's/("client(Id|Secret)": ")[^"]+/\1********/' apis/tests/env.gateway.json
```

```powershell
(Get-Content apis/tests/env.gateway.json -Raw) -replace '("client(Id|Secret)": ")[^"]+', '$1********'
```

```bash
export CONSUMER_KEY=your_consumer_key CONSUMER_SECRET=your_consumer_secret
export TOKEN=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" --data-urlencode "scope=petstore:read invoices:read invoices:write" https://localhost:9443/oauth2/token | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/petstore/1.0.0/pets
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/invoices/1.0.0/invoices
```

```powershell
$env:CONSUMER_KEY = "your_consumer_key"; $env:CONSUMER_SECRET = "your_consumer_secret"
$env:TOKEN = (curl.exe -k -s -u "$($env:CONSUMER_KEY):$($env:CONSUMER_SECRET)" -d "grant_type=client_credentials" --data-urlencode "scope=petstore:read invoices:read invoices:write" https://localhost:9443/oauth2/token | ConvertFrom-Json).access_token
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/petstore/1.0.0/pets
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/invoices/1.0.0/invoices
```

## Step 5 — Traffic worth looking at

```bash
cd apis/tests
node run-tests.mjs --env env.gateway.json --suite petstore
node run-tests.mjs --env env.gateway.json --suite petstore
node run-tests.mjs --env env.gateway.json --suite petstore
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/petstore/1.0.0/pets/99
cd ../..
```

```powershell
cd apis\tests
node run-tests.mjs --env env.gateway.json --suite petstore
node run-tests.mjs --env env.gateway.json --suite petstore
node run-tests.mjs --env env.gateway.json --suite petstore
curl.exe -k -s -o NUL -w "%{http_code}`n" https://localhost:8243/petstore/1.0.0/pets
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/petstore/1.0.0/pets/99
cd ..\..
```

```bash
node labs/lab08a_routing_throttling/burst.mjs https://localhost:8243/petstore/1.0.0/pets "$TOKEN" 60
```

```powershell
node labs\lab08a_routing_throttling\burst.mjs https://localhost:8243/petstore/1.0.0/pets "$env:TOKEN" 60
```

## Step 7 — Plan B: three commands, no account

```bash
cd labs
# Volume and error rate: the number of responses per code
docker compose logs --no-log-prefix petstore invoices | grep '"message":"request handled"' | grep -v '"path":"/health"' | grep -o '"status":[0-9]*' | sort | uniq -c
# Latency: the 10 slowest requests
docker compose logs --no-log-prefix petstore invoices | grep '"message":"request handled"' | grep -v '"path":"/health"' | grep -o '"durationMs":[0-9]*' | sort -t: -k2 -n | tail -10
cd ..
```

```powershell
cd labs
docker compose logs --no-log-prefix petstore invoices | Select-String '"message":"request handled"' |
  Where-Object { $_.Line -notmatch '"path":"/health"' } |
  ForEach-Object { if ($_.Line -match '"status":(\d+)') { $Matches[1] } } | Group-Object | Sort-Object Count -Descending
docker compose logs --no-log-prefix petstore invoices | Select-String '"message":"request handled"' |
  Where-Object { $_.Line -notmatch '"path":"/health"' } |
  ForEach-Object { if ($_.Line -match '"durationMs":(\d+)') { [int]$Matches[1] } } | Sort-Object -Descending | Select-Object -First 10
cd ..
```

```bash
cd labs
docker compose logs -f --no-log-prefix petstore invoices | grep --line-buffered '"status":5'
```

```powershell
cd labs
docker compose logs -f --no-log-prefix petstore invoices | Select-String '"status":5'
```

## Step 8 — Hygiene: the key, the repository, the shutdown

```bash
git status --short
cd labs && docker compose --profile core --profile apps stop
```

```powershell
git status --short
cd labs; docker compose --profile core --profile apps stop
```

## If it doesn't work

```bash
docker compose exec wso2am awk '/^\[/{s=($0 ~ /^\[apim\.analytics(\.properties)?\]$/)} s && !/moesifKey/' /home/wso2carbon/wso2am-4.7.0/repository/conf/deployment.toml
```
