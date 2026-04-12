# WebAudit

Uma aplicação web que analisa qualquer URL e retorna um relatório detalhado com problemas de SEO, erros de validação HTML (W3C) e erros de validação CSS (W3C).

---

## 🏗️ Arquitetura

```bash
webaudit/
├── backend/                 # API NestJS (porta 3000)
│   └── src/
│       ├── cache/           # Cache em memória com deduplicação
│       ├── analyze/         # Módulo principal (orquestrador)
│       │   ├── fetcher/     # Requisições HTTP (axios, segue redirects)
│       │   ├── parser/      # Parser HTML (cheerio)
│       │   ├── seo/         # Motor de regras de SEO
│       │   ├── validator/   # Integração REAL com validadores W3C
│       │   ├── dto/         # DTOs com class-validator
│       │   ├── interfaces/  # Interfaces TypeScript
│       │   ├── analyze.controller.ts
│       │   ├── analyze.service.ts
│       │   └── analyze.module.ts
│       ├── main.ts
│       └── app.module.ts
│
└── frontend/                # App Next.js (porta 3001)
    └── src/app/
        ├── layout.tsx       # Layout principal + metadata
        ├── page.tsx         # Página principal (formulário + resultados)
        ├── types.ts         # Tipos TypeScript compartilhados
        └── globals.css      # Estilos (tema escuro)
```

---

## 🔌 Contrato da API

### POST /analyze

### Requisição

```json
{
  "url": "https://example.com"
}
```

### Resposta

```json
{
  "url": "https://example.com",
  "seo_score": 85,
  "seo_issues": [
    {
      "rule": "missing_meta_description",
      "message": "A página não possui a tag <meta name=\"description\">.",
      "severity": "error",
      "suggestion": "Adicione uma meta description (120–160 caracteres)."
    }
  ],
  "html_errors": [
    {
      "message": "Tag de fechamento div sem abertura correspondente.",
      "type": "error",
      "line": 42
    }
  ],
  "css_errors": []
}
```

---

## ▶️ Como Rodar

### Backend

```bash
cd backend
npm install
npm run start:dev      # porta 3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # porta 3001
```

Abra no navegador:

```bash
http://localhost:3001
```

---

## 🧠 Decisões de Design

### 🌐 APIs REAIS do W3C

A aplicação consome validadores reais:

**HTML**
```bash
https://validator.w3.org/nu/?out=json&doc={url}
```
→ Requisição GET, retorna JSON  

**CSS**
```bash
https://jigsaw.w3.org/css-validator/validator?uri={url}&output=json
```
→ Requisição GET, retorna JSON  

---

### ⚡ Estratégia de Cache

O `CacheService` possui dois níveis de otimização:

- **Cache com TTL (10 minutos)**
  - Armazena o resultado completo por URL  
  - Requisições repetidas retornam instantaneamente  

- **Deduplicação de requisições**
  - Se múltiplas requisições simultâneas forem feitas para a mesma URL  
  - Todas aguardam a mesma Promise  
  - Evita chamadas duplicadas às APIs externas  

---

### 🚀 Execução em Paralelo

Validações HTML e CSS são executadas em paralelo usando:

```bash
Promise.all()
```

Resultado:

- Tempo total ≈ tempo de fetch + o mais lento entre HTML e CSS  
- Muito mais rápido do que execução sequencial  

---

### 📊 Score de SEO (0–100)

A pontuação começa em 100 e sofre penalizações:

- Sem título: -20  
- Sem meta description: -15  
- Sem H1: -15  
- Múltiplos H1: -10  
- Título muito curto ou muito longo: -5 cada  
- Imagens sem alt: -2 por imagem (máx -15)  
- Links vazios: -1 por link (máx -5)  
- Hierarquia de headings incorreta: -3 cada  