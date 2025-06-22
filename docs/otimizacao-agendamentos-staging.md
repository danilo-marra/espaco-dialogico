# Otimização de Agendamentos Recorrentes para Staging

## Problema Identificado

No ambiente de staging da Vercel com banco Neon, a criação de agendamentos recorrentes estava causando timeout (504) após 25 segundos, mesmo com apenas 10 agendamentos.

## Causa Raiz

O código original tinha vários gargalos de performance:

1. **Queries sequenciais individuais** - Cada agendamento era criado com uma query separada
2. **Validações redundantes** - FK de terapeuta e paciente verificados para cada agendamento
3. **Criação de sessões síncronas** - Sessões criadas individualmente após cada agendamento
4. **Logs excessivos** - `console.log` para cada agendamento processado
5. **Transações longas** - Múltiplas operações dentro de uma única transação

## Otimizações Implementadas

### 1. Inserção em Lote Otimizada

**Antes:**

```javascript
for (const agendamento of lote) {
  const novoAgendamento = await create(agendamento);
  // ... criar sessão ...
}
```

**Depois:**

```javascript
// Preparar TODOS os valores para uma única query
const placeholders = batch
  .map((_, index) => {
    const base = index * 11;
    return `($${base + 1}, $${base + 2}, ..., $${base + 11})`;
  })
  .join(", ");

const result = await database.query({
  text: `INSERT INTO agendamentos (...) VALUES ${placeholders} RETURNING *`,
  values: allValues,
});
```

### 2. Validações Únicas

**Antes:**

```javascript
// Para cada agendamento
const terapeutaExists = await database.query(...);
const pacienteExists = await database.query(...);
```

**Depois:**

```javascript
// Uma vez antes do loop
const [terapeutaExists, pacienteExists] = await Promise.all([
  database.query(...),
  database.query(...)
]);
```

### 3. Remoção de Criação de Sessões

Removida a criação automática de sessões durante a criação de agendamentos recorrentes para reduzir complexidade e tempo de processamento.

### 4. Logs Reduzidos

**Antes:**

```javascript
console.log(`Preparando agendamento para ${dataFormatada}`); // Para cada um
```

**Depois:**

```javascript
console.log(`🚀 Inserindo ${total} agendamentos em lote...`); // Uma vez
```

### 5. Método Especializado para Staging

Criado `createRecurrencesOptimizedForStaging()` que:

- Usa inserção única para todos os agendamentos (até 25)
- Reduz logs ao mínimo
- Otimizado para latência de rede do Neon

## Configurações Ajustadas

### Timeout da Vercel

```json
// vercel.json
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 60 // Aumentado de 30 para 60 segundos
    }
  }
}
```

### Timeout da API

```javascript
// Aumentado de 25s para 55s
export default withTimeout(router.handler(...), 55000);
```

### Detecção de Ambiente

```javascript
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const isStaging = process.env.VERCEL_ENV === 'preview';

if (isProduction || isStaging) {
  await agendamento.createRecurrencesOptimizedForStaging(...);
} else {
  await agendamento.createRecurrences(...);
}
```

## Resultados Esperados

- **Redução de 90% no tempo de execução** para cenários típicos
- **Redução de 95% no número de queries** para validações
- **Eliminação de timeout** em cenários de até 25 agendamentos
- **Melhor utilização de recursos** no Vercel

## Testes Disponíveis

1. **test-recurrence-performance.js** - Teste de performance local
2. **test-api-recurrence.js** - Teste da API completa
3. **API /api/test/recurrences/[id]** - Endpoint de teste sem autenticação

## Monitoramento

Logs específicos para acompanhar performance:

```
🚀 STAGING: Inserindo 10 agendamentos em uma única query...
✅ STAGING: 10 agendamentos criados com sucesso
```

## Limites de Segurança

- **Desenvolvimento**: Até 50 agendamentos por recorrência
- **Staging/Produção**: Até 25 agendamentos por recorrência
- **Timeout**: 55 segundos (com margem de 5s para o Vercel)

## Próximos Passos

1. Testar no ambiente de staging
2. Monitorar logs de performance
3. Ajustar limites se necessário
4. Aplicar otimizações similares em outras operações em lote
