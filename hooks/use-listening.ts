"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DictionaryEntry, RegionId } from "@/data/types"
import { REGION_PACKS } from "@/data/config"
import { zeroShotReasoning } from "@/lib/semantic-embeddings"
import { analyzeTone, type ToneAnalysis } from "@/lib/tone-analysis"
import { cacheEntry, recordUsage, getCachedEntry } from "@/lib/indexed-db-cache"

export type MicPermission = "unknown" | "prompt" | "granted" | "denied"

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null
  const Ctor =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  if (!Ctor) return null
  return new Ctor()
}

function matchEntry(
  transcript: string,
  regionId: RegionId,
): DictionaryEntry | null {
  const text = transcript.toLowerCase()
  const pack = REGION_PACKS[regionId]
  for (const entry of pack.entries) {
    const term = entry.term.toLowerCase()
    if (text.includes(term)) return entry
    // match first significant word of multi-word terms
    const first = term.split(" ")[0]
    if (first.length >= 4 && text.includes(first)) return entry
  }
  return null
}

interface UseListeningOptions {
  regionId: RegionId
  onDetect: (entry: DictionaryEntry, tone?: ToneAnalysis) => void
}

export function useListening({ regionId, onDetect }: UseListeningOptions) {
  const [isListening, setIsListening] = useState(false)
  const [permission, setPermission] = useState<MicPermission>("unknown")
  const [supported, setSupported] = useState(true)
  const [simulated, setSimulated] = useState(false)
  const [lastHeard, setLastHeard] = useState("")
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const onDetectRef = useRef(onDetect)
  const regionRef = useRef(regionId)

  useEffect(() => {
    onDetectRef.current = onDetect
    regionRef.current = regionId
  }, [onDetect, regionId])

  useEffect(() => {
    const rec = getRecognition()
    setSupported(!!rec)
  }, [])

  const startSimulated = useCallback(() => {
    setSimulated(true)
    if (simTimerRef.current) clearInterval(simTimerRef.current)
    simTimerRef.current = setInterval(() => {
      const pack = REGION_PACKS[regionRef.current]
      const entry =
        pack.entries[Math.floor(Math.random() * pack.entries.length)]
      setLastHeard(entry.term)
      onDetectRef.current(entry)
    }, 4500)
  }, [])

  const stop = useCallback(() => {
    setIsListening(false)
    setSimulated(false)
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current)
      simTimerRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* noop */
      }
      recognitionRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
    }
  }, [])

  const start = useCallback(async () => {
    setIsListening(true)
    setLastHeard("")

    // Request mic permission for a clear explanation flow.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        setPermission("granted")

        // Initialize audio context for tone analysis
        const audioContext =
          new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        source.connect(analyser)
        analyserRef.current = analyser
      }
    } catch {
      setPermission("denied")
      // Degrade gracefully to simulated detection.
      startSimulated()
      return
    }

    const rec = getRecognition()
    if (!rec) {
      startSimulated()
      return
    }

    rec.continuous = true
    rec.interimResults = true
    rec.lang = "id-ID"
    rec.onresult = async (e: any) => {
      let transcript = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      setLastHeard(transcript.trim())

      let entry = matchEntry(transcript, regionRef.current)

      // If not found in dictionary, use zero-shot semantic reasoning
      if (!entry) {
        const pack = REGION_PACKS[regionRef.current]
        entry = zeroShotReasoning(transcript.trim(), pack.entries)
      }

      if (entry) {
        // Check cache first for zero-latency
        const cached = await getCachedEntry(entry.term, regionRef.current)
        const finalEntry = cached || entry

        // Analyze tone if audio context available
        let tone: ToneAnalysis | undefined
        if (analyserRef.current) {
          try {
            tone = await analyzeTone(
              audioContextRef.current!,
              analyserRef.current,
              regionRef.current
            )
          } catch {
            // Tone analysis optional
          }
        }

        // Cache entry and record usage
        await cacheEntry(finalEntry, regionRef.current)
        await recordUsage(
          entry.term,
          regionRef.current,
          tone?.tone,
          undefined
        )

        onDetectRef.current(finalEntry, tone)
      }
    }
    rec.onerror = () => {
      // Fall back to simulation if recognition errors (e.g. network/no-speech)
      startSimulated()
    }
    rec.onend = () => {
      // Auto-restart while user keeps listening active
      if (recognitionRef.current === rec) {
        try {
          rec.start()
        } catch {
          /* noop */
        }
      }
    }
    recognitionRef.current = rec
    try {
      rec.start()
    } catch {
      startSimulated()
    }
  }, [startSimulated])

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          /* noop */
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  return { isListening, permission, supported, simulated, lastHeard, start, stop }
}
