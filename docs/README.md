# 📚 Documentação do Projeto - Espaço Dialógico

Esta pasta contém toda a documentação técnica do projeto. Cada arquivo serve a um propósito específico.

## 📋 Índice de Documentos

### 🚀 [Scripts - Guia Completo](./scripts-guia-completo.md)

**Documentação completa e detalhada de todos os scripts do projeto.**

**O que contém:**

- Explicação detalhada de cada script
- Parâmetros e funcionamento interno
- Cenários de uso específicos
- Solução de problemas comuns
- Fluxos de trabalho recomendados

**Quando usar:** Para entender profundamente qualquer script ou resolver problemas complexos.

---

### ⚡ [Scripts - Referência Rápida](./scripts-referencia-rapida.md)

**Guia rápido de consulta para uso diário.**

**O que contém:**

- Tabelas resumidas com comandos essenciais
- Fluxos de trabalho mais comuns
- Códigos de emergência para problemas frequentes
- Formato otimizado para consulta rápida

**Quando usar:** No dia a dia para consultar rapidamente qual comando usar.

---

### 🔍 [Solução: Problema com Testes Automáticos](./solucao-testes-automaticos.md)

**Documentação específica sobre o problema resolvido em 23/06/2025.**

**O que contém:**

- Descrição detalhada do problema enfrentado
- Análise da causa raiz (testes executando automaticamente)
- Soluções implementadas passo a passo
- Proteções adicionadas ao projeto
- Prevenção de problemas futuros

**Quando usar:**

- Se o problema retornar
- Para entender as proteções implementadas
- Como referência para problemas similares

---

### 📊 [Dashboard Interativo](./dashboard-interativo.md)

_Documentação sobre melhorias no dashboard (arquivo existente)_

### 🔄 [Melhorias em Agendamentos Recorrentes](./melhorias-agendamentos-recorrentes.md)

_Documentação sobre sistema de agendamentos (arquivo existente)_

### 🛠️ [MCP Server](./mcp-server.md)

_Documentação sobre Model Context Protocol Server (arquivo existente)_

### 🔧 [Correção Agendamentos Recorrentes](./correcao-agendamentos-recorrentes.md)

_Documentação sobre correções específicas (arquivo existente)_

### ⚡ [Otimização Agendamentos Staging](./otimizacao-agendamentos-staging.md)

_Documentação sobre otimizações de performance (arquivo existente)_

---

## 🎯 Como Navegar na Documentação

### Para Desenvolvedores Novos no Projeto

1. **Começar com:** [Scripts - Referência Rápida](./scripts-referencia-rapida.md)
2. **Aprofundar em:** [Scripts - Guia Completo](./scripts-guia-completo.md)
3. **Se surgir o problema específico:** [Solução: Problema com Testes Automáticos](./solucao-testes-automaticos.md)

### Para Desenvolvedores Experientes

- **Consulta rápida:** [Scripts - Referência Rápida](./scripts-referencia-rapida.md)
- **Troubleshooting:** [Scripts - Guia Completo](./scripts-guia-completo.md) → Seção "Solução de Problemas"

### Para Resolução de Problemas

1. **Problema com scripts:** [Scripts - Guia Completo](./scripts-guia-completo.md) → "Solução de Problemas"
2. **Testes executando sozinhos:** [Solução: Problema com Testes Automáticos](./solucao-testes-automaticos.md)
3. **Consulta rápida:** [Scripts - Referência Rápida](./scripts-referencia-rapida.md) → "Códigos de Emergência"

---

## 🔄 Status de Atualização

| Documento                   | Última Atualização | Status        |
| --------------------------- | ------------------ | ------------- |
| Scripts - Guia Completo     | 23/06/2025         | ✅ Atualizado |
| Scripts - Referência Rápida | 23/06/2025         | ✅ Atualizado |
| Solução: Testes Automáticos | 23/06/2025         | ✅ Atualizado |
| Dashboard Interativo        | -                  | 📄 Existente  |
| Melhorias Agendamentos      | -                  | 📄 Existente  |
| MCP Server                  | -                  | 📄 Existente  |
| Correção Agendamentos       | -                  | 📄 Existente  |
| Otimização Staging          | -                  | 📄 Existente  |

---

## 📝 Convenções da Documentação

### Política de Migrations (Sem Rollback)

- Toda nova migration em `infra/migrations/` deve usar o formato CommonJS do `node-pg-migrate`.
- Para criar migration nova, usar sempre o script do projeto: `npm run migrations:create <nome-da-migration>`.
- Este projeto adota rollback desabilitado: **sempre use `exports.down = false`**.
- Não implementar função de rollback em migrations (`exports.down = (pgm) => { ... }` é proibido neste repositório).

### Símbolos Utilizados

- 🚀 **Scripts de Desenvolvimento**
- 🧪 **Scripts de Teste**
- 🗄️ **Scripts de Banco de Dados**
- 🐳 **Scripts Docker**
- 🔍 **Diagnóstico/Debug**
- ✅ **Seguro para usar**
- ⚠️ **Usar com cuidado**
- 🔴 **Perigoso**

### Códigos de Prioridade

- **🟢 Verde:** Comandos seguros para uso diário
- **🟡 Amarelo:** Comandos que requerem atenção
- **🔴 Vermelho:** Comandos perigosos (apenas desenvolvimento)

### Formato de Comandos

```bash
# Comando simples
npm run comando

# Comando com explicação
npm run comando  # O que faz
```

---

## 🤝 Contribuindo com a Documentação

### Para Adicionar Nova Documentação

1. Criar arquivo `.md` na pasta `docs/`
2. Seguir padrões de formatação existentes
3. Atualizar este README
4. Usar símbolos e códigos de prioridade consistentes

### Para Atualizar Documentação Existente

1. Modificar o arquivo específico
2. Atualizar tabela de status neste README
3. Manter histórico de mudanças quando relevante

---

_Documentação mantida pela equipe de desenvolvimento_
_Última atualização geral: 23 de Junho de 2025_
