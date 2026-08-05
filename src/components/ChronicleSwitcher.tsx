import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// === Namespace de Isolamento por Usuário ===
// Todas as chaves do localStorage são prefixadas por userId para impedir
// vazamento de dados entre conta autenticada e modo Convidado.

/** Retorna o userId ativo (ex: "abc-123" ou "guest") */
export function getActiveUserId(): string {
  return localStorage.getItem("v5_active_user_id") || "guest";
}

/** Retorna o ID da crônica ativa para o userId atual */
export function getActiveChronicleId(): string {
  const userId = getActiveUserId();
  return localStorage.getItem(`${userId}_v5_active_chronicle_id`) || "default";
}

/** Gera a chave final com namespace: {userId}_{chronicleId}_{baseKey} */
export function getPrefixedKey(baseKey: string): string {
  const userId = getActiveUserId();
  const chronicleId = getActiveChronicleId();
  // Chaves globais do sistema de crônica são por-user mas não por-crônica
  const isChronicleMetaKey = baseKey === "v5_chronicles_list" || baseKey === "v5_active_chronicle_id";
  if (isChronicleMetaKey) {
    return `${userId}_${baseKey}`;
  }
  return `${userId}_${chronicleId}_${baseKey}`;
}

/** Retorna a lista de crônicas do userId atual */
export function getChronicles() {
  const userId = getActiveUserId();
  const stored = localStorage.getItem(`${userId}_v5_chronicles_list`);
  return stored ? JSON.parse(stored) : [{ id: "default", name: "Crônica Principal" }];
}

/** Checa se o userId ativo é o modo Convidado */
export function isGuestMode(): boolean {
  return getActiveUserId() === "guest";
}

export function ChronicleSwitcher() {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChronicleName, setNewChronicleName] = useState("");
  
  const chronicles = getChronicles();
  const activeId = getActiveChronicleId();
  const activeChronicle = chronicles.find((c: any) => c.id === activeId) || chronicles[0];

  const switchChronicle = (id: string) => {
    const userId = getActiveUserId();
    localStorage.setItem(`${userId}_v5_active_chronicle_id`, id);
    window.location.reload();
  };

  const createChronicle = () => {
    if (!newChronicleName.trim()) return;
    const userId = getActiveUserId();
    const newId = "chr_" + Date.now();
    const updated = [...chronicles, { id: newId, name: newChronicleName }];
    localStorage.setItem(`${userId}_v5_chronicles_list`, JSON.stringify(updated));
    localStorage.setItem(`${userId}_v5_active_chronicle_id`, newId);
    window.location.reload();
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between border-border bg-background/50 hover:bg-muted/50 hidden md:flex"
          >
            <span className="truncate">{activeChronicle.name}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 border-border bg-zinc-950">
          <Command>
            <CommandList>
              <CommandGroup heading="Suas Crônicas">
                {chronicles.map((chronicle: any) => (
                  <CommandItem
                    key={chronicle.id}
                    onSelect={() => {
                      switchChronicle(chronicle.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer text-sm"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        activeId === chronicle.id ? "opacity-100 text-primary" : "opacity-0"
                      }`}
                    />
                    {chronicle.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                  className="cursor-pointer text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Crônica
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif">Criar Nova Crônica</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={newChronicleName}
                onChange={(e) => setNewChronicleName(e.target.value)}
                placeholder="Ex: Noites de Seattle"
                className="col-span-3"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Criar uma nova crônica iniciará um grimório totalmente limpo. Você poderá alternar entre suas crônicas a qualquer momento sem perder os dados da atual.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={createChronicle} className="bg-blood hover:bg-blood/80 text-white">Iniciar Jogo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
