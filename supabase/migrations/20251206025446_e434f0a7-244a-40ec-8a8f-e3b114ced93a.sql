-- Create class_courses junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.class_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, course_id)
);

-- Enable RLS
ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_courses
CREATE POLICY "Anyone can view class courses" 
ON public.class_courses 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers can manage class courses" 
ON public.class_courses 
FOR ALL 
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Make lesson module_id required (lessons must belong to a module)
-- First update any null module_id to link to the first module of the course
UPDATE public.lessons l
SET module_id = (
  SELECT m.id FROM public.modules m 
  WHERE m.course_id = l.course_id 
  ORDER BY m.order_index LIMIT 1
)
WHERE l.module_id IS NULL AND EXISTS (
  SELECT 1 FROM public.modules m WHERE m.course_id = l.course_id
);

-- Make exercise lesson_id required (exercises must belong to a lesson)
-- Update any null lesson_id to link to the first lesson
UPDATE public.exercises e
SET lesson_id = (
  SELECT l.id FROM public.lessons l 
  ORDER BY l.order_index LIMIT 1
)
WHERE e.lesson_id IS NULL AND EXISTS (
  SELECT 1 FROM public.lessons l
);