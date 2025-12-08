-- Este script contém todas as definições de tabelas, funções, políticas e triggers
-- necessárias para o funcionamento do sistema JovemCoder.
-- Execute este script completo no SQL Editor do seu novo projeto Supabase.

-- Tabela: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);

ALTER TABLE public.user_roles OWNER TO postgres;
ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Tabela: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles OWNER TO postgres;
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- Tabela: system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform_name text,
    logo_url text,
    company_name text,
    cnpj text,
    institutional_text text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);

ALTER TABLE public.system_settings OWNER TO postgres;
ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);

-- Tabela: courses
CREATE TABLE IF NOT EXISTS public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    order_index integer
);

ALTER TABLE public.courses OWNER TO postgres;
ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);

-- Tabela: modules
CREATE TABLE IF NOT EXISTS public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    order_index integer
);

ALTER TABLE public.modules OWNER TO postgres;
ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Tabela: lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    module_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    content text,
    video_url text,
    duration_minutes integer,
    xp_reward integer DEFAULT 0,
    order_index integer
);

ALTER TABLE public.lessons OWNER TO postgres;
ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Tabela: exercises
CREATE TABLE IF NOT EXISTS public.exercises (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    description text,
    type text NOT NULL,
    language text,
    difficulty integer,
    xp_reward integer DEFAULT 0,
    starter_code text,
    solution_code text,
    test_cases jsonb
);

ALTER TABLE public.exercises OWNER TO postgres;
ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Tabela: classes
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid,
    teacher_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    is_public boolean DEFAULT true,
    status text
);

ALTER TABLE public.classes OWNER TO postgres;
ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Tabela: class_courses
CREATE TABLE IF NOT EXISTS public.class_courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    course_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.class_courses OWNER TO postgres;
ALTER TABLE ONLY public.class_courses
    ADD CONSTRAINT class_courses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.class_courses
    ADD CONSTRAINT class_courses_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.class_courses
    ADD CONSTRAINT class_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.class_courses
    ADD CONSTRAINT class_courses_class_id_course_id_key UNIQUE (class_id, course_id);

-- Tabela: enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    status text
);

ALTER TABLE public.enrollments OWNER TO postgres;
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_class_id_student_id_key UNIQUE (class_id, student_id);

-- Tabela: enrollment_requests
CREATE TABLE IF NOT EXISTS public.enrollment_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    message text,
    status text DEFAULT 'pending'::text,
    reviewed_at timestamp with time zone,
    reviewed_by uuid
);

ALTER TABLE public.enrollment_requests OWNER TO postgres;
ALTER TABLE ONLY public.enrollment_requests
    ADD CONSTRAINT enrollment_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.enrollment_requests
    ADD CONSTRAINT enrollment_requests_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.enrollment_requests
    ADD CONSTRAINT enrollment_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.enrollment_requests
    ADD CONSTRAINT enrollment_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Tabela: student_progress
CREATE TABLE IF NOT EXISTS public.student_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lesson_id uuid,
    exercise_id uuid,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    score integer
);

ALTER TABLE public.student_progress OWNER TO postgres;
ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);
ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_user_id_exercise_id_key UNIQUE (user_id, exercise_id);

-- Tabela: student_xp
CREATE TABLE IF NOT EXISTS public.student_xp (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_xp integer DEFAULT 0,
    level integer DEFAULT 1,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.student_xp OWNER TO postgres;
ALTER TABLE ONLY public.student_xp
    ADD CONSTRAINT student_xp_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.student_xp
    ADD CONSTRAINT student_xp_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.student_xp
    ADD CONSTRAINT student_xp_user_id_key UNIQUE (user_id);

-- Tabela: streaks
CREATE TABLE IF NOT EXISTS public.streaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity_date date,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.streaks OWNER TO postgres;
ALTER TABLE ONLY public.streaks
    ADD CONSTRAINT streaks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.streaks
    ADD CONSTRAINT streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.streaks
    ADD CONSTRAINT streaks_user_id_key UNIQUE (user_id);

-- Tabela: badges
CREATE TABLE IF NOT EXISTS public.badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    rarity text,
    xp_requirement integer
);

ALTER TABLE public.badges OWNER TO postgres;
ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);

-- Tabela: student_badges
CREATE TABLE IF NOT EXISTS public.student_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.student_badges OWNER TO postgres;
ALTER TABLE ONLY public.student_badges
    ADD CONSTRAINT student_badges_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.student_badges
    ADD CONSTRAINT student_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.student_badges
    ADD CONSTRAINT student_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.student_badges
    ADD CONSTRAINT student_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);

-- Tabela: daily_missions
CREATE TABLE IF NOT EXISTS public.daily_missions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    mission_type text NOT NULL,
    target_count integer,
    xp_reward integer,
    active boolean DEFAULT true
);

ALTER TABLE public.daily_missions OWNER TO postgres;
ALTER TABLE ONLY public.daily_missions
    ADD CONSTRAINT daily_missions_pkey PRIMARY KEY (id);

-- Tabela: student_missions
CREATE TABLE IF NOT EXISTS public.student_missions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mission_id uuid NOT NULL,
    date date NOT NULL,
    progress integer DEFAULT 0,
    completed boolean DEFAULT false
);

ALTER TABLE public.student_missions OWNER TO postgres;
ALTER TABLE ONLY public.student_missions
    ADD CONSTRAINT student_missions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.student_missions
    ADD CONSTRAINT student_missions_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.daily_missions(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.student_missions
    ADD CONSTRAINT student_missions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.student_missions
    ADD CONSTRAINT student_missions_user_id_mission_id_date_key UNIQUE (user_id, mission_id, date);

-- Tabela: certificate_templates
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name text NOT NULL,
    type text NOT NULL,
    template_html text,
    signature_url text,
    is_active boolean DEFAULT true,
    min_score integer,
    min_attendance integer,
    hours_load integer
);

ALTER TABLE public.certificate_templates OWNER TO postgres;
ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT certificate_templates_pkey PRIMARY KEY (id);

-- Tabela: certificates
CREATE TABLE IF NOT EXISTS public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid,
    module_id uuid,
    class_id uuid,
    template_id uuid,
    student_name text NOT NULL,
    course_name text NOT NULL,
    issued_at timestamp with time zone,
    validation_code text NOT NULL,
    pdf_url text,
    score integer,
    hours_load integer
);

ALTER TABLE public.certificates OWNER TO postgres;
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_validation_code_key UNIQUE (validation_code);

-- Tabela: tests
CREATE TABLE IF NOT EXISTS public.tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid,
    teacher_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    description text,
    available_from timestamp with time zone,
    available_until timestamp with time zone,
    time_limit_minutes integer,
    max_attempts integer
);

ALTER TABLE public.tests OWNER TO postgres;
ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Tabela: test_questions
CREATE TABLE IF NOT EXISTS public.test_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    exercise_id uuid NOT NULL,
    order_index integer,
    points integer
);

ALTER TABLE public.test_questions OWNER TO postgres;
ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Tabela: test_attempts
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    user_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    score integer
);

ALTER TABLE public.test_attempts OWNER TO postgres;
ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Tabela: questions
CREATE TABLE IF NOT EXISTS public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exercise_id uuid NOT NULL,
    question_text text NOT NULL,
    options jsonb NOT NULL,
    correct_answer text NOT NULL,
    explanation text,
    order_index integer
);

ALTER TABLE public.questions OWNER TO postgres;
ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Função: get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid) RETURNS app_role
    LANGUAGE sql STABLE
    AS $$
  SELECT role FROM user_roles WHERE user_id = _user_id;
$$;

ALTER FUNCTION public.get_user_role(_user_id uuid) OWNER TO postgres;

-- Função: has_role
CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

ALTER FUNCTION public.has_role(_role app_role, _user_id uuid) OWNER TO postgres;

-- Função: admin_set_user_role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(new_role app_role, target_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT public.has_role('admin', auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can set user roles';
  END IF;

  -- Insert or update the role for the target user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;

ALTER FUNCTION public.admin_set_user_role(new_role app_role, target_user_id uuid) OWNER TO postgres;

-- Função: generate_certificate_code
CREATE OR REPLACE FUNCTION public.generate_certificate_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character alphanumeric code
        new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
        
        -- Check if this code already exists
        SELECT EXISTS (
            SELECT 1 FROM certificates WHERE validation_code = new_code
        ) INTO code_exists;
        
        -- If the code is unique, exit the loop
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$;

ALTER FUNCTION public.generate_certificate_code() OWNER TO postgres;

-- Trigger Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário')
  );

  -- Assign default role if provided in metadata
  IF NEW.raw_user_meta_data ? 'role' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'role')::app_role
    );
  END IF;

  -- Initialize XP and streak for the new user
  INSERT INTO public.student_xp (user_id) VALUES (NEW.id);
  INSERT INTO public.streaks (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Trigger: on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enums
CREATE TYPE public.app_role AS ENUM (
    'student',
    'teacher',
    'coordinator',
    'admin'
);

ALTER TYPE public.app_role OWNER TO postgres;

-- Policies
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Profiles are viewable by themselves and admins."
    ON public.profiles FOR SELECT
    USING (
        (auth.uid() = user_id) OR public.has_role('admin'::app_role, auth.uid())
    );

CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT
    WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update own profile."
    ON public.profiles FOR UPDATE
    USING ((auth.uid() = user_id));

-- Policies for user_roles
CREATE POLICY "Users can read their own roles."
    ON public.user_roles FOR SELECT
    USING ((auth.uid() = user_id));

CREATE POLICY "Admins can manage user roles."
    ON public.user_roles FOR ALL
    USING (public.has_role('admin'::app_role, auth.uid()))
    WITH CHECK (public.has_role('admin'::app_role, auth.uid()));

-- Policies for system_settings
CREATE POLICY "System settings are viewable by everyone."
    ON public.system_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage system settings."
    ON public.system_settings FOR ALL
    USING (public.has_role('admin'::app_role, auth.uid()))
    WITH CHECK (public.has_role('admin'::app_role, auth.uid()));

-- Policies for courses
CREATE POLICY "Courses are viewable by everyone."
    ON public.courses FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can manage courses."
    ON public.courses FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for modules
CREATE POLICY "Modules are viewable by everyone."
    ON public.modules FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can manage modules."
    ON public.modules FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for lessons
CREATE POLICY "Lessons are viewable by everyone."
    ON public.lessons FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can manage lessons."
    ON public.lessons FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for exercises
CREATE POLICY "Exercises are viewable by everyone."
    ON public.exercises FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can manage exercises."
    ON public.exercises FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for classes
CREATE POLICY "Classes are viewable by everyone."
    ON public.classes FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can manage classes."
    ON public.classes FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for class_courses
CREATE POLICY "Class courses are viewable by everyone."
    ON public.class_courses FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can manage class courses."
    ON public.class_courses FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for enrollments
CREATE POLICY "Enrollments are viewable by admins, teachers, and the student."
    ON public.enrollments FOR SELECT
    USING (
        (auth.uid() = student_id) OR
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

CREATE POLICY "Admins and teachers can manage enrollments."
    ON public.enrollments FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for enrollment_requests
CREATE POLICY "Enrollment requests are viewable by admins, teachers, and the student."
    ON public.enrollment_requests FOR SELECT
    USING (
        (auth.uid() = student_id) OR
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

CREATE POLICY "Students can create enrollment requests."
    ON public.enrollment_requests FOR INSERT
    WITH CHECK ((auth.uid() = student_id));

CREATE POLICY "Admins and teachers can manage enrollment requests."
    ON public.enrollment_requests FOR UPDATE
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for student_progress
CREATE POLICY "Progress is viewable by admins, teachers, and the student."
    ON public.student_progress FOR SELECT
    USING (
        (auth.uid() = user_id) OR
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

CREATE POLICY "Students can update their own progress."
    ON public.student_progress FOR UPDATE
    USING ((auth.uid() = user_id))
    WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Students can insert their own progress."
    ON public.student_progress FOR INSERT
    WITH CHECK ((auth.uid() = user_id));

-- Policies for student_xp
CREATE POLICY "XP is viewable by admins, teachers, and the student."
    ON public.student_xp FOR SELECT
    USING (
        (auth.uid() = user_id) OR
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

CREATE POLICY "System can update XP."
    ON public.student_xp FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policies for streaks
CREATE POLICY "Streaks are viewable by admins, teachers, and the student."
    ON public.streaks FOR SELECT
    USING (
        (auth.uid() = user_id) OR
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

CREATE POLICY "System can update streaks."
    ON public.streaks FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policies for badges
CREATE POLICY "Badges are viewable by everyone."
    ON public.badges FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage badges."
    ON public.badges FOR ALL
    USING (public.has_role('admin'::app_role, auth.uid()))
    WITH CHECK (public.has_role('admin'::app_role, auth.uid()));

-- Policies for student_badges
CREATE POLICY "Badges are viewable by admins, teachers, and the student."
    ON public.student_badges FOR SELECT
    USING (
        (auth.uid() = user_id) OR
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

CREATE POLICY "System can manage student badges."
    ON public.student_badges FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policies for daily_missions
CREATE POLICY "Missions are viewable by everyone."
    ON public.daily_missions FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage missions."
    ON public.daily_missions FOR ALL
    USING (public.has_role('admin'::app_role, auth.uid()))
    WITH CHECK (public.has_role('admin'::app_role, auth.uid()));

-- Policies for student_missions
CREATE POLICY "Missions are viewable by admins, teachers, and the student."
    ON public.student_missions FOR SELECT
    USING (
        (auth.uid() = user_id) OR
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

CREATE POLICY "Students can update their own missions."
    ON public.student_missions FOR UPDATE
    USING ((auth.uid() = user_id))
    WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Students can insert their own missions."
    ON public.student_missions FOR INSERT
    WITH CHECK ((auth.uid() = user_id));

-- Policies for certificate_templates
CREATE POLICY "Templates are viewable by everyone."
    ON public.certificate_templates FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage templates."
    ON public.certificate_templates FOR ALL
    USING (public.has_role('admin'::app_role, auth.uid()))
    WITH CHECK (public.has_role('admin'::app_role, auth.uid()));

-- Policies for certificates
CREATE POLICY "Certificates are viewable by admins, teachers, and the student."
    ON public.certificates FOR SELECT
    USING (
        (auth.uid() = user_id) OR
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

CREATE POLICY "System can manage certificates."
    ON public.certificates FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policies for tests
CREATE POLICY "Tests are viewable by admins, teachers, and enrolled students."
    ON public.tests FOR SELECT
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.classes c ON e.class_id = c.id
            WHERE e.student_id = auth.uid() AND c.id = tests.class_id AND e.status = 'approved'
        )
    );

CREATE POLICY "Admins and teachers can manage tests."
    ON public.tests FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for test_questions
CREATE POLICY "Test questions are viewable by admins, teachers, and enrolled students."
    ON public.test_questions FOR SELECT
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.test_attempts ta
            JOIN public.tests t ON ta.test_id = t.id
            JOIN public.enrollments e ON e.class_id = t.class_id
            WHERE ta.user_id = auth.uid() AND e.student_id = auth.uid() AND e.status = 'approved'
        )
    );

CREATE POLICY "Admins and teachers can manage test questions."
    ON public.test_questions FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Policies for test_attempts
CREATE POLICY "Attempts are viewable by admins, teachers, and the student."
    ON public.test_attempts FOR SELECT
    USING (
        (auth.uid() = user_id) OR
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

CREATE POLICY "Students can create and update their own attempts."
    ON public.test_attempts FOR ALL
    USING ((auth.uid() = user_id))
    WITH CHECK ((auth.uid() = user_id));

-- Policies for questions
CREATE POLICY "Questions are viewable by everyone."
    ON public.questions FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can manage questions."
    ON public.questions FOR ALL
    USING (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    )
    WITH CHECK (
        public.has_role('admin'::app_role, auth.uid()) OR
        public.has_role('teacher'::app_role, auth.uid())
    );

-- Inserindo dados iniciais para system_settings
INSERT INTO public.system_settings (id, platform_name)
VALUES ('d8c7e9f1-1a2b-4c3d-9e8f-1a2b4c5d6e7f', 'JovemCoder')
ON CONFLICT (id) DO NOTHING;

-- Inserindo badges iniciais
INSERT INTO public.badges (id, name, description, icon, rarity, xp_requirement)
VALUES
    ('b1', 'Primeiros Passos', 'Concluiu sua primeira aula', '👣', 'common', 100),
    ('b2', 'Explorador', 'Concluiu 5 aulas', '🗺️', 'common', 500),
    ('b3', 'Mestre dos Códigos', 'Concluiu 10 exercícios', '💻', 'rare', 1000),
    ('b4', 'Campeão', 'Manteve uma sequência de 7 dias', '🔥', 'epic', 1500),
    ('b5', 'Lenda', 'Alcançou o Nível 10', '🏆', 'legendary', 5000)
ON CONFLICT (id) DO NOTHING;

-- Inserindo missões diárias iniciais
INSERT INTO public.daily_missions (id, title, description, mission_type, target_count, xp_reward, active)
VALUES
    ('m1', 'Estudante Assíduo', 'Complete 1 aula hoje', 'lessons', 1, 50, true),
    ('m2', 'Praticante', 'Complete 2 exercícios hoje', 'exercises', 2, 100, true),
    ('m3', 'Maratonista', 'Estude por 30 minutos', 'minutes', 30, 75, true)
ON CONFLICT (id) DO NOTHING;

-- Inserindo modelos de certificado iniciais
INSERT INTO public.certificate_templates (id, name, type, is_active, min_score, min_attendance, hours_load, template_html)
VALUES
    ('t1', 'Certificado de Curso Padrão', 'course', true, 70, 75, 40, '<html><body><h1>Certificado de Conclusão</h1><p>Este certificado é concedido a <strong>{{student_name}}</strong> por ter concluído o curso <strong>{{course_name}}</strong> com sucesso.</p><p>Nota: {{score}}% | Frequência: {{attendance}}% | Carga Horária: {{hours_load}}h</p><p>Código de Validação: {{validation_code}}</p></body></html>'),
    ('t2', 'Certificado de Módulo Padrão', 'module', true, 70, 75, 10, '<html><body><h1>Certificado de Conclusão de Módulo</h1><p>Parabéns, <strong>{{student_name}}</strong>! Você concluiu o módulo <strong>{{module_name}}</strong> do curso <strong>{{course_name}}</strong>.</p><p>Nota: {{score}}% | Frequência: {{attendance}}% | Carga Horária: {{hours_load}}h</p><p>Código de Validação: {{validation_code}}</p></body></html>')
ON CONFLICT (id) DO NOTHING;