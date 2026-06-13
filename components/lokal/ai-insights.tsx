"use client"

import { useEffect, useState } from "react"
import type { RegionId } from "@/data/types"
import { Lightbulb, Database, Lock, TrendingUp, Brain } from "lucide-react"
import {
  getCacheStats,
  getFrequentTerms,
  getCachedSearchResults,
} from "@/lib/indexed-db-cache"
import {
  isBiometricAvailable,
  registerBiometric,
} from "@/lib/security-layer"
import { ModelTrainingDashboard } from "./model-dashboard"

interface AIInsightsProps {
  regionId: RegionId
}

export function AIInsights({ regionId }: AIInsightsProps) {
  const [stats, setStats] = useState<{
    cacheEntries: number
    searchResultsCache: number
    historyEntries: number
  }>({
    cacheEntries: 0,
    searchResultsCache: 0,
    historyEntries: 0,
  })
  const [frequentTerms, setFrequentTerms] = useState<string[]>([])
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const cacheStats = await getCacheStats()
        setStats({
          cacheEntries: cacheStats.cacheEntries,
          searchResultsCache: cacheStats.searchResultsCache,
          historyEntries: cacheStats.historyEntries,
        })

        const terms = await getFrequentTerms(regionId, 5)
        setFrequentTerms(terms)

        const biometricSupported = await isBiometricAvailable()
        setBiometricAvailable(biometricSupported)
      } catch (error) {
        console.error("[LokalSense] Failed to load insights:", error)
      }
    }

    loadInsights()
  }, [regionId])

  const handleBiometricToggle = async () => {
    if (!biometricAvailable) return

    try {
      const result = await registerBiometric(`user-${regionId}`)
      if (result.success) {
        setBiometricEnabled(true)
      }
    } catch (error) {
      console.error("[LokalSense] Biometric registration failed:", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* ML Model Training Dashboard */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            Self-Evolving AI Model
          </h3>
        </div>
        <ModelTrainingDashboard regionId={regionId} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Database className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">
            Advanced Caching Layer
          </h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Zero-latency offline access via IndexedDB persistence
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dictionary cache:</span>
            <span className="font-medium text-foreground">
              {stats.cacheEntries} entries
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Search results:</span>
            <span className="font-medium text-foreground">
              {stats.searchResultsCache} cached
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usage history:</span>
            <span className="font-medium text-foreground">
              {stats.historyEntries} records
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">
            AI Learning Suggestions
          </h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Frequently encountered unmapped terms for dictionary expansion
        </p>
        {frequentTerms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {frequentTerms.map((term) => (
              <span
                key={term}
                className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
              >
                {term}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No suggestions yet. Continue using the app to gather data.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">
            Semantic AI Features
          </h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          On-device neural reasoning for zero-shot detection
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              Neural embeddings match unmapped slang via contextual semantics
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              Zero-shot reasoning finds closest cultural matches automatically
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>
              Tone & sentiment analysis detects aggression, sarcasm, politeness
            </span>
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Lock className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Security Features</h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Decentralized, cryptographic protection for all data
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-2">
            <span className="text-sm font-medium text-foreground">
              Biometric Session Lock
            </span>
            <button
              onClick={handleBiometricToggle}
              disabled={!biometricAvailable}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                biometricEnabled
                  ? "bg-green-500 text-white"
                  : biometricAvailable
                    ? "bg-secondary text-foreground hover:bg-accent hover:text-card"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {biometricEnabled ? "Enabled" : "Enable"}
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>✓ AES-256-GCM token encryption</p>
            <p>✓ SHA-256/512 dictionary integrity validation</p>
            <p>✓ Pi SDK auth security untouched</p>
            <p>✓ Offline cryptographic validation</p>
          </div>
        </div>
      </div>
    </div>
  )
}
