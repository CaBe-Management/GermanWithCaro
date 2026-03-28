// Lesson viewer page — fetches the lesson + all its blocks and renders them in order
// Server component: does the data fetching, then passes to client components for interactivity
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TextBlock from '@/components/lesson/TextBlock'
import ExampleSentenceCard from '@/components/lesson/ExampleSentenceCard'
import ConversationBlock from '@/components/lesson/ConversationBlock'
import LessonComplete from '@/components/lesson/LessonComplete'
import type { LessonBlock } from '@/types'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the lesson by its URL slug
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .single()

  if (lessonError || !lesson) notFound()

  // Fetch all content blocks for this lesson, in order
  const { data: blocks } = await supabase
    .from('lesson_blocks')
    .select('*')
    .eq('lesson_id', lesson.id)
    .order('order_index', { ascending: true })

  // Check if the user has already completed this lesson
  const { data: progress } = await supabase
    .from('user_lesson_progress')
    .select('completed_at')
    .eq('user_id', user.id)
    .eq('lesson_id', lesson.id)
    .single()

  const isCompleted = !!progress?.completed_at

  return (
    <main className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Lesson header */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-text3">
            {lesson.unit_name}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-text">{lesson.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-primary-bg px-2.5 py-0.5 text-xs font-medium text-primary-dark">
              {lesson.level}
            </span>
            {isCompleted && (
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Lesson content blocks — rendered in order */}
        <div className="space-y-10">
          {(blocks as LessonBlock[] | null)?.map((block) => {
            // Text blocks: explanations, grammar notes, etc.
            if (block.type === 'text') {
              return <TextBlock key={block.id} block={block} />
            }

            // Example sentences and bad examples
            if (block.type === 'example_sentence' || block.type === 'bad_example') {
              return (
                <ExampleSentenceCard
                  key={block.id}
                  block={block}
                  isBadExample={block.type === 'bad_example'}
                />
              )
            }

            // Conversation blocks (mini-dialogues)
            if (block.type === 'conversation') {
              const conversationContent = block.content as {
                title: string
                context: string
                lines: { speaker: string; german: string; english: string; audio_url: string | null; word_breakdown: { de: string; en: string; role: string }[] }[]
              } | null
              if (!conversationContent) return null
              return (
                <div key={block.id} className="mt-10 border-t border-border pt-10">
                  <ConversationBlock content={conversationContent} />
                </div>
              )
            }

            return null
          })}
        </div>

        {/* Mark as complete button (at the bottom of the lesson) */}
        <div className="mt-12 mb-20">
          <LessonComplete lessonId={lesson.id} isCompleted={isCompleted} />
        </div>
      </div>
    </main>
  )
}
