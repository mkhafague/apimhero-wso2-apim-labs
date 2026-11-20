# Lab 10 — Final project: the Invoices API end to end — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

## Before you start — the starting state

```bash
cd labs
docker compose ps
docker compose stop wso2am-staging petstore-staging wso2is wso2mi legacy-mock
docker compose --profile core --profile apps up -d
docker stats --no-stream wso2am petstore invoices
```

```bash
# Linux / macOS / Git Bash
until curl -k -s -o /dev/null -w "%{http_code}" https://localhost:9443/services/Version | grep -q 200; do sleep 5; done
```

```powershell
# Windows PowerShell
do { Start-Sleep 5 } until ((curl.exe -k -s -o NUL -w "%{http_code}" https://localhost:9443/services/Version) -eq "200")
```

```bash
apictl version                                                                  # lab 5: the version prints
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:9443/publisher/   # → 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8082/health           # → 200 (invoices backend)
docker compose exec wso2am sh -c "grep -c moesif /home/wso2carbon/wso2am-4.7.0/repository/conf/deployment.toml"   # lab 6: 1 or more
cd ..
```

## Step 1 — Publish through the CLI (module 5)

```bash
apictl add env dev --apim https://localhost:9443
apictl login dev -u admin -p admin -k
apictl init Invoices --oas apis/specs/invoices.yaml --force=true
```

```bash
apictl import api -f Invoices -e dev --params labs/lab10_final_project/params.yaml -k
apictl change-status api -a Publish -n "Invoices API" -v 1.0.0 -e dev -k
```

## Step 3 — The test matrix (positive AND negative)

```bash
cd apis/tests
node run-tests.mjs --env env.gateway-invoices.json --suite invoices --report-json rapport-final.json
```

## Step 4 — Monitoring and correlation (module 6)

```bash
docker compose exec wso2am curl -s -o /dev/null -w "%{http_code}\n" https://api.moesif.net
```

## Cleanup

```bash
cd labs
docker compose --profile core --profile apps stop    # stops everything, destroys nothing: fast restart
```
