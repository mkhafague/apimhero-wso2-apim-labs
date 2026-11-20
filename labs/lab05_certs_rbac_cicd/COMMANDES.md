# Lab 5 — Certificats, RBAC et pipeline apictl — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

## Partie C — Le pipeline apictl (m05_v04)

### Étape 1 — Le second environnement (recette)

```bash
docker compose --profile core --profile apps --profile staging up -d
docker compose ps
```

```bash
# Linux / macOS
until [ "$(curl -k -s -o /dev/null -w '%{http_code}' https://localhost:9444/services/Version)" = "200" ]; do sleep 5; done
```

```powershell
# Windows PowerShell
do { Start-Sleep 5 } until ((curl.exe -k -s -o NUL -w "%{http_code}" https://localhost:9444/services/Version) -eq "200")
```

## Partie C — Le pipeline apictl (m05_v04)

### Étape 3 — Environnements et connexion (syntaxe vérifiée docs 4.7.0)

```bash
apictl add env dev --apim https://localhost:9443
apictl add env staging --apim https://localhost:9444
apictl login dev -u admin -p admin -k
apictl login staging -u admin -p admin -k
```

## Partie C — Le pipeline apictl (m05_v04)

### Étape 4 — Le projet, Git, le déploiement en dev

```bash
apictl init Petstore --oas apis/specs/petstore.yaml --force=true
```

```bash
# Linux / macOS
git init Petstore && cd Petstore && git add . && git commit -m "Create Petstore API project" && cd ..
```

```powershell
# Windows PowerShell
git init Petstore; cd Petstore; git add .; git commit -m "Create Petstore API project"; cd ..
```

```bash
apictl import api -f Petstore -e dev -k
```

## Partie C — Le pipeline apictl (m05_v04)

### Étape 5 — La barrière de tests

```bash
cd apis/tests
node run-tests.mjs --env env.gateway.json --suite petstore --report-json results.json
echo $?            # PowerShell : echo $LASTEXITCODE
```

## Partie C — Le pipeline apictl (m05_v04)

### Étape 6 — Promotion en recette

```bash
apictl import api -f Petstore -e staging -k
```

```bash
curl -k -s -u CONSUMER_KEY_STAGING:CONSUMER_SECRET_STAGING -d "grant_type=client_credentials" --data-urlencode "scope=petstore:read petstore:write" https://localhost:9444/oauth2/token
curl -k -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer ACCESS_TOKEN_STAGING" https://localhost:8244/petstore/1.0.0/pets
```

```bash
docker compose stop petstore
docker compose ps
```

```bash
apictl import api -f Petstore -e staging --params labs/lab05_certs_rbac_cicd/api_params.yaml --update -k
```

## Partie C — Le pipeline apictl (m05_v04)

### Étape 7 — Trousse d'exploitation

```bash
apictl undeploy api -n "Simple Petstore API" -v 1.0.0 --rev 2 -e staging -k
apictl import api -f Petstore -e dev --update --rotate-revision -k
```

## Partie C — Le pipeline apictl (m05_v04)

### Étape 8 — GitHub Actions

```bash
# Linux / macOS — depuis la racine du dépôt de formation
mkdir -p ../apim-pipeline/apis/tests ../apim-pipeline/.github/workflows
cp -R Petstore ../apim-pipeline/Petstore && rm -rf ../apim-pipeline/Petstore/.git
cp apis/tests/run-tests.mjs ../apim-pipeline/apis/tests/
cp labs/lab05_certs_rbac_cicd/github-workflow-example/deploy-petstore.yml ../apim-pipeline/.github/workflows/
cd ../apim-pipeline
printf '%s\n' 'apis/tests/env*.json' 'results.json' 'build/' > .gitignore
git init -b main && git add . && git commit -m "Petstore API pipeline"
gh repo create apim-pipeline --private --source . --push
```

```powershell
# Windows PowerShell — depuis la racine du dépôt de formation
New-Item -ItemType Directory -Force ..\apim-pipeline\apis\tests, ..\apim-pipeline\.github\workflows | Out-Null
Copy-Item -Recurse -Force Petstore ..\apim-pipeline\Petstore
Remove-Item -Recurse -Force ..\apim-pipeline\Petstore\.git -ErrorAction SilentlyContinue
Copy-Item apis\tests\run-tests.mjs ..\apim-pipeline\apis\tests\
Copy-Item labs\lab05_certs_rbac_cicd\github-workflow-example\deploy-petstore.yml ..\apim-pipeline\.github\workflows\
cd ..\apim-pipeline
Set-Content .gitignore 'apis/tests/env*.json', 'results.json', 'build/'
git init -b main; git add .; git commit -m "Petstore API pipeline"
gh repo create apim-pipeline --private --source . --push
```
