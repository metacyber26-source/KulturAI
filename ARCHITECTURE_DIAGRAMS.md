# LokalSense Self-Evolving System Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LokalSense Self-Evolving System                  │
└─────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │   User Flow  │
                            └──────────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
            ┌─────▼─────┐  ┌──────▼──────┐  ┌─────▼──────┐
            │  Listening │  │  Feedback   │  │  Settings  │
            │   Screen   │  │   Modal     │  │  Screen    │
            └─────┬─────┘  └──────┬──────┘  └─────┬──────┘
                  │                │              │
                  │                └──────┬───────┘
                  │                       │
                  └───────────┬───────────┘
                              │
                     ┌────────▼────────┐
                     │  Self-Evolving  │
                     │  Vocabulary Mgr │
                     └────────┬────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐         ┌────▼─────┐         ┌────▼─────┐
   │   WASM    │         │    ML    │         │ Payments │
   │ Compiler  │         │ Trainer  │         │  Bridge  │
   └────┬─────┘         └────┬─────┘         └────┬─────┘
        │                    │                    │
   Compiled Dict        Trained Model        Transactions
   Memory Pool          Levenshtein          (localStorage)
   Feature Discovery    Confidence           Wallet Handshake
   Integrity Hash       New Suggestions      Testnet/Mainnet
```

---

## Data Flow: Self-Evolution Loop

```
LISTENING PHASE
═══════════════════════════════════════════════════════════════════════

    ┌──────────────────────┐
    │ User speaks regional │
    │ term "bapak"         │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ Web Speech API       │
    │ Recognizes "bapak"   │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ Lookup in compiled   │
    │ WASM dictionary      │
    │ Finds "pak"          │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ Display Translation  │
    │ Pop-up with:         │
    │ - Term: pak          │
    │ - Literal: father    │
    │ - Tone badge         │
    │ - Cultural tip       │
    │ - "Report Correction"│
    └──────────┬───────────┘
               │
               ▼


FEEDBACK PHASE
═══════════════════════════════════════════════════════════════════════

    ┌──────────────────────┐
    │ User taps            │
    │ "Report Correction"  │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ Feedback Modal Opens │
    │ Shows heard term     │
    │ Confidence slider    │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ User inputs:         │
    │ - Corrected: "pak"   │
    │ - Confidence: 95%    │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ Submit Correction    │
    └──────────┬───────────┘
               │


TRAINING PHASE
═══════════════════════════════════════════════════════════════════════

    ┌──────────────────────┐
    │ ML Trainer           │
    │ recordCorrection()   │
    │ { heard: "bapak",    │
    │   corrected: "pak",  │
    │   confidence: 0.95 } │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ Correction count: 1  │
    │ Trigger training at  │
    │ 10 corrections ✓     │
    └──────────┬───────────┘
               │
    [User collects 9 more corrections...]
               │
    ┌──────────▼───────────┐
    │ 10th correction!     │
    │ Auto-train triggered │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ train() computes:    │
    │ - Levenshtein dist   │
    │ - Phonetic sim: 0.95 │
    │ - Accuracy: 0.87     │
    │ - Loss: 0.13         │
    └──────────┬───────────┘
               │


UPGRADE PHASE
═══════════════════════════════════════════════════════════════════════

    ┌──────────────────────┐
    │ Model detects pattern│
    │ "pak" appears 2x+    │
    │ in corrections       │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ suggestNewEntries()  │
    │ Returns vocabulary   │
    │ entry for "pak"      │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ scheduleUpgrade()    │
    │ Queues entry for:    │
    │ - Source: ml_training│
    │ - Confidence: 0.87   │
    │ - Batch size: 5      │
    └──────────┬───────────┘
               │
    [Accumulate 5 entries or 5 seconds pass...]
               │
    ┌──────────▼───────────┐
    │ flushUpgradeQueue()  │
    │ Apply to IndexedDB   │
    │ cache 5 new entries  │
    └──────────┬───────────┘
               │


NEXT DETECTION
═══════════════════════════════════════════════════════════════════════

    ┌──────────────────────┐
    │ User says "bpak"     │
    │ (similar phonetic)   │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ WASM compile lookup  │
    │ No direct match ✗    │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ ML predict() uses    │
    │ Levenshtein learning │
    │ Predicts: "pak"      │
    │ Confidence: 0.9      │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ getSuggestions()     │
    │ Returns ML + queue   │
    │ suggestions ranked   │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │ Show improved        │
    │ pop-up with "pak"    │
    │ + model confidence   │
    └──────────┬───────────┘
               │
               ▼ CYCLE CONTINUES...
```

---

## Payment Transaction Flow

```
PAYMENT INITIATION
═══════════════════════════════════════════════════════════════════════

    ┌─────────────────────┐
    │ User taps Premium    │
    │ Package (10π)        │
    └────────────┬────────┘
                 │
    ┌────────────▼─────────┐
    │ performWalletHandshake│
    │                      │
    │ Step 1: Verify auth  │
    │ Step 2: Fetch wallet │
    │ Step 3: Validate fmt │
    │ Step 4: Cache wallet │
    └────────────┬─────────┘
                 │
    ┌────────────▼─────────┐
    │ initiatePayment()    │
    │ {                    │
    │   network: testnet   │
    │   productId: xxx     │
    │   amount: 10         │
    │   maxRetries: 3      │
    │   timeoutMs: 30000   │
    │ }                    │
    └────────────┬─────────┘
                 │


TRANSACTION EXECUTION
═══════════════════════════════════════════════════════════════════════

    ┌────────────┬─────────┐
    │ Create TX  │ ID: abc │
    │ Status: pending      │
    └────────────┬─────────┘
                 │
    ┌────────────▼─────────┐
    │ Execute w/ Timeout   │
    │ (30 seconds)         │
    └────────────┬─────────┘
                 │
    ┌────────────▼─────────┐
    │ Process on testnet   │
    │ Status: approved     │
    └────────────┬─────────┘
                 │
    ┌────────────▼─────────┐
    │ Generate TX ID       │
    │ 0xabc123...xyz       │
    │ Status: completed    │
    └────────────┬─────────┘
                 │
    ┌────────────▼─────────┐
    │ Persist to storage   │
    │ localStorage.setItem │
    │ "pi_tx_abc"          │
    └────────────┬─────────┘
                 │
                 ▼ SUCCESS!


FAILURE RECOVERY
═══════════════════════════════════════════════════════════════════════

    If error occurs during execution:

    ┌────────────────────┐
    │ Catch error        │
    │ Status: failed     │
    │ Retry count: 1     │
    └────────────┬───────┘
                 │
    ┌────────────▼───────┐
    │ Backoff:           │
    │ delay = 2000ms     │
    │ (exponential: 2^n) │
    └────────────┬───────┘
                 │
    ┌────────────▼───────┐
    │ Retry attempt 1/3  │
    └────────────┬───────┘
                 │
                 └──> [Repeat execution]


APP RESTART RECOVERY
═══════════════════════════════════════════════════════════════════════

    ┌─────────────────────┐
    │ App restarts        │
    │ During initialization│
    └────────────┬────────┘
                 │
    ┌────────────▼────────┐
    │ recoverPending      │
    │ Transactions()      │
    │ Scan localStorage   │
    └────────────┬────────┘
                 │
    ┌────────────▼────────┐
    │ Find "pi_tx_*"      │
    │ Status: pending or  │
    │ approved            │
    └────────────┬────────┘
                 │
    ┌────────────▼────────┐
    │ Restore to bridge   │
    │ transactions map    │
    │ Ready for retry     │
    └────────────┬────────┘
                 │
                 ▼ READY!
```

---

## WASM Compilation & Feature Discovery

```
COMPILATION PHASE
═══════════════════════════════════════════════════════════════════════

Input Dictionary (45 entries):
┌────────────────────────────────┐
│ { term: "pak",                │
│   pronunciation: "pahk",      │
│   literal: "father",          │
│   contextual: "informal",     │
│   level: "casual",            │
│   culturalTip: "use when...", │
│   guidanceType: "social" }    │
│                               │
│ [44 more entries...]          │
└────────────┬──────────────────┘
             │
    ┌────────▼─────────────┐
    │ compile() executes:  │
    │ 1. Memory allocate   │
    │ 2. Compress entries  │
    │ 3. Encode to buffer  │
    │ 4. Compute hash      │
    └────────┬─────────────┘
             │
Output: CompiledDictionary
┌────────────────────────────────┐
│ {                             │
│   regionId: "javanese",       │
│   hash: "0xabc123",           │
│   entries: [                  │
│     {                         │
│       ...original,            │
│       vectorId: "vec_0",      │
│       frequency: 0,           │
│       confidence: 0.95        │
│     },                        │
│     [44 more...]             │
│   ],                          │
│   metadata: {                 │
│     compiledAt: 1700000000,  │
│     version: "1.0.0",         │
│     entryCount: 45            │
│   }                           │
│ }                             │
└────────────────────────────────┘


FEATURE DISCOVERY
═══════════════════════════════════════════════════════════════════════

    ┌─────────────────────────┐
    │ discoverFeatures()      │
    │ Introspect compiled     │
    │ structure               │
    └────────────┬────────────┘
                 │
    Check each entry:
    ┌────────────▼────────────┐
    │ Has pronunciation?      │
    │ → Add "pronunciation"   │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ Has level (polite/      │
    │  casual/ritual)?        │
    │ → Add "language_levels" │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ guidanceType = gesture? │
    │ → Add "gesture_guidance"│
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ guidanceType = taboo?   │
    │ → Add "taboo_detection" │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │ Count entries > 100?    │
    │ → Add "large_dictionary"│
    └────────────┬────────────┘
                 │
Discovered Features:
┌────────────────────────────────┐
│ [                              │
│   "pronunciation",             │
│   "language_levels",           │
│   "gesture_guidance",          │
│   "large_dictionary"           │
│ ]                              │
└────────────────────────────────┘
```

---

## Memory Management

```
WASM MEMORY POOL
═══════════════════════════════════════════════════════════════════════

Allocation Strategy:
┌──────────────────────────────────────┐
│ Total Pool: 10 MB                   │
│                                     │
│ ┌──────────────────────────────────┐│
│ │ Javanese: 2 MB (45 entries)     ││
│ │ vector_javanese_123456789       ││
│ │ [████████░░░░░░░░░░░░░░░░░░░░░░]││
│ └──────────────────────────────────┘│
│                                     │
│ ┌──────────────────────────────────┐│
│ │ Sundanese: 1.8 MB (42 entries)  ││
│ │ vector_sundanese_123456789      ││
│ │ [███████░░░░░░░░░░░░░░░░░░░░░░░░]││
│ └──────────────────────────────────┘│
│                                     │
│ ┌──────────────────────────────────┐│
│ │ Balinese: 1.5 MB (38 entries)   ││
│ │ vector_balinese_123456789       ││
│ │ [██████░░░░░░░░░░░░░░░░░░░░░░░░]││
│ └──────────────────────────────────┘│
│                                     │
│ Available: 4.7 MB                  │
└──────────────────────────────────────┘

Stats Accessible via:
getMemoryStats() → {
  buffers: 3,
  totalSize: 5300000  // bytes
}
```

---

## Integration Points Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ User Interface                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Listening Screen → Translation Pop-up (with "Report Correction")   │
│  ↓                                                                   │
│  User Feedback Modal ← UserFeedbackModal.tsx                       │
│  ↓                                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Self-Evolving System                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  SelfEvolvingVocabulary                                             │
│  ├─ initializeRegion(entries, regionId)                             │
│  │  └─ calls: WasmDictionaryCompiler.compile()                     │
│  │                                                                 │
│  ├─ processUserCorrection(correction)                              │
│  │  └─ calls: OnDeviceMLTrainer.recordCorrection()                 │
│  │     └─ triggers: auto-train at 10 corrections                   │
│  │     └─ calls: suggestNewEntries()                               │
│  │        └─ calls: scheduleUpgrade()                              │
│  │           └─ calls: flushUpgradeQueue()                         │
│  │                                                                 │
│  └─ getSuggestions(heardTerm, regionId)                            │
│     ├─ ML predictions from OnDeviceMLTrainer.predict()             │
│     └─ pending upgrades from queue                                 │
│                                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Payment System                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PiNetworkPaymentBridge                                             │
│  ├─ initialize(network) → set testnet/mainnet                      │
│  ├─ performWalletHandshake(userId) → validate wallet              │
│  ├─ initiatePayment(config) → create transaction                  │
│  ├─ executeTransactionWithTimeout() → process with 30s timeout     │
│  ├─ handleTransactionFailure() → retry with backoff               │
│  ├─ persists to localStorage                                       │
│  └─ recoverPendingTransactions() → on app restart                  │
│                                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Monitoring & Analytics                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ModelTrainingDashboard                                             │
│  ├─ Real-time ML metrics (accuracy, epochs)                        │
│  ├─ Memory stats (WASM buffers)                                    │
│  ├─ Discovered features                                            │
│  └─ Payment network status                                         │
│                                                                    │
│  Console Logs: [v0] prefix for easy filtering                      │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

**All systems fully integrated and production-ready!** ✅
