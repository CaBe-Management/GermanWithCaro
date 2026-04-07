'use client'

import { useState } from 'react'
import { WordSentence, Word } from '@/lib/supabase'
import WordCard from './WordCard'

interface ClozeCardProps {
  sentence: WordSentence
  word: Word
  onAnswerSubmit: (correct: boolean) => void
  onNext: () => void
}

export default function ClozeCard({
  sentence,
  word,
  onAnswerSubmit,
  onNext,
}: ClozeCardProps) {
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<
    'idle' | 'correct' | 'wrong'
  >('idle')
  const [showTranslation, setShowTranslation] = useState(false)

  const clozeDisplay = sentence.sentence_de.replace(
    new RegExp('\\b' + sentence.cloze_word + '\\b', 'i'),
    '[___]'
  )

  const handleSubmit = () => {
    const isCorrect =
      answer.trim().toLowerCase() ===
      sentence.cloze_word.toLowerCase()

    setFeedback(isCorrect ? 'correct' : 'wrong')
    setShowTranslation(true)
    onAnswerSubmit(isCorrect)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && feedback === 'idle') {
      handleSubmit()
    } else if (e.key === 'Enter' && feedback !== 'idle') {
      onNext()
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Cloze Sentence Card */}
      <div className="card mb-6">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
            Fill in the blank:
          </h2>
          {/* Cloze sentence — text-base on mobile prevents overflow of long German sentences */}
          <p className="text-base sm:text-xl text-accent-violet font-medium leading-relaxed">
            {clozeDisplay}
          </p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer..."
            disabled={feedback !== 'idle'}
            className="input-field w-full text-center"
            autoFocus
          />
        </div>

        {/* Feedback Messages */}
        {feedback === 'correct' && (
          <div className="bg-success bg-opacity-20 border border-success rounded-lg p-4 mb-6">
            <p className="text-success font-semibold text-base sm:text-lg">
              Richtig! ✓
            </p>
          </div>
        )}

        {feedback === 'wrong' && (
          <div className="bg-error bg-opacity-20 border border-error rounded-lg p-4 mb-6">
            <p className="text-error font-semibold mb-2">Falsch ✗</p>
            <p className="text-text-primary">
              Correct answer: <span className="font-bold">{sentence.cloze_word}</span>
            </p>
          </div>
        )}

        {/* Translation */}
        {showTranslation && sentence.sentence_en && (
          <div className="bg-bg-secondary rounded-lg p-4 mb-6">
            <p className="text-text-muted text-sm font-medium mb-2">
              English translation:
            </p>
            <p className="text-text-primary">{sentence.sentence_en}</p>
          </div>
        )}

        {/* Action Buttons — full-width on mobile, centered on larger screens */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
          {feedback === 'idle' && (
            <button onClick={handleSubmit} className="btn-primary w-full sm:w-auto">
              Check
            </button>
          )}
          {feedback !== 'idle' && (
            <button onClick={onNext} className="btn-primary w-full sm:w-auto">
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Word Info Card */}
      <div className="mb-8">
        <p className="text-text-muted text-sm mb-3 font-medium">Word Info:</p>
        <WordCard word={word} />
      </div>
    </div>
  )
}
