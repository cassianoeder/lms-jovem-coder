import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, FileText, Download, CheckCircle } from "lucide-react";

const Setup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"instructions" | "env" | "import" | "success">("instructions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  });

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveEnv = () => {
    if (!formData.supabaseUrl || !formData.supabaseKey) {
      setError("Por favor, preencha a URL e a chave do Supabase");
      return;
    }

    if (!validateUrl(formData.supabaseUrl)) {
      setError("Formato de URL inválido. Deve começar com https://");
      return;
    }

    if (!formData.supabaseUrl.includes(".supabase.co")) {
      setError("URL do Supabase inválida. Deve ser no formato https://seu-projeto.supabase.co");
      return;
    }

    // In a real environment, we would save to .env file
    // For now, we'll just proceed to next step
    setStep("import");
  };

  const handleFinishSetup = () => {
    // Simulate setup completion
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
      // Redirect to landing after 2 seconds
      setTimeout(() => {
        // Refresh the page to reload environment variables
        window.location.reload();
      }, 2000);
    }, 1500);
  };

  if (step === "instructions") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl glass border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
              <Database className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
            <CardDescription>Configure seu novo banco de dados Supabase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Passo 1: Criar Projeto no Supabase</h3>
              <p className="text-muted-foreground text-sm"> {/* Adjusted text size for mobile */}
                Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Dashboard do Supabase</a> e crie um novo projeto.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Passo 2: Configurar Variáveis de Ambiente</h3>
              <p className="text-muted-foreground text-sm"> {/* Adjusted text size for mobile */}
                Após criar seu projeto, obtenha a URL e a Chave Anônima e preencha os campos na próxima etapa.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Passo 3: Importar Esquema do Banco de Dados</h3>
              <p className="text-muted-foreground text-sm"> {/* Adjusted text size for mobile */}
                Você precisará importar o esquema do banco de dados usando o script que preparamos.
              </p>
              <Button 
                onClick={() => {
                  // In a real environment, this would download the file
                  alert("O script 'scripts/full-database-schema.sql' foi gerado. Use-o no SQL Editor do seu projeto Supabase.");
                }} 
                className="w-full bg-gradient-primary"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Script de Importação (scripts/full-database-schema.sql)
              </Button>
            </div>
            <Button onClick={() => setStep("env")} className="w-full bg-gradient-primary">
              Continuar para Configuração
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "env") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
              <Database className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Configuração do Supabase</CardTitle>
            <CardDescription>Insira as credenciais do seu novo projeto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
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
                onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Exemplo: https://xyz123.supabase.co</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabaseKey">Chave Pública (anon key)</Label>
              <Input 
                id="supabaseKey" 
                type="password" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                value={formData.supabaseKey} 
                onChange={(e) => setFormData({ ...formData, supabaseKey: e.target.value })}
              />
            </div>
            <div className="flex gap-2 flex-col sm:flex-row"> {/* Adjusted for responsiveness */}
              <Button variant="outline" onClick={() => setStep("instructions")} className="w-full sm:w-auto"> {/* Adjusted width for mobile */}
                Voltar
              </Button>
              <Button onClick={handleSaveEnv} className="flex-1 bg-gradient-primary">
                Salvar e Continuar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Essas informações devem ser adicionadas ao seu arquivo <code className="bg-muted px-1 rounded">.env</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "import") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl glass border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Importar Esquema do Banco de Dados</CardTitle>
            <CardDescription>Execute o script para criar tabelas e funções</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Instruções</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm"> {/* Adjusted text size for mobile */}
                <li>
                  Acesse o <strong>SQL Editor</strong> no Dashboard do seu projeto Supabase
                </li>
                <li>
                  Abra o arquivo <code className="bg-muted px-1 rounded">scripts/full-database-schema.sql</code> que foi gerado
                </li>
                <li>
                  Copie todo o conteúdo do arquivo
                </li>
                <li>
                  Cole o conteúdo no editor SQL do Supabase
                </li>
                <li>
                  Clique em <strong>Run</strong> para executar o script
                </li>
              </ol>
            </div>
            <Alert>
              <AlertDescription className="text-sm"> {/* Adjusted text size for mobile */}
                <strong>Importante:</strong> Aguarde a execução completa do script antes de continuar. Isso pode levar alguns segundos.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 flex-col sm:flex-row"> {/* Adjusted for responsiveness */}
              <Button variant="outline" onClick={() => setStep("env")} className="w-full sm:w-auto"> {/* Adjusted width for mobile */}
                Voltar
              </Button>
              <Button onClick={handleFinishSetup} disabled={loading} className="flex-1 bg-gradient-primary">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Concluir Configuração"
                )}
              </Button>
            </div>
          </CardContent>
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
            <CardDescription>O sistema está pronto para uso. Redirecionando...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return null;
};

export default Setup;