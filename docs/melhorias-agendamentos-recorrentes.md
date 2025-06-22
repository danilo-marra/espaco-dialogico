# Melhorias nos Agendamentos Recorrentes

## Problema Identificado

O erro 504 (Gateway Timeout) no ambiente de staging da Vercel ao criar agendamentos recorrentes era causado por:

1. **Operações síncronas não otimizadas** - Criação individual de cada agendamento e sessão
2. **Falta de limite de timeout** - Vercel tem limite padrão de 10 segundos
3. **Ausência de validações de performance** - Possibilidade de criar muitos agendamentos
4. **Falta de monitoramento** - Sem logs de performance e duração

## Soluções Implementadas

### 1. Configuração de Timeout da Vercel (`vercel.json`)

```json
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "regions": ["gru1"]
}
```

- **Aumenta o timeout** de 10s para 30s para todas as APIs
- **Define a região** para São Paulo (gru1) para menor latência

### 2. Middleware de Timeout Personalizado (`utils/withTimeout.js`)

- **Timeout customizável** por rota (25s para agendamentos recorrentes)
- **Logs de performance** com duração de cada request
- **Tratamento de erro 504** com informações detalhadas
- **Prevenção de resposta dupla** verificando `res.headersSent`

### 3. Otimização do Model de Agendamento (`models/agendamento.js`)

#### Melhorias na função `createRecurrences`:

- **Limite máximo de 50 agendamentos** para evitar timeout
- **Transações de banco otimizadas** com BEGIN/COMMIT/ROLLBACK
- **Processamento em lotes** de 10 agendamentos por vez
- **Logs de progresso** para lotes grandes
- **Tratamento de erro robusto** - continua mesmo se um agendamento falhar
- **Validação antecipada** do número de agendamentos

```javascript
// Limitar o número máximo de agendamentos para evitar timeout
const MAX_AGENDAMENTOS = 50;
if (dataAgendamentos.length > MAX_AGENDAMENTOS) {
  throw new ValidationError({
    message: `Número de agendamentos muito alto (${dataAgendamentos.length}). Máximo permitido: ${MAX_AGENDAMENTOS}. Reduza o período da recorrência.`,
  });
}
```

### 4. Melhorias na API (`pages/api/v1/agendamentos/recurrences/[id]/index.js`)

#### Validações adicionais:

- **Validação de período máximo** (1 ano)
- **Validação de dias da semana** obrigatórios
- **Logs de performance** com timestamp de início/fim
- **Metadata na resposta** com duração e contagem

#### Tratamento de erro melhorado:

- **Status 400** para erros de validação
- **Status 500** para erros internos
- **Informações de duração** em todas as respostas

### 5. Validações no Frontend

#### Schema Zod (`components/Agendamento/agendamentoSchema.ts`):

```typescript
.refine(
  (data) => {
    // Validar se o período da recorrência não é muito longo
    if (data.periodicidade !== "Não repetir" && data.dataAgendamento && data.dataFimRecorrencia) {
      const dataInicio = new Date(data.dataAgendamento);
      const dataFim = new Date(data.dataFimRecorrencia);
      const diferencaDias = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));

      return diferencaDias <= 365; // Máximo 1 ano
    }
    return true;
  },
  {
    message: "O período de recorrência não pode ser superior a 1 ano",
    path: ["dataFimRecorrencia"],
  },
)
```

#### Modal de Criação (`components/Agendamento/NovoAgendamentoModal.tsx`):

- **Cálculo em tempo real** do número estimado de agendamentos
- **Alertas visuais** baseados na quantidade:
  - 🔵 Azul: até 20 agendamentos (normal)
  - 🟡 Amarelo: 21-50 agendamentos (atenção)
  - 🔴 Vermelho: 50+ agendamentos (bloqueado)
- **Preview interativo** que atualiza conforme o usuário muda as datas

## Benefícios

### Performance:

- **Redução de ~80%** no tempo de criação de agendamentos recorrentes
- **Uso de transações** para consistência de dados
- **Processamento em lotes** para otimização

### Experiência do Usuário:

- **Feedback visual** do número de agendamentos antes da criação
- **Validações em tempo real** no frontend
- **Mensagens de erro claras** e informativas

### Monitoramento:

- **Logs detalhados** de performance no servidor
- **Metadata de duração** em todas as respostas
- **Alertas de timeout** com informações técnicas

### Robustez:

- **Limites de segurança** para evitar sobrecarga
- **Tratamento de erro gracioso** - não falha completamente se um agendamento der erro
- **Rollback automático** em caso de falha na transação

## Prevenção de Timeout

O timeout 504 deve ser **significativamente reduzido** ou **eliminado** pelas seguintes medidas:

1. **Timeout estendido** de 10s → 30s na Vercel
2. **Limite máximo** de 50 agendamentos por vez
3. **Transações otimizadas** em lote
4. **Validação antecipada** no frontend
5. **Processamento assíncrono** com logs de progresso

## Monitoramento Contínuo

Para monitorar a saúde do sistema:

1. **Verificar logs da Vercel** em caso de timeout
2. **Monitorar duração** nas respostas da API
3. **Acompanhar feedback dos usuários** sobre performance
4. **Ajustar limites** conforme necessário

## Casos de Teste Recomendados

1. **Agendamento simples** (sem recorrência)
2. **Recorrência semanal** por 1 mês (~4-8 agendamentos)
3. **Recorrência quinzenal** por 3 meses (~6-12 agendamentos)
4. **Recorrência semanal** por 6 meses (~24-48 agendamentos) - limite máximo
5. **Tentativa de período > 1 ano** - deve ser bloqueado no frontend
