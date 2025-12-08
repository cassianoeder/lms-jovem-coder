-- Add is_public and status to classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

-- Add status to enrollments for approval workflow
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Create enrollment_requests table for handling join requests
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

-- Enable RLS
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollment_requests
CREATE POLICY "Students can view own requests" ON public.enrollment_requests
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create requests" ON public.enrollment_requests
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view all requests" ON public.enrollment_requests
  FOR SELECT USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coordinator'));

CREATE POLICY "Teachers can update requests" ON public.enrollment_requests
  FOR UPDATE USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete requests" ON public.enrollment_requests
  FOR DELETE USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

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

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active modules" ON public.modules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Teachers can manage modules" ON public.modules
  FOR ALL USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

-- Update lessons to reference modules instead of courses directly
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL;

-- Update enrollments policies to include status
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
CREATE POLICY "Students can view own enrollments" ON public.enrollments
  FOR SELECT USING (student_id = auth.uid() AND status = 'approved');

CREATE POLICY "Students can view pending enrollments" ON public.enrollments
  FOR SELECT USING (student_id = auth.uid());

-- Update classes RLS for public visibility
DROP POLICY IF EXISTS "Anyone can view classes" ON public.classes;
CREATE POLICY "Anyone can view public classes" ON public.classes
  FOR SELECT USING (is_public = true OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coordinator'));

CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments 
      WHERE enrollments.class_id = classes.id 
      AND enrollments.student_id = auth.uid() 
      AND enrollments.status = 'approved'
    )
  );

-- Add DELETE policy for classes
CREATE POLICY "Teachers can delete own classes" ON public.classes
  FOR DELETE USING ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'));