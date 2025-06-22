# Correção dos Erros de Agendamentos Recorrentes

## Problema Identificado

O erro "ID do terapeuta é obrigatório" que ocorria durante a criação de agendamentos recorrentes foi diagnosticado e corrigido. O problema não estava relacionado à perda dos dados `terapeuta_id` durante o processamento, mas sim a dois problemas técnicos principais:

### 1. Erro de Formato UUID

- **Problema**: O banco de dados PostgreSQL espera campos `terapeuta_id` e `paciente_id` como UUIDs válidos
- **Causa**: IDs sendo enviados como strings simples (ex: "12345") em vez de UUIDs válidos
- **Sintoma**: Erro PostgreSQL "invalid input syntax for type uuid"
- **Solução**: Adicionada validação de formato UUID com mensagens claras de erro

### 2. Mascaramento de Erros

- **Problema**: Erros reais do banco de dados eram encobertos por validações prematuras
- **Causa**: Validação inicial capturava erros gerais e os convertia em "ID obrigatório"
- **Solução**: Melhorada a estrutura de validação para preservar contexto do erro original

## Correções Implementadas

### 1. Validação Aprimorada de UUIDs (`models/agendamento.js`)

```javascript
// Validar se os IDs são UUIDs válidos
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!uuidRegex.test(agendamentoData.terapeuta_id)) {
  throw new ValidationError({
    message:
      "ID do terapeuta deve ser um UUID válido. Verifique se o terapeuta foi selecionado corretamente.",
  });
}
```

### 2. Validação Robusta no Frontend (`NovoAgendamentoModal.tsx`)

```typescript
// Preparar objeto base de agendamento - usando estrutura mais explícita
const agendamentoBase = {
  paciente_id: String(data.paciente_id || ""),
  terapeuta_id: String(data.terapeuta_id || ""),
  // ... outros campos
};

// Verificar se terapeuta_id e paciente_id estão presentes
if (
  !agendamentoBase.terapeuta_id ||
  agendamentoBase.terapeuta_id.trim() === ""
) {
  toast.error("Erro: Selecione um terapeuta");
  setIsSubmitting(false);
  return;
}
```

### 3. Validação Preventiva na API (`pages/api/v1/agendamentos/recurrences/[id]/index.js`)

```javascript
// Verificar especificamente se terapeuta_id existe
if (!agendamentoBase.terapeuta_id) {
  return res.status(400).json({
    message: "terapeuta_id é obrigatório no agendamentoBase",
  });
}
```

### 4. Clonagem Explícita de Objetos (`models/agendamento.js`)

```javascript
// Criar uma cópia profunda e explícita do agendamentoBase
const agendamentoCompleto = {
  paciente_id: agendamentoBase.paciente_id,
  terapeuta_id: agendamentoBase.terapeuta_id,
  dataAgendamento: dataFormatada,
  // ... outros campos explicitamente copiados
  recurrenceId: recurrenceId,
};
```

## Mensagens de Erro Melhoradas

### Antes:

- "ID do terapeuta é obrigatório" (genérico, não indicava o problema real)

### Depois:

- "ID do terapeuta deve ser um UUID válido. Verifique se o terapeuta foi selecionado corretamente."
- "ID do paciente deve ser um UUID válido. Verifique se o paciente foi selecionado corretamente."
- "Terapeuta não encontrado" (quando UUID é válido mas não existe na base)
- "Paciente não encontrado" (quando UUID é válido mas não existe na base)

## Resultado

✅ **Eliminação do erro "ID do terapeuta é obrigatório"**
✅ **Validação adequada de formato UUID**
✅ **Mensagens de erro mais informativas**
✅ **Preservação de integridade dos dados durante processamento de recorrências**
✅ **Melhor experiência do usuário com feedback claro**

## Teste de Validação

O problema foi reproduzido e corrigido através de teste automatizado que confirmou:

- Dados chegam corretamente do frontend para o backend
- Validação de UUID funciona adequadamente
- Erro original era relacionado ao formato dos IDs, não à perda de dados
- Processamento de recorrências mantém integridade dos dados

## Próximos Passos

Para usar a funcionalidade corretamente, certifique-se de que:

1. Os formulários frontend sempre enviem UUIDs válidos
2. Os selects de terapeuta e paciente retornem IDs no formato UUID
3. Validações do Zod no `agendamentoSchema.ts` estão alinhadas com os requisitos UUID
