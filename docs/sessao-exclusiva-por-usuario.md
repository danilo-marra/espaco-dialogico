# Sistema de Sessão Exclusiva por Usuário

**Data de implementação:** 10 de julho de 2025

## Visão Geral

O sistema foi atualizado para permitir **apenas uma sessão ativa por usuário**. Isso significa que quando um usuário faz login em um novo dispositivo, todas as sessões anteriores desse usuário são automaticamente invalidadas.

## Comportamento Implementado

### Antes (Multi-Sessão)

- Usuário logava no celular → Sessão A criada
- Usuário logava no desktop → Sessão B criada
- **Ambas as sessões permaneciam ativas**

### Agora (Sessão Exclusiva)

- Usuário logava no celular → Sessão A criada
- Usuário logava no desktop → **Sessão A invalidada**, Sessão B criada
- **Apenas a sessão mais recente permanece ativa**

## Fluxo Técnico

### 1. No Login (`/api/v1/auth/login`)

```javascript
// 1. Validar credenciais
// 2. INVALIDAR todas as sessões anteriores do usuário
await userSession.deleteAllByUserId(userFound.id);
// 3. Criar nova sessão exclusiva
const newSession = await userSession.create(userFound.id);
```

### 2. Experiência do Usuário

- **Dispositivo A**: Usuário estava logado
- **Dispositivo B**: Usuário faz novo login
- **Dispositivo A**: Na próxima requisição, recebe erro 401 (sessão invalidada)
- **Frontend**: Automaticamente redireciona para tela de login

## Vantagens de Segurança

1. **Proteção contra uso não autorizado**: Se alguém roubou as credenciais, o login do usuário legítimo automaticamente invalida a sessão do atacante.

2. **Controle de acesso**: Impossível ter múltiplas sessões simultâneas do mesmo usuário.

3. **Auditoria simplificada**: Sempre há apenas uma sessão ativa por usuário para monitorar.

## Endpoints Disponíveis

### Para Usuários

- `POST /api/v1/auth/login` - Login (invalida sessões anteriores automaticamente)
- `POST /api/v1/auth/logout` - Logout da sessão atual
- `POST /api/v1/auth/logout-all` - Logout de todas as sessões (redundante, mas mantido para compatibilidade)

### Para Administradores

- `GET /api/v1/admin/sessions` - Listar todas as sessões ativas
- `POST /api/v1/admin/sessions` - Forçar logout de usuário específico

## Alterações nos Arquivos

### Modificados:

- `pages/api/v1/auth/login.js` - Adicionada invalidação de sessões anteriores
- `models/userSession.js` - Adicionada função `deleteAllByUserId()`
- `pages/api/v1/auth/logout-all.js` - Atualizado para usar novo modelo
- `pages/api/v1/admin/sessions.js` - Atualizado para usar novo modelo

### Novos:

- `hooks/useAuth.ts` - Adicionada função `logoutAll()` para o frontend

## Monitoramento

O sistema agora garante que na tabela `user_sessions`:

- Cada `user_id` terá **no máximo 1 registro ativo** por vez
- Sessões antigas são automaticamente removidas no novo login

## Testando o Comportamento

1. Faça login no dispositivo A
2. Faça login no dispositivo B com as mesmas credenciais
3. Tente acessar uma API protegida no dispositivo A
4. **Resultado esperado**: Dispositivo A recebe erro 401 e é redirecionado para login

Esta implementação aumenta significativamente a segurança do sistema, garantindo que apenas uma sessão por usuário esteja ativa a qualquer momento.
