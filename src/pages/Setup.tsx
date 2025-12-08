import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, User, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface SetupFormData {
  supabaseUrl: string;
  supabaseKey: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

const Setup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"connection" | "admin" | "migrating" | "success" | "error">("connection");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [formData, setFormData] = useState<SetupFormData>({
    supabaseUrl: "",
    supabaseKey: "",
    adminEmail: "",
    adminPassword: "",
    adminName: "",
  });

  // Check if already configured
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (url && key) {
      // Try to connect and check if database is initialized
      checkDatabaseInitialized(url, key);
    }
  }, []);

  const checkDatabaseInitialized = async (url: string, key: string) => {
    try {
      const client = createClient(url, key);
      const { data, error } = await client.from("profiles").select("count").limit(1);
      
      if (error && error.code === "PGRST116") {
        // Table doesn't exist, need setup
        return;
      }
      
      // Database seems initialized, redirect to landing
      navigate("/");
    } catch (err) {
      // Not configured, stay on setup page
    }
  };

  const handleConnectionTest = async () => {
    if (!formData.supabaseUrl || !formData.supabaseKey) {
      setError("Por favor, preencha a URL e a chave do Supabase");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = createClient(formData.supabaseUrl, formData.supabaseKey);
      
      // Test connection
      const { error: testError } = await client.from("profiles").select("count").limit(1);
      
      if (testError && testError.code !== "PGRST116") {
        throw new Error(`Erro ao conectar: ${testError.message}`);
      }

      // Connection successful, move to admin step
      setStep("admin");
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o Supabase");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!formData.adminEmail || !formData.adminPassword || !formData.adminName) {
      setError("Por favor, preencha todos os campos do administrador");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("migrating");

    try {
      const client = createClient(formData.supabaseUrl, formData.supabaseKey);

      // Step 1: Run migrations
      setProgress("Executando migrações do banco de dados...");
      await runMigrations(client);

      // Step 2: Create admin user
      setProgress("Criando usuário administrador...");
      const { data: authData, error: authError } = await client.auth.signUp({
        email: formData.adminEmail,
        password: formData.adminPassword,
        options: {
          data: {
            full_name: formData.adminName,
            role: "admin",
          },
        },
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Falha ao criar usuário");
      }

      // Step 3: Set admin role
      setProgress("Configurando permissões do administrador...");
      const { error: roleError } = await client.rpc("admin_set_user_role", {
        target_user_id: authData.user.id,
        new_role: "admin",
      });

      // If RPC doesn't work, insert directly
      if (roleError) {
        const { error: insertError } = await client
          .from("user_roles")
          .upsert({
            user_id: authData.user.id,
            role: "admin",
          });

        if (insertError) {
          console.warn("Erro ao definir role via RPC, tentando inserção direta:", insertError);
        }
      }

      // Step 4: Save environment variables to localStorage (temporary)
      // In production, these should be set in .env file
      localStorage.setItem("setup_complete", "true");
      localStorage.setItem("supabase_url", formData.supabaseUrl);
      localStorage.setItem("supabase_key", formData.supabaseKey);

      setStep("success");
      setProgress("Configuração concluída com sucesso!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Erro durante a configuração";
      
      // Check if it's a migration error
      if (errorMessage.startsWith("MIGRATIONS_REQUIRED:")) {
        const instructions = errorMessage.replace("MIGRATIONS_REQUIRED:", "");
        setError(instructions);
        setStep("admin"); // Go back to admin step so user can retry after running migrations
      } else {
        setError(errorMessage);
        setStep("error");
      }
    } finally {
      setLoading(false);
    }
  };

  const runMigrations = async (client: any) => {
    // Check if tables exist to determine if migrations are needed
    const { error: checkError } = await client.from("profiles").select("count").limit(1);
    
    if (checkError && checkError.code === "PGRST116") {
      // Tables don't exist - need to run migrations
      // Since Supabase client doesn't support raw SQL execution,
      // we'll provide instructions to the user
      throw new Error(
        "MIGRATIONS_REQUIRED:" +
        "As tabelas do banco de dados não foram criadas.\n\n" +
        "Por favor, execute o seguinte procedimento:\n\n" +
        "1. Acesse o Supabase Dashboard\n" +
        "2. Vá em SQL Editor\n" +
        "3. Copie e cole o conteúdo do arquivo: scripts/consolidate-migrations.sql\n" +
        "4. Execute o script\n" +
        "5. Volte aqui e clique em 'Finalizar Configuração' novamente"
      );
    }

    // If we get here, tables exist (migrations may have been run manually)
    return;
  };

  if (step === "connection") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
              <Database className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
            <CardDescription>
              Conecte-se ao seu banco de dados Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="supabaseUrl">URL do Supabase</Label>
              <Input
                id="supabaseUrl"
                type="url"
                placeholder="https://seu-projeto.supabase.co"
                value={formData.supabaseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, supabaseUrl: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabaseKey">Chave Pública (anon key)</Label>
              <Input
                id="supabaseKey"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={formData.supabaseKey}
                onChange={(e) =>
                  setFormData({ ...formData, supabaseKey: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleConnectionTest}
              disabled={loading}
              className="w-full bg-gradient-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando conexão...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Essas informações podem ser encontradas no Dashboard do Supabase
              em Settings → API
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Criar Administrador</CardTitle>
            <CardDescription>
              Crie a conta do primeiro administrador do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="whitespace-pre-line">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="adminName">Nome Completo</Label>
              <Input
                id="adminName"
                type="text"
                placeholder="João Silva"
                value={formData.adminName}
                onChange={(e) =>
                  setFormData({ ...formData, adminName: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">E-mail</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@exemplo.com"
                value={formData.adminEmail}
                onChange={(e) =>
                  setFormData({ ...formData, adminEmail: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Senha</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="••••••••"
                value={formData.adminPassword}
                onChange={(e) =>
                  setFormData({ ...formData, adminPassword: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("connection")}
                disabled={loading}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSetup}
                disabled={loading}
                className="flex-1 bg-gradient-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  "Finalizar Configuração"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "migrating") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass border-border/50">
          <CardHeader className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <CardTitle className="text-2xl">Configurando Sistema</CardTitle>
            <CardDescription>{progress}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Configuração Concluída!</CardTitle>
            <CardDescription>
              O sistema foi configurado com sucesso. Redirecionando...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return null;
};

export default Setup;

