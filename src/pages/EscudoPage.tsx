import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Skull, Sword, HeartPulse, Scale, ShieldAlert, Moon, Sparkles, Droplet } from "lucide-react";

export default function EscudoPage() {
  const [bloodVictim, setBloodVictim] = useState<any>(null);

  const generateVictim = () => {
    const identities = ["Segurança Noturno", "Universitário Bêbado", "Atendente de Conveniência", "Prostituta", "Executivo Atrasado", "Mendigo Observador", "Policial Corrupto", "Turista Perdido"];
    const resonances = [
      { name: "Colérica", color: "text-red-500", desc: "Raiva, Fúria, Medo. (Bônus em Rapidez/Potência)" },
      { name: "Sanguínea", color: "text-pink-500", desc: "Desejo, Tensão, Paixão. (Bônus em Presença/Feitiçaria)" },
      { name: "Melancólica", color: "text-blue-500", desc: "Tristeza, Luto, Frieza. (Bônus em Fortitude/Ofuscação)" },
      { name: "Fleumática", color: "text-zinc-400", desc: "Apatia, Calma, Preguiça. (Bônus em Auspícios/Dominação)" },
      { name: "Sangue Animal", color: "text-amber-700", desc: "Sem ressonância humana. (Bônus em Animalismo/Metamorfose)" }
    ];
    const intensities = ["Fugaz (Sem bônus)", "Intensa (+1 Dado nas Disciplinas)", "Discrasia (Ganha habilidade especial se drenar tudo)"];
    
    setBloodVictim({
      identity: identities[Math.floor(Math.random() * identities.length)],
      defense: Math.floor(Math.random() * 4) + 2, // 2 to 5 dice
      resonance: resonances[Math.floor(Math.random() * resonances.length)],
      intensity: intensities[Math.floor(Math.random() * intensities.length)]
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary mb-2 flex items-center">
          <ShieldAlert className="mr-3 h-8 w-8" />
          Escudo do Narrador
        </h1>
        <p className="text-muted-foreground">
          Referência rápida das mecânicas da 5ª Edição de Vampiro: A Máscara.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sangue e Fome */}
        <Card className="border-blood/30 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-blood/20">
            <CardTitle className="text-blood flex items-center text-xl">
              <HeartPulse className="mr-2 h-5 w-5" />
              Sistemas de Sangue
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="rouse">
                <AccordionTrigger className="text-foreground hover:text-blood">Rouse Check (Acordar o Sangue)</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-4 border-l-2 border-blood/50">
                  <p className="mb-2">Rola-se 1 dado. <strong>Dificuldade: 6+ para sucesso.</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Sucesso (6-10):</strong> A Fome não aumenta.</li>
                    <li><strong>Falha (1-5):</strong> A Fome aumenta em 1.</li>
                  </ul>
                  <p className="mt-2 text-sm text-foreground/80 italic">Ativação ao acordar de noite, curar dano (1 nível superficial por Rouse), usar Blood Surge ou ativar certas Disciplinas.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="surge">
                <AccordionTrigger className="text-foreground hover:text-blood">Blood Surge (Surto de Sangue)</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-4 border-l-2 border-blood/50">
                  <p>Permite adicionar dados a qualquer teste (Físico, Social ou Mental). O bônus varia com a <strong>Potência do Sangue</strong>. Custa 1 Rouse Check.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hunger">
                <AccordionTrigger className="text-foreground hover:text-blood">Dados de Fome & Besta</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-4 border-l-2 border-blood/50">
                  <ul className="list-disc pl-4 space-y-2">
                    <li><strong>Substituição:</strong> Substitua dados normais iguais à Fome por Dados de Fome (vermelhos). Máx: 5.</li>
                    <li><strong>Falha Bestial:</strong> Ocorre se o teste falha E rola um <strong>"1"</strong> num Dado de Fome. A Besta manifesta compulsões ou ações caóticas.</li>
                    <li><strong>Crítico Bagunçado (Messy Critical):</strong> Ocorre se há um crítico (dois 10s) E pelo menos um <strong>"10"</strong> é num Dado de Fome. O personagem causa dano excessivo, quebra a máscara ou expõe o alvo.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Combate e Dano */}
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-foreground flex items-center text-xl">
              <Sword className="mr-2 h-5 w-5 text-sidebar-primary" />
              Combate e Modificadores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="damage-types">
                <AccordionTrigger className="text-foreground">Dano Superficial x Agravado</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2"><strong>Superficial (/):</strong> Punhos, contusões, pequenos cortes (para mortais). Balas, facas, quedas (para vampiros). <em>A cada turno, o dano superficial sofrido é dividido por 2 (arredondado pra cima) antes de aplicar à ficha.</em></p>
                  <p><strong>Agravado (X):</strong> Fogo, luz do sol, garras/presas de feras e outros vampiros. Não é reduzido pela metade. Quando a trilha enche de Agravado, o Vampiro cai em Torpor (ou encontra a Morte Final).</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="weapons">
                <AccordionTrigger className="text-foreground">Modificadores de Armaduras e Cobertura</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Armaduras (Converte Agravado p/ Superficial):</h4>
                    <Table className="text-sm">
                      <TableBody>
                        <TableRow><TableCell>Couro / Tecido Balístico</TableCell><TableCell className="text-right">Valor 2</TableCell></TableRow>
                        <TableRow><TableCell>Colete Kevlar</TableCell><TableCell className="text-right">Valor 4</TableCell></TableRow>
                        <TableRow><TableCell>Tática / Motim</TableCell><TableCell className="text-right">Valor 6</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Cobertura (Penalidade na Parada de Atirador):</h4>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      <li><strong>Sem cobertura:</strong> -2 dados</li>
                      <li><strong>Ocultação Leve:</strong> -1 dado</li>
                      <li><strong>Barricada Sólida:</strong> Nenhuma alteração</li>
                      <li><strong>Entrincheirado:</strong> +1 dado</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="grapple">
                <AccordionTrigger className="text-foreground">Manobras Essenciais</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="list-disc pl-4 space-y-2">
                    <li><strong>Agarrar/Imobilizar:</strong> Teste oposto de Força + Briga. Ganha quem passa. O perdedor fica imobilizado.</li>
                    <li><strong>A Mordida (Bite):</strong> Ataca um alvo já agarrado sem penalidade, ou testa oposto caso alvo esteja livre com penalidade. Causa sempre 2 níveis flat de Dano Agravado (em mortais ou vampiros, sem modificadores de Força).</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Humanidade e Sociedade */}
        <Card className="border-gold/30 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-gold/20">
            <CardTitle className="text-gold flex items-center text-xl">
              <Scale className="mr-2 h-5 w-5" />
              Humanidade, Máculas e Combate Social
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center"><Skull className="h-4 w-4 mr-2" /> Danos à Força de Vontade</h3>
              <p className="text-sm text-muted-foreground mb-3">No Combate Social, falhas ou argumentos oponentes causam dano superficial na FW. O dano é aumentado com base na <strong>sua audiência</strong>:</p>
              <Table className="text-sm border">
                <TableHeader>
                  <TableRow><TableHead>Situação / Audiência</TableHead><TableHead className="text-right">Dano F.W.</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell>Oponente Isolado</TableCell><TableCell className="text-right">+0</TableCell></TableRow>
                  <TableRow><TableCell>Membros da Coterie</TableCell><TableCell className="text-right">+1</TableCell></TableRow>
                  <TableRow><TableCell>Mentores ou Amantes</TableCell><TableCell className="text-right">+2</TableCell></TableRow>
                  <TableRow><TableCell>Príncipe / Figuras de Poder</TableCell><TableCell className="text-right">+4</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div>
               <h3 className="font-semibold text-foreground mb-3 flex items-center"><FileText className="h-4 w-4 mr-2" /> Máculas (Stains)</h3>
               <p className="text-sm text-muted-foreground mb-3">Ações que rompem o código moral (Princípios da Crônica) ou ferem os Pilares (Touchstones) do personagem.</p>
               <ul className="list-disc pl-4 text-sm text-foreground/80 space-y-2">
                 <li><strong>Enlaçar um mortal (Laço de Sangue):</strong> +1 Mácula</li>
                 <li><strong>Dar o Abraço (Criar filhote):</strong> +2 Máculas</li>
                 <li><strong>Pilar sofre influência maligna:</strong> +1 Mácula</li>
                 <li><strong>Pilar sofre dano base/perigoso:</strong> +2 Máculas</li>
                 <li><strong>Pilar é destruído:</strong> +3 Máculas</li>
               </ul>
               <p className="text-xs text-muted-foreground mt-4 italic">*Se as Máculas ativas ultrapassarem as "caixas vazias" na trilha de Humanidade, testes degenerativos devem ser feitos ao fim da sessão.</p>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         {/* Caçadas (Fase 21) */}
         <Card className="border-purple-900/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-purple-900/30">
            <CardTitle className="text-purple-500 flex items-center text-xl">
              <Moon className="mr-2 h-5 w-5" />
              Sistemas de Caçada (Predadores)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
             <p className="text-sm text-foreground/80">Sempre que a narrativa não cobrir detalhadamente uma caça, exija uma única rolagem rápida baseada no Estilo Predatório do jogador.</p>
             <Table className="text-xs">
                <TableHeader>
                  <TableRow><TableHead>Predador</TableHead><TableHead>Modus Operandi</TableHead><TableHead className="text-right">Rolagem Exigida</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-bold">Becoite</TableCell><TableCell>Ataque Noturno e Surpresa</TableCell><TableCell className="text-right text-purple-400">Força + Briga</TableCell></TableRow>
                  <TableRow><TableCell className="font-bold">Batedor</TableCell><TableCell>Roubo Frio (Sacos de Sangue)</TableCell><TableCell className="text-right text-purple-400">Inteligência + Manha</TableCell></TableRow>
                  <TableRow><TableCell className="font-bold">Sanguessuga</TableCell><TableCell>Beber Vitae (Atacar Vampiros)</TableCell><TableCell className="text-right text-purple-400">Sangue vs Sangue</TableCell></TableRow>
                  <TableRow><TableCell className="font-bold">Limpador</TableCell><TableCell>Fingir ser amigo de mortais</TableCell><TableCell className="text-right text-purple-400">Manipulação + Lábia</TableCell></TableRow>
                  <TableRow><TableCell className="font-bold">Consensualista</TableCell><TableCell>Oferecer Vitae em Troca</TableCell><TableCell className="text-right text-purple-400">Manipulação + Persuasão</TableCell></TableRow>
                  <TableRow><TableCell className="font-bold">Cíclope/Osíris</TableCell><TableCell>Exigir sangue do seu Culto</TableCell><TableCell className="text-right text-purple-400">Manipulação + Liderança</TableCell></TableRow>
                  <TableRow><TableCell className="font-bold">João-Pestana</TableCell><TableCell>Invadir casas de dorminhocos</TableCell><TableCell className="text-right text-purple-400">Destreza + Furtividade</TableCell></TableRow>
                  <TableRow><TableCell className="font-bold">Isca/Sedutor</TableCell><TableCell>Boates e Cenas Noturnas</TableCell><TableCell className="text-right text-purple-400">Carisma + Lábia</TableCell></TableRow>
                </TableBody>
            </Table>
            <div className="bg-purple-950/20 p-2 rounded text-[10px] border border-purple-900/30 text-purple-300">
               <strong>Falha na Caçada:</strong> O personagem não bebe Sangue. E se o teste tiver Falha Bestial, o personagem quebra a Máscara gravemente e o *Mestre* sobe o Termômetro da Máscara.
            </div>

            {/* Sangário Widget */}
            <div className="mt-4 pt-4 border-t border-purple-900/30">
               <div className="flex items-center justify-between mb-3">
                 <h4 className="font-serif text-sm text-purple-400 flex items-center">
                   <Droplet className="w-4 h-4 mr-1" /> O Sangário (Gerador)
                 </h4>
                 <Button size="sm" onClick={generateVictim} className="h-7 text-[10px] bg-purple-900 hover:bg-purple-800 border border-purple-700">
                    Sortear Vítima Aleatória
                 </Button>
               </div>
               
               {bloodVictim ? (
                 <div className="bg-surface-container-low p-3 rounded border border-border animate-in fade-in zoom-in-95">
                    <p className="font-bold text-sm mb-1">{bloodVictim.identity}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                       <div className="bg-background p-2 rounded">
                          <span className="block uppercase tracking-widest text-[8px] mb-1">Parada de Defesa</span>
                          <span className="font-mono text-primary font-bold">{bloodVictim.defense} Dados</span>
                       </div>
                       <div className="bg-background p-2 rounded">
                          <span className="block uppercase tracking-widest text-[8px] mb-1">Ressonância</span>
                          <span className={`font-mono font-bold ${bloodVictim.resonance.color}`}>{bloodVictim.resonance.name}</span>
                       </div>
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground">
                       <p className="border-l-2 border-blood/50 pl-2"><strong>Desejo:</strong> {bloodVictim.resonance.desc}</p>
                       <p className="border-l-2 border-blood/50 pl-2 mt-1"><strong>Nível de Foco:</strong> <span className="font-bold">{bloodVictim.intensity}</span></p>
                    </div>
                 </div>
               ) : (
                 <div className="bg-muted/10 border border-border border-dashed p-4 rounded text-center text-xs text-muted-foreground italic">
                    Ao invés de pensar no improviso, role uma vítima instantaneamente para as caçadas da sua mesa.
                 </div>
               )}
            </div>

          </CardContent>
        </Card>

        {/* Regras Clássicas de Disciplina (Fase 22) */}
         <Card className="border-blue-900/30 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-blue-900/20">
            <CardTitle className="text-blue-500 flex items-center text-xl">
              <Sparkles className="mr-2 h-5 w-5" />
              Dicionário Célere (Disciplinas Core)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
             <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Consulte Rápido Sem o PDF</p>
             <Accordion type="single" collapsible className="w-full text-sm">
                <AccordionItem value="auspex">
                  <AccordionTrigger className="text-foreground hover:text-blue-400">Auspícios (Visão Além)</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                     <p><strong>Nível 1 (Sentir o Invisível):</strong> Percebe ilusões e vampiros escondidos. Rola: <em>Raciocínio + Auspícios</em> ou <em>Prontidão</em>.</p>
                     <p><strong>Nível 2 (Premonição):</strong> Desperta para visões futuras/passadas.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="dominate">
                  <AccordionTrigger className="text-foreground hover:text-blue-400">Dominação (Controle Mental)</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                     <p><strong>Clã base:</strong> Ventrue, Tremere, Malkaviano.</p>
                     <p><strong>Nível 1 (Forçar/Compelir):</strong> Alvo obedece a uma ordem curta. Requer Contato Visual! Role <em>Carisma + Dominação vs Inteligência + Perseverança</em> (para alvos difíceis).</p>
                     <p><strong>Nível 2 (Mesmerizar):</strong> Ordena tarefas complexas, mas o alvo para se for fatal.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="presence">
                  <AccordionTrigger className="text-foreground hover:text-blue-400">Presença (Manipulação Emocional)</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                     <p><strong>Nível 1 (Fascínio/Pavor):</strong> Todos ao redor se afeiçoam ou se aterrorizam. Para alvos hostis/específicos: <em>Manipulação + Presença vs Autocontrole + Perseverança</em>.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="potence">
                  <AccordionTrigger className="text-foreground hover:text-blue-400">Potência (Dano Brutal)</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                     <p><strong>Nível 2 (Corpo Letal):</strong> Golpes desarmados agora causam Dano Agravado a Mortais, ou dobram dano contra alvos resistentes.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="celerity">
                  <AccordionTrigger className="text-foreground hover:text-blue-400">Rapidez (Celeridade)</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                     <p><strong>Nível 1 (Blink/Esquiva Perfeita):</strong> Some da linha de tiro ou ganha esquiva mágica. Adiciona o nível em Celeridade na reserva de testes p/ desviar.</p>
                  </AccordionContent>
                </AccordionItem>
             </Accordion>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
