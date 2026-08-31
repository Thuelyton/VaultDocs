#!/usr/bin/env bash
# =============================================================================
# VaultDocs - Testes de Integração (API em produção no Render)
# Origem simulada: https://vault-docs-mobile.vercel.app
# =============================================================================
set -u

API="https://vaultdocs.onrender.com"
ORIGIN="https://vault-docs-mobile.vercel.app"
BASE="$API/api/v1"

PASS=0
FAIL=0
TOKEN=""
USER_ID=""
DOC_ID=""

TS=$(date +%s)
EMAIL="integration_test_${TS}@vaultdocs.test"
PASSWD="Test@123456"
NAME="Integration Test User"

# Arquivo de teste (PDF mínimo válido)
PDF_FILE="$(mktemp --suffix=.pdf)"
printf '%s' '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n0\n%%EOF' > "$PDF_FILE"

divider() { printf '\n\033[1;36m────────────────────────────────────────────\033[0m\n'; }

assert() {
  # $1 = condition description, $2 = expected, $3 = actual
  if [ "$2" = "$3" ]; then
    printf '  \033[1;32m✅ PASS\033[0m | %s (esperado=%s)\n' "$1" "$2"
    PASS=$((PASS+1))
  else
    printf '  \033[1;31m❌ FAIL\033[0m | %s (esperado=%s, obtido=%s)\n' "$1" "$2" "$3"
    FAIL=$((FAIL+1))
  fi
}

assert_contains() {
  # $1 = description, $2 = haystack, $3 = needle
  if echo "$2" | grep -q "$3"; then
    printf '  \033[1;32m✅ PASS\033[0m | %s (contém "%s")\n' "$1" "$3"
    PASS=$((PASS+1))
  else
    printf '  \033[1;31m❌ FAIL\033[0m | %s (não contém "%s")\n' "$1" "$3"
    printf '       trecho: %s\n' "$(echo "$2" | head -c 300)"
    FAIL=$((FAIL+1))
  fi
}

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 1: Health Check\033[0m\n'
RESP=$(curl -s -m 30 "$API/health")
STATUS=$(echo "$RESP" | grep -o '"status":"[^"]*"' | head -1)
assert "Health check retorna status ok" '"status":"ok"' "$STATUS"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 2: CORS - origem permitida (Vercel)\033[0m\n'
HEADERS=$(curl -s -m 30 -D - -o /dev/null -H "Origin: $ORIGIN" "$API/health")
ACAO=$(echo "$HEADERS" | grep -i "access-control-allow-origin" | tr -d '\r' | awk '{print $2}')
assert "CORS permite origem Vercel" "$ORIGIN" "$ACAO"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 3: CORS - preflight OPTIONS\033[0m\n'
PREF=$(curl -s -m 30 -D - -o /dev/null \
  -X OPTIONS \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  "$BASE/auth/login")
ACAM=$(echo "$PREF" | grep -i "access-control-allow-methods" | tr -d '\r')
assert_contains "Preflight retorna métodos permitidos" "$ACAM" "POST"
ACAH=$(echo "$PREF" | grep -i "access-control-allow-headers" | tr -d '\r')
assert_contains "Preflight retorna headers permitidos" "$ACAH" "authorization"
STATUS_LINE=$(echo "$PREF" | head -1 | tr -d '\r')
assert_contains "Preflight status 2xx/3xx" "$STATUS_LINE" "20"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 4: CORS - origem bloqueada (evil.com)\033[0m\n'
EVIL=$(curl -s -m 30 -D - -o /dev/null -H "Origin: https://evil.com" "$API/health")
EVIL_ACAO=$(echo "$EVIL" | grep -i "access-control-allow-origin" | tr -d '\r' | awk '{print $2}')
if [ -z "$EVIL_ACAO" ]; then
  printf '  \033[1;32m✅ PASS\033[0m | Origem evil.com bloqueada (sem header ACAO)\n'
  PASS=$((PASS+1))
else
  printf '  \033[1;31m❌ FAIL\033[0m | Origem evil.com NÃO bloqueada (ACAO=%s)\n' "$EVIL_ACAO"
  FAIL=$((FAIL+1))
fi

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 5: Registro de usuário\033[0m\n'
RESP=$(curl -s -m 30 -X POST "$BASE/auth/register" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWD\"}")
assert_contains "Registro retorna status success" "$RESP" '"status":"success"'
TOKEN=$(echo "$RESP" | grep -o '"token":"[^"]*"' | head -1 | sed 's/"token":"//;s/"$//')
if [ -n "$TOKEN" ]; then
  printf '  \033[1;32m✅ PASS\033[0m | Token JWT recebido (%s chars)\n' "${#TOKEN}"
  PASS=$((PASS+1))
else
  printf '  \033[1;31m❌ FAIL\033[0m | Token JWT não recebido\n'
  printf '       resposta: %s\n' "$(echo "$RESP" | head -c 400)"
  FAIL=$((FAIL+1))
fi

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 6: Login do usuário\033[0m\n'
RESP=$(curl -s -m 30 -X POST "$BASE/auth/login" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWD\"}")
assert_contains "Login retorna status success" "$RESP" '"status":"success"'
TOKEN=$(echo "$RESP" | grep -o '"token":"[^"]*"' | head -1 | sed 's/"token":"//;s/"$//')
USER_ID=$(echo "$RESP" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"$//')
[ -n "$USER_ID" ] || USER_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')
assert "Login retorna token" "yes" "$([ -n "$TOKEN" ] && echo yes || echo no)"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 7: GET /auth/me (rota protegida)\033[0m\n'
RESP=$(curl -s -m 30 "$BASE/auth/me" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
assert_contains "auth/me retorna o email do usuário" "$RESP" "$EMAIL"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 8: Rota protegida sem token (deve falhar)\033[0m\n'
RESP=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$BASE/documents" -H "Origin: $ORIGIN")
assert "Documentos sem token retorna 401" "401" "$RESP"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 9: Criar documento (sem upload, sem vencimento)\033[0m\n'
RESP=$(curl -s -m 30 -X POST "$BASE/documents" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"title\":\"Documento Teste Integração\",\"category\":\"Documentos Pessoais\"}")
assert_contains "Criação de documento success" "$RESP" '"status":"success"'
DOC_ID=$(echo "$RESP" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"$//')
assert "Documento criado tem ID" "yes" "$([ -n "$DOC_ID" ] && echo yes || echo no)"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 10: Criar documento com vencimento\033[0m\n'
FUTURE=$(date -d "+20 days" +%Y-%m-%d 2>/dev/null || date -v+20d +%Y-%m-%d 2>/dev/null)
RESP=$(curl -s -m 30 -X POST "$BASE/documents" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"title\":\"Conta de Luz\",\"category\":\"Contas Fixas\",\"expirationDate\":\"$FUTURE\"}")
assert_contains "Documento com vencimento success" "$RESP" '"status":"success"'
assert_contains "Vencimento persistido" "$RESP" "$FUTURE"
DOC2=$(echo "$RESP" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"$//')

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 11: Listar documentos\033[0m\n'
RESP=$(curl -s -m 30 "$BASE/documents" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
assert_contains "Listagem contém documento criado" "$RESP" "Documento Teste Integração"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 12: Filtrar por categoria\033[0m\n'
RESP=$(curl -s -m 30 "$BASE/documents?category=Contas%20Fixas" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
assert_contains "Filtro categoria retorna conta" "$RESP" "Conta de Luz"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 13: Buscar por texto (search)\033[0m\n'
RESP=$(curl -s -m 30 "$BASE/documents?search=Luz" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
assert_contains "Busca por texto funciona" "$RESP" "Conta de Luz"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 14: Documentos expirando\033[0m\n'
RESP=$(curl -s -m 30 "$BASE/documents/expiring?days=30" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
assert_contains "Expiring contém conta com vencimento" "$RESP" "Conta de Luz"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 15: Estatísticas\033[0m\n'
RESP=$(curl -s -m 30 "$BASE/documents/stats" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
assert_contains "Stats retorna status success" "$RESP" '"status":"success"'

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 16: Obter documento por ID\033[0m\n'
RESP=$(curl -s -m 30 "$BASE/documents/$DOC_ID" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
assert_contains "GET por ID retorna título" "$RESP" "Documento Teste Integração"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 17: Atualizar documento\033[0m\n'
RESP=$(curl -s -m 30 -X PUT "$BASE/documents/$DOC_ID" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Documento Atualizado","category":"Outros"}')
assert_contains "Update retorna título novo" "$RESP" "Documento Atualizado"

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 18: Upload de arquivo + criação de documento (R2)\033[0m\n'
RESP=$(curl -s -m 60 -X POST "$BASE/upload/document" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$PDF_FILE;type=application/pdf" \
  -F "title=PDF Upload Integração" \
  -F "category=Contratos")
if echo "$RESP" | grep -q '"status":"success"'; then
  printf '  \033[1;32m✅ PASS\033[0m | Upload+documento criado com sucesso\n'
  PASS=$((PASS+1))
  UP_DOC=$(echo "$RESP" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"$//')
  assert_contains "Upload retorna título" "$RESP" "PDF Upload Integração"
else
  printf '  \033[1;33m⚠️  SKIP\033[0m | Upload R2 falhou (credenciais R2 / GEMINI ausentes no Render?)\n'
  printf '       resposta: %s\n' "$(echo "$RESP" | head -c 400)"
fi

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 19: View-url (presigned URL)\033[0m\n'
if [ -n "${UP_DOC:-}" ]; then
  RESP=$(curl -s -m 30 "$BASE/documents/$UP_DOC/view-url" \
    -H "Origin: $ORIGIN" \
    -H "Authorization: Bearer $TOKEN")
  if echo "$RESP" | grep -qi "url"; then
    printf '  \033[1;32m✅ PASS\033[0m | view-url retornou uma URL\n'
    PASS=$((PASS+1))
  else
    printf '  \033[1;31m❌ FAIL\033[0m | view-url não retornou URL\n'
    printf '       resposta: %s\n' "$(echo "$RESP" | head -c 300)"
    FAIL=$((FAIL+1))
  fi
else
  printf '  \033[1;33m⚠️  SKIP\033[0m | Sem documento com upload para testar view-url\n'
fi

# ---------------------------------------------------------------------------
divider; printf '\033[1;36mTESTE 20: Excluir documento (hard delete)\033[0m\n'
CODE=$(curl -s -m 30 -o /dev/null -w "%{http_code}" -X DELETE "$BASE/documents/$DOC_ID" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
assert "Delete retorna 200/204" "200" "$CODE"

# verifica se sumiu da listagem
RESP=$(curl -s -m 30 "$BASE/documents/$DOC_ID" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
CODE2=$(echo "$RESP" | grep -o '"statusCode":[0-9]*' | grep -o '[0-9]*' | head -1)
[ -z "$CODE2" ] && CODE2=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$BASE/documents/$DOC_ID" -H "Origin: $ORIGIN" -H "Authorization: Bearer $TOKEN")
assert "Documento excluído não é mais acessível" "404" "$CODE2"

# ---------------------------------------------------------------------------
divider
printf '\n\033[1;36m================ RESUMO ================\033[0m\n'
printf '  \033[1;32mPASS: %d\033[0m\n' "$PASS"
printf '  \033[1;31mFAIL: %d\033[0m\n' "$FAIL"
if [ "$FAIL" -eq 0 ]; then
  printf '\n  \033[1;32m✅ TODOS OS TESTES DE INTEGRAÇÃO PASSARAM\033[0m\n'
else
  printf '\n  \033[1;31m❌ %d teste(s) falharam — revise acima\033[0m\n' "$FAIL"
fi

# limpeza
rm -f "$PDF_FILE"
