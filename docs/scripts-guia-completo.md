# 📋 Guia Completo de Scripts - Espaço Dialógico

Este documento explica detalhadamente todos os scripts disponíveis no projeto e quando usar cada um deles.

## 🎯 Índice

1. [Scripts de Desenvolvimento](#-scripts-de-desenvolvimento)
2. [Scripts de Teste](#-scripts-de-teste)
3. [Scripts de Banco de Dados](#-scripts-de-banco-de-dados)
4. [Scripts de Build e Deploy](#-scripts-de-build-e-deploy)
5. [Scripts de Qualidade de Código](#-scripts-de-qualidade-de-código)
6. [Scripts de Serviços Docker](#-scripts-de-serviços-docker)
7. [Scripts de Migração](#-scripts-de-migração)
8. [Cenários de Uso Comuns](#-cenários-de-uso-comuns)
9. [Solução de Problemas](#-solução-de-problemas)

---

## 🚀 Scripts de Desenvolvimento

### `npm run dev`

**Uso:** Desenvolvimento padrão

```bash
npm run dev
```

**O que faz:**

- Define `NODE_ENV=development`
- Inicia containers Docker
- Aguarda banco de dados ficar disponível
- Executa migrações pendentes
- Inicia servidor Next.js

**Quando usar:** Desenvolvimento normal do dia a dia

---

### `npm run dev:safe`

**Uso:** Desenvolvimento com verificações extras

```bash
npm run dev:safe
```

**O que faz:**

- Todas as etapas do `dev`
- Verifica se a porta 3000 está livre
- Usa script personalizado de inicialização
- Mais seguro contra conflitos de porta

**Quando usar:** Quando há problemas de porta ou conflitos

---

### `npm run dev:clean`

**Uso:** Desenvolvimento com ambiente limpo

```bash
npm run dev:clean
```

**O que faz:**

- Para e remove todos os containers
- Executa o script `dev` normalmente
- Garante um ambiente totalmente limpo

**Quando usar:**

- Após problemas com banco de dados
- Quando há dados inconsistentes
- Para "resetar" o ambiente

---

### `npm run dev:isolated`

**Uso:** Desenvolvimento isolado (SEM testes automáticos)

```bash
npm run dev:isolated
```

**O que faz:**

- Configura variáveis que impedem testes automáticos
- Sequência controlada de inicialização
- Limpeza automática ao parar (Ctrl+C)
- Máxima proteção contra interferências

**Quando usar:**

- **RECOMENDADO** para desenvolvimento
- Quando você teve problemas com testes automáticos
- Para garantir ambiente isolado

---

### `npm run neodev`

**Uso:** Script alternativo de desenvolvimento

```bash
npm run neodev
```

**O que faz:**

- Executa `handle-dev-services.js`
- Gerenciamento personalizado de serviços
- Limpeza automática de processos

**Quando usar:** Script legado, prefira `dev:isolated`

---

## 🧪 Scripts de Teste

### ⚠️ **IMPORTANTE:** Proteção Contra Execução Automática

Todos os scripts de teste agora têm proteções para **NÃO** executar automaticamente durante desenvolvimento.

### `npm run test:frontend`

**Uso:** Testes de componentes React

```bash
npm run test:frontend
```

**O que faz:**

- Executa apenas testes frontend
- Usa ambiente jsdom
- Não afeta banco de dados

**Quando usar:** Testar componentes, hooks, páginas

---

### `npm run test`

**Uso:** Todos os testes (integração + frontend)

```bash
npm run test
```

**O que faz:**

- Inicia serviços necessários
- Executa servidor Next.js
- Roda todos os testes
- Para serviços automaticamente

**Quando usar:**

- Antes de fazer commit
- Validar funcionalidades completas
- CI/CD

---

### `npm run test:all`

**Uso:** Alias para `test`

```bash
npm run test:all
```

**O que faz:** Idêntico ao `test`

---

### `npm run test:watch`

**Uso:** Testes em modo watch (desenvolvimento de testes)

```bash
npm run test:watch
```

**O que faz:**

- Executa testes automaticamente quando arquivos mudam
- **Protegido:** só executa quando explicitamente chamado

**Quando usar:**

- Desenvolvendo novos testes
- Debugando testes específicos

---

### `npm run test:verbose`

**Uso:** Testes com logs detalhados

```bash
npm run test:verbose
```

**O que faz:**

- Ativa `TEST_VERBOSE=true`
- Mostra logs detalhados de execução

**Quando usar:** Debugar problemas em testes

---

## 🗄️ Scripts de Banco de Dados

### `npm run db:validate`

**Uso:** Validar conexão e estrutura do banco

```bash
npm run db:validate
```

**O que faz:**

- Verifica conexão com PostgreSQL
- Valida estrutura das tabelas
- Reporta problemas encontrados

**Quando usar:** Diagnosticar problemas de banco

---

### `npm run db:test`

**Uso:** Testar conexão básica

```bash
npm run db:test
```

**O que faz:**

- Testa conexão simples com banco
- Não modifica dados

**Quando usar:** Verificar se banco está acessível

---

### `npm run db:seed:terapeutas`

**Uso:** Popular tabela de terapeutas com dados de teste

```bash
npm run db:seed:terapeutas
```

**O que faz:**

- Insere dados fictícios de terapeutas
- Útil para desenvolvimento

**Quando usar:** Precisar de dados de teste

---

### `npm run db:seed:all`

**Uso:** Popular todas as tabelas com dados de teste

```bash
npm run db:seed:all
```

**O que faz:**

- Executa todos os scripts de seed
- Cria ambiente completo de desenvolvimento

**Quando usar:** Setup inicial de desenvolvimento

---

## 🏗️ Scripts de Build e Deploy

### `npm run build`

**Uso:** Build de produção

```bash
npm run build
```

**O que faz:**

- Compila aplicação Next.js
- Otimiza para produção
- Executa `postbuild` automaticamente

**Quando usar:** Deploy para produção

---

### `postbuild` (automático)

**Uso:** Executado automaticamente após `build`
**O que faz:**

- Executa migrações em produção
- Apenas se `NODE_ENV` não for development/test

---

## 🔍 Scripts de Qualidade de Código

### `npm run lint:prettier:check`

**Uso:** Verificar formatação

```bash
npm run lint:prettier:check
```

**O que faz:**

- Verifica se código está formatado corretamente
- Não modifica arquivos

**Quando usar:** CI/CD, verificação antes de commit

---

### `npm run lint:prettier:fix`

**Uso:** Corrigir formatação

```bash
npm run lint:prettier:fix
```

**O que faz:**

- Formata automaticamente o código
- Corrige problemas de estilo

**Quando usar:** Antes de commit, limpeza de código

---

### `npm run lint:eslint:check`

**Uso:** Verificar qualidade do código

```bash
npm run lint:eslint:check
```

**O que faz:**

- Analisa código TypeScript/JavaScript
- Identifica problemas de qualidade

**Quando usar:** Revisão de código, CI/CD

---

## 🐳 Scripts de Serviços Docker

### `npm run services:up`

**Uso:** Iniciar containers

```bash
npm run services:up
```

**O que faz:**

- Inicia PostgreSQL via Docker Compose
- Executa em background (-d)

**Quando usar:** Antes de iniciar desenvolvimento

---

### `npm run services:stop`

**Uso:** Parar containers (sem remover)

```bash
npm run services:stop
```

**O que faz:**

- Para containers sem removê-los
- Dados são preservados

**Quando usar:** Pausa temporária

---

### `npm run services:down`

**Uso:** Parar e remover containers

```bash
npm run services:down
```

**O que faz:**

- Para e remove containers
- Remove networks criadas
- **Não remove volumes** (dados preservados)

**Quando usar:** Limpeza completa, reset de ambiente

---

### `npm run services:wait:database`

**Uso:** Aguardar banco ficar disponível

```bash
npm run services:wait:database
```

**O que faz:**

- Tenta conectar no PostgreSQL
- Aguarda até conexão ser estabelecida
- Timeout configurável

**Quando usar:** Automação, scripts que dependem do banco

---

## 📊 Scripts de Migração

### `npm run migrations:up`

**Uso:** Executar migrações pendentes

```bash
npm run migrations:up
```

**O que faz:**

- Executa migrações não aplicadas
- Cria/atualiza estrutura do banco
- Cria usuário admin padrão

**Quando usar:**

- Após pull de código com novas migrações
- Setup inicial

---

### `npm run migrations:create`

**Uso:** Criar nova migração

```bash
npm run migrations:create nome_da_migracao
```

**O que faz:**

- Cria arquivo de migração timestamped
- Template pronto para edição

**Quando usar:** Modificar estrutura do banco

---

### `npm run migrations:down`

**Uso:** Reverter última migração

```bash
npm run migrations:down
```

**O que faz:**

- Reverte a migração mais recente
- **CUIDADO:** pode perder dados

**Quando usar:** Corrigir migração com problema

---

### `npm run migrations:down:all`

**Uso:** Reverter TODAS as migrações

```bash
npm run migrations:down:all
```

**O que faz:**

- Remove toda estrutura do banco
- **PERDA TOTAL DE DADOS**

**Quando usar:** ⚠️ **APENAS EM DESENVOLVIMENTO** para reset completo

---

### Scripts de Migração Remota (Produção/Staging)

#### `npm run migrations:reset:production`

⚠️ **EXTREMAMENTE PERIGOSO**

```bash
npm run migrations:reset:production
```

**Quando usar:** **NUNCA** sem confirmação explícita

#### `npm run migrations:reset:staging`

⚠️ **PERIGOSO**

```bash
npm run migrations:reset:staging
```

**Quando usar:** Reset de ambiente de staging

---

## 🎯 Cenários de Uso Comuns

### 🌅 **Início do Dia de Desenvolvimento**

```bash
# Opção 1: Desenvolvimento isolado (RECOMENDADO)
npm run dev:isolated

# Opção 2: Desenvolvimento normal
npm run dev

# Opção 3: Se houve problemas ontem
npm run dev:clean
```

### 🧪 **Desenvolvendo Funcionalidade Nova**

```bash
# 1. Iniciar desenvolvimento
npm run dev:isolated

# 2. Se precisar de dados de teste
npm run db:seed:all

# 3. Criar migração se necessário
npm run migrations:create add_nova_coluna

# 4. Aplicar migração
npm run migrations:up
```

### 🔍 **Testando Código**

```bash
# Testes de componentes apenas
npm run test:frontend

# Todos os testes (antes de commit)
npm run test

# Desenvolvimento de testes
npm run test:watch
```

### 🚀 **Preparando Deploy**

```bash
# 1. Verificar qualidade
npm run lint:eslint:check
npm run lint:prettier:fix

# 2. Executar todos os testes
npm run test

# 3. Build de produção
npm run build
```

### 🔧 **Problemas e Limpeza**

```bash
# Problema com banco
npm run services:down
npm run dev:clean

# Reset completo de desenvolvimento
npm run services:down
npm run migrations:down:all
npm run migrations:up
npm run db:seed:all
npm run dev:isolated
```

### 📊 **Trabalhando com Banco**

```bash
# Verificar status do banco
npm run db:validate

# Aplicar novas migrações
npm run migrations:up

# Popular com dados de teste
npm run db:seed:all

# Reverter migração problemática
npm run migrations:down
```

---

## 🆘 Solução de Problemas

### **Problema: Testes Executando Automaticamente**

**Sintoma:** Logs com criação automática de usuários, múltiplas chamadas API
**Solução:**

```bash
# Parar todos os processos Node
taskkill /f /im node.exe

# Usar desenvolvimento isolado
npm run dev:isolated
```

### **Problema: Porta 3000 Ocupada**

**Sintoma:** `Error: listen EADDRINUSE :::3000`
**Solução:**

```bash
# Opção 1: Usar dev:safe
npm run dev:safe

# Opção 2: Matar processo na porta 3000
netstat -ano | findstr :3000
taskkill /PID [número_do_pid] /F
```

### **Problema: Banco Não Conecta**

**Sintoma:** Erro de conexão PostgreSQL
**Solução:**

```bash
# 1. Verificar se Docker está rodando
docker ps

# 2. Reiniciar serviços
npm run services:down
npm run services:up
npm run services:wait:database

# 3. Verificar conexão
npm run db:test
```

### **Problema: Migrações Falhando**

**Sintoma:** Erro ao executar migrações
**Solução:**

```bash
# 1. Verificar status do banco
npm run db:validate

# 2. Se necessário, reset (CUIDADO!)
npm run migrations:down:all
npm run migrations:up

# 3. Recriar dados de teste
npm run db:seed:all
```

### **Problema: Dependências Desatualizadas**

**Sintoma:** Erros estranhos, pacotes não encontrados
**Solução:**

```bash
# 1. Limpar cache npm
npm cache clean --force

# 2. Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# 3. Reiniciar desenvolvimento
npm run dev:isolated
```

---

## 📋 Resumo de Comandos por Frequência

### **Uso Diário**

- `npm run dev:isolated` - Desenvolvimento seguro
- `npm run test:frontend` - Testar componentes
- `npm run lint:prettier:fix` - Formatar código

### **Uso Semanal**

- `npm run test` - Todos os testes
- `npm run db:seed:all` - Dados de teste
- `npm run dev:clean` - Limpeza ambiente

### **Uso Ocasional**

- `npm run migrations:create` - Nova migração
- `npm run build` - Build produção
- `npm run services:down` - Reset containers

### **Emergência/Debug**

- `npm run db:validate` - Diagnóstico banco
- `npm run test:verbose` - Debug testes
- `npm run migrations:down` - Reverter migração

---

## 🏷️ Tags Rápidas

**🟢 Seguro para usar sempre:**

- `dev:isolated`
- `test:frontend`
- `lint:prettier:fix`
- `db:validate`

**🟡 Usar com cuidado:**

- `dev:clean`
- `migrations:down`
- `services:down`

**🔴 Perigoso (dev apenas):**

- `migrations:down:all`
- `migrations:reset:*`

---

_Última atualização: 23 de Junho de 2025_
_Versão: 1.0_
