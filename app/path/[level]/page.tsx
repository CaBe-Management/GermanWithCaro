'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase, Word } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import WordRow from '@/components/WordRow'

interface WordWithReviewCount extends Word {
  reviewCount: number
}

export default function PathPage() {
  const params = useParams()
  const level = params.level as string
  const [words, setWords] = useState<WordWithReviewCount[]>([])
  const [filteredWords, setFilteredWords] = useState<WordWithReviewCount[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const wordsPerPage = 50

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const sessionId = getOrCreateSessionId()

        // Get all words for this level
        const { data: levelWords } = await supabase
          .from('gwc_words')
          .select('*')
          .eq('level', level)
          .order('frequenz_rang', { ascending: true })

        if (!levelWords) {
          setLoading(false)
          return
        }

        // Efficient batch approach: 2 extra queries instead of N×2
        const wordIds = levelWords.map((w: Word) => w.id)

        const [{ data: sentences }, { data: reviews }] = await Promise.all([
          supabase.from('gwc_word_sentences').select('id, word_id').in('word_id', wordIds),
          supabase.from('gwc_user_reviews').select('word_sentence_id').eq('session_id', sessionId),
        ])

        // Build sentence→word lookup + count reviews per word
        const sentenceToWord: Record<string, string> = {}
        ;(sentences || []).forEach((s: { id: string; word_id: string }) => {
          sentenceToWord[s.id] = s.word_id
        })

        const reviewsPerWord: Record<string, number> = {}
        ;(reviews || []).forEach((r: { word_sentence_id: string }) => {
          const wordId = sentenceToWord[r.word_sentence_id]
          if (wordId) reviewsPerWord[wordId] = (reviewsPerWord[wordId] || 0) + 1
        })

        const wordsWithCounts: WordWithReviewCount[] = levelWords.map((w: Word) => ({
          ...w,
          reviewCount: reviewsPerWord[w.id] || 0,
        }))

        setWords(wordsWithCounts)
        setFilteredWords(wordsWithCounts)
      } catch (error) {
        console.error('Error fetching words:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWords()
  }, [level])

  // Filter words based on search query
  useEffect(() => {
    const filtered = words.filter((word) =>
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (word.artikel && word.artikel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      word.typ.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredWords(filtered)
    setCurrentPage(1)
  }, [searchQuery, words])

  // Pagination
  const startIndex = (currentPage - 1) * wordsPerPage
  const paginatedWords = filteredWords.slice(startIndex, startIndex + wordsPerPage)
  const totalPages = Math.ceil(filteredWords.length / wordsPerPage)

  const getLevelDescription = () => {
    switch (level) {
      case 'A1':
        return 'Elementarstufe 1 — Anfänger'
      case 'A2':
        return 'Elementarstufe 2'
      case 'B1':
        return 'Mittelstufe 1'
      default:
        return `Level ${level}`
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Caro's {level} Path
          </h1>
          <p className="text-text-muted mb-6">{getLevelDescription()}</p>

          {/* Action Buttons */}
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent-purple text-white font-medium hover:bg-accent-violet transition-colors"
            >
              Learn {filteredWords.length} →
            </Link>
            <Link
              href="/review"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
            >
              Review (0)
            </Link>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search for Vocab or Grammar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full"
          />
        </div>

        {/* Words List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-text-muted">Loading words...</p>
          </div>
        ) : paginatedWords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">
              {searchQuery ? 'No words found' : 'No words in this level'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {paginatedWords.map((word) => (
                <WordRow
                  key={word.id}
                  word={word}
                  reviewCount={word.reviewCount}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-bg-card text-text-primary disabled:opacity-50 hover:bg-bg-secondary transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-accent-purple text-white'
                          : 'bg-bg-card text-text-muted hover:bg-bg-secondary'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-bg-card text-text-primary disabled:opacity-50 hover:bg-bg-secondary transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
