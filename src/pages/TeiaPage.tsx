import { Network } from "lucide-react";

export default function TeiaPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold">Teia de Intrigas</h1>
        <p className="text-muted-foreground mt-1">Mapa de relacionamentos entre personagens</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg">
        <Network className="w-16 h-16 mb-4 opacity-30" />
        <p className="font-serif text-lg">Grafo Interativo</p>
        <p className="text-sm mt-2">Adicione personagens e NPCs para visualizar suas conexões.</p>
        <p className="text-xs mt-1 text-muted-foreground/60">React Flow será integrado na Fase 4</p>
      </div>
    </div>
  );
}
