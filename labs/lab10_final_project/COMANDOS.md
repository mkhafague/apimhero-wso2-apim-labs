# Lab 10 — Proyecto final: la API Invoices de extremo a extremo — comandos

> Chuleta para copiar y pegar. Las explicaciones, los resultados esperados y el incidente están en la ficha del lab.

## Antes de empezar — el estado de partida

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
apictl version                                                                  # lab 5: se muestra la versión
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:9443/publisher/   # → 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8082/health           # → 200 (backend invoices)
docker compose exec wso2am sh -c "grep -c moesif /home/wso2carbon/wso2am-4.7.0/repository/conf/deployment.toml"   # lab 6: 1 o más
cd ..
```

## Paso 1 — Publicación mediante el CLI (módulo 5)

```bash
apictl add env dev --apim https://localhost:9443
apictl login dev -u admin -p admin -k
apictl init Invoices --oas apis/specs/invoices.yaml --force=true
```

```bash
apictl import api -f Invoices -e dev --params labs/lab10_final_project/params.yaml -k
apictl change-status api -a Publish -n "Invoices API" -v 1.0.0 -e dev -k
```

## Paso 3 — La matriz de pruebas (positivas Y negativas)

```bash
cd apis/tests
node run-tests.mjs --env env.gateway-invoices.json --suite invoices --report-json rapport-final.json
```

## Paso 4 — Supervisión y correlación (módulo 6)

```bash
docker compose exec wso2am curl -s -o /dev/null -w "%{http_code}\n" https://api.moesif.net
```

## Limpieza

```bash
cd labs
docker compose --profile core --profile apps stop    # lo detiene todo, no destruye nada: reinicio rápido
```
