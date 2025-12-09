import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, ExternalLink, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";

type Certificate = Tables<'certificates'>;

const CertificateValidation = () => {
  const { validationCode } = useParams<{ validationCode: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!validationCode) {
        setError("Código de validação não fornecido.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('validation_code', validationCode)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCertificate(data);
        } else {
          setError("Certificado não encontrado ou código inválido.");
        }
      } catch (err: any) {
        console.error("Error fetching certificate:", err.message);
        setError("Erro ao buscar certificado. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [validationCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Award className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">Validação de Certificado</span>
        </Link>

        {error ? (
          <Card className="glass border-border/50 text-center">
            <CardContent className="py-12">
              <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
              <CardTitle className="text-xl text-destructive mb-2">Erro na Validação</CardTitle>
              <CardDescription className="text-muted-foreground">{error}</CardDescription>
              <Link to="/" className="mt-6 inline-block">
                <Button variant="outline">Voltar à Página Inicial</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-border/50">
            <CardHeader className="text-center pb-3">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-xp flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">{certificate?.course_name}</CardTitle>
              <CardDescription>Certificado de Conclusão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground">Emitido para:</p>
                <p className="font-display text-lg font-bold text-foreground">{certificate?.student_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground">Carga Horária</p>
                  <p className="font-bold text-foreground">{certificate?.hours_load || 0}h</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground">Nota Final</p>
                  <p className="font-bold text-foreground">{certificate?.score || 0}%</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground">Código de Validação</p>
                <p className="font-mono font-bold text-foreground">{certificate?.validation_code}</p>
              </div>
              <div className="flex gap-2">
                {certificate?.pdf_url ? (
                  <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button className="w-full bg-gradient-primary hover:opacity-90">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Imagem (PNG)
                    </Button>
                  </a>
                ) : (
                  <Button className="flex-1 bg-gradient-primary hover:opacity-90" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Imagem em processamento
                  </Button>
                )}
                <Link to="/student/certificates">
                  <Button variant="outline" title="Voltar aos meus certificados">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Este certificado foi emitido por JovemCoder em {certificate?.issued_at ? new Date(certificate.issued_at).toLocaleDateString('pt-BR') : 'data desconhecida'}.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CertificateValidation;