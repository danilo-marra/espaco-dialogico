# Sistema de Permissões por Role

Este documento descreve o sistema de permissões baseado em roles implementado no projeto Espaço Dialógico.

## Roles Disponíveis

### Admin

- **Descrição**: Usuário administrador com acesso completo ao sistema
- **Permissões**:
  - `agendamentos` - Gerenciar agendamentos
  - `pacientes` - Gerenciar pacientes
  - `sessoes` - Gerenciar sessões
  - `terapeutas` - Gerenciar terapeutas
  - `transacoes` - Gerenciar transações financeiras
  - `convites` - Gerenciar convites do sistema
  - `usuarios` - Gerenciar usuários
  - `perfil` - Gerenciar próprio perfil

### Terapeuta

- **Descrição**: Profissional terapeuta com acesso limitado
- **Permissões**:
  - `agendamentos` - Gerenciar agendamentos
  - `perfil` - Gerenciar próprio perfil

### Secretaria

- **Descrição**: Usuário da secretaria com acesso operacional
- **Permissões**:
  - `agendamentos` - Gerenciar agendamentos
  - `pacientes` - Gerenciar pacientes
  - `sessoes` - Gerenciar sessões
  - `terapeutas` - Gerenciar terapeutas
  - `transacoes` - Gerenciar transações financeiras
  - `perfil` - Gerenciar próprio perfil

## Como Funciona

### Backend - APIs

1. **Middleware de Permissões** (`utils/roleMiddleware.js`):

   - `requirePermission(resource)` - Middleware para proteger rotas de API
   - `withRolePermission(handler, resource)` - Wrapper para handlers
   - `hasPermission(userRole, resource)` - Função auxiliar para verificar permissões

2. **Uso nas APIs**:

```javascript
import { requirePermission } from "utils/roleMiddleware.js";

const router = createRouter();
router.use(requirePermission("pacientes")); // Só admins podem acessar
```

### Frontend - React

1. **Hook de Permissões** (`hooks/usePermissions.tsx`):

```tsx
const { hasPermission, userRole, canAccessRoute } = usePermissions();

// Verificar permissão
if (hasPermission("pacientes")) {
  // Renderizar conteúdo
}
```

2. **Componente PermissionGuard** (`components/PermissionGuard.tsx`):

```tsx
<PermissionGuard resource="pacientes">
  <div>Conteúdo apenas para quem pode gerenciar pacientes</div>
</PermissionGuard>
```

3. **Proteção de Rotas** (`components/RouteGuard.tsx`):
   - Automaticamente redireciona usuários sem permissão
   - Integrado no Layout principal

### Menu Dinâmico

O menu (`components/Menu.tsx`) agora mostra apenas as opções que o usuário tem permissão para acessar:

```tsx
{
  hasPermission("pacientes") && (
    <li>
      <Link href="/dashboard/pacientes">Pacientes</Link>
    </li>
  );
}
```

## Comportamento por Role

### Terapeuta (role: "terapeuta")

- **Dashboard**: Redirecionado automaticamente para `/dashboard/agenda`
- **Menu**: Mostra apenas "Home", "Agenda" e "Meu Perfil"
- **APIs**: Pode acessar apenas APIs de agendamentos e perfil

### Secretaria (role: "secretaria")

- **Dashboard**: Redirecionado automaticamente para `/dashboard/agenda`
- **Menu**: Mostra "Home", "Agenda", "Pacientes", "Sessões", "Terapeutas", "Transações" e "Meu Perfil"
- **APIs**: Pode acessar APIs de agendamentos, pacientes, sessões, terapeutas, transações e perfil

### Administrador (role: "admin")

- **Dashboard**: Acesso completo ao dashboard principal
- **Menu**: Mostra todas as opções disponíveis
- **APIs**: Acesso completo a todas as APIs

## Configuração e Customização

### Adicionando Nova Permissão

1. **Adicionar ao `ROLE_PERMISSIONS`** em `utils/roleMiddleware.js` e `hooks/usePermissions.tsx`:

```javascript
const ROLE_PERMISSIONS = {
  admin: [..., 'nova_permissao'],
  user: [...] // adicionar se necessário
};
```

2. **Adicionar ao `ROUTE_RESOURCE_MAP`**:

```javascript
const ROUTE_RESOURCE_MAP = {
  "/dashboard/nova-rota": "nova_permissao",
};
```

3. **Proteger a API**:

```javascript
router.use(requirePermission("nova_permissao"));
```

### Adicionando Novo Role

1. **Definir permissões** em ambos os arquivos:

```javascript
const ROLE_PERMISSIONS = {
  admin: [...],
  terapeuta: [...],
  secretaria: ['permissao1', 'permissao2'],
  novo_role: ['permissao1', 'permissao2']
};
```

2. **Atualizar migration** se necessário para adicionar o novo role ao banco

## Segurança

- **Token JWT**: Inclui o role do usuário
- **Verificação Backend**: Todas as APIs verificam permissões
- **Verificação Frontend**: Interface adaptada conforme permissões
- **Redirecionamento**: Usuários sem permissão são redirecionados automaticamente

## Exemplos de Uso

### Proteger uma seção de página:

```tsx
<PermissionGuard resource="transacoes">
  <TransactionChart />
</PermissionGuard>
```

### Verificar permissão condicionalmente:

```tsx
const { hasPermission } = usePermissions();

return (
  <div>
    {hasPermission("usuarios") && <AdminPanel />}
    <RegularContent />
  </div>
);
```

### Proteger uma API:

```javascript
import { requirePermission } from "utils/roleMiddleware.js";

const router = createRouter();
router.use(requirePermission("terapeutas"));
router.get(getAllTerapeutas);
router.post(createTerapeuta);
```

## Fluxo de Autenticação/Autorização

1. **Login**: Usuário faz login e recebe JWT com role
2. **Token Storage**: Role é armazenado no localStorage
3. **API Request**: Token enviado no header Authorization
4. **Backend Verification**: Middleware verifica token e permissões
5. **Frontend Adaptation**: Interface se adapta conforme permissões
6. **Route Protection**: Rotas protegidas por RouteGuard

Este sistema garante que terapeutas tenham acesso apenas ao gerenciamento de agendamentos, secretarias tenham acesso operacional amplo, e administradores mantenham controle total do sistema.
