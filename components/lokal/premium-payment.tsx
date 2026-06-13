"use client"

import { useState } from "react"
import { getPiPaymentBridge, type PiPaymentConfig } from "@/lib/pi-payment-bridge"
import { usePiAuth } from "@/contexts/pi-auth-context"
import { AlertCircle, Zap, Lock, CheckCircle, Clock } from "lucide-react"

interface PremiumPackageProps {
  name: string
  priceInPi: number
  description: string
  features: string[]
  productId: string
}

const PREMIUM_PACKAGES: PremiumPackageProps[] = [
  {
    name: "Regional Pro",
    priceInPi: 10,
    description: "Unlock 5 additional regional language packs",
    features: [
      "Minangkabau, Banjarese, Buginese",
      "Advanced tone analysis",
      "Custom vocabulary",
    ],
    productId: "regional_pro_10pi",
  },
  {
    name: "Master Bundle",
    priceInPi: 25,
    description: "All premium features + lifetime updates",
    features: [
      "All 8 regional packs",
      "Advanced AI features",
      "Priority updates",
      "Gesture recognition ready",
    ],
    productId: "master_bundle_25pi",
  },
]

export function PremiumPaymentUI() {
  const { isAuthenticated, userId } = usePiAuth()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<string | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async (pkg: PremiumPackageProps) => {
    if (!isAuthenticated || !userId) {
      setError("Please sign in with Pi Network first")
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const bridge = getPiPaymentBridge()

      // Step 1: Perform wallet handshake
      const handshake = await bridge.performWalletHandshake(userId)
      if (!handshake.success) {
        throw new Error(handshake.error || "Wallet handshake failed")
      }

      setTransactionStatus("Wallet verified...")

      // Step 2: Initiate payment
      const config: PiPaymentConfig = {
        network: "testnet", // Use testnet for safety
        productId: pkg.productId,
        amount: pkg.priceInPi,
        memo: `LokalSense Premium: ${pkg.name}`,
        maxRetries: 3,
        timeoutMs: 30000,
      }

      const tx = await bridge.initiatePayment(config)

      if (tx.status === "completed" && tx.blockchainTxId) {
        setTransactionStatus(`Payment successful! TX: ${tx.blockchainTxId.slice(0, 12)}...`)
        setTimeout(() => {
          setSelectedPackage(null)
          setProcessing(false)
          setTransactionStatus(null)
        }, 3000)
      } else if (tx.status === "failed") {
        throw new Error(tx.error || "Payment failed")
      } else {
        setTransactionStatus(`Payment status: ${tx.status}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      console.error("[v0] Payment error:", message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Zap className="h-4 w-4 text-accent" />
        Premium Features
      </h3>

      {error && (
        <div className="flex gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {transactionStatus && (
        <div className="flex gap-2 rounded-xl border border-accent/50 bg-accent/10 p-3">
          <Clock className="h-5 w-5 flex-shrink-0 animate-spin text-accent" />
          <p className="text-sm text-accent-foreground">{transactionStatus}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {PREMIUM_PACKAGES.map((pkg) => (
          <button
            key={pkg.productId}
            onClick={() => setSelectedPackage(pkg.productId)}
            className="rounded-2xl border-2 border-border bg-card p-4 text-left transition-all duration-300 hover:border-primary hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-foreground">{pkg.name}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {pkg.description}
                </p>
                <ul className="mt-2 space-y-1">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      • {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                {pkg.priceInPi} π
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedPackage && (
        <div className="rounded-2xl border border-primary bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">
            Ready to unlock premium features?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your wallet will be verified and payment processed on Pi testnet for
            safety.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() =>
                handlePurchase(
                  PREMIUM_PACKAGES.find((p) => p.productId === selectedPackage)!,
                )
              }
              disabled={processing}
              className="flex-1 rounded-full bg-primary py-2 font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {processing ? "Processing..." : "Confirm Purchase"}
            </button>
            <button
              onClick={() => setSelectedPackage(null)}
              className="rounded-full border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 rounded-xl bg-secondary/50 p-3">
        <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          All transactions are encrypted and performed on-device. Your Pi wallet
          never shares private keys with this app.
        </p>
      </div>
    </div>
  )
}
