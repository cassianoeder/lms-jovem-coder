# Guia de Configuração Inicial do Sistema

Este guia explica como configurar o sistema pela primeira vez quando o banco de dados Supabase não está configurado.

## Funcionamento Automático

O sistema detecta automaticamente se o banco de dados está configurado:

1. **Verificação Automática**: Ao acessar a aplicação, o sistema verifica:
   - Se as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão configuradas
   - Se as tabelas do banco de dados existem

2. **Redirecionamento para Setup**: Se o banco não estiver configurado, o usuário é automaticamente redirecionado para a página de setup.

## Processo de Setup

### Passo 1: Configuração da Conexão

1. Acesse o **Supabase Dashboard** (https://supabase.com/dashboard)
2. Selecione seu projeto ou crie um novo
3. Vá em **Settings → API**
4. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave pública)

5. Na página de setup, insira:
   - URL do Supabase
   - Chave pública (anon key)
6. Clique em **"Testar Conexão"**

### Passo 2: Executar Migrações SQL

Após testar a conexão, você precisará executar as migrações SQL:

1. No **Supabase Dashboard**, vá em **SQL Editor**
2. Clique em **New Query**
3. Abra o arquivo `scripts/consolidate-migrations.sql` do projeto
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

**Importante**: Aguarde a execução completa do script. Isso pode levar alguns segundos.

### Passo 3: Criar Usuário Administrador

Após executar as migrações:

1. Volte para a página de setup
2. Preencha os dados do administrador:
   - **Nome Completo**: Nome do primeiro administrador
   - **E-mail**: E-mail que será usado para login
   - **Senha**: Senha segura para a conta admin
3. Clique em **"Finalizar Configuração"**

O sistema irá:
- Verificar se as tabelas foram criadas
- Criar a conta do administrador
- Configurar as permissões de admin
- Redirecionar para a página de login

## Configuração Manual (Alternativa)

Se preferir configurar manualmente sem usar a interface de setup:

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui
```

### 2. Executar Migrações

Execute o script `scripts/consolidate-migrations.sql` no SQL Editor do Supabase.

### 3. Criar Usuário Admin

No Supabase Dashboard:
1. Vá em **Authentication → Users**
2. Clique em **Add User → Create new user**
3. Preencha:
   - Email: email do admin
   - Password: senha do admin
   - User Metadata: `{"full_name": "Nome do Admin", "role": "admin"}`
4. Após criar, vá em **SQL Editor** e execute:

```sql
-- Substitua 'email-do-admin@exemplo.com' pelo email usado acima
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'email-do-admin@exemplo.com';

-- Criar role de admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'email-do-admin@exemplo.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## Estrutura do Banco de Dados

O script de migração cria as seguintes tabelas principais:

- **profiles**: Perfis de usuários
- **user_roles**: Roles e permissões
- **classes**: Turmas/Classes
- **courses**: Cursos
- **modules**: Módulos dos cursos
- **lessons**: Aulas
- **exercises**: Exercícios
- **student_progress**: Progresso dos estudantes
- **certificates**: Certificados emitidos
- **certificate_templates**: Modelos de certificados
- E outras tabelas auxiliares...

## Verificação Pós-Setup

Após o setup, você pode verificar se tudo está funcionando:

1. Faça login com a conta de administrador criada
2. Acesse o dashboard do professor/admin
3. Verifique se consegue:
   - Criar cursos
   - Criar módulos
   - Criar aulas
   - Criar exercícios

## Solução de Problemas

### Erro: "Tabelas não encontradas"
- Certifique-se de que executou o script `consolidate-migrations.sql` completamente
- Verifique se há erros no SQL Editor do Supabase

### Erro: "Erro ao criar usuário"
- Verifique se o email não está em uso
- Certifique-se de que a senha atende aos requisitos (mínimo 6 caracteres no Supabase)

### Erro: "Permissão negada"
- Verifique se as políticas RLS foram criadas corretamente
- Execute novamente o script de migrações

### Setup não aparece
- Limpe o cache do navegador
- Verifique se as variáveis de ambiente estão configuradas
- Tente acessar diretamente `/setup` (se implementado)

## Próximos Passos

Após o setup:
1. Configure os modelos de certificados em **Settings → Certificados**
2. Crie seus primeiros cursos e módulos
3. Adicione aulas e exercícios
4. Crie turmas e convide estudantes

## Suporte

Se encontrar problemas durante o setup, verifique:
- Logs do Supabase Dashboard
- Console do navegador (F12)
- Documentação do Supabase: https://supabase.com/docs



