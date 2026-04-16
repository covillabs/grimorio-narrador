
# Grimório do Narrador — Plano de Implementação

## Design System Gótico
- **Fundo:** Cinza chumbo `#1A1A1A` e preto `#000000`
- **Texto:** Off-white `#E0E0E0`
- **Acento:** Vermelho sangue `#8B0000` (botões, links, destaques)
- **Tipografia:** Fonte serifada para títulos (Cinzel), sans-serif para corpo (Inter)
- **Componentes:** Cards escuros com bordas sutis, efeitos de hover em vermelho

## Banco de Dados (Supabase + Storage)

### Tabelas Principais
1. **players** — Personagens dos jogadores (nome, clã, geração, sire, fome, humanidade, vitalidade, força de vontade, história, abraço, disciplinas, vantagens, defeitos, imagem)
2. **npcs** — NPCs do narrador (nome, espécie/facção, clã, status, aparência, histórico, motivações, segredos, paradas de dados físico/social/mental, especialidades, potência de sangue, disciplinas, vitalidade, imagem)
3. **items** — Itens e artefatos (nome, categoria, descrição, regras/bônus, posse tipo + ID polimórfico, imagem)
4. **locations** — Locais (nome, tipo, descrição pública, segredos, controlador NPC, imagem)
5. **myths** — Arquivo de ocultismo (título, visão mortal, visão sobrenatural, verdade oculta)
6. **myth_discoveries** — Quem descobriu qual mito (link player ↔ myth)
7. **sessions** — Diário da crônica (data, título, resumo, anotações com menções)
8. **session_mentions** — Menções '@' (session_id + entity_type + entity_id)
9. **relationships** — Teia de intrigas (source_type, source_id, target_type, target_id, tipo: aliado/inimigo/vínculo de sangue, cor)
10. **player_touchstones** — Pilares/Touchstones (player_id → npc_id)

### Storage
- Bucket `grimorio-media` para uploads de imagens (retratos, itens, mapas)

## Módulos / Telas

### 1. A Coterie (Dashboard)
- Grid de cards com foto do personagem, barra de Fome (0-5 em vermelho) e Humanidade (0-10)
- Click no card → ficha completa com todos os campos, rastreadores editáveis inline, touchstones linkados

### 2. Galeria de NPCs
- Lista filtrável por facção com accordion UI
- Modo retraído: foto + lore (aparência, histórico)
- Botão "Modo Combate": expande paradas de dados, disciplinas, vitalidade
- Indicador visual de status (vivo / morte final)

### 3. Teia de Intrigas (React Flow)
- Grafo interativo com nós arrastáveis representando Players e NPCs
- Linhas coloridas: azul (aliado), vermelho (inimigo/vínculo de sangue)
- Zoom, pan, e possibilidade de adicionar/remover conexões
- Nós clicáveis que abrem a ficha do personagem

### 4. Arsenal / Inventário
- Galeria visual dos itens com imagem e badge indicando posse atual
- Filtro por categoria (Arma, Ferramenta, Artefato, Documento)
- Transferência de posse via dropdown

### 5. Atlas Sombrio
- Grid de locais com imagem/mapa
- Badge do controlador (NPC)
- Descrição pública visível, segredos ocultos com toggle "Olho do Mestre"

### 6. Ocultismo
- Accordion com as 3 camadas de verdade (Mortal → Sobrenatural → Oculta)
- Cada camada revela progressivamente
- Lista de "quem já descobriu" com links para jogadores

### 7. Diário da Crônica
- Timeline de sessões ordenada por data
- Editor de texto com autocomplete '@' inline — ao digitar '@' aparece dropdown com NPCs, Locais e Itens para selecionar
- Menções viram links clicáveis que navegam para a entidade

## Navegação
- Sidebar lateral escura com ícones temáticos para cada módulo
- Nome "Grimório do Narrador" no topo com fonte gótica
- Navegação responsiva (collapsa em mobile)

## Implementação Faseada
**Fase 1:** Design system, layout base, sidebar, CRUD de Players (Coterie) com upload de imagem
**Fase 2:** CRUD de NPCs com accordion e modo combate, CRUD de Itens
**Fase 3:** Locais, Ocultismo, Diário com sistema de menções
**Fase 4:** Teia de Intrigas com React Flow, relacionamentos
