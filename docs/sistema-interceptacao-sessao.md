# Sistema de Interceptação de Sessão - Documentação

## Visão Geral

Este sistema implementa a interceptação automática de respostas HTTP para detectar quando uma sessão de usuário foi invalidada no servidor (erro 401) e redirecionar automaticamente para a página de login.

## Problema Resolvido

- **Antes**: Usuários com tokens em cache continuavam usando a aplicação normalmente, mas recebiam múltiplos erros 401 sem saber o motivo
- **Depois**: Quando a sessão é invalidada no servidor, o usuário é automaticamente redirecionado para login com uma mensagem clara

## Componentes do Sistema

### 1. `authenticatedFetch` (utils/authenticatedFetch.ts)

Substituto para o `fetch` nativo que:

- Adiciona automaticamente o token de autenticação
- Intercepta respostas 401 e força logout
- Redireciona para login quando necessário

```typescript
import { authenticatedFetch } from "utils/authenticatedFetch";

// Uso básico
const response = await authenticatedFetch("/api/v1/users");

// Com opções
const response = await authenticatedFetch("/api/v1/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(userData),
});

// Pular verificação de auth (para endpoints públicos)
const response = await authenticatedFetch("/api/v1/status", {
  skipAuthCheck: true,
});
```

### 2. `useApi` (hooks/useApi.ts)

Hook para requisições HTTP com estado gerenciado:

```typescript
import useApi from "hooks/useApi";

const MyComponent = () => {
  const { loading, error, data, execute } = useApi({
    onSuccess: (data) => console.log("Sucesso:", data),
    onError: (error) => console.error("Erro:", error),
  });

  const handleClick = async () => {
    try {
      await execute("/api/v1/users", { method: "GET" });
    } catch (error) {
      // Tratar erro se necessário
    }
  };

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {error && <p>Erro: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={handleClick}>Carregar dados</button>
    </div>
  );
};
```

### 3. `AuthProvider` (components/AuthProvider.tsx)

Provider que verifica periodicamente a validade da sessão:

```typescript
// Já incluído no _app.tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### 4. `SessionCheck` (components/SessionCheck.tsx)

Componente para verificar sessão antes de renderizar conteúdo:

```typescript
import SessionCheck from "components/SessionCheck";

const ProtectedPage = () => {
  return (
    <SessionCheck>
      <div>Conteúdo protegido aqui</div>
    </SessionCheck>
  );
};
```

## Migração de Código Existente

### Substituir `fetch` por `authenticatedFetch`

```typescript
// Antes
const response = await fetch("/api/v1/users", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Depois
const response = await authenticatedFetch("/api/v1/users");
```

### Substituir `axios` por `authenticatedFetch`

```typescript
// Antes
const response = await axiosInstance.get("/api/v1/users");
const data = response.data;

// Depois
const response = await authenticatedFetch("/api/v1/users");
const data = await response.json();
```

## Comportamento do Sistema

### Cenários de Invalidação de Sessão

1. **Token Version Mismatch**: Quando o usuário faz login em outro dispositivo
2. **Sessão Expirada**: Quando a sessão expira naturalmente
3. **Logout Forçado**: Quando um admin invalida a sessão do usuário
4. **Deploy/Restart**: Quando o servidor é reiniciado e as sessões são perdidas

### Fluxo de Interceptação

1. Requisição feita com `authenticatedFetch`
2. Servidor retorna 401
3. Sistema detecta erro 401 específico
4. Remove token do localStorage
5. Mostra toast de erro
6. Redireciona para `/login`

### Mensagens de Erro Interceptadas

- "Sessão inválida. Por favor, faça login novamente."
- "Token de autenticação não fornecido"
- "Token inválido ou malformado"
- "Não autorizado"

## Vantagens

- **Experiência do Usuário**: Redirecionamento automático sem confusão
- **Segurança**: Limpeza automática de tokens inválidos
- **Manutenibilidade**: Lógica centralizada de autenticação
- **Robustez**: Tratamento consistente de erros de autenticação

## Configuração Adicional

### Verificação Periódica

O sistema verifica a validade da sessão a cada 30 segundos quando:

- Usuário está logado
- Não está na página de login
- Aplicação está ativa

### Customização

Para customizar o comportamento, edite:

- `utils/authenticatedFetch.ts`: Lógica de interceptação
- `components/AuthProvider.tsx`: Frequência de verificação
- `hooks/useAuth.ts`: Comportamento de logout

## Testes

Para testar o sistema:

1. **Simular Token Inválido**: Modificar token no localStorage
2. **Simular Sessão Expirada**: Incrementar token_version no banco
3. **Simular Login em Outro Dispositivo**: Fazer login duplo
4. **Verificar Redirecionamento**: Confirmar redirect para /login

## Notas Importantes

- O sistema não interfere em requisições com `skipAuthCheck: true`
- Páginas públicas não são afetadas
- O sistema funciona tanto para SPAs quanto para páginas server-side
- Compatível com Next.js e React Router
