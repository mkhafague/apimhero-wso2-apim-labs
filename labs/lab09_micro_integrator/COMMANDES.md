# Lab 9 — Exposer le legacy GestPrest avec Micro Integrator — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

## Étape 1 — Démarrer l'intégration

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

## Étape 2 — Écouter le dialecte legacy (en direct)

```bash
curl -s "http://localhost:9091/GESTPREST/RMBT?id=1042"
```

```bash
curl -s "http://localhost:9091/GESTPREST/RMBT?id=7777"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:9091/GESTPREST/RMBT?id=7777"
```

## Étape 3 — La façade Micro Integrator

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

## Étape 4 — Publier la façade dans APIM

```bash
export CONSUMER_KEY=votre_consumer_key CONSUMER_SECRET=votre_consumer_secret
TOKEN=$(curl -k -s -u "$CONSUMER_KEY:$CONSUMER_SECRET" -d "grant_type=client_credentials" https://localhost:9443/oauth2/token | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
curl -k -s -H "Authorization: Bearer $TOKEN" https://localhost:8243/claims/1.0.0/1042
```

```powershell
$env:CONSUMER_KEY = "votre_consumer_key"; $env:CONSUMER_SECRET = "votre_consumer_secret"
$TOKEN = (curl.exe -k -s -u "$($env:CONSUMER_KEY):$($env:CONSUMER_SECRET)" -d "grant_type=client_credentials" https://localhost:9443/oauth2/token | ConvertFrom-Json).access_token
curl.exe -k -s -H "Authorization: Bearer $TOKEN" https://localhost:8243/claims/1.0.0/1042
```

## Étape 5 — La règle des trois étages, en panne réelle

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

## Étape 6 — Rendre la mémoire

```bash
docker compose --profile integration stop
docker compose ps -a
docker stats --no-stream wso2am petstore invoices
```
