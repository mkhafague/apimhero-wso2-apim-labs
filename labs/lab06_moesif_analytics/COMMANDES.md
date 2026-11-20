# Lab 6 — Analytics avec Moesif — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

## Étape 0 — L'état de départ, et le test qui décide

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

## Étape 1 — Le compte Moesif, et la clé qu'on ne montre jamais

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

## Étape 2 — La configuration : copier, éditer, substituer

```bash
docker compose cp wso2am:/home/wso2carbon/wso2am-4.7.0/repository/conf/deployment.toml ./conf-wso2am-deployment.toml
```

```bash
# Linux / Git Bash
sed -i "s|MOESIF_KEY_A_REMPLACER|$(tr -d '\r\n' < .moesif.key)|" conf-wso2am-deployment.toml
# macOS (sed BSD : l'argument vide après -i est obligatoire)
sed -i '' "s|MOESIF_KEY_A_REMPLACER|$(tr -d '\r\n' < .moesif.key)|" conf-wso2am-deployment.toml
# Contrôles : 0 occurrence du marqueur, et la ligne send_headers
grep -c "MOESIF_KEY_A_REMPLACER" conf-wso2am-deployment.toml
grep -n "send_headers" conf-wso2am-deployment.toml
```

```powershell
$k = (Get-Content .moesif.key -Raw).Trim()
$t = (Get-Content conf-wso2am-deployment.toml -Raw) -replace 'MOESIF_KEY_A_REMPLACER', $k
# Écriture en UTF-8 sans BOM : un BOM en tête du fichier peut gêner la lecture du TOML
[IO.File]::WriteAllText((Resolve-Path conf-wso2am-deployment.toml), $t, (New-Object Text.UTF8Encoding $false))
(Select-String -Path conf-wso2am-deployment.toml -Pattern 'MOESIF_KEY_A_REMPLACER' | Measure-Object).Count
Select-String -Path conf-wso2am-deployment.toml -Pattern 'send_headers'
```

## Étape 3 — Les deux montages, et la recréation

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
# L'écriture DOIT se faire en LF, sinon le script ne démarre pas
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

## Étape 4 — Republier : les deux API, l'application, les clés

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
export CONSUMER_KEY=votre_consumer_key CONSUMER_SECRET=votre_consumer_secret
export TOKEN=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" --data-urlencode "scope=petstore:read invoices:read invoices:write" https://localhost:9443/oauth2/token | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/petstore/1.0.0/pets
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/invoices/1.0.0/invoices
```

```powershell
$env:CONSUMER_KEY = "votre_consumer_key"; $env:CONSUMER_SECRET = "votre_consumer_secret"
$env:TOKEN = (curl.exe -k -s -u "$($env:CONSUMER_KEY):$($env:CONSUMER_SECRET)" -d "grant_type=client_credentials" --data-urlencode "scope=petstore:read invoices:read invoices:write" https://localhost:9443/oauth2/token | ConvertFrom-Json).access_token
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/petstore/1.0.0/pets
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/invoices/1.0.0/invoices
```

## Étape 5 — Du trafic qui vaut le coup d'œil

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

## Étape 7 — Le plan B : trois commandes, sans compte

```bash
cd labs
# Volume et taux d'erreur : le nombre de réponses par code
docker compose logs --no-log-prefix petstore invoices | grep '"message":"request handled"' | grep -v '"path":"/health"' | grep -o '"status":[0-9]*' | sort | uniq -c
# Latence : les 10 requêtes les plus lentes
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

## Étape 8 — Hygiène : la clé, le dépôt, l'arrêt

```bash
git status --short
cd labs && docker compose --profile core --profile apps stop
```

```powershell
git status --short
cd labs; docker compose --profile core --profile apps stop
```

## Si ça ne marche pas

```bash
docker compose exec wso2am awk '/^\[/{s=($0 ~ /^\[apim\.analytics(\.properties)?\]$/)} s && !/moesifKey/' /home/wso2carbon/wso2am-4.7.0/repository/conf/deployment.toml
```
