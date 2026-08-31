# 🚀 Deploy do VaultDocs — Guia Completo

Este repositório contém **dois alvos de produção**:

| Alvo | Plataforma | Caminho | URL final |
|---|---|---|---|
| **API (Express + Node)** | Render (Web Service) | `apps/api/` | `https://vaultdocs-api.onrender.com` |
| **App Mobile Web (Expo)** | Vercel (Static) | `apps/mobile/` | `https://vaultdocs.vercel.app` |
| **Storage de arquivos** | Cloudflare R2 | externo | `https://vaultdocs-storage.<account>.r2.dev` |

A app **Mobile nativa** (iOS/Android) é publicada via **Expo EAS Build** —
não é coberta por este guia.

---

## ⚠️ Passo 0 — Segurança (FAÇA ANTES DE TUDO)

O arquivo `apps/api/.env.example` antigo tinha credenciais reais do Cloudflare R2
commitadas no histórico do git. **A chave de acesso precisa ser rotacionada**.

1. Abra https://dash.cloudflare.com → **R2** → **Manage R2 API Tokens**
2. Localize o token com prefixo `8ab2389a…` (ou recrie do zero)
3. Clique em **Rotate** / **Delete** e crie um novo token com permissão **Object Read & Write** no bucket `vaultdocs-storage`
4. Anote o novo **Access Key ID** e **Secret Access Key** — você usará no Render
5. (Opcional) Para remover o segredo do histórico do git:
   ```bash
   npx --yes bfg-repo-cleaner --replace-text passwords.txt
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force
   ```

> ⚠️ Mesmo após `bfg`, qualquer clone antigo ainda terá a chave. **A rotação é o que efetivamente invalida a chave**.

---

## 1️⃣ Cloudflare R2

1. https://dash.cloudflare.com → **R2** → **Create bucket**
   - Nome: `vaultdocs-storage`
   - Location: **Automatic** (ou **ENAM** se preferir EUA)
2. Em **Settings** do bucket, copie o **S3 API** → endpoint e o **Account ID**
3. **Manage R2 API Tokens** → **Create API token**
   - Permissions: **Object Read & Write**
   - Bucket: `vaultdocs-storage`
   - **Anote** Access Key ID e Secret Access Key (eles só aparecem uma vez)

> ✅ Não precisa habilitar "Public Development URL" — o app usa **presigned URLs** temporárias (15 min) geradas pela API.

---

## 2️⃣ MongoDB Atlas

A connection string do cluster `ac-hesmlpb-shard-00-00.efpw04u.mongodb.net` já existe
e está em `atlas-credentials.env` (local). Para o Render:

1. https://cloud.mongodb.com → **Database Access** → confirme que o usuário existe
2. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
   *(necessário porque o Render usa IPs dinâmicos)*
3. Copie a connection string **Drivers (Node.js 5.5 or later)** do botão **Connect**

Formato:
```
mongodb+srv://USER:PASS@ac-hesmlpb-shard-00-00.efpw04u.mongodb.net/vaultdocs?retryWrites=true&w=majority
```

---

## 3️⃣ Render — API

### Criar o serviço

1. https://dashboard.render.com → **New +** → **Blueprint**
2. Conecte o repo `Thuelyton/VaultDocs` (autorize o GitHub se necessário)
3. Render detecta `render.yaml` na raiz → mostra o plano:
   - Service: `vaultdocs-api`
   - Plan: **Free**
   - Root dir: `apps/api`
4. Clique **Apply**

### Definir os secrets

Em **Environment** do serviço, preencha **uma a uma** (clique em **Add Secret**):

| Key | Value |
|---|---|
| `MONGO_URI` | a connection string completa do passo 2 |
| `JWT_SECRET` | qualquer string longa aleatória (32+ chars), ex.: `openssl rand -hex 32` |
| `R2_ACCOUNT_ID` | seu Account ID do Cloudflare |
| `R2_ACCESS_KEY_ID` | o Access Key novo (após rotação) |
| `R2_SECRET_ACCESS_KEY` | o Secret novo (após rotação) |
| `R2_PUBLIC_URL` | **vazio por enquanto** (presigned URLs dispensam) |
| `GEMINI_API_KEY` | (opcional) chave do Google Gemini para OCR/IA |
| `CORS_ORIGIN` | **atualize depois** com a URL da Vercel, ex.: `https://vaultdocs.vercel.app` |

> Os campos `NODE_ENV`, `PORT`, `NODE_VERSION`, `R2_BUCKET_NAME` já vêm
> preenchidos pelo `render.yaml`.

### Primeiro deploy

Render dispara o build automaticamente. Acompanhe em **Logs**.
Você deve ver:

```
📦 MongoDB connected to: ac-hesmlpb-shard-00-00.efpw04u.mongodb.net
✅ R2 credentials configured successfully
🚀 VaultDocs API running on port 10000
```

### Teste rápido

```bash
curl https://vaultdocs-api.onrender.com/health
# {"status":"ok","service":"VaultDocs API",...}
```

Anote a URL pública (`https://vaultdocs-api.onrender.com`) — você vai usar
na Vercel.

---

## 4️⃣ Vercel — Mobile Web

### Criar o projeto

1. https://vercel.com → **Add New…** → **Project**
2. Importe o repo `Thuelyton/VaultDocs`
3. Em **Configure Project**:
   - **Root Directory**: `apps/mobile`
   - **Build Command**: deixe em branco (usa o de `vercel.json`)
   - **Output Directory**: deixe em branco (usa o de `vercel.json`)
   - **Install Command**: deixe em branco
4. **Environment Variables** → adicione:
   | Key | Value |
   |---|---|
   | `EXPO_PUBLIC_API_URL` | `https://vaultdocs-api.onrender.com` |
5. **Deploy**

A primeira build pode levar 3–5 min (Metro + Expo bundler).
Quando terminar, anote a URL (`https://vaultdocs-xxxx.vercel.app`).

### Ajustar CORS no Render

Volte ao Render → **Environment** do `vaultdocs-api` → edite `CORS_ORIGIN`
para a URL exata da Vercel (sem barra no final) → **Save Changes**.
Render vai fazer redeploy automático.

---

## 5️⃣ Verificação end-to-end

1. Abra `https://vaultdocs-xxxx.vercel.app` no navegador
2. Crie uma conta em **Sign Up**
3. Faça login
4. **Adicionar documento** → escolha um PDF ou imagem
5. O upload deve funcionar e o documento aparecer na lista
6. Abra o documento — o visualizador deve carregar via presigned URL

---

## 🔄 Atualizações futuras

```bash
git add -A
git commit -m "feat: ..."
git push origin main
```

- **Render**: auto-deploy em cada push na `main`
- **Vercel**: auto-deploy em cada push na `main`
- **Mobile nativo (Expo EAS)**: ver `apps/mobile/EAS_SETUP.md` (a criar)

---

## 💸 Custos esperados (free tier)

| Serviço | Custo |
|---|---|
| Render Web Service Free | US$ 0 (limite 750h/mês, sleep após 15 min idle) |
| Vercel Hobby | US$ 0 (100 GB bandwidth/mês) |
| Cloudflare R2 Free | US$ 0 (10 GB storage, 1M reads, 10M writes/mês) |
| MongoDB Atlas M0 | US$ 0 (512 MB) |

> ⚠️ **Cold start no Render Free**: primeira requisição após ~15 min idle
> pode levar **30–60 segundos**. Para evitar isso, use Render Starter ($7/mês)
> ou Render com UptimeRobot pinging `/health` a cada 14 min.

---

## 📁 Arquivos de deploy neste repo

| Arquivo | Função |
|---|---|
| `render.yaml` | Blueprint do Render (cria o Web Service) |
| `vercel.json` | Config do Vercel (build Expo Web) |
| `apps/api/.env.example` | Template das variáveis (placeholders) |
| `DEPLOY.md` | Este guia |
