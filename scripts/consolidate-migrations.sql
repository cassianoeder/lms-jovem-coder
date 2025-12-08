-- Script consolidado de todas as migrações do sistema
-- Execute este script no SQL Editor do Supabase Dashboard

-- ============================================
-- MIGRAÇÃO 1: Estrutura Base
-- ============================================

-- Create role enum
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('student', 'teacher', 'coordinator', 'admin');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_public boolean DEFAULT true,
  status text DEFAULT 'active',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status text DEFAULT 'pending',
  UNIQUE (student_id, class_id)
);

-- Create courses/modules table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create modules table (linked to courses)
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 10,
  duration_minutes INTEGER DEFAULT 0,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'code', 'logic')),
  language TEXT CHECK (language IN ('python', 'javascript', 'sql')),
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  xp_reward INTEGER DEFAULT 20,
  starter_code TEXT,
  solution_code TEXT,
  test_cases JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create questions table (for multiple choice)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER DEFAULT 0
);

-- Create student_progress table
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  score INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique indexes for student_progress
CREATE UNIQUE INDEX IF NOT EXISTS student_progress_user_lesson_unique 
ON public.student_progress (user_id, lesson_id) 
WHERE lesson_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS student_progress_user_exercise_unique 
ON public.student_progress (user_id, exercise_id) 
WHERE exercise_id IS NOT NULL;

-- Create student_xp table
CREATE TABLE IF NOT EXISTS public.student_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create streaks table
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_requirement INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create student_badges table
CREATE TABLE IF NOT EXISTS public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- Create daily_missions table
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_count INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 50,
  mission_type TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Create student_missions table
CREATE TABLE IF NOT EXISTS public.student_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.daily_missions(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, mission_id, date)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tests table
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 1,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Test questions linking table
CREATE TABLE IF NOT EXISTS public.test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0
);

-- Student test attempts
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  score INTEGER,
  UNIQUE (user_id, test_id, started_at)
);

-- Create enrollment_requests table
CREATE TABLE IF NOT EXISTS public.enrollment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  message text,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Create class_courses junction table
CREATE TABLE IF NOT EXISTS public.class_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, course_id)
);

-- System settings table
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

-- Certificate templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'course',
  template_html text,
  signature_url text,
  min_score integer DEFAULT 70,
  min_attendance integer DEFAULT 75,
  hours_load integer DEFAULT 40,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

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

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to generate certificate code
CREATE OR REPLACE FUNCTION public.generate_certificate_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Function to check if module is completed
CREATE OR REPLACE FUNCTION public.is_module_completed(_user_id uuid, _module_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_lessons integer;
  _completed_lessons integer;
  _total_exercises integer;
  _completed_exercises integer;
BEGIN
  SELECT COUNT(*) INTO _total_lessons
  FROM public.lessons
  WHERE module_id = _module_id;
  
  SELECT COUNT(DISTINCT sp.lesson_id) INTO _completed_lessons
  FROM public.student_progress sp
  INNER JOIN public.lessons l ON l.id = sp.lesson_id
  WHERE sp.user_id = _user_id
    AND sp.lesson_id IS NOT NULL
    AND sp.completed = true
    AND l.module_id = _module_id;
  
  IF _total_lessons = 0 THEN
    RETURN false;
  END IF;
  
  IF _completed_lessons < _total_lessons THEN
    RETURN false;
  END IF;
  
  SELECT COUNT(*) INTO _total_exercises
  FROM public.exercises e
  INNER JOIN public.lessons l ON l.id = e.lesson_id
  WHERE l.module_id = _module_id;
  
  IF _total_exercises = 0 THEN
    RETURN true;
  END IF;
  
  SELECT COUNT(DISTINCT sp.exercise_id) INTO _completed_exercises
  FROM public.student_progress sp
  INNER JOIN public.exercises e ON e.id = sp.exercise_id
  INNER JOIN public.lessons l ON l.id = e.lesson_id
  WHERE sp.user_id = _user_id
    AND sp.exercise_id IS NOT NULL
    AND sp.completed = true
    AND l.module_id = _module_id;
  
  RETURN _completed_exercises >= _total_exercises;
END;
$$;

-- Function to emit module certificate
CREATE OR REPLACE FUNCTION public.emit_module_certificate(_user_id uuid, _module_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _module_record record;
  _template_record record;
  _profile_record record;
  _class_id uuid;
  _certificate_id uuid;
  _validation_code text;
  _avg_score numeric(5,2);
  _total_hours integer;
BEGIN
  SELECT id INTO _certificate_id
  FROM public.certificates
  WHERE user_id = _user_id
    AND module_id = _module_id;
  
  IF _certificate_id IS NOT NULL THEN
    RETURN _certificate_id;
  END IF;
  
  SELECT m.*, c.id as course_id, c.title as course_title, m.title as module_title
  INTO _module_record
  FROM public.modules m
  INNER JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = _module_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Module not found';
  END IF;
  
  SELECT * INTO _profile_record
  FROM public.profiles
  WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  SELECT * INTO _template_record
  FROM public.certificate_templates
  WHERE type = 'module'
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  SELECT cc.class_id INTO _class_id
  FROM public.class_courses cc
  INNER JOIN public.enrollments e ON e.class_id = cc.class_id
  WHERE cc.course_id = _module_record.course_id
    AND e.student_id = _user_id
    AND e.status = 'approved'
  LIMIT 1;
  
  SELECT COALESCE(AVG(sp.score), 0) INTO _avg_score
  FROM public.student_progress sp
  INNER JOIN public.exercises e ON e.id = sp.exercise_id
  INNER JOIN public.lessons l ON l.id = e.lesson_id
  WHERE sp.user_id = _user_id
    AND sp.exercise_id IS NOT NULL
    AND sp.completed = true
    AND l.module_id = _module_id
    AND sp.score IS NOT NULL;
  
  SELECT COALESCE(SUM(duration_minutes), 0) / 60 INTO _total_hours
  FROM public.lessons
  WHERE module_id = _module_id;
  
  _validation_code := public.generate_certificate_code();
  
  WHILE EXISTS (SELECT 1 FROM public.certificates WHERE validation_code = _validation_code) LOOP
    _validation_code := public.generate_certificate_code();
  END LOOP;
  
  INSERT INTO public.certificates (
    user_id,
    template_id,
    course_id,
    module_id,
    class_id,
    validation_code,
    student_name,
    course_name,
    hours_load,
    score
  ) VALUES (
    _user_id,
    _template_record.id,
    _module_record.course_id,
    _module_id,
    _class_id,
    _validation_code,
    COALESCE(_profile_record.full_name, 'Estudante'),
    _module_record.course_title || ' - ' || _module_record.module_title,
    _total_hours,
    _avg_score
  )
  RETURNING id INTO _certificate_id;
  
  RETURN _certificate_id;
END;
$$;

-- Function to check and emit certificate after lesson completion
CREATE OR REPLACE FUNCTION public.check_module_completion_and_emit_certificate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lesson_record record;
  _module_id uuid;
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    SELECT * INTO _lesson_record
    FROM public.lessons
    WHERE id = NEW.lesson_id;
    
    IF FOUND AND _lesson_record.module_id IS NOT NULL THEN
      _module_id := _lesson_record.module_id;
      
      IF public.is_module_completed(NEW.user_id, _module_id) THEN
        PERFORM public.emit_module_certificate(NEW.user_id, _module_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to check and emit certificate after exercise completion
CREATE OR REPLACE FUNCTION public.check_module_completion_after_exercise()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _exercise_record record;
  _module_id uuid;
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    SELECT e.*, l.module_id INTO _exercise_record
    FROM public.exercises e
    INNER JOIN public.lessons l ON l.id = e.lesson_id
    WHERE e.id = NEW.exercise_id;
    
    IF FOUND AND _exercise_record.module_id IS NOT NULL THEN
      _module_id := _exercise_record.module_id;
      
      IF public.is_module_completed(NEW.user_id, _module_id) THEN
        PERFORM public.emit_module_certificate(NEW.user_id, _module_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function for admin to update user role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id UUID, new_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET role = new_role;
  
  RETURN TRUE;
END;
$$;

-- Trigger to create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  requested_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'));
  
  requested_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'student');
  
  IF requested_role IN ('teacher', 'coordinator', 'admin') THEN
    requested_role := 'student';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role);
  
  IF requested_role = 'student' THEN
    INSERT INTO public.student_xp (user_id) VALUES (NEW.id);
    INSERT INTO public.streaks (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for certificate emission
DROP TRIGGER IF EXISTS check_module_certificate_trigger ON public.student_progress;
CREATE TRIGGER check_module_certificate_trigger
  AFTER INSERT OR UPDATE ON public.student_progress
  FOR EACH ROW
  WHEN (NEW.lesson_id IS NOT NULL AND NEW.completed = true)
  EXECUTE FUNCTION public.check_module_completion_and_emit_certificate();

DROP TRIGGER IF EXISTS check_module_certificate_after_exercise_trigger ON public.student_progress;
CREATE TRIGGER check_module_certificate_after_exercise_trigger
  AFTER INSERT OR UPDATE ON public.student_progress
  FOR EACH ROW
  WHEN (NEW.exercise_id IS NOT NULL AND NEW.completed = true)
  EXECUTE FUNCTION public.check_module_completion_after_exercise();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - see individual migration files for complete policies)
-- Profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User Roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'));
DROP POLICY IF EXISTS "Only admins can create teacher or coordinator roles" ON public.user_roles;
CREATE POLICY "Only admins can create teacher or coordinator roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((role = 'student' AND auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));

-- Classes
DROP POLICY IF EXISTS "Anyone can view public classes" ON public.classes;
CREATE POLICY "Anyone can view public classes" ON public.classes FOR SELECT USING (is_public = true OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coordinator'));
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
CREATE POLICY "Students can view enrolled classes" ON public.classes FOR SELECT USING (EXISTS (SELECT 1 FROM public.enrollments WHERE enrollments.class_id = classes.id AND enrollments.student_id = auth.uid() AND enrollments.status = 'approved'));
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
CREATE POLICY "Teachers can create classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
CREATE POLICY "Teachers can update own classes" ON public.classes FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Teachers can delete own classes" ON public.classes;
CREATE POLICY "Teachers can delete own classes" ON public.classes FOR DELETE USING ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Enrollments
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (student_id = auth.uid() AND status = 'approved');
DROP POLICY IF EXISTS "Students can view pending enrollments" ON public.enrollments;
CREATE POLICY "Students can view pending enrollments" ON public.enrollments FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS "Teachers can view class enrollments" ON public.enrollments;
CREATE POLICY "Teachers can view class enrollments" ON public.enrollments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));
DROP POLICY IF EXISTS "Teachers can manage enrollments" ON public.enrollments;
CREATE POLICY "Teachers can manage enrollments" ON public.enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Courses
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Teachers can manage courses" ON public.courses;
CREATE POLICY "Teachers can manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Modules
DROP POLICY IF EXISTS "Anyone can view active modules" ON public.modules;
CREATE POLICY "Anyone can view active modules" ON public.modules FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Teachers can manage modules" ON public.modules;
CREATE POLICY "Teachers can manage modules" ON public.modules FOR ALL USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

-- Lessons
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Teachers can manage lessons" ON public.lessons;
CREATE POLICY "Teachers can manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Exercises
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Teachers can manage exercises" ON public.exercises;
CREATE POLICY "Teachers can manage exercises" ON public.exercises FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Questions
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Teachers can manage questions" ON public.questions;
CREATE POLICY "Teachers can manage questions" ON public.questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Student Progress
DROP POLICY IF EXISTS "Students can view own progress" ON public.student_progress;
CREATE POLICY "Students can view own progress" ON public.student_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Students can update own progress" ON public.student_progress;
CREATE POLICY "Students can update own progress" ON public.student_progress FOR ALL TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Teachers can view all progress" ON public.student_progress;
CREATE POLICY "Teachers can view all progress" ON public.student_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));

-- Student XP
DROP POLICY IF EXISTS "Students can view own xp" ON public.student_xp;
CREATE POLICY "Students can view own xp" ON public.student_xp FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Students can update own xp" ON public.student_xp;
CREATE POLICY "Students can update own xp" ON public.student_xp FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Teachers can view all xp" ON public.student_xp;
CREATE POLICY "Teachers can view all xp" ON public.student_xp FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));

-- Streaks
DROP POLICY IF EXISTS "Students can view own streak" ON public.streaks;
CREATE POLICY "Students can view own streak" ON public.streaks FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Students can update own streak" ON public.streaks;
CREATE POLICY "Students can update own streak" ON public.streaks FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Teachers can view all streaks" ON public.streaks;
CREATE POLICY "Teachers can view all streaks" ON public.streaks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));

-- Badges
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage badges" ON public.badges;
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Student Badges
DROP POLICY IF EXISTS "Students can view own badges" ON public.student_badges;
CREATE POLICY "Students can view own badges" ON public.student_badges FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "System can award badges" ON public.student_badges;
CREATE POLICY "System can award badges" ON public.student_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Teachers can view all badges" ON public.student_badges;
CREATE POLICY "Teachers can view all badges" ON public.student_badges FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));

-- Daily Missions
DROP POLICY IF EXISTS "Anyone can view missions" ON public.daily_missions;
CREATE POLICY "Anyone can view missions" ON public.daily_missions FOR SELECT TO authenticated USING (active = true);
DROP POLICY IF EXISTS "Admins can manage missions" ON public.daily_missions;
CREATE POLICY "Admins can manage missions" ON public.daily_missions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Student Missions
DROP POLICY IF EXISTS "Students can view own missions" ON public.student_missions;
CREATE POLICY "Students can view own missions" ON public.student_missions FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Students can update own missions" ON public.student_missions;
CREATE POLICY "Students can update own missions" ON public.student_missions FOR ALL TO authenticated USING (user_id = auth.uid());

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Tests
DROP POLICY IF EXISTS "Anyone can view tests" ON public.tests;
CREATE POLICY "Anyone can view tests" ON public.tests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Teachers can manage tests" ON public.tests;
CREATE POLICY "Teachers can manage tests" ON public.tests FOR ALL TO authenticated USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Teachers can create tests" ON public.tests;
CREATE POLICY "Teachers can create tests" ON public.tests FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Test Questions
DROP POLICY IF EXISTS "Anyone can view test questions" ON public.test_questions;
CREATE POLICY "Anyone can view test questions" ON public.test_questions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Teachers can manage test questions" ON public.test_questions;
CREATE POLICY "Teachers can manage test questions" ON public.test_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Test Attempts
DROP POLICY IF EXISTS "Students can view own attempts" ON public.test_attempts;
CREATE POLICY "Students can view own attempts" ON public.test_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Students can create attempts" ON public.test_attempts;
CREATE POLICY "Students can create attempts" ON public.test_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Teachers can view all attempts" ON public.test_attempts;
CREATE POLICY "Teachers can view all attempts" ON public.test_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));

-- Enrollment Requests
DROP POLICY IF EXISTS "Students can view own requests" ON public.enrollment_requests;
CREATE POLICY "Students can view own requests" ON public.enrollment_requests FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS "Students can create requests" ON public.enrollment_requests;
CREATE POLICY "Students can create requests" ON public.enrollment_requests FOR INSERT WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "Teachers can view all requests" ON public.enrollment_requests;
CREATE POLICY "Teachers can view all requests" ON public.enrollment_requests FOR SELECT USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coordinator'));
DROP POLICY IF EXISTS "Teachers can update requests" ON public.enrollment_requests;
CREATE POLICY "Teachers can update requests" ON public.enrollment_requests FOR UPDATE USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Teachers can delete requests" ON public.enrollment_requests;
CREATE POLICY "Teachers can delete requests" ON public.enrollment_requests FOR DELETE USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

-- Class Courses
DROP POLICY IF EXISTS "Anyone can view class courses" ON public.class_courses;
CREATE POLICY "Anyone can view class courses" ON public.class_courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Teachers can manage class courses" ON public.class_courses;
CREATE POLICY "Teachers can manage class courses" ON public.class_courses FOR ALL USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- System Settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;
CREATE POLICY "Anyone can view settings" ON public.system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Certificate Templates
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.certificate_templates;
CREATE POLICY "Anyone can view active templates" ON public.certificate_templates FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Teachers can manage templates" ON public.certificate_templates;
CREATE POLICY "Teachers can manage templates" ON public.certificate_templates FOR ALL USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

-- Certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Anyone can validate certificates" ON public.certificates;
CREATE POLICY "Anyone can validate certificates" ON public.certificates FOR SELECT USING (true);
DROP POLICY IF EXISTS "System can create certificates" ON public.certificates;
CREATE POLICY "System can create certificates" ON public.certificates FOR INSERT WITH CHECK (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Insert default settings
INSERT INTO public.system_settings (platform_name) VALUES ('CodeQuest') ON CONFLICT DO NOTHING;

-- Insert default badges
INSERT INTO public.badges (name, description, icon, rarity, xp_requirement) VALUES
  ('Primeira Lição', 'Complete sua primeira lição', '🎯', 'common', 0),
  ('Streak de 7 dias', 'Mantenha uma sequência de 7 dias', '🔥', 'rare', 0),
  ('Streak de 30 dias', 'Mantenha uma sequência de 30 dias', '💪', 'epic', 0),
  ('Mestre Python', 'Complete todos os exercícios de Python', '🐍', 'epic', 0),
  ('Mestre JavaScript', 'Complete todos os exercícios de JavaScript', '💛', 'epic', 0),
  ('Mestre SQL', 'Complete todos os exercícios de SQL', '🗃️', 'epic', 0),
  ('Primeiro Nível', 'Alcance o nível 5', '⭐', 'common', 500),
  ('Veterano', 'Alcance o nível 10', '🏆', 'rare', 2000),
  ('Lenda', 'Alcance o nível 20', '👑', 'legendary', 10000)
ON CONFLICT DO NOTHING;

-- Insert default daily missions
INSERT INTO public.daily_missions (title, description, target_count, xp_reward, mission_type) VALUES
  ('Complete 3 exercícios', 'Resolva 3 exercícios de qualquer tipo', 3, 50, 'exercises'),
  ('Assista 1 aula', 'Assista pelo menos 1 aula completa', 1, 30, 'lessons'),
  ('Acerte 5 questões seguidas', 'Responda 5 questões corretamente sem errar', 5, 100, 'streak_correct'),
  ('Pratique por 15 minutos', 'Passe pelo menos 15 minutos estudando', 15, 40, 'time')
ON CONFLICT DO NOTHING;

-- Insert sample courses
INSERT INTO public.courses (title, description, image_url, order_index) VALUES
  ('Python Básico', 'Aprenda os fundamentos da programação com Python', '🐍', 1),
  ('JavaScript Fundamentos', 'Domine o JavaScript do zero ao avançado', '💛', 2),
  ('SQL para Iniciantes', 'Aprenda a manipular bancos de dados com SQL', '🗃️', 3)
ON CONFLICT DO NOTHING;

