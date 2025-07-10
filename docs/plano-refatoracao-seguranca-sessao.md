# Plano de Refatoração: Gerenciamento de Sessão Seguro

Este documento detalha o plano para refatorar o sistema de autenticação e gerenciamento de sessão, migrando de um modelo puramente stateless (JWT) para um modelo stateful, utilizando a tabela `user_sessions` para aumentar a segurança e o controle.

## Justificativa

Atualmente, o sistema utiliza JWTs stateless. Um JWT, uma vez assinado, é válido até sua expiração. Isso representa um risco de segurança: se um token for comprometido, um atacante pode usá-lo para acessar o sistema até que o token expire, e não há um mecanismo no servidor para revogá-lo imediatamente.

A solução é implementar um gerenciamento de sessão stateful, onde cada sessão de usuário ativa é registrada no banco de dados. Isso nos permite:

1.  **Invalidar sessões em tempo real** (ex: no logout ou se uma ameaça for detectada).
2.  **Monitorar sessões ativas**.
3.  **Limitar o número de sessões simultâneas** por usuário.

## Plano de Execução

O plano está dividido em três fases:

### Fase 1: Análise e Preparação

O objetivo desta fase é coletar todo o contexto necessário para a implementação, sem modificar o código.

1.  **Analisar Arquivos-Chave:** Ler o conteúdo dos seguintes arquivos para entender a implementação atual de autenticação, autorização e registro:

    - `utils/auth.js` (criação e verificação de JWT)
    - `utils/authMiddleware.js` (proteção de rotas)
    - `utils/roleMiddleware.js` (controle de acesso por perfil)
    - `pages/api/auth/login.tsx` (ou arquivo similar de endpoint de login)
    - `models/invite.js` (fluxo de registro de novos usuários)

2.  **Analisar Testes e CI/CD:** Revisar os arquivos de teste de integração e o workflow do GitHub Actions para entender como a validação é feita atualmente.
    - `tests/integration/**/*.js`
    - `.github/workflows/tests.yaml`
    - `infra/compose.yaml` (para o ambiente de teste local)

### Fase 2: Implementação

Nesta fase, as modificações de código serão realizadas.

1.  **Criar Modelo `UserSession`:** Implementar o arquivo `models/userSession.js` para abstrair as interações com a tabela `user_sessions`.

2.  **Modificar Lógica de Login:**

    - No endpoint de login, após a validação bem-sucedida das credenciais:
      - Gerar um token de sessão seguro e aleatório (ex: `crypto.randomBytes`).
      - Armazenar o **hash** deste token na tabela `user_sessions`, associado ao `user_id` e com uma data de expiração.
      - O JWT retornado ao cliente será modificado para conter apenas o **token de sessão puro**, em vez dos dados completos do usuário.

3.  **Atualizar `authMiddleware.js`:**

    - O middleware irá extrair o token de sessão do payload do JWT.
    - Buscará o hash do token na tabela `user_sessions`.
    - **Validações a serem feitas:**
      - A sessão existe no banco?
      - A sessão não está expirada?
    - Se a sessão for válida, o middleware buscará os dados do usuário (`users`) e os anexará ao objeto `req`. Caso contrário, rejeitará a requisição com um erro 401.

4.  **Implementar Lógica de Logout:**

    - Criar um novo endpoint: `pages/api/auth/logout.js`.
    - Este endpoint deverá usar o `authMiddleware` para identificar a sessão atual.
    - Remover o registro da sessão correspondente da tabela `user_sessions`. Isso invalidará o token imediatamente.

5.  **Analisar e Adaptar Sistema de Convites:**
    - Verificar se o fluxo em `models/invite.js` é impactado. A expectativa é que não haja necessidade de grandes mudanças, pois o convite precede a autenticação.

### Fase 3: Testes e Validação

O objetivo é garantir que a nova implementação é segura e não introduziu regressões.

1.  **Adaptar Testes de Integração:**

    - **Login:** Atualizar os testes para verificar se uma entrada é criada na tabela `user_sessions`.
    - **Rotas Protegidas:** Modificar os testes para usar o novo formato de JWT (com o token de sessão) e garantir que a validação contra o banco de dados funciona.
    - **Logout:** Criar novos testes para o endpoint de logout, verificando se a sessão é removida do banco de dados.

2.  **Executar Validação Local:**

    - Rodar toda a suíte de testes no ambiente local orquestrado pelo `infra/compose.yaml`.

3.  **Verificação Final (CI/CD):**
    - Submeter as alterações para que o workflow do GitHub Actions (`.github/workflows/tests.yaml`) execute a suíte de testes completa, validando a integração contínua.
