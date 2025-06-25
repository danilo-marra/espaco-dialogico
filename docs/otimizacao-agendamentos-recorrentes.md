# Otimização de Agendamentos Recorrentes

## Problema Identificado

No ambiente de homologação (staging) da Vercel, a criação de agendamentos recorrentes estava causando timeout após 55 segundos. A análise dos logs mostrou que:

1. **Agendamentos eram criados com sucesso** em ~4 segundos
2. **O timeout ocorria na criação das sessões** (processo sequencial)
3. **35 agendamentos = 35 chamadas individuais ao banco** para criar sessões

## Otimizações Implementadas

### 1. **CRIAÇÃO** de Agendamentos Recorrentes (POST)

#### Criação de Sessões em Lote (Batch)

- **Novo método `createBatch`** no modelo `sessao.js`
- **Inserção única** para todas as sessões em ambiente de staging/produção
- **Fallback automático** para criação individual em caso de erro

#### Timeout Diferenciado por Ambiente

- **Desenvolvimento:** 55 segundos (mantido)
- **Staging:** 30 segundos (otimizado)
- **Produção:** 45 segundos (conservativo)

#### Processamento em Chunks

- **Lotes de 10 sessões** para evitar queries muito grandes
- **Transações menores** reduzem chance de deadlock
- **Logs de progresso** para monitoramento

### 2. **EDIÇÃO** de Agendamentos Recorrentes (PUT)

#### Atualização de Sessões Otimizada

- **Novo método `atualizarSessoesDeAgendamentosOtimizado`**
- **Processamento em paralelo** usando `Promise.all`
- **Chunks de 10 atualizações** para evitar sobrecarga
- **Fallback automático** para método individual em caso de erro

#### Monitoramento Detalhado

- **Tempo de execução** separado para agendamentos e sessões
- **Contadores precisos** de itens atualizados
- **Logs específicos** para staging/produção vs desenvolvimento

### 3. Melhor Logging e Monitoramento

- **Tempo de execução** de cada etapa
- **Contadores precisos** de sessões criadas/atualizadas
- **Logs específicos** para staging/produção vs desenvolvimento

## Estrutura dos Métodos Otimizados

### CRIAÇÃO - Método Original (Desenvolvimento)

```javascript
for (const agendamento of agendamentos) {
  await sessao.create(sessaoData); // 35 queries individuais
}
```

### CRIAÇÃO - Método Otimizado (Staging/Produção)

```javascript
// Preparar dados
const sessoesData = agendamentos.map(/* ... */);

// Criar em lote
sessoesCreated = await sessao.createBatch(sessoesData); // 1-4 queries em batch
```

### EDIÇÃO - Método Original (Desenvolvimento)

```javascript
for (const agendamento of agendamentos) {
  const sessoes = await sessao.getFiltered({ agendamento_id: agendamento.id });
  for (const sessao of sessoes) {
    await sessao.update(sessao.id, updateData); // N queries sequenciais
  }
}
```

### EDIÇÃO - Método Otimizado (Staging/Produção)

```javascript
// Coletar todas as sessões
const sessoesParaAtualizar = [];
// ... coleta dados ...

// Processar em chunks paralelos
const updatePromises = chunk.map(({ id, updateData }) =>
  sessao.update(id, updateData),
);
await Promise.all(updatePromises); // Atualizações em paralelo
```

## Resultados Esperados

### CRIAÇÃO - Antes da Otimização

- ❌ **Timeout:** 55+ segundos
- ❌ **35 queries individuais** para sessões
- ❌ **Falha total** em caso de erro

### CRIAÇÃO - Após a Otimização

- ✅ **Tempo estimado:** 5-10 segundos total
- ✅ **3-4 queries em lote** para sessões
- ✅ **Fallback automático** em caso de erro
- ✅ **Timeout adequado** por ambiente

### EDIÇÃO - Antes da Otimização

- ❌ **Loops aninhados sequenciais**
- ❌ **N × M queries individuais** (N agendamentos × M sessões cada)
- ❌ **Risco de timeout** em recorrências grandes

### EDIÇÃO - Após a Otimização

- ✅ **Processamento em paralelo**
- ✅ **Chunks de 10 atualizações** por vez
- ✅ **Fallback automático** para método individual
- ✅ **Logs detalhados** de progresso

## Monitoramento

### Logs de Sucesso - CRIAÇÃO

```
🏭 Usando método otimizado para ambiente de staging/produção
Agendamentos criados em 4218ms
🔄 Criando sessões para os agendamentos recorrentes...
🏭 Usando criação otimizada de sessões para staging/produção
🚀 BATCH: Inserindo 10 sessões (1-10/35)...
🚀 BATCH: Inserindo 10 sessões (11-20/35)...
🚀 BATCH: Inserindo 10 sessões (21-30/35)...
🚀 BATCH: Inserindo 5 sessões (31-35/35)...
✅ BATCH: 35 sessões criadas com sucesso
✅ 35 sessões criadas com sucesso para os agendamentos recorrentes em 1250ms
```

### Logs de Sucesso - EDIÇÃO

```
Iniciando atualização de agendamentos recorrentes. Recurrence ID: [uuid]
Atualizando agendamentos recorrentes sem alterar dia da semana
Agendamentos atualizados em 2150ms
🔄 Atualizando sessões dos agendamentos recorrentes...
🏭 Usando atualização otimizada de sessões para staging/produção
🚀 BATCH: Atualizando 35 sessões em lote...
🚀 BATCH: Atualizando sessões 1-10/35...
🚀 BATCH: Atualizando sessões 11-20/35...
🚀 BATCH: Atualizando sessões 21-30/35...
🚀 BATCH: Atualizando sessões 31-35/35...
✅ BATCH: 35 sessões atualizadas com sucesso
✅ 35 sessões atualizadas em 980ms
Processo total concluído em 3130ms
```

### Logs de Fallback

```
⚠️ Erro na criação em lote, tentando método individual: [erro]
✅ 35 sessões criadas com sucesso para os agendamentos recorrentes em 8500ms

⚠️ Erro ao atualizar chunk de sessões: [erro]
✅ BATCH: 35 sessões atualizadas com sucesso
```

## Compatibilidade

- ✅ **Desenvolvimento:** Mantém comportamento original
- ✅ **Staging:** Usa métodos otimizados
- ✅ **Produção:** Usa métodos otimizados
- ✅ **Fallback:** Funciona em caso de erro nos métodos otimizados

## Arquivos Modificados

1. `pages/api/v1/agendamentos/recurrences/[id]/index.js`

   - **POST (Criação):** Detecção de ambiente, criação de sessões otimizada, timeout diferenciado, fallback automático
   - **PUT (Edição):** Atualização de sessões otimizada, logs detalhados, processamento em paralelo
   - **DELETE:** Mantém método original (já eficiente)

2. `models/sessao.js`
   - Novo método `createBatch`
   - Processamento em chunks
   - Tratamento de erros melhorado

## Aplicação das Otimizações

| Operação                             | Desenvolvimento | Staging          | Produção         |
| ------------------------------------ | --------------- | ---------------- | ---------------- |
| **Criar Agendamentos Recorrentes**   | ✅ Individual   | ✅ **Otimizado** | ✅ **Otimizado** |
| **Editar Agendamentos Recorrentes**  | ✅ Individual   | ✅ **Otimizado** | ✅ **Otimizado** |
| **Excluir Agendamentos Recorrentes** | ✅ Individual   | ✅ Individual    | ✅ Individual    |

## Testes Recomendados

1. **Desenvolvimento:** Verificar que funciona como antes
2. **Staging:**
   - Testar criação de 35 agendamentos recorrentes
   - Testar edição de 35 agendamentos recorrentes (alterar valor, tipo, status)
   - Testar edição com mudança de dia da semana
3. **Monitoramento:** Verificar logs e tempos de execução
4. **Fallback:** Simular erro no batch para testar fallback automático
