import React, { useEffect, useState } from 'react';
import { Award, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

interface CertificateData {
  student_name: string;
  course_name: string;
  hours_load: number | null;
  score: number | null;
  issued_at: string;
  validation_code: string;
}

type SystemSettings = Tables<'system_settings'>;

const CertificateTemplateDisplay = React.forwardRef<HTMLDivElement, { certificate: CertificateData }>(
  ({ certificate }, ref) => {
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    useEffect(() => {
      const fetchSettings = async () => {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .maybeSingle();
        if (error) {
          console.error("Error fetching system settings:", error);
        } else {
          setSettings(data);
        }
      };
      fetchSettings();
    }, []);

    const platformName = settings?.platform_name || "JovemCoder";
    const companyName = settings?.company_name || "JovemCoder Ltda.";
    const institutionalText = settings?.institutional_text || "Certificamos que o(a) aluno(a) abaixo concluiu com êxito o curso/módulo.";
    const signatureUrl = settings?.logo_url || "https://storage.googleapis.com/gpt-engineer-file-uploads/DyTOn2DQUDaKjPuJu1LQihxcKzj2/uploads/1764944196263-2181.png"; // Placeholder for signature/logo

    return (
      <div
        ref={ref}
        className="relative w-[800px] h-[600px] bg-white text-gray-900 p-12 flex flex-col justify-between items-center shadow-xl border-8 border-primary-foreground"
        style={{ backgroundImage: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)' }}
      >
        {/* Background elements */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/cubes.png)' }}></div>
        <div className="absolute top-8 left-8">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={platformName} className="h-16" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="font-display text-2xl font-bold text-gray-800">{platformName}</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-8 right-8 text-right text-sm text-gray-600">
          <p>{companyName}</p>
          {settings?.cnpj && <p>CNPJ: {settings.cnpj}</p>}
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center text-center z-10 mt-8">
          <h1 className="font-display text-5xl font-extrabold text-primary mb-4">CERTIFICADO</h1>
          <p className="text-xl font-semibold text-gray-700 mb-6">{institutionalText}</p>
          
          <h2 className="font-display text-6xl font-bold text-gray-900 mb-8 leading-tight">
            {certificate.student_name}
          </h2>

          <p className="text-2xl text-gray-800 mb-4">
            pela conclusão do curso/módulo
          </p>
          <p className="font-display text-4xl font-bold text-accent mb-8">
            "{certificate.course_name}"
          </p>

          <div className="flex justify-center gap-8 text-lg text-gray-700">
            {certificate.hours_load && (
              <p className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Carga Horária: <span className="font-bold">{certificate.hours_load} horas</span>
              </p>
            )}
            {certificate.score !== null && (
              <p className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Nota Final: <span className="font-bold">{certificate.score}%</span>
              </p>
            </p>
            )}
          </div>
        </div>

        {/* Footer / Signature */}
        <div className="w-full flex justify-between items-end z-10 mt-auto">
          <div className="text-left text-sm text-gray-600">
            <p>Emitido em: {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}</p>
            <p>Código de Validação: <span className="font-mono font-bold">{certificate.validation_code}</span></p>
            <p>Verifique em: {window.location.origin}/certificate/validate/{certificate.validation_code}</p>
          </div>
          <div className="text-center">
            {signatureUrl && (
              <img src={signatureUrl} alt="Assinatura" className="h-20 w-auto mx-auto mb-2" />
            )}
            <div className="border-t border-gray-400 pt-2">
              <p className="font-semibold text-gray-800">Direção {platformName}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplateDisplay.displayName = "CertificateTemplateDisplay";

export default CertificateTemplateDisplay;