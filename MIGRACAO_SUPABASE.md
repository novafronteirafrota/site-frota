# Guia de Migração para Supabase Externo

Este guia detalha o processo completo para migrar o projeto **Stellar ORG** para um projeto Supabase externo.

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Criar Projeto Supabase](#2-criar-projeto-supabase)
3. [Executar Migrations](#3-executar-migrations)
4. [Configurar Edge Functions](#4-configurar-edge-functions)
5. [Criar Usuário Admin Inicial](#5-criar-usuário-admin-inicial)
6. [Configurar Variáveis de Ambiente](#6-configurar-variáveis-de-ambiente)
7. [Particularidades do Sistema de Login](#7-particularidades-do-sistema-de-login)

---

## 1. Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
- Node.js 18+ instalado
- Acesso ao código fonte do projeto

---

## 2. Criar Projeto Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em **New Project**
3. Configure:
   - **Name**: Stellar ORG (ou nome desejado)
   - **Database Password**: Guarde esta senha com segurança
   - **Region**: Escolha a região mais próxima dos seus usuários
4. Aguarde a criação do projeto (pode levar alguns minutos)
5. Anote os seguintes valores em **Settings > API**:
   - `Project URL` (SUPABASE_URL)
   - `anon public key` (SUPABASE_ANON_KEY)
   - `service_role secret key` (SUPABASE_SERVICE_ROLE_KEY)

---

## 3. Executar Migrations

### Opção A: Via Supabase CLI (Recomendado)

```bash
# Login no Supabase
supabase login

# Vincular ao projeto (substitua pelo seu project-ref)
supabase link --project-ref SEU_PROJECT_REF

# Executar migrations
supabase db push
```

### Opção B: Via SQL Editor no Dashboard

Execute os seguintes scripts SQL **em ordem** no SQL Editor do Supabase:

#### Migration 1: Estrutura Base

```sql
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE public.acquisition_type AS ENUM ('ingame', 'hangar');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  sub_rank_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE(user_id, role)
);

-- Create sub_ranks table
CREATE TABLE public.sub_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add FK for sub_rank_id on profiles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_sub_rank_id_fkey
  FOREIGN KEY (sub_rank_id) REFERENCES public.sub_ranks(id) ON DELETE SET NULL;

-- Create ships table (global catalog)
CREATE TABLE public.ships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  manufacturer TEXT,
  photo_url TEXT,
  available_ingame BOOLEAN NOT NULL DEFAULT true,
  available_hangar BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_fleet table
CREATE TABLE public.user_fleet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ship_id UUID NOT NULL REFERENCES public.ships(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  acquisition_type acquisition_type NOT NULL DEFAULT 'hangar',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL DEFAULT 'Stellar ORG',
  logo_url TEXT,
  logo_shape TEXT NOT NULL DEFAULT 'circle',
  primary_color TEXT DEFAULT '#00e7ff',
  secondary_color TEXT DEFAULT '#1a1a2e',
  accent_color TEXT DEFAULT '#16213e',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
```

#### Migration 2: Funções e Triggers

```sql
-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Handle new user signup - create profile and assign member role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'photo_url'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_fleet_updated_at
  BEFORE UPDATE ON public.user_fleet
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

#### Migration 3: Políticas RLS

```sql
-- =====================
-- PROFILES
-- =====================
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can update member profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'moderator')
    AND NOT public.has_role(id, 'admin')
    AND NOT public.has_role(id, 'moderator')
  );

-- =====================
-- USER_ROLES
-- =====================
CREATE POLICY "Roles are viewable by authenticated users"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- SUB_RANKS
-- =====================
CREATE POLICY "Sub-ranks are viewable by authenticated users"
  ON public.sub_ranks FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sub-ranks"
  ON public.sub_ranks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can manage sub-ranks"
  ON public.sub_ranks FOR ALL
  USING (public.has_role(auth.uid(), 'moderator'));

-- =====================
-- SHIPS
-- =====================
CREATE POLICY "Ships are viewable by authenticated users"
  ON public.ships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage ships"
  ON public.ships FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can manage ships"
  ON public.ships FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- =====================
-- USER_FLEET
-- =====================
CREATE POLICY "Fleet is viewable by authenticated users"
  ON public.user_fleet FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own fleet"
  ON public.user_fleet FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage any fleet"
  ON public.user_fleet FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can manage member fleet"
  ON public.user_fleet FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'moderator')
    AND NOT public.has_role(user_id, 'admin')
    AND NOT public.has_role(user_id, 'moderator')
  );

-- =====================
-- SITE_SETTINGS
-- =====================
CREATE POLICY "Site settings are viewable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## 4. Configurar Edge Functions

### 4.1. Deploy via CLI

```bash
# Na pasta do projeto
supabase functions deploy create-user
supabase functions deploy change-password
supabase functions deploy delete-user
```

### 4.2. Configurar JWT Verification

Após o deploy, desabilite a verificação JWT para as funções (necessário pois usam autenticação customizada).

Via CLI, crie/edite o arquivo `supabase/config.toml`:

```toml
[functions.create-user]
verify_jwt = false

[functions.change-password]
verify_jwt = false

[functions.delete-user]
verify_jwt = false
```

---

## 5. Criar Usuário Admin Inicial

### ⚠️ IMPORTANTE: Sistema de Login Baseado em Username

Este projeto **NÃO usa email para autenticação**. Apenas username e senha. O email armazenado no Supabase Auth é um email fake gerado automaticamente (`{username}@stellarorg.local`).

### Via Edge Function (Recomendado)

Após o deploy da Edge Function `create-user`, faça uma requisição:

```bash
curl -X POST "https://SEU_PROJECT_REF.supabase.co/functions/v1/create-user" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SuaSenhaForte123!",
    "display_name": "Administrador",
    "role": "admin",
    "init_secret": "STELLAR_INIT_2024"
  }'
```

> **Nota**: O `init_secret` só funciona para a criação inicial. Após criar o admin, novos usuários só podem ser criados por admins/moderadores autenticados.

---

## 6. Configurar Variáveis de Ambiente

Atualize o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
VITE_SUPABASE_PROJECT_ID=SEU_PROJECT_REF
```

---

## 7. Particularidades do Sistema de Login

### 7.1. Autenticação por Username (Não Email)

O sistema foi projetado para **não coletar emails dos usuários** por motivos de privacidade:

1. **Criação de usuário**: Admin/Moderador informa `username`, `password`, `display_name`. O sistema gera `{username}@stellarorg.local` internamente.
2. **Login**: Usuário informa `username` e `password`. O frontend converte para `{username}@stellarorg.local`.

### 7.2. Hierarquia de Roles

| Role       | Pode Criar | Pode Editar    | Pode Alterar Senha | Pode Remover   |
|------------|------------|----------------|-------------------|----------------|
| Admin      | Todos      | Todos          | Todos             | Todos          |
| Moderator  | Members    | Members apenas | Members apenas    | Members apenas |
| Member     | —          | Próprio perfil | Própria senha     | —              |

### 7.3. Edge Functions

| Função           | Descrição                                      |
|------------------|-------------------------------------------------|
| `create-user`    | Cria novos usuários (admin/moderador)           |
| `change-password`| Altera senha respeitando hierarquia de roles    |
| `delete-user`    | Remove usuários respeitando hierarquia de roles |

Todas requerem `verify_jwt = false` pois fazem validação de autorização internamente.

### 7.4. Sistema de Aquisição de Naves

Cada nave no catálogo pode ser marcada como disponível para aquisição **in-game** e/ou **hangar pessoal** (dinheiro real). Ao adicionar uma nave à frota, o membro seleciona o tipo de aquisição:

- **Comprada no jogo** (`ingame`) — ícone de controle 🎮
- **Hangar da conta** (`hangar`) — ícone de dólar 💲

### 7.5. Sub-Ranks

Sub-ranks são classificações adicionais atribuídas aos membros (ex: divisões, esquadrões). Gerenciados por admins e moderadores.

---

## Checklist Final

- [ ] Projeto Supabase criado
- [ ] Migrations executadas na ordem correta (tabelas → funções/triggers → RLS)
- [ ] Edge Functions deployadas (`create-user`, `change-password`, `delete-user`)
- [ ] JWT verification desabilitado para as 3 Edge Functions
- [ ] Usuário admin inicial criado via `curl`
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Teste de login com admin funcionando
- [ ] Teste de criação de novo membro funcionando
- [ ] Teste de remoção de membro funcionando

---

*Documento atualizado em: Abril 2026*
