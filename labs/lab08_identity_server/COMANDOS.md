# Lab 8 — Identity Server como Key Manager, scopes y tres incidentes — comandos

> Chuleta para copiar y pegar. Las explicaciones, los resultados esperados y el incidente están en la ficha del lab.

## Paso 1 — Hacer sitio y después arrancar Identity Server

```bash
docker compose ps -a --format "table {{.Name}}\t{{.Status}}"
docker compose --profile staging --profile integration stop
docker compose --profile core --profile apps --profile iam up -d
docker compose ps --format "table {{.Name}}\t{{.Status}}"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" wso2am petstore invoices wso2is
```

```bash
until curl -k -s -o /dev/null https://localhost:9443/publisher; do sleep 5; done; echo "APIM pret"
until curl -k -s -o /dev/null https://localhost:9445/console;  do sleep 5; done; echo "IS pret"
```

```powershell
while ($true) { curl.exe -k -s -o NUL https://localhost:9443/publisher; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 5 }; "APIM pret"
while ($true) { curl.exe -k -s -o NUL https://localhost:9445/console;  if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 5 }; "IS pret"
```

```bash
docker exec wso2am bash -c "cd wso2am-4.7.0/repository/resources/security && keytool -printcert -sslserver wso2is:9443 -rfc | keytool -importcert -noprompt -alias wso2is -keystore client-truststore.jks -storepass wso2carbon"
docker compose restart wso2am
until curl -k -s -o /dev/null https://localhost:9443/publisher; do sleep 5; done; echo "APIM pret"
```

```powershell
docker exec wso2am bash -c "cd wso2am-4.7.0/repository/resources/security && keytool -printcert -sslserver wso2is:9443 -rfc | keytool -importcert -noprompt -alias wso2is -keystore client-truststore.jks -storepass wso2carbon"
docker compose restart wso2am
while ($true) { curl.exe -k -s -o NUL https://localhost:9443/publisher; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 5 }; "APIM pret"
```

## Paso 3 — Los scopes en la API Invoices, la aplicación, el primer token

```bash
apictl login dev -u admin -p admin -k
apictl init Invoices --oas apis/specs/invoices.yaml --definition labs/lab06_moesif_analytics/definition-invoices.yaml --force=true
apictl import api -f Invoices -e dev -k
apictl change-status api -a Publish -n "Invoices API" -v 1.0.0 -e dev -k
```

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/invoices/1.0.0/invoices
```

```bash
export CONSUMER_KEY=tu_consumer_key CONSUMER_SECRET=tu_consumer_secret
REPONSE=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read" https://localhost:9445/oauth2/token)
echo "$REPONSE" | sed 's/"access_token":"[^"]*"/"access_token":"***"/'
TOKEN_LECTURE=$(echo "$REPONSE" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
```

```powershell
$env:CONSUMER_KEY = "tu_consumer_key"; $env:CONSUMER_SECRET = "tu_consumer_secret"
$REPONSE = curl.exe -k -s -u "$($env:CONSUMER_KEY):$($env:CONSUMER_SECRET)" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read" https://localhost:9445/oauth2/token | ConvertFrom-Json
$REPONSE | Select-Object scope, token_type, expires_in
$env:TOKEN_LECTURE = $REPONSE.access_token
```

## Incidente 1 — El scope ausente (403)

```bash
curl -k -s -i -H "Authorization: Bearer $TOKEN_LECTURE" -X POST https://localhost:8243/invoices/1.0.0/invoices -H "Content-Type: application/json" -d @payloads/new-invoice.json
```

```powershell
curl.exe -k -s -i -H "Authorization: Bearer $env:TOKEN_LECTURE" -X POST https://localhost:8243/invoices/1.0.0/invoices -H "Content-Type: application/json" -d "@payloads/new-invoice.json"
```

```bash
REPONSE=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read invoices:write" https://localhost:9445/oauth2/token)
echo "$REPONSE" | sed 's/"access_token":"[^"]*"/"access_token":"***"/'
TOKEN_COMPLET=$(echo "$REPONSE" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
curl -k -s -i -H "Authorization: Bearer $TOKEN_COMPLET" -X POST https://localhost:8243/invoices/1.0.0/invoices -H "Content-Type: application/json" -d @payloads/new-invoice.json
```

```powershell
$REPONSE = curl.exe -k -s -u "$($env:CONSUMER_KEY):$($env:CONSUMER_SECRET)" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read invoices:write" https://localhost:9445/oauth2/token | ConvertFrom-Json
$REPONSE | Select-Object scope, token_type, expires_in
$env:TOKEN_COMPLET = $REPONSE.access_token
curl.exe -k -s -i -H "Authorization: Bearer $env:TOKEN_COMPLET" -X POST https://localhost:8243/invoices/1.0.0/invoices -H "Content-Type: application/json" -d "@payloads/new-invoice.json"
```

## Incidente 3 — JWKS inaccesible

```bash
REPONSE=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read" https://localhost:9445/oauth2/token)
echo "$REPONSE" | sed 's/"access_token":"[^"]*"/"access_token":"***"/'
TOKEN=$(echo "$REPONSE" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/invoices/1.0.0/invoices
```

```bash
docker network ls --filter name=wso2
docker network disconnect wso2-training_default wso2is
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/invoices/1.0.0/invoices
docker compose restart wso2am
until [ "$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost:8243/invoices/1.0.0/invoices)" = 401 ]; do sleep 5; done; echo "APIM pret"
curl -k -s -w "\n%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/invoices/1.0.0/invoices
docker compose logs --since 5m wso2am | grep -i jwks
```

```powershell
$REPONSE = curl.exe -k -s -u "$($env:CONSUMER_KEY):$($env:CONSUMER_SECRET)" -d "grant_type=client_credentials" --data-urlencode "scope=invoices:read" https://localhost:9445/oauth2/token | ConvertFrom-Json
$REPONSE | Select-Object scope, token_type, expires_in
$env:TOKEN = $REPONSE.access_token
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/invoices/1.0.0/invoices
docker network ls --filter name=wso2
docker network disconnect wso2-training_default wso2is
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/invoices/1.0.0/invoices
docker compose restart wso2am
while ((curl.exe -k -s -o NUL -w "%{http_code}" https://localhost:8243/invoices/1.0.0/invoices) -ne "401") { Start-Sleep 5 }; "APIM pret"
curl.exe -k -s -w "`n%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/invoices/1.0.0/invoices
docker compose logs --since 5m wso2am | Select-String -Pattern jwks
```

```bash
docker network connect wso2-training_default wso2is
docker compose restart wso2am
until [ "$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost:8243/invoices/1.0.0/invoices)" = 401 ]; do sleep 5; done; echo "APIM pret"
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" https://localhost:8243/invoices/1.0.0/invoices
docker network inspect wso2-training_default | grep '"Name"'
```

```powershell
docker network connect wso2-training_default wso2is
docker compose restart wso2am
while ((curl.exe -k -s -o NUL -w "%{http_code}" https://localhost:8243/invoices/1.0.0/invoices) -ne "401") { Start-Sleep 5 }; "APIM pret"
curl.exe -k -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $env:TOKEN" https://localhost:8243/invoices/1.0.0/invoices
docker network inspect wso2-training_default | Select-String '"Name"'
```

## Higiene — devolver la memoria

```bash
docker compose --profile iam stop
docker compose ps -a --format "table {{.Name}}\t{{.Status}}"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" wso2am petstore invoices wso2is
```
