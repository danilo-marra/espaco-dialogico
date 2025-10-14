# Adição da Sala 321 ao Sistema

## Resumo

Foi adicionada uma nova sala chamada "Sala 321" ao sistema de agendamentos, além das salas Verde e Azul já existentes.

## Alterações Realizadas

### Backend

1. **Migration** - `infra/migrations/1760000000000_add-sala-321-to-agendamentos.js`

   - Criada migration para atualizar a constraint do banco de dados
   - Adiciona "Sala 321" aos valores permitidos para o campo `local_agendamento`
   - Permite rollback seguro removendo a Sala 321 se necessário

2. **Tipos TypeScript** - `tipos.ts`

   - Atualizado o tipo `Agendamento` para incluir "Sala 321" no `localAgendamento`

3. **Schema de Validação** - `components/Agendamento/agendamentoSchema.ts`

   - Atualizado o schema Zod para aceitar "Sala 321" como valor válido

4. **Scripts** - `infra/scripts/seed-agendamentos.js`
   - Atualizado script de seed para incluir "Sala 321" nos dados de teste

### Frontend

1. **Componentes de Formulário**

   - `components/Agendamento/NovoAgendamentoModal.tsx` - Adicionada "Sala 321" ao array de locais
   - `components/Agendamento/EditarAgendamentoModal.tsx` - Adicionada "Sala 321" ao array de locais

2. **Página de Agenda** - `pages/dashboard/agenda/index.tsx`

   - Adicionado estado `sala321` ao filtro de salas
   - Atualizada função `handleRoomChange` para incluir "sala321"
   - Adicionado filtro checkbox para Sala 321
   - Atualizada lógica de verificação de salas (`isSalaMatch` e `needsRoom`)
   - Adicionada estatística de ocupação da Sala 321
   - Adicionada cor roxa (purple) para representar a Sala 321 na legenda

3. **Componentes de Visualização**
   - `components/Agendamento/AgendaSemanal.tsx` - Adicionada cor roxa para Sala 321
   - `components/Agendamento/AgendaMensal.tsx` - Adicionada cor roxa para Sala 321
   - `components/Agendamento/AgendaPorTerapeuta.tsx` - Adicionada cor roxa para Sala 321
   - `components/Agendamento/AgendaPeriodoPersonalizado.tsx` - Adicionada cor roxa para Sala 321

## Cores Definidas

- **Sala Verde**: Verde (`bg-green-500` / `border-green-500` / `text-green-600`)
- **Sala Azul**: Azul (`bg-blue-500` / `border-blue-500` / `text-blue-600`)
- **Sala 321**: Roxo (`bg-purple-500` / `border-purple-500` / `text-purple-600`)
- **Não Precisa de Sala**: Amarelo (`bg-yellow-400`)

## Como Testar

1. Execute a migration: `npm run migrations:up`
2. Verifique a constraint no banco de dados:
   ```sql
   SELECT conname, pg_get_constraintdef(oid) as definition
   FROM pg_constraint
   WHERE conname = 'agendamentos_local_agendamento_check';
   ```
3. Acesse a página de agendamentos no sistema
4. Crie um novo agendamento selecionando "Sala 321" como local
5. Verifique se a Sala 321 aparece com a cor roxa nas visualizações de agenda
6. Teste o filtro de sala incluindo/excluindo a Sala 321

## Migração Executada

A migration foi executada com sucesso em: 14/10/2025
Resultado: ✓ 1760433506791_add-sala-321-to-agendamentos

## Impacto

- **Banco de Dados**: Constraint atualizada com sucesso
- **Frontend**: Todos os componentes de visualização atualizados
- **Validação**: Schema Zod atualizado para aceitar o novo valor
- **Filtros**: Novo filtro de Sala 321 disponível na interface
- **Estatísticas**: Contador de ocupação da Sala 321 adicionado

## Observações

- A Sala 321 utiliza a cor roxa para diferenciação visual
- Todos os filtros e visualizações foram atualizados para incluir a nova sala
- A migration permite rollback caso seja necessário remover a Sala 321
- Testes existentes continuam funcionando pois usam valores válidos (Sala Verde e Sala Azul)
