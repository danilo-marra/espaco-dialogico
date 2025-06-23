# 🚀 Scripts - Referência Rápida

## 💻 Desenvolvimento

| Comando                | Uso                       | Quando                 |
| ---------------------- | ------------------------- | ---------------------- |
| `npm run dev:isolated` | 🔒 Desenvolvimento seguro | **Recomendado diário** |
| `npm run dev`          | 🔨 Desenvolvimento padrão | Alternativa normal     |
| `npm run dev:clean`    | 🧹 Ambiente limpo         | Após problemas         |
| `npm run dev:safe`     | ⚡ Com verificações       | Conflitos de porta     |

## 🧪 Testes

| Comando                 | Uso                | Quando               |
| ----------------------- | ------------------ | -------------------- |
| `npm run test:frontend` | 🎨 Só componentes  | Desenvolvimento UI   |
| `npm run test`          | 🔍 Todos os testes | Antes de commit      |
| `npm run test:watch`    | 👀 Watch mode      | Desenvolvendo testes |

## 🗄️ Banco de Dados

| Comando                     | Uso                  | Quando            |
| --------------------------- | -------------------- | ----------------- |
| `npm run db:validate`       | ✅ Verificar status  | Diagnóstico       |
| `npm run db:seed:all`       | 📊 Dados de teste    | Setup inicial     |
| `npm run migrations:up`     | ⬆️ Aplicar migrações | Após git pull     |
| `npm run migrations:create` | ➕ Nova migração     | Mudança estrutura |

## 🐳 Docker

| Comando                 | Uso                   | Quando                |
| ----------------------- | --------------------- | --------------------- |
| `npm run services:up`   | ▶️ Iniciar containers | Antes desenvolvimento |
| `npm run services:down` | ⏹️ Parar e remover    | Reset ambiente        |
| `npm run services:stop` | ⏸️ Apenas parar       | Pausa temporária      |

## 🔧 Manutenção

| Comando                     | Uso                | Quando       |
| --------------------------- | ------------------ | ------------ |
| `npm run lint:prettier:fix` | 💅 Formatar código | Antes commit |
| `npm run build`             | 🏗️ Build produção  | Deploy       |

---

## 🎯 Fluxos Comuns

### Início do Dia

```bash
npm run dev:isolated
```

### Nova Funcionalidade

```bash
npm run dev:isolated
npm run db:seed:all  # se precisar dados
```

### Antes de Commit

```bash
npm run lint:prettier:fix
npm run test
```

### Reset Completo

```bash
npm run services:down
npm run dev:clean
```

### Problema com Testes Automáticos

```bash
taskkill /f /im node.exe
npm run dev:isolated
```

---

## 🚨 Códigos de Emergência

**Testes executando sozinhos:**

```bash
taskkill /f /im node.exe && npm run dev:isolated
```

**Porta 3000 ocupada:**

```bash
npm run dev:safe
```

**Banco não conecta:**

```bash
npm run services:down && npm run services:up && npm run services:wait:database
```

**Reset total:**

```bash
npm run services:down && npm run migrations:down:all && npm run migrations:up && npm run db:seed:all
```
