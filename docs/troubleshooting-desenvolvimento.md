# Troubleshooting - Problemas de Desenvolvimento

## Problema: Loop infinito após "Starting..." no Next.js

### Sintomas

- O comando `npm run dev:isolated` fica travado após mostrar "Starting..."
- Erro `EPERM: operation not permitted, open '.next\trace'`
- Next.js não consegue iniciar adequadamente

### Causa

Este problema é comum no Windows quando:

1. O arquivo `.next/trace` fica com permissões bloqueadas
2. Processos anteriores do Next.js deixaram arquivos "travados"
3. Antivírus interfere com os arquivos temporários

### Solução Rápida

1. **Limpar permissões e cache:**

   ```bash
   npm run dev:fix-permissions
   ```

2. **Usar modo seguro:**

   ```bash
   npm run dev:isolated:safe
   ```

3. **Se ainda não funcionar, modo manual:**

   ```bash
   # Parar todos os serviços
   npm run services:down

   # Limpar permissões
   npm run dev:fix-permissions

   # Iniciar novamente
   npm run dev:isolated
   ```

### Solução Avançada (Administrador)

Se os comandos acima não funcionarem, execute como administrador:

1. Abra PowerShell como administrador
2. Navegue até o projeto
3. Execute:
   ```powershell
   takeown /f ".next" /r /d y
   icacls ".next" /grant %USERNAME%:F /t
   rmdir /s /q ".next"
   ```

### Prevenção

1. **Sempre use os scripts seguros:**

   - `npm run dev:isolated:safe` em vez de `npm run dev:isolated`
   - `npm run dev:safe` em vez de `npm run dev`

2. **Configure o antivírus:**

   - Adicione exclusão para a pasta `.next`
   - Adicione exclusão para a pasta `node_modules`

3. **Feche adequadamente:**
   - Sempre use Ctrl+C para parar o servidor
   - Evite fechar a janela do terminal diretamente

### Scripts Disponíveis

| Script                        | Descrição                         |
| ----------------------------- | --------------------------------- |
| `npm run dev:isolated`        | Modo isolado padrão               |
| `npm run dev:isolated:safe`   | Modo isolado com limpeza prévia   |
| `npm run dev:fix-permissions` | Corrige permissões do .next       |
| `npm run dev:safe`            | Modo development com verificações |

### Logs Úteis

Quando reportar problemas, inclua:

- Saída completa do comando que falhou
- Sistema operacional e versão
- Se executou como administrador
- Antivírus em uso

### Problemas Conhecidos

1. **Windows Defender Real-time Protection**

   - Pode bloquear arquivos temporários
   - Solução: Adicionar exclusões

2. **WSL vs Native Windows**

   - Scripts otimizados para Windows nativo
   - Para WSL, usar comandos Linux padrão

3. **Múltiplas instâncias**
   - Verificar se não há outros Next.js rodando
   - Usar `npm run dev:fix-permissions` para limpar

### Contato

Se o problema persistir, documente:

- Sistema operacional
- Versão do Node.js (`node --version`)
- Saída completa do erro
- Passos já tentados
