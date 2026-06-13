/**
 * Sentiment & Tone Analysis system using Web Audio API.
 * Analyzes speech patterns (pitch, intensity, pace) to detect emotional context.
 * Classifies tone as: aggressive, sarcastic, polite, neutral, eager, cautious.
 */

export type ToneType =
  | "aggressive"
  | "sarcastic"
  | "polite"
  | "neutral"
  | "eager"
  | "cautious";

export interface ToneAnalysis {
  tone: ToneType;
  confidence: number;
  characteristics: {
    pitchVariation: number; // 0-1: high = sarcasm/excitement, low = monotone
    intensity: number; // 0-1: volume level analysis
    pace: number; // 0-1: speech rate (0.5 = slow/cautious, 1.0 = fast/eager)
    pauseFrequency: number; // 0-1: how often speaker pauses
  };
  recommendation: string; // Cultural tip based on detected tone
}

/**
 * Analyze audio data to extract tone indicators.
 * Uses frequency analysis and amplitude dynamics from audio context.
 */
async function analyzeAudioData(
  audioContext: AudioContext,
  analyser: AnalyserNode
): Promise<ToneAnalysis["characteristics"]> {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  // Calculate frequency spread (pitch variation)
  let sum = 0;
  let sqSum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
    sqSum += dataArray[i] * dataArray[i];
  }
  const mean = sum / dataArray.length;
  const variance = sqSum / dataArray.length - mean * mean;
  const pitchVariation = Math.min(Math.sqrt(variance) / 128, 1);

  // Amplitude-based intensity
  const timeDomain = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(timeDomain);
  let intensity = 0;
  for (let i = 0; i < timeDomain.length; i++) {
    intensity += Math.abs(timeDomain[i] - 128);
  }
  intensity = Math.min(intensity / (timeDomain.length * 128), 1);

  // Simulated pace detection (would require more complex analysis in production)
  const pace = 0.5 + Math.random() * 0.5; // Placeholder

  // Pause frequency placeholder
  const pauseFrequency = Math.random() * 0.3;

  return {
    pitchVariation,
    intensity,
    pace,
    pauseFrequency,
  };
}

/**
 * Classify tone based on audio characteristics.
 */
function classifyTone(
  characteristics: ToneAnalysis["characteristics"]
): { tone: ToneType; confidence: number } {
  const { pitchVariation, intensity, pace, pauseFrequency } = characteristics;

  // High intensity + high pitch variation + fast pace = aggressive
  if (intensity > 0.6 && pitchVariation > 0.6 && pace > 0.7) {
    return {
      tone: "aggressive",
      confidence: Math.min(intensity * pitchVariation * pace, 1),
    };
  }

  // High pitch variation + moderate intensity + medium pace = sarcastic
  if (pitchVariation > 0.7 && intensity > 0.4 && intensity < 0.7) {
    return {
      tone: "sarcastic",
      confidence: Math.min(pitchVariation * 0.8, 1),
    };
  }

  // Low intensity + slow pace + high pauses = polite/cautious
  if (intensity < 0.4 && pauseFrequency > 0.2) {
    return {
      tone: pauseFrequency > 0.25 ? "cautious" : "polite",
      confidence: Math.min((1 - intensity) * (1 - pace), 1),
    };
  }

  // Fast pace + high intensity = eager
  if (pace > 0.75 && intensity > 0.5) {
    return {
      tone: "eager",
      confidence: Math.min(pace * intensity * 0.9, 1),
    };
  }

  // Default to neutral
  return {
    tone: "neutral",
    confidence: 0.5,
  };
}

/**
 * Get cultural guidance recommendation based on detected tone.
 */
function getToneRecommendation(tone: ToneType, regionId: string): string {
  const recommendations: Record<ToneType, Record<string, string>> = {
    aggressive: {
      javanese: "High intensity detected. Use gentle, krama (formal) speech.",
      sundanese: "Tone is strong. Soften with polite diminutives.",
      balinese: "Respect hierarchy. Lower voice and pace.",
      default: "Moderate your tone to avoid offense.",
    },
    sarcastic: {
      javanese: "Sarcasm may be misinterpreted. Use direct courtesy.",
      sundanese: "Humor context unclear. Be explicit and gentle.",
      balinese: "Sacred context may not suit irony. Speak clearly.",
      default: "Avoid sarcasm to prevent cultural misunderstanding.",
    },
    polite: {
      javanese: "Excellent polite register. Continue krama speech.",
      sundanese: "Good respectful tone. Maintain gentle demeanor.",
      balinese: "Respectful approach appreciated. Keep reverence.",
      default: "Your polite tone is well-received.",
    },
    neutral: {
      javanese: "Neutral acceptable. Consider context and relationship.",
      sundanese: "Moderate tone. Adjust based on formal/informal setting.",
      balinese: "Standard tone. Respect ritual context.",
      default: "Your tone is appropriate.",
    },
    eager: {
      javanese: "Enthusiasm noted. Balance with formal courtesy.",
      sundanese: "Energy good. Channel into sincere helpfulness.",
      balinese: "Enthusiasm welcomed. Respect ritual timing.",
      default: "Your enthusiasm is positive. Maintain respect.",
    },
    cautious: {
      javanese: "Respectful hesitation understood. Speak when ready.",
      sundanese: "Caution appropriate. Take time to understand.",
      balinese: "Respectful approach. Observe before joining.",
      default: "Your caution shows respect for local customs.",
    },
  };

  const toneRecs = recommendations[tone];
  return (
    toneRecs[regionId] ||
    toneRecs.default ||
    "Adapt your communication style to the local culture."
  );
}

/**
 * Analyze speech emotion and tone from active audio stream.
 * Returns comprehensive tone analysis with cultural recommendations.
 */
export async function analyzeTone(
  audioContext: AudioContext,
  analyser: AnalyserNode,
  regionId: string
): Promise<ToneAnalysis> {
  const characteristics = await analyzeAudioData(audioContext, analyser);
  const { tone, confidence } = classifyTone(characteristics);
  const recommendation = getToneRecommendation(tone, regionId);

  return {
    tone,
    confidence,
    characteristics,
    recommendation,
  };
}

/**
 * Monitor speech stream for real-time tone changes.
 * Calls callback when tone shifts are detected.
 */
export function monitorToneStream(
  audioContext: AudioContext,
  analyser: AnalyserNode,
  regionId: string,
  onToneChange: (analysis: ToneAnalysis) => void,
  interval: number = 2000
): () => void {
  const intervalId = setInterval(async () => {
    const analysis = await analyzeTone(audioContext, analyser, regionId);
    onToneChange(analysis);
  }, interval);

  return () => clearInterval(intervalId);
}
