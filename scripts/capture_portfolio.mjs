import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Configurações
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const CANDIDATE_URLS = [
  "http://127.0.0.1:8080",
  "http://localhost:8080",
];
const OUTPUT_DIR = path.resolve("./portfolio");

const MOCK_DATA = {
  v5_homeSettings: {
    subtitle: "Vampire: The Masquerade (5ª Edição - V5)",
    chronicleName: "Sombras da Noite Eterna",
    quote: '"O Sangue se lembra de tudo o que os mortais esqueceram nas cinzas do tempo."',
    imageUrl: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=1600&auto=format&fit=crop",
    metaTitle: "Resumo da Crônica de São Paulo:",
    metaText: "A Camarilla mantém um aperto de ferro sobre a região dos Jardins e Paulista, enquanto as células Anarquistas dominam a periferia. Rumores de agentes da Segunda Inquisição nas sombras exigem silêncio absoluto e proteção à Máscara.",
    trackers: [
      { id: 1, title: "Status Geral", value: "Tensão Bélica" },
      { id: 2, title: "Máscara", value: "Nível 1 (Suspeita)" },
      { id: 3, title: "Próxima Sessão", value: "Sexta-feira 21:00" },
      { id: 4, title: "XP Distribuído", value: "15 XP Acumulado" },
    ],
  },
  v5_coterie: [
    {
      id: "p_lucien",
      character_name: "Lucien de Montmirail",
      clan: "Toreador",
      concept: "Curador de Arte Decadente",
      generation: 10,
      sire: "Madame Delacroix",
      predator_type: "Sirene",
      hunger: 2,
      humanity: 7,
      blood_potency: 2,
      health_current: 7,
      health_max: 7,
      health_superficial: 0,
      health_aggravated: 0,
      willpower_current: 5,
      willpower_max: 6,
      willpower_superficial: 1,
      willpower_aggravated: 0,
      ambition: "Restaurar o Prestígio da Galeria Elysium",
      desire: "Descobrir o segredo da Dra. Evelyn",
      image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
      disciplines: [
        { id: "d1", nome: "Presença", nivel: 3, poderes: ["Awe (Fascínio)", "Daunt (Pavor)", "Entrancement"] },
        { id: "d2", nome: "Rapidez", nivel: 2, poderes: ["Graça Felina", "Disparada Fugaz"] },
        { id: "d3", nome: "Auspícios", nivel: 1, poderes: ["Sentidos Aguçados"] },
      ],
      advantages: [
        { id: "a1", nome: "Recursos", tipo: "Antecedente", pontos: 4 },
        { id: "a2", nome: "Fama (Mundo da Arte)", tipo: "Antecedente", pontos: 2 },
      ],
    },
    {
      id: "p_viktoria",
      character_name: "Viktoria Vance",
      clan: "Ventrue",
      concept: "Diretora de Fundos Imobiliários",
      generation: 9,
      sire: "Archibald Sterling",
      predator_type: "Ventoinha de Clube",
      hunger: 1,
      humanity: 6,
      blood_potency: 3,
      health_current: 8,
      health_max: 8,
      health_superficial: 1,
      health_aggravated: 0,
      willpower_current: 7,
      willpower_max: 7,
      willpower_superficial: 0,
      willpower_aggravated: 0,
      ambition: "Controlar o Conselho da Cidade de SP",
      desire: "Garantir a lealdade da Coterie",
      image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
      disciplines: [
        { id: "d4", nome: "Dominação", nivel: 3, poderes: ["Comando", "Mesmerismo", "Esquecimento"] },
        { id: "d5", nome: "Fortitude", nivel: 2, poderes: ["Resiliência", "Toughness"] },
        { id: "d6", nome: "Presença", nivel: 1, poderes: ["Olhar Majestoso"] },
      ],
      advantages: [
        { id: "a3", nome: "Contatos (Judiciário)", tipo: "Antecedente", pontos: 3 },
        { id: "a4", nome: "Influência (Finanças)", tipo: "Antecedente", pontos: 4 },
      ],
    },
    {
      id: "p_kaleb",
      character_name: "Kaleb O Errante",
      clan: "Gangrel",
      concept: "Ranger Urbano & Protetor Noturno",
      generation: 11,
      sire: "Torvald Presa-de-Lobo",
      predator_type: "Fera do Asfalto",
      hunger: 3,
      humanity: 5,
      blood_potency: 2,
      health_current: 9,
      health_max: 9,
      health_superficial: 2,
      health_aggravated: 0,
      willpower_current: 4,
      willpower_max: 5,
      willpower_superficial: 1,
      willpower_aggravated: 0,
      ambition: "Expulsar a Inquisição das Reservas Florestais",
      desire: "Alimentar-se sem alertar os guardas",
      image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop",
      disciplines: [
        { id: "d7", nome: "Metamorfose", nivel: 3, poderes: ["Olhos da Fera", "Garras Ferozes", "Forma Terrena"] },
        { id: "d8", nome: "Fortitude", nivel: 2, poderes: ["Armadura da Noite", "Defesa Inabalável"] },
        { id: "d9", nome: "Animalismo", nivel: 2, poderes: ["Língua das Bestas", "Acalmar o Animal"] },
      ],
      advantages: [
        { id: "a5", nome: "Aliados (Matilha Urbana)", tipo: "Antecedente", pontos: 3 },
      ],
    },
  ],
  v5_npcs: [
    {
      id: "npc_1",
      name: "Príncipe Montgomery Sterling",
      species_faction: "Camarilla",
      clan: "Ventrue",
      role: "Príncipe da Cidade",
      category: "Alta Nobreza",
      status: "Ativo",
      appearance: "Homem em seus 40 anos eternos, alfaiataria impecável e olhar penetrante de quem comanda impérios sem erguer a voz.",
      history: "Governa o Domínio desde a década de 1970 com pulso de ferro. Mantém a trégua com os Anarquistas enquanto expurga sabotadores.",
      image_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600&auto=format&fit=crop",
      physical_pool: 6,
      social_pool: 9,
      mental_pool: 8,
    },
    {
      id: "npc_2",
      name: "Julian Cross",
      species_faction: "Anarquistas",
      clan: "Brujah",
      role: "Barão da Zona Leste",
      category: "Revolucionário",
      status: "Ativo",
      appearance: "Jaqueta de couro desgastada, cicatrizes no rosto e tatuagens arcanas nas mãos.",
      history: "Ex-camarilla que abandonou as amarras das tradições após a traição do antigo Conselho. Líder carismático dos jovens rebeldes.",
      image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop",
      physical_pool: 8,
      social_pool: 7,
      mental_pool: 5,
    },
    {
      id: "npc_3",
      name: "Dra. Evelyn Thorne",
      species_faction: "Camarilla",
      clan: "Tremere",
      role: "Regente da Capela Paulista",
      category: "Erudita",
      status: "Ativo",
      appearance: "Óculos de armação fina, postura acadêmica fria e sempre carregando pergaminhos ou tablets codificados.",
      history: "Especialista em Feitiçaria do Sangue e alquimia hermética. Guarda os maiores segredos arcanos de São Paulo.",
      image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
      physical_pool: 4,
      social_pool: 6,
      mental_pool: 9,
    },
  ],
  v5_arsenal: [
    {
      id: "art_1",
      name: "Adaga Cerimonial das Sombras",
      category: "Artefato Místico",
      owner: "Lucien de Montmirail",
      owner_type: "player",
      modifier: "+2 Dano Agravado contra Bestas",
      description: "Forjada na Boêmia renascentista, embebida em rituais do sangue antigo. Inflige ferimentos que não cicatrizam facilmente.",
    },
    {
      id: "art_2",
      name: "Beretta 9mm Silenciada de Titânio",
      category: "Arma",
      owner: "Viktoria Vance",
      owner_type: "player",
      modifier: "+2 Dano Superficial (Disparo Furtivo)",
      description: "Arma tática personalizada com cano amortecido e gravuras em alto relevo com o brasão Ventrue.",
    },
    {
      id: "art_3",
      name: "Scanner Frequencial da Segunda Inquisição",
      category: "Ferramenta de Investigação",
      owner: "Kaleb O Errante",
      owner_type: "player",
      modifier: "+3 Investigação contra Drones",
      description: "Aparelho militar confiscado de um agente caçador. Detecta frequências térmicas e ondas de comunicação criptografadas.",
    },
  ],
  v5_atlas: [
    {
      id: "loc_1",
      name: "Palácio dos Arcos (Elysium Central)",
      type: "Elysium",
      security_level: "Máxima (Zona Neutra)",
      description: "Antigo casarão histórico na Paulista transformado em museu privativo. Solo sagrado onde nenhum combate é tolerado.",
      image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop",
      notes: "Acesso restrito apenas a Kindred reconhecidos pelo Príncipe.",
    },
    {
      id: "loc_2",
      name: "Galpão do Cais Seco (Refúgio da Coterie)",
      type: "Haven da Coterie",
      security_level: "Defesa Reforçada",
      description: "Galpão industrial abandonado no Brás, com subsolo fortificado, portas de chumbo e gerador auxiliar.",
      image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop",
      notes: "Esconderijo seguro com reservas de bolsas de sangue refrigeradas.",
    },
    {
      id: "loc_3",
      name: "Distrito Neon & Rua Augusta",
      type: "Hunting Ground",
      security_level: "Risco Médio de Exposição",
      description: "Área de casas noturnas e multidões fervilhantes. O local favorito de caça para vampiros elegantes e sedutores.",
      image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
      notes: "Ressonâncias Sanguíneas e Coléricas abundantes aos fins de semana.",
    },
  ],
  v5_quests: [
    {
      id: "q_1",
      title: "O Sangue Adulterado da Zona Leste",
      type: "investigacao",
      status: "Em Andamento",
      client: "Príncipe Montgomery",
      assignedTo: "Coterie",
      description: "Bolsas de sangue com traços químicos venenosos foram apreendidas. Descobrir se é sabotagem Anarquista ou operação da Inquisição.",
      category: "main",
      cluesData: [
        { id: "c1", text: "Lote de sangue com rótulo falso do Hospital das Clínicas.", assignedTo: "Viktoria" },
        { id: "c2", text: "Testemunha mortal viu van preta descarregando engradados às 03:00.", assignedTo: "Kaleb" },
      ],
    },
    {
      id: "q_2",
      title: "Conspiração no Salão de Negócios",
      type: "politica",
      status: "Em Andamento",
      client: "Julian Cross",
      assignedTo: "Lucien de Montmirail",
      description: "Evitar que a Camarilla execute um Primogênito dissidente sem julgamento justo.",
      category: "side",
      cluesData: [
        { id: "c3", text: "Gravação comprometedora interceptada na rede corporativa.", assignedTo: "Lucien" },
      ],
    },
  ],
  v5_sessions: [
    {
      id: "s_1",
      title: "Noite I: O Ultimato das Sombras",
      date: "04 de Outubro de 2026",
      summary: "A Coterie recebeu a convocação oficial do Príncipe no Elysium. Um ataque furtivo de drones revelou a aproximação de caçadores mortais.",
      xpAwarded: 4,
      hooks: [
        "Investigar o drone militar abatido por Kaleb no terraço.",
        "Marcar reunião clandestina com Julian Cross para alinhar trégua.",
      ],
    },
    {
      id: "s_2",
      title: "Noite II: Sangue e Neon na Augusta",
      date: "11 de Outubro de 2026",
      summary: "Caçada intensa na Rua Augusta. Viktoria e Lucien conseguiram subornar o detetive responsável pelo inquérito do homicídio vampírico.",
      xpAwarded: 3,
      hooks: [
        "Proteger o refúgio contra batidas policiais coordenadas.",
      ],
    },
  ],
  v5_boons: [
    {
      id: "b_1",
      type: "major",
      from: "Julian Cross (Barão Anarquista)",
      to: "Lucien de Montmirail (Coterie)",
      description: "Garantia de livre passagem e proteção nos territórios rebeldes por ter salvo o carniçal mensageiro.",
      isResolved: false,
    },
    {
      id: "b_2",
      type: "minor",
      from: "Viktoria Vance (Coterie)",
      to: "Dra. Evelyn Thorne (Regente Tremere)",
      description: "Acesso aos arquivos confidenciais do Cartório Central em troca de poções de alquimia do sangue.",
      isResolved: false,
    },
    {
      id: "b_3",
      type: "trivial",
      from: "Coterie",
      to: "Detetive Moura (Polícia Civil)",
      description: "Apagamento do boletim de ocorrência de atropelamento noturno.",
      isResolved: true,
    },
  ],
  v5_arena: [
    {
      id: "comb_1",
      name: "Lucien (Toreador)",
      type: "player",
      max_hp: 7,
      max_wp: 6,
      sup_dmg: 1,
      agr_dmg: 0,
      fw_sup: 1,
      fw_agr: 0,
      physical_pool: 6,
      social_pool: 8,
      mental_pool: 6,
    },
    {
      id: "comb_2",
      name: "Agente Especial da SI",
      type: "npc",
      max_hp: 6,
      max_wp: 5,
      sup_dmg: 2,
      agr_dmg: 1,
      fw_sup: 0,
      fw_agr: 0,
      physical_pool: 7,
      social_pool: 4,
      mental_pool: 7,
    },
    {
      id: "comb_3",
      name: "Kaleb (Gangrel - Em Frenesi)",
      type: "player",
      max_hp: 9,
      max_wp: 5,
      sup_dmg: 2,
      agr_dmg: 0,
      fw_sup: 2,
      fw_agr: 0,
      physical_pool: 8,
      social_pool: 4,
      mental_pool: 5,
    },
  ],
  v5_scratchpad: "Lembretes do Narrador:\n- A Besta de Kaleb está inquieta devido à Fome 3.\n- O Príncipe vai exigir um Favor Maior se a Coterie falhar no caso do sangue adulterado.\n- Drones da Inquisição possuem visão térmica; uso de Ofuscação requer teste com dificuldade elevada.",
};

const PAGES_TO_CAPTURE = [
  {
    name: "00-login",
    path: "/login",
    title: "Tela de Login e Boas-Vindas Gótica",
    description: "Autenticação temática sombria com identidade visual de Vampiro a Máscara, efeitos atmosféricos e acesso rápido de Convidado.",
    isGuest: false,
  },
  {
    name: "01-dashboard-cronica",
    path: "/",
    title: "Painel Principal da Crônica (Dashboard)",
    description: "Visão geral da crônica, status de Máscara da cidade, atalhos rápidos e widgets temáticos de narrativa.",
    isGuest: true,
  },
  {
    name: "02-coterie-membros",
    path: "/coterie",
    title: "Membros da Coterie & Fichas",
    description: "Gerenciamento dos membros do grupo vampírico, clãs, conceitos, atributos, disciplinas e ambições.",
    isGuest: true,
  },
  {
    name: "03-spc-npcs",
    path: "/npcs",
    title: "Galeria de NPCs & SPCs",
    description: "Fichas de personagens coadjuvantes, tipos de predador, contatos, rivais e seus níveis de ameaça.",
    isGuest: true,
  },
  {
    name: "04-teia-relacoes",
    path: "/teia",
    title: "Teia de Relações (Graph View)",
    description: "Mapeamento visual e interativo de conexões, inimizades, laços de sangue e intrigas políticas da cidade.",
    isGuest: true,
  },
  {
    name: "05-combate-iniciativa",
    path: "/combate",
    title: "Rastreador de Combate e Conflito V5",
    description: "Controle de turnos, dano superficial e agravado, trilhas de vitalidade e força de vontade e testes de fome.",
    isGuest: true,
  },
  {
    name: "06-escudo-narrador",
    path: "/escudo",
    title: "Escudo do Narrador (Quick Reference)",
    description: "Tabelas de regras rápidas da 5ª edição: dificuldades, regras de sangue, frenesi, compulsões e caçada.",
    isGuest: true,
  },
  {
    name: "07-oraculo-geradores",
    path: "/oracle",
    title: "Oráculo do Narrador & Geradores Rápidos",
    description: "Sementes de tramas, ganchos narrativos, complicações de caçada e nomes temáticos de vampiros.",
    isGuest: true,
  },
  {
    name: "08-arsenal-equipamentos",
    path: "/arsenal",
    title: "Arsenal & Equipamentos",
    description: "Armas de fogo, armas brancas, artefatos especiais e equipamentos táticos com regras de dano V5.",
    isGuest: true,
  },
  {
    name: "09-atlas-dominios",
    path: "/atlas",
    title: "Atlas & Domínios Urbanos",
    description: "Mapa e catálogo dos territórios, refúgios, locais de caça e influência das facções na cidade.",
    isGuest: true,
  },
  {
    name: "10-ocultismo-rituais",
    path: "/ocultismo",
    title: "Compêndio de Ocultismo & Disciplinas",
    description: "Disciplinas vampíricas, poderes de Feitiçaria de Sangue, Rituais e Alquimia do Sangue Ralo.",
    isGuest: true,
  },
  {
    name: "11-quests-intrigas",
    path: "/quests",
    title: "Missões & Intrigas",
    description: "Linhas de investigação ativas, conspirações da cidade e objetivos da Coterie.",
    isGuest: true,
  },
  {
    name: "12-diario-cronica",
    path: "/diario",
    title: "Diário de Sessões da Crônica",
    description: "Registro cronológico dos eventos de cada sessão e resumos narrativos.",
    isGuest: true,
  },
  {
    name: "13-boons-favores",
    path: "/boons",
    title: "Livro de Favores (Boons)",
    description: "Economia de favores da Camarilla: favores triviais, menores, maiores e de vida entre kindred.",
    isGuest: true,
  },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  return await res.json();
}

async function detectActiveBaseUrl() {
  for (const url of CANDIDATE_URLS) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.status === 200) {
        console.log(`✅ Servidor web detectado em: ${url}`);
        return url;
      }
    } catch {}
  }
  throw new Error(
    "Nenhum servidor Vite ativo na porta 8080! Certifique-se de que 'npm run dev' está em execução."
  );
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.idCounter = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id && this.pending.has(data.id)) {
            const { resolve: res, reject: rej } = this.pending.get(data.id);
            this.pending.delete(data.id);
            if (data.error) {
              rej(new Error(data.error.message || JSON.stringify(data.error)));
            } else {
              res(data.result);
            }
          }
        } catch (e) {
          console.error("Erro parsing WS message:", e);
        }
      };
    });
  }

  send(method, params = {}, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const id = this.idCounter++;
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Timeout ao executar CDP ${method} (${timeoutMs}ms)`));
        }
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("🔍 Verificando status do servidor de desenvolvimento...");
  const baseUrl = await detectActiveBaseUrl();

  const tempUserDataDir = path.join(os.tmpdir(), "grimorio-chrome-profile-" + Date.now());
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  console.log("🚀 Iniciando Google Chrome headless com CDP habilitado...");
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${tempUserDataDir}`,
      "--window-size=1920,1080",
      "about:blank",
    ],
    {
      detached: false,
      stdio: "ignore",
    }
  );

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      versionData = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
      if (versionData && versionData.webSocketDebuggerUrl) {
        break;
      }
    } catch {
      await sleep(500);
    }
  }

  if (!versionData) {
    chromeProcess.kill();
    throw new Error("Não foi possível conectar ao Chrome CDP na porta " + PORT);
  }

  console.log("⚡ Chrome conectado com sucesso via WebSocket CDP.");
  const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
  const pageTarget = targets.find((t) => t.type === "page") || targets[0];

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1.25,
    mobile: false,
  });

  // 1. CAPTURAR PRIMEIRO O LOGIN (sem autenticação prévia)
  const loginPage = PAGES_TO_CAPTURE[0];
  console.log(`\n📸 Capturando [${loginPage.name}]: ${loginPage.title}...`);
  await client.send("Page.navigate", { url: `${baseUrl}${loginPage.path}` });
  await sleep(3000);

  // Validar se o DOM carregou corretamente
  const loginCheck = await client.send("Runtime.evaluate", {
    expression: "document.title + ' | ' + document.body.innerText.substring(0, 100)",
  });
  console.log(`   Conteúdo detectado: ${loginCheck.result?.value?.replace(/\n/g, " ")}`);

  const loginScreenshot = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${loginPage.name}.png`),
    Buffer.from(loginScreenshot.data, "base64")
  );
  console.log(`✅ Salvo: portfolio/${loginPage.name}.png`);

  // 2. INJETAR DADOS DE MOCK E AUTENTICAÇÃO GUEST
  console.log("\n💉 Injetando Crônica Completa e Modo Convidado no localStorage...");

  const injectionScript = `
    try {
      localStorage.setItem('v5_active_user_id', 'guest');
      localStorage.setItem('v5_guest_mode', 'true');
      localStorage.setItem('guest_v5_active_chronicle_id', 'default');
      localStorage.setItem('guest_v5_chronicles_list', JSON.stringify([
        { id: 'default', name: 'Sombras da Noite Eterna' }
      ]));
      
      const mocks = ${JSON.stringify(MOCK_DATA)};
      for (const [key, val] of Object.entries(mocks)) {
        localStorage.setItem('guest_default_' + key, JSON.stringify(val));
      }
    } catch(e) {
      console.error('Erro ao injetar mocks:', e);
    }
  `;

  // Registrar para executar em todas as próximas navegações
  await client.send("Page.addScriptToEvaluateOnNewDocument", {
    source: injectionScript,
  });

  // Executar imediatamente no contexto atual
  await client.send("Runtime.evaluate", {
    expression: injectionScript,
  });

  // 3. CAPTURAR TODAS AS DEMAIS PÁGINAS
  const remainingPages = PAGES_TO_CAPTURE.slice(1);
  for (const pageInfo of remainingPages) {
    try {
      console.log(`\n📸 Capturando [${pageInfo.name}]: ${pageInfo.title}...`);
      const targetUrl = `${baseUrl}${pageInfo.path}`;

      await client.send("Page.navigate", { url: targetUrl });
      // Aguardar carregamento de fontes, SVGs e transições CSS
      await sleep(3500);

      // Checar se não caiu em tela de erro
      const pageCheck = await client.send("Runtime.evaluate", {
        expression: "document.title + ' | ' + (document.querySelector('h1')?.innerText || document.body.innerText.substring(0, 60))",
      });
      console.log(`   Página ativa: ${pageCheck.result?.value?.replace(/\n/g, " ")}`);

      const screenshot = await client.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });

      const filePath = path.join(OUTPUT_DIR, `${pageInfo.name}.png`);
      fs.writeFileSync(filePath, Buffer.from(screenshot.data, "base64"));
      console.log(`✅ Salvo: portfolio/${pageInfo.name}.png (${(screenshot.data.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`⚠️ Erro ao capturar ${pageInfo.name}:`, err.message);
    }
  }

  client.close();
  try {
    chromeProcess.kill();
  } catch {}

  console.log("\n📄 Atualizando README.md da galeria de portfólio...");
  const readmeContent = `# 🧛 Grimório do Narrador — Portfólio Visual & Apresentação

Este diretório contém capturas de tela em alta definição do **Grimório do Narrador**, uma aplicação web gótica e responsiva desenvolvida para gerenciamento completo de crônicas de **Vampiro: A Máscara (5ª Edição - V5)**.

---

## 🛠️ Stack Tecnológica
- **Frontend Core:** React 18, TypeScript, Vite
- **Estilização & Design:** Tailwind CSS, Temas Góticos Personalizados, Efeitos Carmesim e Pulso de Sangue, Glassmorphism
- **Componentes & UI:** Radix UI, Lucide Icons, Embla Carousel, React Flow / XYFlow (Diagramas interativos de relações)
- **Gerenciamento de Estado:** TanStack React Query, Context API, LocalStorage isolado por crônica e usuário
- **Mecânicas da V5:** Regras oficiais de D10, Dados de Fome, Críticos Bagunçados, Falhas Bestiais, Ameaça de Quebra de Máscara

---

## 📸 Galeria de Telas & Funcionalidades

${PAGES_TO_CAPTURE.map(
  (p) => `### ${p.title}
![${p.title}](./${p.name}.png)

- **Arquivo:** \`${p.name}.png\`
- **Descrição:** ${p.description}
- **Rota:** \`${p.path}\`
`
).join("\n---\n\n")}

---

*Criado para apresentação em portfólio profissional (GitHub, LinkedIn, Behance).*
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, "README.md"), readmeContent, "utf-8");
  console.log("\n🎉 Concluído com sucesso! Pasta 'portfolio' atualizada com capturas perfeitas.");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
