-- Function to check if a module is completed by a user
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
  -- Count total lessons in the module
  SELECT COUNT(*) INTO _total_lessons
  FROM public.lessons
  WHERE module_id = _module_id;
  
  -- Count completed lessons
  SELECT COUNT(DISTINCT sp.lesson_id) INTO _completed_lessons
  FROM public.student_progress sp
  INNER JOIN public.lessons l ON l.id = sp.lesson_id
  WHERE sp.user_id = _user_id
    AND sp.lesson_id IS NOT NULL
    AND sp.completed = true
    AND l.module_id = _module_id;
  
  -- If no lessons, module is not completed
  IF _total_lessons = 0 THEN
    RETURN false;
  END IF;
  
  -- Check if all lessons are completed
  IF _completed_lessons < _total_lessons THEN
    RETURN false;
  END IF;
  
  -- Count total exercises in the module's lessons
  SELECT COUNT(*) INTO _total_exercises
  FROM public.exercises e
  INNER JOIN public.lessons l ON l.id = e.lesson_id
  WHERE l.module_id = _module_id;
  
  -- If no exercises, module is completed if all lessons are done
  IF _total_exercises = 0 THEN
    RETURN true;
  END IF;
  
  -- Count completed exercises
  SELECT COUNT(DISTINCT sp.exercise_id) INTO _completed_exercises
  FROM public.student_progress sp
  INNER JOIN public.exercises e ON e.id = sp.exercise_id
  INNER JOIN public.lessons l ON l.id = e.lesson_id
  WHERE sp.user_id = _user_id
    AND sp.exercise_id IS NOT NULL
    AND sp.completed = true
    AND l.module_id = _module_id;
  
  -- Module is completed if all lessons and all exercises are completed
  RETURN _completed_exercises >= _total_exercises;
END;
$$;

-- Update RLS policy to allow system functions to create certificates
-- Note: SECURITY DEFINER functions bypass RLS, but we keep the policy for manual inserts
DROP POLICY IF EXISTS "System can create certificates" ON public.certificates;
CREATE POLICY "System can create certificates" ON public.certificates
  FOR INSERT 
  WITH CHECK (
    has_role(auth.uid(), 'teacher') OR 
    has_role(auth.uid(), 'admin') OR 
    user_id = auth.uid()
  );

-- Function to emit module certificate
CREATE OR REPLACE FUNCTION public.emit_module_certificate(_user_id uuid, _module_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _module_record record;
  _course_record record;
  _template_record record;
  _profile_record record;
  _class_id uuid;
  _certificate_id uuid;
  _validation_code text;
  _avg_score numeric(5,2);
  _total_hours integer;
BEGIN
  -- Check if certificate already exists
  SELECT id INTO _certificate_id
  FROM public.certificates
  WHERE user_id = _user_id
    AND module_id = _module_id;
  
  IF _certificate_id IS NOT NULL THEN
    RETURN _certificate_id;
  END IF;
  
  -- Get module information
  SELECT m.*, c.id as course_id, c.title as course_title, m.title as module_title
  INTO _module_record
  FROM public.modules m
  INNER JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = _module_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Module not found';
  END IF;
  
  -- Get user profile
  SELECT * INTO _profile_record
  FROM public.profiles
  WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Get active module certificate template
  SELECT * INTO _template_record
  FROM public.certificate_templates
  WHERE type = 'module'
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no template found, still create certificate but without template
  -- (template_id will be null)
  
  -- Get class_id if user is enrolled in a class with this course
  SELECT cc.class_id INTO _class_id
  FROM public.class_courses cc
  INNER JOIN public.enrollments e ON e.class_id = cc.class_id
  WHERE cc.course_id = _module_record.course_id
    AND e.student_id = _user_id
    AND e.status = 'approved'
  LIMIT 1;
  
  -- Calculate average score from module exercises
  SELECT COALESCE(AVG(sp.score), 0) INTO _avg_score
  FROM public.student_progress sp
  INNER JOIN public.exercises e ON e.id = sp.exercise_id
  INNER JOIN public.lessons l ON l.id = e.lesson_id
  WHERE sp.user_id = _user_id
    AND sp.exercise_id IS NOT NULL
    AND sp.completed = true
    AND l.module_id = _module_id
    AND sp.score IS NOT NULL;
  
  -- Calculate total hours (sum of lesson durations)
  SELECT COALESCE(SUM(duration_minutes), 0) / 60 INTO _total_hours
  FROM public.lessons
  WHERE module_id = _module_id;
  
  -- Generate validation code
  _validation_code := public.generate_certificate_code();
  
  -- Ensure validation code is unique
  WHILE EXISTS (SELECT 1 FROM public.certificates WHERE validation_code = _validation_code) LOOP
    _validation_code := public.generate_certificate_code();
  END LOOP;
  
  -- Insert certificate
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
  -- Only process if lesson is being marked as completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    -- Get lesson information
    SELECT * INTO _lesson_record
    FROM public.lessons
    WHERE id = NEW.lesson_id;
    
    IF FOUND AND _lesson_record.module_id IS NOT NULL THEN
      _module_id := _lesson_record.module_id;
      
      -- Check if module is completed
      IF public.is_module_completed(NEW.user_id, _module_id) THEN
        -- Emit certificate
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
  -- Only process if exercise is being marked as completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    -- Get exercise information
    SELECT e.*, l.module_id INTO _exercise_record
    FROM public.exercises e
    INNER JOIN public.lessons l ON l.id = e.lesson_id
    WHERE e.id = NEW.exercise_id;
    
    IF FOUND AND _exercise_record.module_id IS NOT NULL THEN
      _module_id := _exercise_record.module_id;
      
      -- Check if module is completed
      IF public.is_module_completed(NEW.user_id, _module_id) THEN
        -- Emit certificate
        PERFORM public.emit_module_certificate(NEW.user_id, _module_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to check module completion after lesson progress update
DROP TRIGGER IF EXISTS check_module_certificate_trigger ON public.student_progress;
CREATE TRIGGER check_module_certificate_trigger
  AFTER INSERT OR UPDATE ON public.student_progress
  FOR EACH ROW
  WHEN (NEW.lesson_id IS NOT NULL AND NEW.completed = true)
  EXECUTE FUNCTION public.check_module_completion_and_emit_certificate();

-- Create trigger to check module completion after exercise progress update
DROP TRIGGER IF EXISTS check_module_certificate_after_exercise_trigger ON public.student_progress;
CREATE TRIGGER check_module_certificate_after_exercise_trigger
  AFTER INSERT OR UPDATE ON public.student_progress
  FOR EACH ROW
  WHEN (NEW.exercise_id IS NOT NULL AND NEW.completed = true)
  EXECUTE FUNCTION public.check_module_completion_after_exercise();

