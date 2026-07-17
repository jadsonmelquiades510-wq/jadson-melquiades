package com.whatsvirtual.app.utils

import android.util.Base64
import java.nio.charset.StandardCharsets

object Crypto {
    private const val E2EE_KEY = "WhatsVirtual-Secure-Session-Key-9912"

    fun encryptMessage(text: String): String {
        if (text.isEmpty()) return ""
        
        // XOR Cipher
        val xorBytes = ByteArray(text.length)
        for (i in text.indices) {
            val charCode = text[i].code xor E2EE_KEY[i % E2EE_KEY.length].code
            xorBytes[i] = charCode.toByte()
        }
        
        // Base64 Encode
        val base64Data = Base64.encodeToString(xorBytes, Base64.NO_WRAP)
        
        // Return with Prefix
        return "e2ee::$base64Data"
    }

    fun decryptMessage(encryptedText: String): String {
        if (encryptedText.isEmpty()) return ""
        if (!encryptedText.startsWith("e2ee::")) return encryptedText // Not encrypted
        
        return try {
            val base64Data = encryptedText.substring(6)
            val decodedBytes = Base64.decode(base64Data, Base64.NO_WRAP)
            
            val result = StringBuilder()
            for (i in decodedBytes.indices) {
                val charCode = decodedBytes[i].toInt() xor E2EE_KEY[i % E2EE_KEY.length].code
                result.append(charCode.toChar())
            }
            result.toString()
        } catch (e: Exception) {
            "[Erro de Descriptografia E2EE]"
        }
    }
}
