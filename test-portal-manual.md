# Manual de Testes do Portal Web Grifo

## Configuração Atual
- **API**: http://localhost:3001
- **Portal**: http://localhost:8081
- **Status**: ✅ Ambos funcionando

## Testes Manuais Recomendados

### 1. Teste de Carregamento da Página
- [ ] Abrir http://localhost:8081 no navegador
- [ ] Verificar se a página carrega sem erros
- [ ] Verificar se o título "Portal Grifo" aparece
- [ ] Verificar se os estilos CSS estão aplicados corretamente

### 2. Teste de Interface de Login
- [ ] Verificar se o formulário de login está visível
- [ ] Verificar se os campos "Email" e "Senha" estão presentes
- [ ] Verificar se o botão "Entrar" está funcional
- [ ] Verificar se há validação de campos obrigatórios

### 3. Teste de Autenticação
- [ ] Tentar login com credenciais inválidas
- [ ] Verificar se mensagem de erro é exibida
- [ ] Tentar login com credenciais válidas (se disponível)
- [ ] Verificar redirecionamento após login bem-sucedido

### 4. Teste de Navegação
- [ ] Verificar se as abas de navegação funcionam:
  - [ ] Dashboard
  - [ ] Inspeções
  - [ ] Relatórios
  - [ ] Usuários
  - [ ] Configurações

### 5. Teste de Responsividade
- [ ] Testar em diferentes tamanhos de tela
- [ ] Verificar se o layout se adapta em dispositivos móveis
- [ ] Verificar se todos os elementos permanecem acessíveis

### 6. Teste de Conectividade com API
- [ ] Verificar se o portal consegue se comunicar com a API
- [ ] Testar endpoints principais:
  - [ ] /health (✅ Funcionando)
  - [ ] /auth/login
  - [ ] /dashboard
  - [ ] /inspections

### 7. Teste de Console do Navegador
- [ ] Abrir DevTools (F12)
- [ ] Verificar se há erros JavaScript no console
- [ ] Verificar se há erros de rede na aba Network
- [ ] Verificar se há avisos de segurança

## Resultados dos Testes Automatizados

### ✅ Testes Concluídos
1. **API Health Check**: ✅ Funcionando (Status 200)
2. **Portal Carregamento**: ✅ Funcionando (Status 200)
3. **Conectividade**: ✅ API e Portal comunicando

### ⚠️ Observações
1. **Firebase**: Configuração com erro de chave privada, mas servidor continua funcionando
2. **Playwright**: Problemas de instalação, testes manuais recomendados

## Próximos Passos
1. Executar testes manuais listados acima
2. Corrigir configuração do Firebase se necessário
3. Implementar testes automatizados quando Playwright estiver funcionando
4. Documentar resultados dos testes manuais

## Comandos Úteis
```bash
# Iniciar API
npm run dev:win

# Iniciar Portal (em outro terminal)
cd portal-web
python -m http.server 8081

# Testar API
node test-api-simple.js

# Verificar portas em uso
netstat -ano | findstr :300
```