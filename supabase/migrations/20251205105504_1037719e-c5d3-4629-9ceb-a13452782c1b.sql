-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'coordinator', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, class_id)
);

-- Create courses/modules table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'code', 'logic')),
  language TEXT CHECK (language IN ('python', 'javascript', 'sql')),
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  xp_reward INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create questions table (for multiple choice)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER DEFAULT 0
);

-- Create student_progress table
CREATE TABLE public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  score INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id),
  UNIQUE (user_id, exercise_id)
);

-- Create student_xp table
CREATE TABLE public.student_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create streaks table
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_requirement INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create student_badges table
CREATE TABLE public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- Create daily_missions table
CREATE TABLE public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_count INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 50,
  mission_type TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Create student_missions table
CREATE TABLE public.student_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.daily_missions(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, mission_id, date)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Trigger to create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'student'));
  
  INSERT INTO public.student_xp (user_id) VALUES (NEW.id);
  INSERT INTO public.streaks (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
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

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_roles (read-only for users, managed by system)
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view student roles" ON public.user_roles FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for classes
CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can create classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can update own classes" ON public.classes FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for enrollments
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Teachers can view class enrollments" ON public.enrollments FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));
CREATE POLICY "Teachers can manage enrollments" ON public.enrollments FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for courses (public read)
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage courses" ON public.courses FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for lessons
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage lessons" ON public.lessons FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for exercises
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage exercises" ON public.exercises FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage questions" ON public.questions FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_progress
CREATE POLICY "Students can view own progress" ON public.student_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students can update own progress" ON public.student_progress FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers can view all progress" ON public.student_progress FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));

-- RLS Policies for student_xp
CREATE POLICY "Students can view own xp" ON public.student_xp FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students can update own xp" ON public.student_xp FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers can view all xp" ON public.student_xp FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));

-- RLS Policies for streaks
CREATE POLICY "Students can view own streak" ON public.streaks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students can update own streak" ON public.streaks FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers can view all streaks" ON public.streaks FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));

-- RLS Policies for badges (public read)
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_badges
CREATE POLICY "Students can view own badges" ON public.student_badges FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can award badges" ON public.student_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers can view all badges" ON public.student_badges FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'coordinator'));

-- RLS Policies for daily_missions (public read)
CREATE POLICY "Anyone can view missions" ON public.daily_missions FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins can manage missions" ON public.daily_missions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_missions
CREATE POLICY "Students can view own missions" ON public.student_missions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students can update own missions" ON public.student_missions FOR ALL TO authenticated USING (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

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
  ('Lenda', 'Alcance o nível 20', '👑', 'legendary', 10000);

-- Insert default daily missions
INSERT INTO public.daily_missions (title, description, target_count, xp_reward, mission_type) VALUES
  ('Complete 3 exercícios', 'Resolva 3 exercícios de qualquer tipo', 3, 50, 'exercises'),
  ('Assista 1 aula', 'Assista pelo menos 1 aula completa', 1, 30, 'lessons'),
  ('Acerte 5 questões seguidas', 'Responda 5 questões corretamente sem errar', 5, 100, 'streak_correct'),
  ('Pratique por 15 minutos', 'Passe pelo menos 15 minutos estudando', 15, 40, 'time');

-- Insert sample courses
INSERT INTO public.courses (title, description, image_url, order_index) VALUES
  ('Python Básico', 'Aprenda os fundamentos da programação com Python', '🐍', 1),
  ('JavaScript Fundamentos', 'Domine o JavaScript do zero ao avançado', '💛', 2),
  ('SQL para Iniciantes', 'Aprenda a manipular bancos de dados com SQL', '🗃️', 3);