# Configuração e Uso do MCP Server

Este documento explica como configurar e usar o Model Context Protocol (MCP) Server no projeto Espaço Dialógico.

## O que é MCP Server?

O Model Context Protocol (MCP) permite que modelos de IA (como o GitHub Copilot) acessem contextos adicionais durante o desenvolvimento, como repositórios GitHub, bases de conhecimento, documentação, etc.

## Requisitos

- Docker instalado e funcionando
- Um GitHub Personal Access Token com permissões apropriadas

## Como usar

1. **Inicie o VS Code** e abra o projeto

2. **Inicie o MCP Server**:

   - Pressione `Ctrl+Shift+P` para abrir a paleta de comandos
   - Digite e selecione `MCP: Start Server`
   - Selecione o servidor `github` na lista
   - Quando solicitado, insira seu GitHub Personal Access Token

3. **Use o GitHub Copilot**:

   - Com o MCP Server rodando, o GitHub Copilot terá acesso a contexto adicional
   - Você pode fazer perguntas sobre o código do projeto e obter respostas mais precisas

4. **Para parar o servidor**:
   - Pressione `Ctrl+Shift+P`
   - Digite e selecione `MCP: Stop Server`

## Configuração do Token

O token GitHub é solicitado toda vez que o servidor é iniciado. Para maior segurança:

- Não armazene o token diretamente no código
- Use um token com o mínimo de permissões necessárias
- Revogue e atualize o token periodicamente

## Resolução de Problemas

Se você encontrar problemas ao usar o MCP Server:

1. Verifique se o Docker está em execução
2. Certifique-se de que o token GitHub é válido e tem as permissões corretas
3. Verifique as saídas de console para mensagens de erro
4. Reinicie o VS Code e tente novamente
