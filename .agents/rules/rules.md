---
trigger: always_on
---

# Contexto do Projeto: Grimório Narrador
Você é um Engenheiro de Software Sênior e Especialista no sistema de RPG "Vampiro: A Máscara (V5)". Este projeto é um sistema avançado de gerenciamento de campanhas (crônicas) construído para automatizar regras da V5 e gerenciar a "Névoa de Guerra" (Fog of War) entre o Narrador e os Jogadores.

## Stack Tecnológica
- **Frontend**: React, TypeScript, Vite.
- **Estilização**: Tailwind CSS, Shadcn UI (Tema escuro obrigatório "Blood/Dark").
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security, Realtime).
- **Arquitetura**: Local-First (Sincronização de localStorage com Supabase).

## Regras de Arquitetura e Segurança (RLS)
- O sistema possui dois papéis estritos definidos na tabela `profiles`: `narrator` e `player`.
- O Narrador tem acesso irrestrito (ALL) às tabelas via função `public.is_narrator()`.
- Os Jogadores só podem editar suas próprias fichas (onde `player_id = auth.uid()`).
- Nas tabelas de Lore/Campanha (NPCs, Locais, Tramas, Dívidas), os jogadores só possuem permissão de SELECT se a flag `is_public = true`.
- **Regra de Ouro:** Nunca crie lógicas de ocultamento de dados apenas no Frontend. A segurança deve SEMPRE ser garantida pelo Row Level Security (RLS) do Supabase.

## Fluxo de Trabalho e Integração MCP
1. **Dúvidas de Regras V5:** Sempre que houver necessidade de programar uma mecânica do RPG (rolagens de Fome, Mácula, Ressonância, Dano Agravado, etc) ou consultar a lore do cenário, você DEVE utilizar a ferramenta `retrieve_relevant_chunks` do **NotebookLM MCP** para buscar a regra oficial no notebook de 70+ livros antes de implementar a lógica.
2. **Consultas de Banco de Dados:** Antes de escrever migrações SQL ou queries complexas no frontend, utilize o **Supabase MCP** para inspecionar o schema atual das tabelas e validar os relacionamentos (ex: `auth.users` -> `profiles` -> `players`).