# Atualização de Segurança: Gerenciamento de Sessão Stateful

**Data:** 10 de julho de 2025

## Visão Geral

Esta atualização implementa um sistema de gerenciamento de sessão stateful (com estado) para aprimorar a segurança da autenticação de usuários. Anteriormente, o sistema dependia exclusivamente de JSON Web Tokens (JWTs) stateless, o que apresentava um risco de segurança significativo: um token comprometido permaneceria válido até sua expiração, sem um mecanismo para revogação imediata.

Com esta refatoração, as sessões de usuário agora são gerenciadas e validadas contra um registro no banco de dados (`user_sessions`), permitindo a invalidação em tempo real e um controle mais robusto sobre as sessões ativas.

## Problema Abordado

A autenticação baseada puramente em JWTs stateless, embora eficiente, não oferece um mecanismo intrínseco para revogar tokens emitidos antes de sua expiração natural. Isso significa que, se um JWT fosse roubado ou comprometido, um atacante poderia utilizá-lo para manter acesso não autorizado ao sistema até que o token expirasse, sem que o servidor pudesse intervir.

## Solução Implementada

Para mitigar esse risco, o sistema foi refatorado para utilizar um modelo de sessão stateful, onde cada sessão ativa é registrada na tabela `user_sessions` do banco de dados. O JWT agora contém apenas um identificador de sessão único, que é validado contra o registro no banco de dados a cada requisição protegida.

### Principais Alterações

- **`models/userSession.js` (Novo)**: Criado um novo modelo para gerenciar as operações CRUD (Criar, Ler, Atualizar, Deletar) na tabela `user_sessions`. Este modelo é responsável por gerar tokens de sessão seguros, armazenar seus hashes no banco de dados e verificar sua validade.

- **`pages/api/v1/auth/login.js` (Modificado)**: Após a autenticação bem-sucedida do usuário, este endpoint agora cria uma nova entrada na tabela `user_sessions` e gera um JWT que contém apenas o ID da sessão (e não mais os dados completos do usuário). O token de sessão é hasheado antes de ser armazenado no banco de dados para maior segurança.

- **`utils/auth.js` (Modificado)**: A função `generateToken` foi generalizada para aceitar um payload arbitrário, permitindo que ela crie JWTs contendo apenas o ID da sessão.

- **`utils/authMiddleware.js` (Modificado)**: Este middleware crucial foi atualizado para a nova lógica de validação de sessão. Ele agora:

  1.  Decodifica o JWT para extrair o ID da sessão.
  2.  Consulta a tabela `user_sessions` para verificar a existência e validade da sessão.
  3.  Se a sessão for válida, busca os dados completos do usuário no banco de dados e os anexa ao objeto `request`.
  4.  Retorna um erro de autenticação (`401`) se a sessão for inválida, expirada ou não encontrada.

- **`pages/api/v1/auth/logout.js` (Novo)**: Criado um novo endpoint que permite aos usuários invalidar suas sessões ativas. Ao ser acionado, este endpoint remove a entrada correspondente da tabela `user_sessions`, tornando o JWT associado imediatamente inválido.

- **`utils/roleMiddleware.js` (Modificado)**: As funções de verificação de permissão (`requirePermission` e `withRolePermission`) foram ajustadas para depender do objeto `req.user` (populado pelo `authMiddleware`) para obter as informações de role do usuário, em vez de tentar decodificar o JWT por conta própria.

- **`pages/api/v1/terapeutas/index.js` e `pages/api/v1/dashboard/financeiro-otimizado.js` (Modificados)**: A aplicação dos middlewares nessas rotas foi ajustada para garantir que o `authMiddleware` seja executado antes do `roleMiddleware`, assegurando que `req.user` esteja devidamente populado para a verificação de permissões.

- **`pages/api/v1/test-protected.js` (Novo)**: Criada uma rota de teste simples e protegida para auxiliar na validação do fluxo de autenticação e autorização em ambientes de teste, sem interferir com rotas de saúde do serviço.

## Impacto na Segurança

Esta atualização melhora significativamente a segurança do sistema ao:

- **Permitir a invalidação imediata de sessões**: Em caso de comprometimento de um token, a sessão pode ser revogada instantaneamente, minimizando o tempo de exposição.
- **Centralizar o controle de sessão**: Todas as sessões ativas são gerenciadas no banco de dados, oferecendo maior visibilidade e controle.
- **Reduzir a superfície de ataque do JWT**: O JWT agora contém apenas um identificador de sessão, diminuindo a quantidade de informações sensíveis expostas caso o token seja interceptado.

## Verificação

Todas as alterações foram validadas através de uma suíte abrangente de testes de integração. Os testes foram atualizados e novos testes foram adicionados para cobrir os fluxos de login, logout e acesso a rotas protegidas com a nova lógica de sessão. Todos os testes foram executados com sucesso, garantindo a funcionalidade e a segurança da aplicação.
