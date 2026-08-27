# 📦 Configuração do Cloudflare R2

Guia para configurar o Cloudflare R2 no VaultDocs.

---

## 1. Criar Conta no Cloudflare

1. Acesse [cloudflare.com](https://cloudflare.com)
2. Crie uma conta ou faça login
3. No painel, vá em **R2 Object Storage**

---

## 2. Criar Bucket

1. Clique em **Create Bucket**
2. Nome: `vaultdocs-storage`
3. Localização: **Automática** (ou escolha a mais próxima)
4. Clique em **Create Bucket**

---

## 3. Criar Token de API

1. No painel R2, vá em **Manage R2 API Tokens**
2. Clique em **Create API Token**
3. Configure:
   - **Token name**: `vaultdocs-api`
   - **Permissions**: **Object Read & Write**
   - **Specify bucket(s)**: `vaultdocs-storage` (apenas este bucket)
4. Clique em **Create API Token**

---

## 4. Copiar Credenciais

Após criar o token, copie:

- **Access Key ID**
- **Secret Access Key**

⚠️ **IMPORTANTE**: O Secret Key só é exibido UMA VEZ. Copie imediatamente.

---

## 5. Obter Account ID

1. No painel do Cloudflare, vá em **Overview**
2. O **Account ID** está no canto inferior direito
3. Copie ele

---

## 6. Configurar Acesso Público (Opcional)

Para arquivos públicos (sem necessidade de presigned URLs):

1. No bucket `vaultdocs-storage`, vá em **Settings**
2. Em **Public Access**, clique em **Allow Access**
3. Copie a **Public R2 Domain** (algo como `https://pub-xxxxx.r2.dev`)

**Nota**: Se não configurar acesso público, o VaultDocs usará presigned URLs temporárias (funciona normalmente).

---

## 7. Configurar .env

Edite o arquivo `apps/api/.env`:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=seu_account_id_aqui
R2_ACCESS_KEY_ID=sua_access_key_aqui
R2_SECRET_ACCESS_KEY=sua_secret_key_aqui
R2_BUCKET_NAME=vaultdocs-storage
R2_PUBLIC_URL=https://pub-seu-codigo.r2.dev
```

---

## 8. Testar Configuração

Após configurar, reinicie a API:

```bash
cd apps/api
npm run dev
```

Faça login e tente fazer upload de um documento.

---

## 🔒 Segurança

- **NUNCA** commite o `.env` no git
- **NUNCA** exponha as credenciais no frontend
- As credenciais ficam apenas no backend
- O backend gera presigned URLs temporárias para acesso

---

## ⚠️ Solução de Problemas

### Erro "Failed to upload file to storage"
- Verifique se as credenciais estão corretas
- Verifique se o bucket existe
- Verifique se o token tem permissão de escrita

### Erro "Access Denied"
- Verifique as permissões do token
- Verifique se o bucket está no Account ID correto

### Arquivo não aparece após upload
- Verifique se o R2_PUBLIC_URL está configurado
- Verifique se o bucket tem acesso público (se necessário)
