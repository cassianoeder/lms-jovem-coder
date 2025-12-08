import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Lesson = Tables<'lessons'>;
type Exercise = Tables<'exercises'>;
type StudentProgress = Tables<'student_progress'>;
type CertificateTemplate = Tables<'certificate_templates'>;
type Profile = Tables<'profiles'>;
type Module = Tables<'modules'>;
type Course = Tables<'courses'>;

export async function checkAndIssueModuleCertificate(userId: string, moduleId: string, courseId: string) {
  if (!userId || !moduleId || !courseId) {
    console.error("Missing userId, moduleId, or courseId for certificate check.");
    return;
  }

  // 1. Fetch all lessons in the module
  const { data: lessonsInModule, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, xp_reward')
    .eq('module_id', moduleId)
    .order('order_index');

  if (lessonsError) {
    console.error("Error fetching lessons for module:", lessonsError);
    return;
  }
  if (!lessonsInModule || lessonsInModule.length === 0) {
    console.log(`Module ${moduleId} has no lessons.`);
    return;
  }

  const lessonIds = lessonsInModule.map(l => l.id);

  // 2. Fetch all exercises for these lessons
  const { data: exercisesInLessons, error: exercisesError } = await supabase
    .from('exercises')
    .select('id, lesson_id, xp_reward')
    .in('lesson_id', lessonIds);

  if (exercisesError) {
    console.error("Error fetching exercises for lessons:", exercisesError);
    return;
  }

  const exerciseIds = exercisesInLessons.map(e => e.id);

  // 3. Fetch student's progress for all relevant lessons and exercises
  const { data: studentProgress, error: progressError } = await supabase
    .from('student_progress')
    .select('lesson_id, exercise_id, completed, score')
    .eq('user_id', userId);

  if (progressError) {
    console.error("Error fetching student progress:", progressError);
    return;
  }

  const completedLessons = new Set(studentProgress?.filter(p => p.lesson_id && p.completed).map(p => p.lesson_id));
  const completedExercises = new Set(studentProgress?.filter(p => p.exercise_id && p.completed).map(p => p.exercise_id));
  const exerciseScores = new Map<string, number>(studentProgress?.filter(p => p.exercise_id && p.score !== null).map(p => [p.exercise_id!, p.score!]) || []);

  // Check if all lessons in the module are completed
  const allLessonsCompleted = lessonsInModule.every(lesson => completedLessons.has(lesson.id));

  // Check if all exercises in the module are completed
  const allExercisesCompleted = exercisesInLessons.every(exercise => completedExercises.has(exercise.id));

  if (!allLessonsCompleted || !allExercisesCompleted) {
    console.log(`Module ${moduleId} not fully completed by user ${userId}.`);
    return; // Module is not fully completed
  }

  // 4. Module is completed, now check for an active module certificate template
  const { data: template, error: templateError } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('type', 'module')
    .eq('is_active', true)
    .maybeSingle();

  if (templateError) {
    console.error("Error fetching certificate template:", templateError);
    return;
  }
  if (!template) {
    console.log("No active module certificate template found.");
    return;
  }

  // 5. Calculate average score for the module
  let totalScoreSum = 0;
  let scoredExercisesCount = 0;

  for (const exercise of exercisesInLessons) {
    if (exerciseScores.has(exercise.id)) {
      totalScoreSum += exerciseScores.get(exercise.id)!;
      scoredExercisesCount++;
    }
  }

  const averageScore = scoredExercisesCount > 0 ? Math.round(totalScoreSum / scoredExercisesCount) : 0;

  // 6. Check if requirements are met
  if (averageScore < (template.min_score || 0)) {
    console.log(`Module completion score (${averageScore}%) is below required minimum (${template.min_score}%).`);
    return;
  }
  // For attendance, we assume 100% if all lessons are completed.
  // If a more granular attendance tracking is needed, it would be implemented here.
  if (100 < (template.min_attendance || 0)) { // Assuming 100% attendance if all lessons are completed
    console.log(`Module completion attendance (100%) is below required minimum (${template.min_attendance}%).`);
    return;
  }

  // 7. Fetch student name, module name, and course name
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', userId)
    .single();

  if (profileError || !profileData) {
    console.error("Error fetching student profile:", profileError);
    return;
  }

  const { data: moduleData, error: moduleDataError } = await supabase
    .from('modules')
    .select('title')
    .eq('id', moduleId)
    .single();

  if (moduleDataError || !moduleData) {
    console.error("Error fetching module data:", moduleDataError);
    return;
  }

  const { data: courseData, error: courseDataError } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single();

  if (courseDataError || !courseData) {
    console.error("Error fetching course data:", courseDataError);
    return;
  }

  // 8. Generate unique validation code
  const { data: validationCode, error: codeError } = await supabase.rpc('generate_certificate_code');

  if (codeError || !validationCode) {
    console.error("Error generating validation code:", codeError);
    return;
  }

  // 9. Check if certificate already exists for this module and user
  const { data: existingCertificate, error: existingCertError } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle();

  if (existingCertError) {
    console.error("Error checking for existing certificate:", existingCertError);
    return;
  }

  if (existingCertificate) {
    console.log(`Certificate for module ${moduleId} already issued to user ${userId}.`);
    return; // Certificate already issued
  }

  // 10. Insert new certificate
  const { error: insertCertError } = await supabase.from('certificates').insert({
    user_id: userId,
    module_id: moduleId,
    course_name: courseData.title, // Use course name for context
    student_name: profileData.full_name,
    validation_code: validationCode,
    issued_at: new Date().toISOString(),
    template_id: template.id,
    hours_load: template.hours_load,
    score: averageScore,
    // pdf_url will be generated by a separate service or process
    pdf_url: null, 
  });

  if (insertCertError) {
    console.error("Error inserting new certificate:", insertCertError);
    toast.error("Erro ao emitir certificado do módulo.");
    return;
  }

  toast.success(`Certificado do módulo "${moduleData.title}" emitido!`);
  console.log(`Certificate issued for module ${moduleData.title} to user ${profileData.full_name}.`);
}