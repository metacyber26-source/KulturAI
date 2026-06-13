"use client"

import { useState } from "react"
import type { DictionaryEntry, RegionId } from "@/data/types"
import { getSelfEvolvingVocabulary } from "@/lib/self-evolving"
import { AlertCircle, Check, Lightbulb, Send, X } from "lucide-react"

interface UserFeedbackModalProps {
  heardTerm: string
  regionId: RegionId
  detectedEntry?: DictionaryEntry
  onClose: () => void
  onSubmit?: (correction: {
    heardTerm: string
    correctedTerm: string
  }) => void
}

export function UserFeedbackModal({
  heardTerm,
  regionId,
  detectedEntry,
  onClose,
  onSubmit,
}: UserFeedbackModalProps) {
  const [correction, setCorrection] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confidence, setConfidence] = useState(0.5)

  const handleSubmit = async () => {
    if (!correction.trim()) return

    setIsSubmitting(true)
    try {
      const vocab = getSelfEvolvingVocabulary()
      await vocab.processUserCorrection({
        heardTerm,
        correctedTerm: correction,
        regionId,
        confidence,
        timestamp: Date.now(),
        tone: undefined,
        context: detectedEntry?.term,
      })

      setSubmitted(true)
      onSubmit?.({ heardTerm, correctedTerm: correction })

      // Auto-close after success
      setTimeout(onClose, 2000)
    } catch (error) {
      console.error("[v0] Feedback submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="mx-4 max-w-sm rounded-3xl bg-card p-6 shadow-xl">
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-accent/15 p-4">
            <Check className="h-6 w-6 text-accent" />
            <p className="text-lg font-bold text-foreground">
              Correction recorded!
            </p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Your correction helps train the on-device AI. As you make more
            corrections, vocabulary suggestions improve automatically.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-full bg-primary py-2.5 font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 max-w-sm rounded-3xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Correct Term</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl bg-secondary/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">You said:</p>
          <p className="text-lg font-bold text-foreground">{heardTerm}</p>
        </div>

        {detectedEntry && (
          <div className="mt-3 rounded-xl border border-border bg-card p-3">
            <p className="text-xs font-medium text-muted-foreground">
              We thought you meant:
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">
              {detectedEntry.term}
            </p>
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs font-medium text-foreground">
            Actually, you said:
          </label>
          <input
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Enter the correct term"
            className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">
              How confident are you?
            </label>
            <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-bold text-primary">
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            className="mt-2 w-full"
          />
        </div>

        <div className="mt-4 flex items-gap-2 gap-2 rounded-xl bg-blue-50 p-3">
          <Lightbulb className="h-4 w-4 flex-shrink-0 text-blue-600" />
          <p className="text-xs text-blue-900">
            Your corrections train the AI to recognize regional terms better.
            They stay completely on your device.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!correction.trim() || isSubmitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Recording..." : "Record Correction"}
        </button>
      </div>
    </div>
  )
}
