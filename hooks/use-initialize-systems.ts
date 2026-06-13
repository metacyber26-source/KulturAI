// Hook to initialize self-evolving systems on app startup

import { useEffect, useState } from "react"
import type { RegionId } from "@/data/types"
import { REGION_PACKS } from "@/data/config"
import { getSelfEvolvingVocabulary } from "@/lib/self-evolving"
import { getMLTrainer } from "@/lib/ml-training"
import { getPiPaymentBridge } from "@/lib/pi-payment-bridge"
import { getWasmCompiler } from "@/lib/wasm-bridge"

/**
 * Initialize all self-evolving and advanced systems on app startup
 * Sets up ML training, WASM compilation, payment bridges, and vocabulary evolution
 */
export function useInitializeAdvancedSystems() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("[v0] Initializing advanced LokalSense systems...")

        // 1. Initialize ML trainer
        const trainer = getMLTrainer()
        console.log("[v0] ✓ ML trainer initialized")

        // 2. Initialize WASM compiler and compile all regions
        const compiler = getWasmCompiler()
        const vocab = getSelfEvolvingVocabulary()

        for (const regionId of Object.keys(REGION_PACKS) as RegionId[]) {
          const entries = REGION_PACKS[regionId].entries
          try {
            await vocab.initializeRegion(entries, regionId)
            console.log(
              `[v0] ✓ WASM compiled ${regionId} (${entries.length} entries)`,
            )
          } catch (e) {
            console.error(`[v0] Failed to compile ${regionId}:`, e)
          }
        }

        // 3. Initialize payment bridge
        const bridge = getPiPaymentBridge()
        bridge.initialize("testnet") // Use testnet by default
        console.log("[v0] ✓ Pi Payment Bridge ready (testnet)")

        // 4. Recover pending transactions
        const recovered = await bridge.recoverPendingTransactions()
        if (recovered.length > 0) {
          console.log(
            `[v0] ✓ Recovered ${recovered.length} pending transactions`,
          )
        }

        console.log("[v0] Advanced systems initialized successfully")
        setInitialized(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error("[v0] System initialization error:", message)
        setError(message)
      }
    }

    initialize()
  }, [])

  return { initialized, error }
}
