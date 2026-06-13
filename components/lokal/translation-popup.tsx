"use client"

import { useEffect, useState } from "react"
import type { DictionaryEntry, RegionId } from "@/data/types"
import { REGION_META } from "@/data/config"
import { GuidanceBadge, LevelBadge } from "./badges"
import { X, Lightbulb, Radio, AlertCircle } from "lucide-react"
import type { ToneAnalysis } from "@/lib/tone-analysis"
import { UserFeedbackModal } from "./user-feedback-modal"

export interface PopupItem {
  id: string
  entry: DictionaryEntry
  regionId: RegionId
  tone?: ToneAnalysis
  heardTerm?: string
}

interface TranslationPopupProps {
  item: PopupItem
  onDismiss: (id: string) => void
  autoDismissMs?: number
}

export function TranslationPopup({
  item,
  onDismiss,
  autoDismissMs = 9000,
}: TranslationPopupProps) {
  const { entry, regionId, id, tone, heardTerm } = item
  const accent = REGION_META[regionId].colorVar
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), autoDismissMs)
    return () => clearTimeout(timer)
  }, [id, autoDismissMs, onDismiss])

  const getToneColor = (toneType: string) => {
    switch (toneType) {
      case "aggressive":
        return "bg-red-100 text-red-900 border-red-300"
      case "sarcastic":
        return "bg-yellow-100 text-yellow-900 border-yellow-300"
      case "polite":
        return "bg-green-100 text-green-900 border-green-300"
      case "eager":
        return "bg-blue-100 text-blue-900 border-blue-300"
      case "cautious":
        return "bg-orange-100 text-orange-900 border-orange-300"
      default:
        return "bg-gray-100 text-gray-900 border-gray-300"
    }
  }

  if (showFeedback && heardTerm) {
    return (
      <UserFeedbackModal
        heardTerm={heardTerm}
        regionId={regionId}
        detectedEntry={entry}
        onClose={() => {
          setShowFeedback(false)
          onDismiss(id)
        }}
      />
    )
  }

  return (
    <div
      role="alert"
      onClick={() => onDismiss(id)}
      className="animate-popup-in pointer-events-auto relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDismiss(id)
        }}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="py-4 pl-5 pr-9">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-foreground">{entry.term}</h3>
          <LevelBadge level={entry.level} />
        </div>
        {entry.pronunciation && (
          <p className="text-xs italic text-muted-foreground">
            /{entry.pronunciation}/
          </p>
        )}

        <p className="mt-2 text-base font-semibold text-foreground">
          {entry.literal}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {entry.contextual}
        </p>

        {tone && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border p-2">
            <Radio className="h-3.5 w-3.5 flex-shrink-0 text-accent" />
            <div className="flex-1">
              <span
                className={`inline-block rounded-full px-2 py-1 text-xs font-semibold border ${getToneColor(tone.tone)}`}
              >
                {tone.tone.charAt(0).toUpperCase() + tone.tone.slice(1)} tone
                ({Math.round(tone.confidence * 100)}%)
              </span>
              <p className="mt-1 text-xs text-foreground">
                {tone.recommendation}
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 rounded-xl bg-secondary/70 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-accent" />
            <GuidanceBadge type={entry.guidanceType} />
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {entry.culturalTip}
          </p>
        </div>

        {heardTerm && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowFeedback(true)
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary/50 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Report Correction
          </button>
        )}
      </div>
    </div>
  )
}
