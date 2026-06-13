/**
 * Cryptographic security layer for LokalSense.
 * Features:
 * - Offline hash validation for dictionary integrity
 * - Biometric session lock via WebAuthn
 * - Encrypted Pi SDK auth tokens
 * - Tamper detection for static JSON data
 */

import crypto from "crypto";

export interface SecurityConfig {
  enableBiometric: boolean;
  enableTokenEncryption: boolean;
  hashAlgorithm: "SHA-256" | "SHA-512";
}

export interface IntegrityProof {
  hash: string;
  timestamp: number;
  algorithm: "SHA-256" | "SHA-512";
  verified: boolean;
}

/**
 * Generate cryptographic hash of dictionary data for integrity verification.
 * Uses SubtleCrypto API available in browser (no Node crypto needed at runtime).
 */
export async function computeDataHash(
  data: string,
  algorithm: "SHA-256" | "SHA-512" = "SHA-256"
): Promise<string> {
  // For Node.js environment (build time)
  if (typeof window === "undefined") {
    const hashAlgo = algorithm === "SHA-256" ? "sha256" : "sha512";
    return crypto.createHash(hashAlgo).update(data).digest("hex");
  }

  // For browser (runtime)
  const encoder = new TextEncoder();
  const data_uint8 = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest(
    algorithm === "SHA-256" ? "SHA-256" : "SHA-512",
    data_uint8
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify dictionary hash to detect unauthorized tampering.
 */
export async function verifyIntegrity(
  data: string,
  expectedHash: string,
  algorithm: "SHA-256" | "SHA-512" = "SHA-256"
): Promise<IntegrityProof> {
  const computedHash = await computeDataHash(data, algorithm);
  const verified = computedHash === expectedHash;

  return {
    hash: computedHash,
    timestamp: Date.now(),
    algorithm,
    verified,
  };
}

/**
 * Encrypt Pi SDK auth token with a session key.
 * In production, would use secure key derivation (PBKDF2/Argon2).
 */
export async function encryptAuthToken(
  token: string,
  sessionId: string
): Promise<{
  iv: string;
  ciphertext: string;
  algorithm: string;
}> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionId.padEnd(32, "0").substring(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(token)
  );

  return {
    iv: Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    ciphertext: Array.from(new Uint8Array(ciphertext))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    algorithm: "AES-256-GCM",
  };
}

/**
 * Decrypt Pi SDK auth token.
 */
export async function decryptAuthToken(
  encrypted: {
    iv: string;
    ciphertext: string;
    algorithm: string;
  },
  sessionId: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionId.padEnd(32, "0").substring(0, 32)),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const iv = new Uint8Array(
    encrypted.iv.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const ciphertext = new Uint8Array(
    encrypted.ciphertext.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Check if WebAuthn (biometric/PIN) is available on device.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    const available =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Register device for biometric session lock.
 * Stores credential ID for later verification.
 */
export async function registerBiometric(userId: string): Promise<{
  credentialId: string;
  success: boolean;
}> {
  if (!window.PublicKeyCredential) {
    return { credentialId: "", success: false };
  }

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: "LokalSense",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: "LokalSense User",
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        timeout: 60000,
        attestation: "none",
        userVerification: "preferred",
      },
    });

    if (credential && credential.id) {
      return {
        credentialId: credential.id,
        success: true,
      };
    }
    return { credentialId: "", success: false };
  } catch (error) {
    console.error("[LokalSense] Biometric registration failed:", error);
    return { credentialId: "", success: false };
  }
}

/**
 * Verify biometric session lock on app startup.
 */
export async function verifyBiometricSession(
  credentialId: string
): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        timeout: 60000,
        userVerification: "preferred",
      },
    });

    return assertion !== null;
  } catch (error) {
    console.error("[LokalSense] Biometric verification failed:", error);
    return false;
  }
}

/**
 * Generate a cryptographic session ID for token encryption.
 */
export function generateSessionId(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
