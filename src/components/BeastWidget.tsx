import { useState } from "react";
import { Skull, Dices, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CLANS = [
  "Brujah", "Toreador", "Ventrue", "Malkaviano", "Nosferatu", "Tremere", "Gangrel",
  "Lasombra", "Banu Haqim", "Hecata", "Tzimisce", "Ravnos", "Salubri", "Ministry", "Caitiff", "Sangue-Fraco"
];

const getCompulsion = (clan: string) => {
  switch(clan) {
    case "Brujah": return "Rebelião: O vampiro deve desafiar a autoridade ou liderança atual imediatamente. Penalidade de -2 dados para qualquer ação que não seja subversiva.";
    case "Toreador": return "Obsessão: Fica paralisado admirando algo belo (ou chocante) na cena. Não pode tirar os olhos do alvo até passar um turno inteiro focado na beleza.";
    case "Ventrue": return "Arrogância: Sente necessidade profunda de dar ordens. O Ventrue sofre -2 dados em qualquer ação cooperativa até que alguém obedeça a uma ordem direta sua.";
    case "Malkaviano": return "Delírio: Sofre uma alucinação severa ou paranoia aguda ligada à cena atual, substituindo uma pessoa real por uma ameaça imaginária no seu campo de visão.";
    case "Nosferatu": return "Criptofilia: Uma ânsia compulsiva de aprender os segredos dos outros. -2 dados para qualquer rolagem que não envolva coleta de informações obscuras.";
    case "Tremere": return "Perfeccionismo: O vampiro não aceita falhas. Se falhar em uma rolagem, perde um ponto extra de Fome por frustração e estresse místico.";
    case "Gangrel": return "Mudez Feral: A besta toma conta da sua garganta. O personagem só consegue se comunicar através de rosnados, gestos agressivos ou silvados por uma cena inteira.";
    case "Lasombra": return "Desumanidade: A compaixão morre. O vampiro sofre uma penalidade de -2 dados em qualquer rolagem que envolva empatia, pena ou tentativa de preservar a humanidade de alguém.";
    case "Banu Haqim": return "Julgamento: A besta exige punição. O vampiro se foca em alguém que julga culpado e recebe -2 dados em qualquer ação que não seja punir, ferir ou expor esse alvo.";
    case "Hecata": return "Morbidez: Fascínio obssessivo pela morte e decaimento. -2 dados para prender a atenção ou socializar a menos que o assunto envolva cadáveres, doença ou fatalidades iminentes.";
    case "Tzimisce": return "Cobiça: Necessidade ardente de possuir ou delimitar seu território. -2 dados para rolagens a menos que a ação expanda ou defenda violentamente sua propriedade ou subordinados.";
    case "Ravnos": return "Condenação: O sangue clama pelo perigo extremo. Pede ação arriscada; -2 dados em ações cautelosas, planejamento longo ou qualquer recuo tático de uma situação de perigo imediato.";
    case "Salubri": return "Empatia Afetiva: Uma dor física ao infligir dor desnessesária. -2 dados em qualquer ação agressiva, manipulativa ou hostil que não tenha o propósito explícito de defender a vida de um inocente.";
    case "Ministry": return "Transgressão: Impulso de corromper ou quebrar as correntes. O vampiro sofre -2 dados se não tentar ativamente convencer alguém próximo a quebrar um de seus próprios princípios morais.";
    case "Caitiff":
    case "Sangue-Fraco": return "Sede de Sangue: Fome cega. O vampiro deve atacar a fonte de sangue mais próxima ou receber a penalidade de Compulsão de -2 dados para ações que não foquem em caçar.";
    default: return "Sede de Sangue: Fome cega. O vampiro deve atacar a fonte de sangue mais próxima ou receber a penalidade de Compulsão de -2 dados para ações que não foquem em caçar.";
  }
};

const getGeneralMessy = () => {
  const options = [
    "Quebra de Disfarce: Você usa um poder (Disciplina) de forma extremamente visível, arriscando a Máscara.",
    "Devastação: Você tira sucesso, mas destrói a ferramenta, janela, porta ou até machuca severamente seu Aliado no processo.",
    "Impulso Prepotente: Você teve sucesso de forma tão gloriosa que se recusa a recuar na próxima rodada, mesmo que as chances estejam contra você."
  ];
  return options[Math.floor(Math.random() * options.length)];
};

export function BeastWidget() {
  const [open, setOpen] = useState(false);
  const [selectedClan, setSelectedClan] = useState<string>("Brujah");
  const [result, setResult] = useState<string>("");
  const [type, setType] = useState<"bestial" | "messy" | null>(null);

  const rollBestial = () => {
    setType("bestial");
    setResult("Compulsão de Clã: " + getCompulsion(selectedClan));
  };

  const rollMessy = () => {
    setType("messy");
    setResult("Efeito Catastrófico: " + getGeneralMessy());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.6)] bg-red-950 border border-red-500 hover:bg-blood hover:scale-110 transition-all z-50 flex items-center justify-center p-0"
        >
          <Skull className="w-7 h-7 text-white" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-zinc-950 border-red-900 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-red-500 flex items-center gap-2">
            <Skull className="w-6 h-6" /> Sussurro da Besta
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Assistente rápido de Consequências V5</p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Clã do Infortunado</label>
            <Select value={selectedClan} onValueChange={setSelectedClan}>
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Selecione o clã" />
              </SelectTrigger>
              <SelectContent>
                {CLANS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button onClick={rollBestial} className="flex-1 bg-red-950 text-red-400 hover:bg-red-900 border border-red-900 hover:text-red-100">
              <Dices className="w-4 h-4 mr-2" /> Falha Bestial
            </Button>
            <Button onClick={rollMessy} className="flex-1 bg-yellow-950 text-yellow-400 hover:bg-yellow-900 border border-yellow-900 hover:text-yellow-100">
              <Dices className="w-4 h-4 mr-2" /> Crítico Bagunçado
            </Button>
          </div>

          {result && (
            <div className={`p-4 rounded-md border ${type === 'bestial' ? 'bg-red-950/30 border-red-900/50' : 'bg-yellow-950/30 border-yellow-900/50'} animate-in fade-in slide-in-from-bottom-2`}>
              <Badge variant="outline" className={`mb-2 font-mono ${type === 'bestial' ? 'text-red-400 border-red-900' : 'text-yellow-400 border-yellow-900'}`}>
                {type === 'bestial' ? 'FALHA BESTIAL' : 'CRÍTICO BAGUNÇADO'}
              </Badge>
              <p className="text-sm text-foreground leading-relaxed">
                {result}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
