import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const certificateId = url.searchParams.get('certificate_id');
    
    if (!certificateId) {
      return new Response('Certificate ID is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Importar o cliente Supabase
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do certificado
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (error || !certificate) {
      return new Response('Certificate not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Gerar HTML do certificado
    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificado - ${certificate.course_name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400;500;700&display=swap');
          
          body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .certificate-container {
            width: 800px;
            max-width: 90vw;
            height: 600px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            position: relative;
            border: 8px solid #FFD700;
            overflow: hidden;
          }
          
          .certificate-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255, 215, 0, 0.03) 10px,
                transparent 10px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 10px,
                rgba(255, 215, 0, 0.03) 10px,
                transparent 10px
              );
            opacity: 0.5;
          }
          
          .certificate-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
          }
          
          .certificate-title {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          }
          
          .certificate-subtitle {
            font-size: 20px;
            color: #34495e;
            margin-bottom: 20px;
            font-weight: 500;
          }
          
          .certificate-body {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
          }
          
          .student-name {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 15px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }
          
          .certificate-text {
            font-size: 18px;
            color: #34495e;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          
          .certificate-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            position: relative;
            z-index: 2;
          }
          
          .certificate-date {
            font-size: 14px;
            color: #7f8c8d;
          }
          
          .certificate-code {
            font-size: 14px;
            color: #7f8c8d;
            font-family: 'Courier New', monospace;
            background: #f8f9fa;
            padding: 5px 10px;
            border-radius: 5px;
          }
          
          .seal {
            position: absolute;
            bottom: 30px;
            right: 40px;
            width: 120px;
            height: 120px;
            border: 4px solid #FFD700;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 3;
          }
          
          .seal-text {
            font-family: 'Playfair Display', serif;
            font-size: 14px;
            font-weight: 700;
            color: #2c3e50;
            text-align: center;
          }
          
          .ribbon {
            position: absolute;
            top: 20px;
            right: -30px;
            background: #FF6B6B;
            color: white;
            padding: 10px 40px;
            transform: rotate(45deg);
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 4;
          }
          
          @media print {
            body {
              background: white;
            }
            
            .certificate-container {
              box-shadow: none;
              border: 2px solid #333;
            }
            
            .certificate-background {
              display: none;
            }
            
            .ribbon {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="certificate-background"></div>
          <div class="ribbon">CERTIFICADO</div>
          
          <div class="certificate-header">
            <div class="certificate-title">Certificado de Conclusão</div>
            <div class="certificate-subtitle">${certificate.course_name}</div>
          </div>
          
          <div class="certificate-body">
            <div class="student-name">${certificate.student_name}</div>
            <div class="certificate-text">
              Certificamos que <strong>${certificate.student_name}</strong> concluiu com sucesso<br/>
              o curso <strong>${certificate.course_name}</strong><br/>
              com aproveitamento de <strong>${certificate.score || 100}%</strong><br/>
              <br/>
              <em>Este certificado comprova a conclusão do curso e pode ser validado através do código: <strong>${certificate.validation_code}</strong></em>
            </div>
          </div>
          
          <div class="certificate-footer">
            <div class="certificate-date">
              Emitido em: ${new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
            </div>
            <div class="certificate-code">
              Código: ${certificate.validation_code}
            </div>
          </div>
          
          <div class="seal">
            <div class="seal-text">JovemCoder</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Usar um serviço de geração de PDF
    // Vamos usar o serviço do Deno para converter HTML para PDF
    const pdfCommand = new Deno.Command(Deno.execPath(), [
      "run",
      "-A",
      "allow-net",
      "allow-read",
      "allow-env",
      "unstable",
      "https://deno.land/x/pdf@0.1.11/pdf.ts",
      "generate",
      "--format=A4",
      "--orientation=landscape",
      "--border=0.5cm",
      "--background-color=white",
      "--css=body { margin: 0; padding: 0; }",
      "--css=@page { margin: 0; size: A4 landscape; }",
      "-",
      "https://deno.land/std@0.190.0/examples/pdf.ts",
      certificateHtml,
    ]);

    const { code, stdout, stderr } = await pdfCommand.output();

    if (code !== 0) {
      console.error('Error generating PDF:', stderr);
      return new Response('Error generating PDF', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    return new Response(stdout, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-${certificate.course_name.replace(/\s+/g, '-')}-${certificateId}.pdf"`,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error in certificate generation:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});