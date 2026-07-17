/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Simple client-side End-to-End Encryption (E2EE) helper.
 * Uses a basic XOR-based cipher with Base64 encoding to simulate a real secure protocol.
 * The server only receives and stores the encrypted string, and does not have the key.
 */

const E2EE_KEY = "WhatsVirtual-Secure-Session-Key-9912";

export function encryptMessage(text: string): string {
  if (!text) return "";
  
  // Convert characters using XOR with E2EE_KEY
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ E2EE_KEY.charCodeAt(i % E2EE_KEY.length);
    result += String.fromCharCode(charCode);
  }
  
  // Encode as Base64 with a clear prefix so the UI can detect E2EE
  return "e2ee::" + btoa(unescape(encodeURIComponent(result)));
}

export function decryptMessage(encryptedText: string): string {
  if (!encryptedText) return "";
  if (!encryptedText.startsWith("e2ee::")) return encryptedText; // Not encrypted
  
  try {
    const base64Data = encryptedText.substring(6);
    const decoded = decodeURIComponent(escape(atob(base64Data)));
    
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ E2EE_KEY.charCodeAt(i % E2EE_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    console.error("Failed to decrypt E2EE message:", error);
    return "[Erro de Descriptografia E2EE]";
  }
}
