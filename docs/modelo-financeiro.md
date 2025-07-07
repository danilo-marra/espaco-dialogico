# Modelo Financeiro - Espaço Dialógico

Este documento descreve o modelo financeiro integrado no sistema Espaço Dialógico.

## Estrutura

### Model: `models/financeiro.js`

O modelo financeiro centraliza toda a lógica de cálculo e agregação de dados financeiros do sistema.

### Funções Principais

#### `obterResumoFinanceiroPorPeriodo(periodo)`

- **Parâmetro**: `periodo` (string no formato "YYYY-MM")
- **Retorno**: Objeto com resumo financeiro do período
- **Descrição**: Agrega dados de sessões e transações para um período específico

#### `obterHistoricoFinanceiro()`

- **Retorno**: Array com dados dos últimos 6 meses
- **Descrição**: Retorna histórico financeiro para gráficos

#### `obterMetricasFinanceiras()`

- **Retorno**: Resumo financeiro do mês atual
- **Descrição**: Wrapper para obter dados do período atual

#### `obterComparativoMensal()`

- **Retorno**: Comparativo entre mês atual e anterior
- **Descrição**: Calcula variações percentuais

#### `obterResumoAnual(ano)`

- **Parâmetro**: `ano` (opcional, padrão: ano atual)
- **Retorno**: Resumo anual com dados mensais e totais
- **Descrição**: Agrega dados financeiros anuais

### Estrutura de Dados

```javascript
{
  periodo: "2024-01",
  receitaSessoes: 15000,      // Soma de sessões pagas
  repasseTerapeutas: 7500,    // Soma de repasses realizados
  entradasManuais: 2000,      // Transações tipo "entrada"
  saidasManuais: 500,         // Transações tipo "saida"
  totalEntradas: 17000,       // receitaSessoes + entradasManuais
  totalSaidas: 8000,          // repasseTerapeutas + saidasManuais
  saldoFinal: 9000,           // totalEntradas - totalSaidas
  quantidadeSessoes: 30       // Número de sessões pagas
}
```

## Lógica de Cálculo

### Receitas

- **Sessões**: Apenas sessões com `pagamentoRealizado = true`
- **Entradas manuais**: Transações do tipo "entrada"

### Despesas

- **Repasses**: Apenas sessões com `repasseRealizado = true`
- **Saídas manuais**: Transações do tipo "saida"

### Cálculo Automático de Repasses

Se `valorRepasse` não estiver definido na sessão, é calculado automaticamente:

- **< 12 meses**: 45% do valor da sessão
- **≥ 12 meses**: 50% do valor da sessão

Base: `dt_entrada` do terapeuta.

## Integração

### API Endpoint

- **URL**: `/api/v1/dashboard/financeiro`
- **Métodos**: GET
- **Parâmetros**:
  - `periodo`: "YYYY-MM" (opcional)
  - `historico`: "true" para últimos 6 meses

### Frontend

- **Hook**: `useDashboardFinanceiro(periodo?)`
- **Hook**: `useDashboardFinanceiroHistorico()`
- **Componente**: `DashboardCharts`

### Permissões

- Requer permissão `"sessoes"` para acesso

## Benefícios

1. **Centralização**: Toda lógica financeira em um só lugar
2. **Consistência**: Dados sempre calculados da mesma forma
3. **Reutilização**: Funções podem ser usadas em diferentes contextos
4. **Manutenibilidade**: Fácil de modificar e estender
5. **Testabilidade**: Lógica isolada e testável

## Próximos Passos

- Adicionar testes unitários para o modelo
- Implementar cache para consultas pesadas
- Adicionar mais métricas financeiras
- Criar relatórios financeiros detalhados
