# Indicador de Aniversário no Calendário

## Funcionalidade Implementada

Adicionamos um indicador discreto de aniversário no calendário para sinalizar quando o dia de um agendamento coincide com o aniversário do paciente.

### Como Funciona

- **Ícone Visual**: Um ícone de bolo 🎂 (rosa) aparece ao lado do nome do paciente quando o agendamento é no dia do aniversário
- **Tooltip Informativo**: Ao passar o mouse sobre o ícone, é exibida a informação "Aniversário - X anos"
- **Posicionamento Discreto**: O ícone aparece ao lado do nome do paciente sem ocupar muito espaço

### Onde Aparece

O indicador de aniversário é exibido em todos os componentes de visualização da agenda:

1. **Agenda Semanal** (`AgendaSemanal.tsx`)
2. **Agenda Mensal** (`AgendaMensal.tsx`)
3. **Agenda Por Terapeuta** (`AgendaPorTerapeuta.tsx`)
4. **Agenda Sem Sala** (`AgendaSemSala.tsx`)
5. **Agenda Período Personalizado** (`AgendaPeriodoPersonalizado.tsx`)

### Arquivos Criados/Modificados

#### Novos Arquivos:

- `utils/birthdayUtils.ts` - Funções utilitárias para verificar aniversários
- `components/common/BirthdayIndicator.tsx` - Componente do indicador de aniversário

#### Arquivos Modificados:

- Todos os componentes de agenda foram atualizados para incluir o indicador

### Funcionalidades das Utilidades

**`utils/birthdayUtils.ts`:**

- `isBirthday(birthDate, targetDate)` - Verifica se uma data é aniversário
- `calculateAge(birthDate, targetDate)` - Calcula a idade em uma data específica

**`components/common/BirthdayIndicator.tsx`:**

- Componente reutilizável que exibe o ícone de aniversário
- Inclui tooltip com a idade
- Totalmente customizável (tamanho, classe CSS)

### Uso

A funcionalidade é automática. Quando:

1. Um paciente tem `dt_nascimento` definida
2. Um agendamento acontece no mesmo dia e mês do nascimento
3. O ícone de aniversário aparece automaticamente

### Exemplos de Uso

```tsx
// O indicador aparece automaticamente nos componentes de agenda
{
  agendamento.pacienteInfo?.dt_nascimento &&
    isBirthday(
      agendamento.pacienteInfo.dt_nascimento,
      agendamento.dataAgendamento,
    ) && (
      <BirthdayIndicator
        birthDate={agendamento.pacienteInfo.dt_nascimento}
        targetDate={agendamento.dataAgendamento}
        size={14}
      />
    );
}
```

### Benefícios

- **Experiência do Usuário**: Ajuda os profissionais a lembrarem de datas especiais
- **Discreto**: Não interfere na visualização geral do calendário
- **Informativo**: Mostra a idade que o paciente está completando
- **Consistente**: Aparece em todas as visualizações de agenda

### Requisitos de Dados

Para que o indicador funcione, é necessário que:

- O paciente tenha a data de nascimento (`dt_nascimento`) cadastrada
- A data deve estar em um formato válido (Date, string ISO, ou YYYY-MM-DD)
