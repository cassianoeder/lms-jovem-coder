import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Setup from "@/pages/Setup";

const SetupGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = () => {
      // Verifica se as variáveis de ambiente estão configuradas
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setNeedsSetup(true);
      } else {
        // Se as variáveis estiverem configuradas, assumimos que o setup foi feito
        // Em um ambiente real, você poderia fazer uma chamada de teste aqui
        setNeedsSetup(false);
      }
      setLoading(false);
    };

    checkSetup();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (needsSetup) {
    return <Setup />;
  }

  return <>{children}</>;
};

export default SetupGuard;