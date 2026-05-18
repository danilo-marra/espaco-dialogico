# Feature Specification: Criação e edição de agendamentos

**Feature Branch**: `[001-criacao-edicao-agendamentos]`

**Created**: 2026-05-17

**Status**: Draft

**Input**: User description: "criação e edição de agendamentos. Verifique e valide os testes de integridade da api /agendamentos"

**Project Context Defaults**:

- Produto web de gestao clinica (pacientes, terapeutas, agendamentos, sessoes, financeiro)
- Perfis padrao: `admin`, `secretaria`, `terapeuta`
- Endpoints esperados em `pages/api/v1/**` com regras de negocio em `models/**`
- Testes esperados em `tests/integration/**` e/ou `tests/frontend/**`

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Criar novo agendamento (Priority: P1)

Usuário autorizado acessa o formulário de agendamento, preenche os dados obrigatórios e confirma a criação de um novo agendamento.

**Why this priority**: Criação de agendamento é o fluxo central do módulo, essencial para o funcionamento da agenda.

**Independent Test**: Pode ser testado criando um agendamento via API e verificando se ele aparece na listagem e no banco de dados.

**Acceptance Scenarios**:

1. **Given** usuário autenticado com permissão, **When** preenche e envia o formulário, **Then** agendamento é criado e listado corretamente.
2. **Given** campos obrigatórios não preenchidos, **When** tenta criar, **Then** recebe erro de validação.

---

### User Story 2 - Editar agendamento existente (Priority: P2)

Usuário autorizado acessa um agendamento já criado, altera informações permitidas e salva as mudanças.

**Why this priority**: Permite correção de dados e ajustes na agenda, reduzindo erros operacionais.

**Independent Test**: Pode ser testado alterando um agendamento via API e verificando se as mudanças persistem e são refletidas na listagem.

**Acceptance Scenarios**:

1. **Given** agendamento existente, **When** usuário edita e salva, **Then** alterações são persistidas.
2. **Given** usuário sem permissão, **When** tenta editar, **Then** recebe erro de autorização.

---

### User Story 3 - Testes de integridade da API /agendamentos (Priority: P3)

Executar e validar todos os testes automatizados de integração para os endpoints de criação e edição de agendamentos.

**Why this priority**: Garante que a API está íntegra e cobre casos de sucesso, erro e permissão.

**Independent Test**: Rodar `npm run test` e garantir que todos os testes de `/api/v1/agendamentos` passam sem falhas.

**Acceptance Scenarios**:

1. **Given** código atualizado, **When** executa os testes de integração, **Then** todos os testes de `/agendamentos` passam.
2. **Given** alteração que quebra regra de negócio, **When** executa testes, **Then** falha é detectada.

---

### User Story 4 - Consultar agendamentos em cenário padrão (Priority: P3)

Usuário autenticado com permissão acessa a listagem padrão de agendamentos sem filtros e recebe os registros existentes com estrutura de resposta consistente.

**Why this priority**: Garante cobertura do fluxo de leitura principal da API e reduz risco de regressão silenciosa no endpoint de listagem.

**Independent Test**: Pode ser testado com GET em `/api/v1/agendamentos/` após criação de dados válidos, validando status 200 e estrutura dos itens retornados.

**Acceptance Scenarios**:

1. **Given** usuário autenticado com permissão, **When** chama GET `/api/v1/agendamentos/` sem filtros, **Then** recebe 200 e lista contendo agendamentos válidos.
2. **Given** usuário sem autenticação, **When** chama GET `/api/v1/agendamentos/`, **Then** recebe 401.
3. **Given** usuário sem permissão no recurso, **When** chama GET `/api/v1/agendamentos/`, **Then** recebe 403.

---

## Functional Requirements

- FR-001: Permitir criação de agendamentos com todos os campos obrigatórios validados.
- FR-002: Permitir edição de agendamentos existentes, respeitando regras de permissão.
- FR-003: Retornar mensagens de erro claras para validação e autorização.
- FR-004: Garantir cobertura de testes automatizados para fluxos principais e de erro em criação/edição.
- FR-005: Permitir consulta padrão (GET) de agendamentos com autenticação/autorização e contrato estável.

## Success Criteria

- SC-001: Criação e edição retornam status esperados (201/200) em cenários válidos.
- SC-002: Cenários de validação inválida retornam status 400 ou 422 com mensagem de erro coerente.
- SC-003: Cenários de autenticação/autorização inválida retornam 401/403 conforme regra.
- SC-004: Testes de integração de agendamentos executam sem falha no comando padrão de testes do projeto.
- SC-005: Fluxo GET padrão de agendamentos é validado com resposta 200 e estrutura esperada para usuário autorizado.

## API Contract Checks (Objective)

- POST `/api/v1/agendamentos/`:
  - sucesso: 201
  - validação: 400 ou 422
  - sem autenticação: 401
- PUT `/api/v1/agendamentos/[id]/`:
  - sucesso: 200
  - sem permissão: 403
  - validação: 400 ou 422
- GET `/api/v1/agendamentos/`:
  - sucesso: 200 com array de objetos contendo ao menos `id`, `paciente_id`, `terapeuta_id`, `dataAgendamento`, `horarioAgendamento`
  - sem autenticação: 401
  - sem permissão: 403

## Key Entities

- Agendamento (campos: id, paciente_id, terapeuta_id, data, hora, status, local, observações)
- Usuário (roles: admin, secretaria, terapeuta)

## Assumptions

- Permissões seguem regras já implementadas no middleware do projeto.
- Campos obrigatórios e formatos seguem validação já existente no backend.
- Testes automatizados já cobrem os principais fluxos e erros conhecidos.
