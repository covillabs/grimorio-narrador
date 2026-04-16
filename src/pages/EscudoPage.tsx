import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Skull, Sword, HeartPulse, Scale, ShieldAlert } from "lucide-react";

export default function EscudoPage() {
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
    </div>
  );
}
