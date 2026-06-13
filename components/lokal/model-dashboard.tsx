"use client"

import { useEffect, useState } from "react"
import type { RegionId } from "@/data/types"
import { getSelfEvolvingVocabulary } from "@/lib/self-evolving"
import { getMLTrainer } from "@/lib/ml-training"
import { getPiPaymentBridge } from "@/lib/pi-payment-bridge"
import {
  Brain,
  TrendingUp,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"

interface ModelDashboardProps {
  regionId: RegionId
}

export function ModelTrainingDashboard({ regionId }: ModelDashboardProps) {
  const [modelState, setModelState] = useState<any>(null)
  const [vocabState, setVocabState] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateStats = () => {
      const vocab = getSelfEvolvingVocabulary()
      const trainer = getMLTrainer()
      const bridge = getPiPaymentBridge()

      setModelState(trainer.getModelState(regionId))
      setVocabState({
        memory: vocab.getMemoryStats(),
        queue: vocab.getUpgradeQueueStatus(),
        features: vocab.getDiscoveredFeatures(regionId),
      })
      setPaymentStatus(bridge.getStatus())
      setLoading(false)
    }

    updateStats()
    const timer = setInterval(updateStats, 5000)
    return () => clearInterval(timer)
  }, [regionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-secondary/50 p-8">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ML Model Status */}
      {modelState && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">ML Model Status</h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Training Epochs:</span>
              <span className="font-semibold text-foreground">
                {modelState.trainingEpochs}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Model Accuracy:</span>
              <span className="rounded-full bg-accent/15 px-2 py-1 font-semibold text-accent">
                {Math.round(modelState.accuracy * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Corrections Learned:</span>
              <span className="font-semibold text-foreground">
                {modelState.totalCorrections}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${modelState.accuracy * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Memory & Cache Status */}
      {vocabState && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              Memory & Cache
            </h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">WASM Buffers:</span>
              <span className="font-semibold text-foreground">
                {vocabState.memory.buffers}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Memory Used:</span>
              <span className="rounded-full bg-primary/15 px-2 py-1 font-semibold text-primary">
                {(vocabState.memory.totalSize / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Upgrade Queue:</span>
              <span className="font-semibold text-foreground">
                {vocabState.queue.pending} pending
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Discovered Features */}
      {vocabState?.features?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-bold text-foreground">
              Discovered Features
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {vocabState.features.map((feature: string, i: number) => (
              <span
                key={i}
                className="rounded-full border border-accent/50 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent-foreground"
              >
                {feature.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Payment Network Status */}
      {paymentStatus && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              Payment Network
            </h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network:</span>
              <span className="rounded-full bg-primary/15 px-2 py-1 font-semibold text-primary">
                {paymentStatus.network.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active TXs:</span>
              <span className="font-semibold text-foreground">
                {paymentStatus.activeTransactions}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed:</span>
              <span className="rounded-full bg-accent/15 px-2 py-1 font-semibold text-accent">
                {paymentStatus.completedTransactions}
              </span>
            </div>
            {paymentStatus.failedTransactions > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Failed:</span>
                <span className="rounded-full bg-red-100 px-2 py-1 font-semibold text-red-700">
                  {paymentStatus.failedTransactions}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 rounded-xl bg-secondary/50 p-3">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          All AI training, payment processing, and data handling happens on your
          device. No data leaves LokalSense.
        </p>
      </div>
    </div>
  )
}
