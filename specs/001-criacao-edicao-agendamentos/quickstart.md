# Quickstart: Criação e edição de agendamentos

## 1) Pré-requisitos

- Dependências instaladas (`npm install`)
- Ambiente de teste configurado (`.env.test`)
- Docker disponível para Postgres de desenvolvimento/teste

## 2) Rodar validação focada de agendamentos

```bash
npx jest --runInBand --verbose tests/integration/api/v1/agendamentos/put.test.js
```

```bash
npx jest --runInBand --verbose tests/integration/api/v1/agendamentos/get.test.js
```

Critério de sucesso:

- suites passam sem falha
- pendência conhecida de 403 no GET permanece como `skip` documentado em T034

## 3) Rodar regressão padrão do projeto

```bash
npm run test
```

Critério de sucesso:

- nenhuma regressão nas rotas `/api/v1/agendamentos/**`

## 4) Verificação manual recomendada (UI)

No modal de edição de agendamento:

- marcar `Sessão Realizada` e salvar
- desmarcar `Sessão Realizada` e salvar
- repetir para `Falta / desmarcação com menos de 24h`

Resultado esperado:

- valor persistido no retorno da API
- valor refletido após refresh da agenda
- comportamento coerente para agendamentos recorrentes quando edição em massa estiver ativa
