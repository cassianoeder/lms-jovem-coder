-- Create unique constraints for student_progress upserts
-- First, drop existing entries that would violate the constraint (keep latest)
DELETE FROM student_progress a
USING student_progress b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.lesson_id IS NOT NULL 
  AND a.lesson_id = b.lesson_id;

DELETE FROM student_progress a
USING student_progress b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.exercise_id IS NOT NULL 
  AND a.exercise_id = b.exercise_id;

-- Create unique indexes for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS student_progress_user_lesson_unique 
ON student_progress (user_id, lesson_id) 
WHERE lesson_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS student_progress_user_exercise_unique 
ON student_progress (user_id, exercise_id) 
WHERE exercise_id IS NOT NULL;