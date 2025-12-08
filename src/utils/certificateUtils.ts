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
  console.log("--- checkAndIssueModuleCertificate initiated ---");
  console.log({ userId, moduleId, courseId });

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
    console.log(`Module ${moduleId} has no lessons. Skipping certificate check.`);
    return;
  }
  console.log(`Lessons in module ${moduleId}:`, lessonsInModule.length);

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
  console.log(`Exercises in module's lessons:`, exercisesInLessons.length);

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
  console.log(`Student progress entries:`, studentProgress?.length);

  const completedLessons = new Set(studentProgress?.filter(p => p.lesson_id && p.completed).map(p => p.lesson_id));
  const completedExercises = new Set(studentProgress?.filter(p => p.exercise_id && p.completed).map(p => p.exercise_id));
  const exerciseScores = new Map<string, number>(studentProgress?.filter(p => p.exercise_id && p.score !== null).map(p => [p.exercise_id!, p.score!]) || []);

  // Check if all lessons in the module are completed
  const allLessonsCompleted = lessonsInModule.every(lesson => completedLessons.has(lesson.id));
  console.log(`All lessons completed in module: ${allLessonsCompleted}`);

  // Check if all exercises in the module are completed
  const allExercisesCompleted = exercisesInLessons.every(exercise => completedExercises.has(exercise.id));
  console.log(`All exercises completed in module: ${allExercisesCompleted}`);

  if (!allLessonsCompleted || !allExercisesCompleted) {
    console.log(`Module ${moduleId} not fully completed by user ${userId}. Returning early.`);
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
    console.log("No active module certificate template found. Returning early.");
    toast.error("Nenhum modelo de certificado de módulo ativo encontrado.");
    return;
  }
  console.log("Active certificate template found:", template.name);

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
  console.log(`Calculated average score: ${averageScore}%`);

  // 6. Check if requirements are met
  if (averageScore < (template.min_score || 0)) {
    console.log(`Module completion score (${averageScore}%) is below required minimum (${template.min_score}%). Returning early.`);
    toast.error(`Sua nota (${averageScore}%) é inferior à mínima exigida (${template.min_score}%) para o certificado.`);
    return;
  }
  // Assuming 100% attendance if all lessons are completed.
  // The condition `100 < (template.min_attendance || 0)` means: if required attendance is > 100%, it fails.
  // This is a simplified check. If a more granular attendance tracking is needed, it would be implemented here.
  if (template.min_attendance && (100 < template.min_attendance)) { 
    console.log(`Module completion attendance (100%) is below required minimum (${template.min_attendance}%). Returning early.`);
    toast.error(`Sua frequência (100%) é inferior à mínima exigida (${template.min_attendance}%) para o certificado.`);
    return;
  }
  console.log("Score and attendance requirements met.");

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
  console.log("Student profile fetched:", profileData.full_name);

  const { data: moduleData, error: moduleDataError } = await supabase
    .from('modules')
    .select('title')
    .eq('id', moduleId)
    .single();

  if (moduleDataError || !moduleData) {
    console.error("Error fetching module data:", moduleDataError);
    return;
  }
  console.log("Module data fetched:", moduleData.title);

  const { data: courseData, error: courseDataError } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single();

  if (courseDataError || !courseData) {
    console.error("Error fetching course data:", courseDataError);
    return;
  }
  console.log("Course data fetched:", courseData.title);

  // 8. Generate unique validation code
  const { data: validationCode, error: codeError } = await supabase.rpc('generate_certificate_code');

  if (codeError || !validationCode) {
    console.error("Error generating validation code:", codeError);
    toast.error("Erro ao gerar código de validação para o certificado.");
    return;
  }
  console.log("Validation code generated:", validationCode);

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
    console.log(`Certificate for module ${moduleId} already issued to user ${userId}. Returning early.`);
    toast.info(`Você já possui o certificado para o módulo "${moduleData.title}".`);
    return; // Certificate already issued
  }
  console.log("No existing certificate found. Proceeding to insert.");

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
    // Usando um URL de placeholder para uma imagem de certificado.
    // Em um ambiente de produção, um serviço de backend geraria o PNG real
    // e faria o upload para um armazenamento (ex: Supabase Storage, S3).
    pdf_url: `https://via.placeholder.com/800x600/007bff/ffffff?text=Certificado+JovemCoder`, 
  });

  if (insertCertError) {
    console.error("Error inserting new certificate:", insertCertError);
    toast.error("Erro ao emitir certificado do módulo.");
    return;
  }

  toast.success(`Certificado do módulo "${moduleData.title}" emitido!`);
  console.log(`Certificate issued for module ${moduleData.title} to user ${profileData.full_name}.`);
  console.log("--- checkAndIssueModuleCertificate finished ---");
}