import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import Setup from "@/pages/Setup";

const SetupGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Check if environment variables are set
      if (!supabaseUrl || !supabaseKey) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      try {
        const client = createClient(supabaseUrl, supabaseKey);
        
        // Try to query a table to check if database is initialized
        const { error } = await client.from("profiles").select("count").limit(1);
        
        if (error) {
          // If error is "relation does not exist", database needs setup
          if (error.code === "PGRST116" || error.message.includes("does not exist")) {
            setNeedsSetup(true);
          } else {
            // Other errors might be connection issues, but we'll assume setup is needed
            setNeedsSetup(true);
          }
        } else {
          // Database seems initialized
          setNeedsSetup(false);
        }
      } catch (err) {
        // Error connecting, assume setup is needed
        setNeedsSetup(true);
      } finally {
        setLoading(false);
      }
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



