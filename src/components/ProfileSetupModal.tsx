import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Skull } from "lucide-react";

export function ProfileSetupModal() {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: username.trim(),
          avatar_url: user.user_metadata?.avatar_url || null,
        });

      if (error) throw error;
      
      toast.success("Sangue reconhecido. Bem-vindo, Narrador.");
      await refreshProfile();
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        toast.error("Este nome já pertence a outro Ancião nas sombras.");
      } else {
        toast.error(error.message || "Ocorreu um erro ao selar o pacto.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-blood/30 p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(139,0,0,0.15)] animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blood/10 rounded-full flex items-center justify-center border border-blood/30 shadow-[0_0_15px_rgba(220,20,60,0.2)]">
            <Skull className="w-8 h-8 text-blood-glow animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-2xl font-serif font-bold text-center text-white mb-2 uppercase tracking-widest">
          Revelação de Identidade
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-8 leading-relaxed">
          Sua alma adentrou o Grimório, mas as sombras ainda não conhecem o seu título. Como deseja ser chamado nas noites que virão?
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 ml-1">
              Título do Narrador
            </label>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: Príncipe Sebastian, Beckett..."
              className="h-12 bg-background/50 border-blood/20 focus:border-blood text-center text-lg rounded-xl"
              maxLength={30}
              required
            />
          </div>

          <Button 
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="w-full h-12 bg-blood hover:bg-blood/80 text-white font-bold tracking-wider uppercase transition-all"
          >
            {isSubmitting ? "Selando Pacto..." : "Assinar com Sangue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
