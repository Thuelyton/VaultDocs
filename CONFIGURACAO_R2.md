# ⚡ Configuração R2 - Passo a Passo

## O que você precisa fazer

O VaultDocs está **100% implementado**. Falta apenas configurar o Cloudflare R2 para armazenar arquivos.

---

## Passo 1: Criar conta no Cloudflare

1. Acesse: https://dash.cloudflare.com/sign-up
2. Crie uma conta (gratuita)

---

## Passo 2: Criar Bucket

1. No painel, vá em **R2 Object Storage**
2. Clique em **Create Bucket**
3. Nome: `vaultdocs-storage`
4. Clique em **Create Bucket**

---

## Passo 3: Criar Token de API

1. Vá em **Manage R2 API Tokens**
2. Clique em **Create API Token**
3. Configure:
   - Nome: `vaultdocs-api`
   - Permissões: **Object Read & Write**
   - Bucket: `vaultdocs-storage`
4. Clique em **Create API Token**
5. **COPIE IMEDIATAMENTE:**
   - Access Key ID
   - Secret Access Key

---

## Passo 4: Copiar Account ID

1. Vá em **Overview** no painel
2. Copie o **Account ID** (canto inferior direito)

---

## Passo 5: Configurar .env

Edite `apps/api/.env`:

```env
R2_ACCOUNT_ID=COLE_AQUI_O_ACCOUNT_ID
R2_ACCESS_KEY_ID=COLE_AQUI_A_ACCESS_KEY
R2_SECRET_ACCESS_KEY=COLE_AQUI_A_SECRET_KEY
R2_BUCKET_NAME=vaultdocs-storage
R2_PUBLIC_URL=
```

**Nota**: O `R2_PUBLIC_URL` pode ficar vazio. O VaultDocs usa presigned URLs.

---

## Passo 6: Reiniciar a API

```bash
cd apps/api
npm run dev
```

---

## Passo 7: Testar

1. Acesse o app: http://localhost:8081
2. Faça login
3. Adicione um documento
4. Verifique se o upload funciona

---

## ✅ Pronto!

Se o upload funcionar, a V1 está completa.

Se tiver erro, verifique:
- Se as credenciais estão corretas
- Se o bucket existe
- Se o token tem permissão de escrita
