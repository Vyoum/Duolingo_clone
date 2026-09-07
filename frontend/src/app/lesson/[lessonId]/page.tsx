import { LessonPlayer } from "@/components/learn/LessonPlayer";
export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <LessonPlayer lessonId={lessonId} />;
}
