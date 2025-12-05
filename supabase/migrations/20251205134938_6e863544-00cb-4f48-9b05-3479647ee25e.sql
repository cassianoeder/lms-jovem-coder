-- System settings table for platform configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text DEFAULT 'CodeQuest',
  logo_url text,
  company_name text,
  cnpj text,
  institutional_text text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.system_settings (platform_name) VALUES ('CodeQuest') ON CONFLICT DO NOTHING;

-- Certificate templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'course', -- 'course' or 'module'
  template_html text,
  signature_url text,
  min_score integer DEFAULT 70,
  min_attendance integer DEFAULT 75,
  hours_load integer DEFAULT 40,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates" ON public.certificate_templates
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage templates" ON public.certificate_templates
  FOR ALL USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

-- Certificates issued table
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid REFERENCES public.certificate_templates(id),
  course_id uuid REFERENCES public.courses(id),
  module_id uuid REFERENCES public.modules(id),
  class_id uuid REFERENCES public.classes(id),
  validation_code text UNIQUE NOT NULL,
  issued_at timestamp with time zone DEFAULT now(),
  student_name text NOT NULL,
  course_name text NOT NULL,
  hours_load integer,
  score numeric(5,2),
  pdf_url text
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can validate certificates" ON public.certificates
  FOR SELECT USING (true);

CREATE POLICY "System can create certificates" ON public.certificates
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Function to generate unique validation code
CREATE OR REPLACE FUNCTION generate_certificate_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;