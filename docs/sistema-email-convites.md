# Sistema de Envio de Email para Convites

Este documento descreve o sistema de envio de emails para convites implementado no Espaço Dialógico.

## Visão Geral

O sistema permite que administradores enviem convites por email diretamente da interface de gerenciamento de convites. Os emails incluem o código do convite, um link direto para registro e informações sobre a função atribuída.

## Componentes

### 1. Serviço de Email (`utils/emailService.js`)

Responsável pela configuração e envio de emails usando Nodemailer.

**Funcionalidades:**

- Configuração do transportador de email (Gmail por padrão)
- Template HTML responsivo para emails
- Função de envio com tratamento de erros
- Teste de configuração

**Funções principais:**

- `sendInviteEmail(inviteData, senderName)` - Envia email com convite
- `testEmailConfiguration()` - Testa se a configuração está válida
- `createInviteEmailTemplate()` - Gera o HTML do email

### 2. API Endpoints

#### `POST /api/v1/invites/send-email`

Envia email para um convite específico.

**Parâmetros:**

```json
{
  "inviteId": "id-do-convite"
}
```

**Resposta de sucesso:**

```json
{
  "message": "Email enviado com sucesso",
  "sentTo": "usuario@email.com",
  "inviteCode": "ABC123XYZ",
  "messageId": "message-id-do-email"
}
```

#### `GET /api/v1/email/test`

Testa a configuração de email.

**Resposta:**

```json
{
  "success": true,
  "message": "Configuração de email válida",
  "status": "OK"
}
```

### 3. Interface do Usuário

**Localização:** `pages/dashboard/convites/index.tsx`

**Funcionalidades adicionadas:**

- Botão de envio de email na tabela de convites
- Estado de loading durante envio
- Mensagens de sucesso/erro
- Validação se convite possui email

## Configuração

### 1. Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```bash
# Email Configuration
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app-do-gmail
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Configuração do Gmail

1. Acesse [Google Account Security](https://myaccount.google.com/security)
2. Ative a "Verificação em duas etapas"
3. Vá em "Senhas de app"
4. Selecione "Email" e "Outro (nome personalizado)"
5. Digite "Espaço Dialógico"
6. Use a senha gerada (16 caracteres) no `EMAIL_PASSWORD`

### 3. Outros Provedores

Para usar outros provedores além do Gmail, modifique a função `createEmailTransporter()` em `utils/emailService.js`:

```javascript
// Exemplo para Outlook
const transporter = nodemailer.createTransporter({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

## Recursos do Template de Email

### Design Responsivo

- Layout que funciona em desktop e mobile
- CSS inline para compatibilidade máxima
- Cores da marca da aplicação

### Informações Incluídas

- Código do convite (destacado)
- Função atribuída (Terapeuta, Secretaria, Administrador)
- Link direto para registro
- Data de expiração
- Nome do remetente
- Instruções de uso

### Elementos Visuais

- Logo da empresa
- Badges coloridos para funções
- Botão call-to-action destacado
- Avisos de expiração
- Footer informativo

## Rastreamento

### Banco de Dados

A tabela `invites` foi estendida com:

- `last_email_sent` - Timestamp do último envio

### Logs

Todos os envios são registrados no console com:

- ID da mensagem
- Email destinatário
- Código do convite
- Status do envio

## Segurança

### Autorização

- Apenas administradores podem enviar emails
- Validação de token JWT
- Verificação de permissões via middleware

### Validações

- Convite deve existir e não estar usado
- Convite não pode estar expirado
- Convite deve ter email associado
- Sanitização de dados antes do envio

## Tratamento de Erros

### Frontend

- Loading states durante envio
- Mensagens de sucesso/erro com toast
- Validação de email presente no convite
- Retry automático (opcional)

### Backend

- Logs detalhados de erros
- Mensagens de erro padronizadas
- Códigos HTTP apropriados
- Fallback para falhas de email

## Exemplo de Uso

1. **Criar Convite**

   ```javascript
   // Na página de convites, criar um novo convite com email
   const novoConvite = {
     email: "usuario@exemplo.com",
     role: "terapeuta",
     expiresInDays: 7,
   };
   ```

2. **Enviar Email**

   ```javascript
   // Clicar no botão de email na tabela
   sendInviteEmail(conviteId, conviteEmail);
   ```

3. **Verificar Envio**
   ```javascript
   // Check logs ou usar endpoint de teste
   GET / api / v1 / email / test;
   ```

## Troubleshooting

### Email não é enviado

1. Verificar variáveis de ambiente
2. Testar configuração: `GET /api/v1/email/test`
3. Verificar logs do servidor
4. Confirmar senha de app do Gmail

### Template não carrega corretamente

1. Verificar `NEXT_PUBLIC_BASE_URL`
2. Confirmar que o link de convite está correto
3. Testar em diferentes clientes de email

### Permissões negadas

1. Verificar se usuário é administrador
2. Confirmar token JWT válido
3. Verificar middleware de autorização

## Roadmap

### Funcionalidades Futuras

- [ ] Templates personalizáveis
- [ ] Agendamento de envio
- [ ] Estatísticas de abertura/clique
- [ ] Integração com outros provedores
- [ ] Envio em lote
- [ ] Histórico de emails enviados

### Melhorias Técnicas

- [ ] Queue system para envios em massa
- [ ] Retry automático com backoff
- [ ] Compressão de templates
- [ ] Cache de configurações
- [ ] Metrics e monitoring
