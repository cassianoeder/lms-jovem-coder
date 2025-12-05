import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Code2, ArrowLeft, Settings as SettingsIcon, Award, Plus, Pencil, Trash2, Building, FileText, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SystemSettings {
  id: string;
  platform_name: string;
  logo_url: string | null;
  company_name: string | null;
  cnpj: string | null;
  institutional_text: string | null;
}

interface CertificateTemplate {
  id: string;
  name: string;
  type: string;
  template_html: string | null;
  signature_url: string | null;
  min_score: number;
  min_attendance: number;
  hours_load: number;
  is_active: boolean;
}

const Settings = () => {
  const { role } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);

  // Settings form
  const [platformName, setPlatformName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [institutionalText, setInstitutionalText] = useState("");

  // Template form
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] = useState("course");
  const [minScore, setMinScore] = useState(70);
  const [minAttendance, setMinAttendance] = useState(75);
  const [hoursLoad, setHoursLoad] = useState(40);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [settingsRes, templatesRes] = await Promise.all([
      supabase.from('system_settings').select('*').maybeSingle(),
      supabase.from('certificate_templates').select('*').order('name'),
    ]);

    if (settingsRes.data) {
      setSettings(settingsRes.data);
      setPlatformName(settingsRes.data.platform_name || "");
      setLogoUrl(settingsRes.data.logo_url || "");
      setCompanyName(settingsRes.data.company_name || "");
      setCnpj(settingsRes.data.cnpj || "");
      setInstitutionalText(settingsRes.data.institutional_text || "");
    }
    if (templatesRes.data) setTemplates(templatesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    if (settings) {
      const { error } = await supabase.from('system_settings').update({
        platform_name: platformName,
        logo_url: logoUrl || null,
        company_name: companyName || null,
        cnpj: cnpj || null,
        institutional_text: institutionalText || null,
        updated_at: new Date().toISOString(),
      }).eq('id', settings.id);

      if (error) {
        toast.error("Erro ao salvar configurações");
        return;
      }
      toast.success("Configurações salvas!");
      fetchData();
    }
  };

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: templateName,
      type: templateType,
      min_score: minScore,
      min_attendance: minAttendance,
      hours_load: hoursLoad,
      signature_url: signatureUrl || null,
      is_active: isActive,
    };

    if (selectedTemplate) {
      const { error } = await supabase.from('certificate_templates').update(payload).eq('id', selectedTemplate.id);
      if (error) {
        toast.error("Erro ao atualizar modelo");
        return;
      }
      toast.success("Modelo atualizado!");
    } else {
      const { error } = await supabase.from('certificate_templates').insert(payload);
      if (error) {
        toast.error("Erro ao criar modelo");
        return;
      }
      toast.success("Modelo criado!");
    }

    setDialogOpen(false);
    resetTemplateForm();
    fetchData();
  };

  const handleEditTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateType(template.type);
    setMinScore(template.min_score);
    setMinAttendance(template.min_attendance);
    setHoursLoad(template.hours_load);
    setSignatureUrl(template.signature_url || "");
    setIsActive(template.is_active);
    setDialogOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Excluir este modelo de certificado?")) return;
    const { error } = await supabase.from('certificate_templates').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir modelo");
      return;
    }
    toast.success("Modelo excluído!");
    fetchData();
  };

  const toggleTemplateActive = async (template: CertificateTemplate) => {
    const { error } = await supabase.from('certificate_templates').update({ is_active: !template.is_active }).eq('id', template.id);
    if (error) {
      toast.error("Erro ao atualizar modelo");
      return;
    }
    toast.success(template.is_active ? "Modelo desativado" : "Modelo ativado");
    fetchData();
  };

  const resetTemplateForm = () => {
    setSelectedTemplate(null);
    setTemplateName("");
    setTemplateType("course");
    setMinScore(70);
    setMinAttendance(75);
    setHoursLoad(40);
    setSignatureUrl("");
    setIsActive(true);
  };

  const isAdmin = role === 'admin';

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
            <Link to="/teacher">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Configurações</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="certificates">
          <TabsList className="mb-6">
            <TabsTrigger value="certificates">
              <Award className="w-4 h-4 mr-2" />
              Certificados
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="platform">
                <Building className="w-4 h-4 mr-2" />
                Plataforma
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="certificates">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Modelos de Certificados</h2>
                <p className="text-muted-foreground text-sm">Configure os requisitos e aparência dos certificados</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetTemplateForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />Novo Modelo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedTemplate ? "Editar Modelo" : "Novo Modelo de Certificado"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitTemplate} className="space-y-4">
                    <div>
                      <Label>Nome do Modelo</Label>
                      <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ex: Certificado Padrão" required />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select value={templateType} onValueChange={setTemplateType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course">Certificado de Curso</SelectItem>
                          <SelectItem value="module">Certificado de Módulo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Nota Mínima (%)</Label>
                        <Input type="number" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} min={0} max={100} />
                      </div>
                      <div>
                        <Label>Frequência Mín. (%)</Label>
                        <Input type="number" value={minAttendance} onChange={(e) => setMinAttendance(Number(e.target.value))} min={0} max={100} />
                      </div>
                      <div>
                        <Label>Carga Horária</Label>
                        <Input type="number" value={hoursLoad} onChange={(e) => setHoursLoad(Number(e.target.value))} min={1} />
                      </div>
                    </div>
                    <div>
                      <Label>URL da Assinatura</Label>
                      <Input value={signatureUrl} onChange={(e) => setSignatureUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {isActive ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                        <div>
                          <p className="font-medium">{isActive ? "Modelo Ativo" : "Modelo Inativo"}</p>
                          <p className="text-sm text-muted-foreground">{isActive ? "Disponível para emissão" : "Indisponível"}</p>
                        </div>
                      </div>
                      <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-gradient-primary">{selectedTemplate ? "Salvar" : "Criar"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {templates.length === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum modelo de certificado cadastrado</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nota Mín.</TableHead>
                      <TableHead>Freq. Mín.</TableHead>
                      <TableHead>Carga Horária</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{template.type === 'course' ? 'Curso' : 'Módulo'}</Badge>
                        </TableCell>
                        <TableCell>{template.min_score}%</TableCell>
                        <TableCell>{template.min_attendance}%</TableCell>
                        <TableCell>{template.hours_load}h</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={template.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                            {template.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => toggleTemplateActive(template)}>
                            {template.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditTemplate(template)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteTemplate(template.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="platform">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Configurações da Plataforma
                  </CardTitle>
                  <CardDescription>Personalize as informações da sua plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Plataforma</Label>
                      <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                    </div>
                    <div>
                      <Label>URL do Logo</Label>
                      <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <Label>Nome da Empresa</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                    </div>
                  </div>
                  <div>
                    <Label>Texto Institucional</Label>
                    <Textarea 
                      value={institutionalText} 
                      onChange={(e) => setInstitutionalText(e.target.value)}
                      rows={4}
                      placeholder="Texto que aparecerá nos certificados e páginas institucionais..."
                    />
                  </div>
                  <Button className="bg-gradient-primary hover:opacity-90" onClick={handleSaveSettings}>
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
