-- Update RLS policy for user_roles to only allow admins to create teacher/coordinator roles
DROP POLICY IF EXISTS "Teachers can view student roles" ON public.user_roles;

-- Only admins can view all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles 
FOR SELECT TO authenticated 
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'coordinator')
);

-- Only admins can insert non-student roles
CREATE POLICY "Only admins can create teacher or coordinator roles" ON public.user_roles 
FOR INSERT TO authenticated 
WITH CHECK (
  -- Students can self-register
  (role = 'student' AND auth.uid() = user_id)
  OR 
  -- Admins can create any role
  public.has_role(auth.uid(), 'admin')
);

-- Update handle_new_user to only auto-assign student role if not admin-created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  requested_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'));
  
  -- Get requested role, default to student
  requested_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'student');
  
  -- Only allow student role for self-registration
  -- Admin-assigned roles will be handled separately
  IF requested_role IN ('teacher', 'coordinator', 'admin') THEN
    requested_role := 'student';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role);
  
  -- Initialize XP and streak for students
  IF requested_role = 'student' THEN
    INSERT INTO public.student_xp (user_id) VALUES (NEW.id);
    INSERT INTO public.streaks (user_id) VALUES (NEW.id);
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
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Update or insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET role = new_role;
  
  RETURN TRUE;
END;
$$;

-- Create lessons content table for video/text content
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

-- Add more fields to exercises for code exercises
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS starter_code TEXT;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS solution_code TEXT;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS test_cases JSONB DEFAULT '[]';

-- Create tests/exams table
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

-- Enable RLS on new tables
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- RLS for tests
CREATE POLICY "Anyone can view tests" ON public.tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage tests" ON public.tests FOR ALL TO authenticated 
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can create tests" ON public.tests FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS for test_questions
CREATE POLICY "Anyone can view test questions" ON public.test_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage test questions" ON public.test_questions FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS for test_attempts
CREATE POLICY "Students can view own attempts" ON public.test_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students can create attempts" ON public.test_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers can view all attempts" ON public.test_attempts FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));