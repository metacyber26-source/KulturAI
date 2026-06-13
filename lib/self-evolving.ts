// Self-Evolving Vocabulary System
// Automated dictionary generation, feature discovery, and self-upgrade pipeline

import type { DictionaryEntry, RegionId } from "@/data/types"
import { getWasmCompiler, type CompiledDictionary } from "./wasm-bridge"
import { getMLTrainer, type UserCorrection } from "./ml-training"
import { cacheEntry, recordUsage } from "./indexed-db-cache"

export interface SelfUpgradePackage {
  entries: DictionaryEntry[]
  source: "ml_training" | "semantic" | "user_feedback"
  confidence: number
  appliedAt?: number
}

export interface VocabularySuggestion {
  term: string
  source: string
  confidence: number
  suggestedEntry: DictionaryEntry
}

/**
 * Self-Evolving Vocabulary Manager
 * Autonomous dictionary self-upgrade without cloud dependencies
 */
export class SelfEvolvingVocabulary {
  private compiler = getWasmCompiler()
  private trainer = getMLTrainer()
  private compiledCache: Map<RegionId, CompiledDictionary> = new Map()
  private upgradeQueue: SelfUpgradePackage[] = []
  private discoveredFeatures: Map<RegionId, string[]> = new Map()

  /**
   * Initialize WASM compilation and discover features
   */
  async initializeRegion(
    entries: DictionaryEntry[],
    regionId: RegionId,
  ): Promise<void> {
    // Compile dictionary with WASM bridge
    const compiled = this.compiler.compile(entries, regionId)
    this.compiledCache.set(regionId, compiled)

    // Discover structural features
    const features = this.compiler.discoverFeatures(compiled)
    this.discoveredFeatures.set(regionId, features)

    console.log(
      `[v0] Compiled ${compiled.metadata.entryCount} entries for ${regionId}`,
    )
    console.log(`[v0] Discovered features: ${features.join(", ")}`)
  }

  /**
   * Process user correction and trigger self-upgrade
   */
  async processUserCorrection(correction: Omit<UserCorrection, "id">) {
    // Record in ML trainer
    const recorded = this.trainer.recordCorrection(correction)

    // Check if we should auto-upgrade based on correction patterns
    const suggestions = this.trainer.suggestNewEntries(correction.regionId)
    if (suggestions.length > 0) {
      await this.scheduleUpgrade({
        entries: suggestions,
        source: "ml_training",
        confidence: this.calculateConfidence(suggestions),
      })
    }
  }

  /**
   * Schedule vocabulary upgrade package
   */
  async scheduleUpgrade(pkg: SelfUpgradePackage): Promise<void> {
    this.upgradeQueue.push(pkg)

    // If queue is small, apply immediately; otherwise batch
    if (this.upgradeQueue.length >= 5) {
      await this.flushUpgradeQueue()
    } else {
      // Schedule with delay
      setTimeout(() => this.flushUpgradeQueue(), 5000)
    }
  }

  /**
   * Apply all pending upgrades to vocabulary
   */
  async flushUpgradeQueue(): Promise<number> {
    let applied = 0

    for (const pkg of this.upgradeQueue) {
      for (const entry of pkg.entries) {
        // Cache new entries for rapid access
        await cacheEntry(entry, "javanese") // Would be regionId from context
        applied++
      }
      pkg.appliedAt = Date.now()
    }

    if (applied > 0) {
      console.log(`[v0] Applied ${applied} vocabulary upgrades from ${this.upgradeQueue.length} packages`)
    }

    this.upgradeQueue = []
    return applied
  }

  /**
   * Calculate confidence score for upgrade package
   */
  private calculateConfidence(entries: DictionaryEntry[]): number {
    if (entries.length === 0) return 0
    // Confidence increases with more diverse, consistent corrections
    return Math.min(0.98, 0.6 + entries.length * 0.05)
  }

  /**
   * Get vocabulary suggestions for given term
   */
  async getSuggestions(
    heardTerm: string,
    regionId: RegionId,
  ): Promise<VocabularySuggestion[]> {
    const suggestions: VocabularySuggestion[] = []

    // 1. Check ML model predictions
    const mlPrediction = this.trainer.predict(heardTerm, regionId)
    if (mlPrediction) {
      suggestions.push({
        term: mlPrediction,
        source: "ml_prediction",
        confidence: 0.85,
        suggestedEntry: {
          term: mlPrediction,
          literal: `ML-predicted correction`,
          contextual: `Based on ${regionId} speech patterns learned from user corrections`,
          culturalTip: "This term may be appropriate in your region",
          guidanceType: "social",
        },
      })
    }

    // 2. Check pending upgrades
    for (const pkg of this.upgradeQueue) {
      for (const entry of pkg.entries) {
        if (
          entry.term.toLowerCase().includes(heardTerm.toLowerCase()) ||
          heardTerm.toLowerCase().includes(entry.term.toLowerCase())
        ) {
          suggestions.push({
            term: entry.term,
            source: pkg.source,
            confidence: pkg.confidence,
            suggestedEntry: entry,
          })
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Get current model state for monitoring
   */
  getTrainingState(regionId: RegionId) {
    return this.trainer.getModelState(regionId)
  }

  /**
   * Get discovered features for display
   */
  getDiscoveredFeatures(regionId: RegionId): string[] {
    return this.discoveredFeatures.get(regionId) ?? []
  }

  /**
   * Get WASM compiler memory stats
   */
  getMemoryStats() {
    return this.compiler.getMemoryStats()
  }

  /**
   * Get upgrade queue status
   */
  getUpgradeQueueStatus() {
    return {
      pending: this.upgradeQueue.length,
      totalEntriesToApply: this.upgradeQueue.reduce(
        (sum, pkg) => sum + pkg.entries.length,
        0,
      ),
    }
  }
}

// Singleton instance
let vocabSystem: SelfEvolvingVocabulary | null = null

export function getSelfEvolvingVocabulary(): SelfEvolvingVocabulary {
  if (!vocabSystem) {
    vocabSystem = new SelfEvolvingVocabulary()
  }
  return vocabSystem
}
