import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, ArrowLeft, Award, Download, ExternalLink, Copy, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Certificate {
  id: string;
  validation_code: string;
  issued_at: string;
  student_name: string;
  course_name: string;
  hours_load: number | null;
  score: number | null;
  pdf_url: string | null;
}

const MyCertificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (data) setCertificates(data);
      setLoading(false);
    };

    fetchCertificates();
  }, [user]);

  const copyValidationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadCertificate = async (certificate: Certificate) => {
    if (!certificate.pdf_url) {
      toast.error("Certificado ainda está sendo processado. Tente novamente em alguns instantes.");
      return;
    }

    try {
      // Fazer download do PDF
      const response = await fetch(certificate.pdf_url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${certificate.course_name.replace(/\s+/g, '-')}-${certificate.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Certificado baixado com sucesso!");
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error("Erro ao baixar certificado. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/student">
              <Button variant="outline" size="icon"><ArrowLeft className="w-5 h-5 text-foreground" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-xp flex items-center justify-center">
                <Award className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Meus Certificados</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {certificates.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Você ainda não possui certificados</p>
              <p className="text-sm text-muted-foreground">Complete cursos para receber seus certificados!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <Card key={cert.id} className="glass border-border/50 border-badge-gold/30 hover:border-badge-gold/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-xp flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cert.course_name}</CardTitle>
                      <CardDescription>
                        Emitido em {new Date(cert.issued_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground">Código de Validação</p>
                        <p className="font-mono font-bold text-foreground">{cert.validation_code}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyValidationCode(cert.validation_code)}
                      >
                        {copiedCode === cert.validation_code ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {cert.hours_load && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent">
                          {cert.hours_load}h
                        </Badge>
                      )}
                      {cert.score && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Nota: {cert.score}%
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {cert.pdf_url ? (
                        <Button 
                          className="flex-1 bg-gradient-primary hover:opacity-90"
                          onClick={() => downloadCertificate(cert)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar PDF
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1 bg-gradient-primary hover:opacity-90" 
                          disabled
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Gerando PDF...
                        </Button>
                      )}
                      
                      <Link to={`/certificate/validate/${cert.validation_code}`}>
                        <Button variant="outline">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCertificates;