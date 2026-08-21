# 📱 VaultDocs - Especificações Técnicas e Arquitetura

## 🎯 Visão Geral
Aplicativo mobile para captura, gerenciamento seguro e alertas de vencimento de documentos pessoais (RG, CNH, contratos, boletos, garantias).

## 🏗️ Stack Tecnológica
* **Mobile:** React Native com Expo (TypeScript), Expo Camera, Expo Document Picker, Expo Local Authentication (Biometria).
* **Backend:** Node.js + Express (TypeScript) utilizando Clean Architecture e Service Pattern.
* **Banco de Dados:** MongoDB Atlas (Mongoose ODM).
* **Armazenamento de Arquivos:** Cloudflare R2 / AWS S3 (Object Storage) via Presigned URLs. NUNCA salvar PDFs/imagens diretamente no MongoDB.

## 🗄️ Modelagem MongoDB (Mongoose Schema)
### Coleção `documents`
* `userId` (ObjectId, indexed)
* `title` (String)
* `category` (String: 'cnh' | 'rg' | 'boleto' | 'contrato' | 'garantia' | 'outros')
* `file`: { `storageKey`: String, `mimeType`: String, `sizeBytes`: Number }
* `extractedData`: Object (Flexível para dados extraídos por OCR/IA: CPF, nome, emissor, etc.)
* `expirationDate`: Date (Indexed)
* `notifications`: [{ `daysBefore`: Number, `sent`: Boolean }]
* `status`: String ('active' | 'archived' | 'expired')
* `createdAt` / `updatedAt` (Timestamps)

## 🔒 Regras de Segurança e Boas Práticas
1. Isolamento total de dados por `userId` em todas as queries.
2. Arquivos no Object Storage devem ser privados. Acesso mobile somente via Presigned URLs com expiração curta (15 mins).
3. Índices de banco obrigatórios em `{ userId: 1, status: 1 }` e `{ expirationDate: 1, "notifications.sent": 1 }`.

## 📁 Estrutura de Pastas Esperada
vaultdocs/
├── apps/
│   ├── mobile/         # App React Native (Expo)
│   └── api/            # API Express + Node.js (Mongoose)
