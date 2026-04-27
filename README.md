# Grimório Narrador

Sistema avançado de gerenciamento para Mestres e Narradores de **Vampiro: A Máscara (5ª Edição - V5)**. O Grimório é uma ferramenta definitiva para organizar campanhas (crônicas) e automatizar mecânicas do sistema de RPG.

## 🩸 Funcionalidades Principais

### Mesa de Jogo
- **Escudo do Narrador**: Tabelas rápidas, geradores e sumários das regras principais da V5 na ponta dos dedos.
- **Arena de Sangue**: Painel tático para resolução de conflitos físicos e sociais em turnos (Acompanhamento de Força de Vontade e Vitalidade).
- **Diário da Crônica**: Linha do tempo da crônica, registro de sessões e scratchpad de anotações.

### Crônica
- **Gestão da Coterie**: Fichas completas dos Jogadores, acompanhamento de Fome, Mácula e Humanidade.
- **Códice de NPCs (SPCs)**: Banco de dados interativo com personagens coadjuvantes e antagonistas.
- **Teia de Intrigas**: Gráfico interativo visualizando a relação política entre as facções do domínio.
- **Tramas e Contratos**: Acompanhamento de Quests, side-quests, rumores e pistas.
- **Livro de Dívidas (Boons)**: Economia de favores políticos da Camarilla/Anarchs.

### Mundo e Oráculo
- **Atlas Sombrio**: O tabuleiro geográfico com domínios, refúgios e segredos.
- **Arsenal & Relíquias**: Itens, artefatos e armas vitais.
- **Grimório Oculto**: Rituais de Magia do Sangue, Cerimônias Oblívio e Fórmulas Alquímicas.
- **Oráculo de Lore**: Módulo integrado com Inteligência Artificial para consultar regras dos manuais da V5 (Requer integração MCP NotebookLM).

## 🛠️ Tecnologias e Arquitetura
- **Frontend**: React + Vite + TypeScript
- **Estilização**: Tailwind CSS + Shadcn UI (Visual rico, tema escuro "Blood" personalizado)
- **Persistência**: `localStorage` nativo do navegador para rápida iteração, com módulos prontos para integração de nuvem.
- **Autenticação**: Identidade do mestre protegida via login com o Supabase.

## 🚀 Como Executar Localmente

1. Clone o repositório
2. Instale as dependências: `bun install` ou `npm install`
3. Execute o servidor de desenvolvimento: `bun run dev`
4. Acesse: `http://localhost:8080` (A porta configurada padrão é 8080)

*Nota: Para que o recurso de Identidade e Oráculo funcionem perfeitamente, é necessário configurar as variáveis de ambiente `.env` para o Supabase e habilitar o servidor MCP associado.*
