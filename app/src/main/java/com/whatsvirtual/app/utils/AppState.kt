package com.whatsvirtual.app.utils

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.whatsvirtual.app.types.*
import java.time.Instant
import java.time.format.DateTimeFormatter
import kotlin.random.Random

object AppState {
    var currentUser by mutableStateOf<UserProfile?>(null)
    var chats by mutableStateOf<List<Chat>>(emptyList())
    var messages by mutableStateOf<List<Message>>(emptyList())
    var statuses by mutableStateOf<List<StatusUpdate>>(emptyList())
    var callsHistory by mutableStateOf<List<CallSession>>(emptyList())
    var activeCall by mutableStateOf<CallSession?>(null)

    // Formatter for timestamp strings
    private fun getNowIso(): String {
        return DateTimeFormatter.ISO_INSTANT.format(Instant.now())
    }

    // Static profiles
    val systemBotProfile = UserProfile(
        id = "bot-system",
        username = "Suporte Virtual AI",
        virtualNumber = "+888-000-0000",
        avatar = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
        statusMessage = "Alimentado por IA. Envie mensagens, fotos ou áudios para testar!",
        createdAt = getNowIso()
    )

    val neymarProfile = UserProfile(
        id = "user-creator",
        username = "Neymar Jr (Virtual)",
        virtualNumber = "+888-101-1111",
        avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        statusMessage = "Ousadia e alegria! ⚽📱",
        createdAt = getNowIso()
    )

    init {
        // Initialize default data
        resetData()
    }

    fun resetData() {
        chats = listOf(
            Chat(
                id = "global-group",
                name = "Grupo Oficial WhatsVirtual",
                type = ChatType.GROUP,
                avatar = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80",
                participants = listOf("+888-000-0000", "+888-101-1111"),
                createdAt = getNowIso()
            )
        )

        messages = listOf(
            Message(
                id = "welcome-msg-1",
                chatId = "global-group",
                senderNumber = systemBotProfile.virtualNumber,
                senderName = systemBotProfile.username,
                text = "Bem-vindo ao Grupo Oficial do WhatsVirtual! 🎉 Aqui você pode testar conversas em grupo com números virtuais.",
                encrypted = false,
                type = MessageType.TEXT,
                timestamp = getNowIso(),
                status = MessageStatus.READ
            )
        )

        statuses = listOf(
            StatusUpdate(
                id = "status-welcome",
                userNumber = systemBotProfile.virtualNumber,
                username = systemBotProfile.username,
                userAvatar = systemBotProfile.avatar,
                type = StatusType.TEXT,
                content = "Privacidade total sem chip! WhatsVirtual ativo e seguro 🔒✨",
                background = "#005C4B",
                timestamp = getNowIso()
            )
        )

        callsHistory = emptyList()
        activeCall = null
    }

    fun generateNumber(): String {
        val part1 = Random.nextInt(100, 1000)
        val part2 = Random.nextInt(1000, 10000)
        return "+888-$part1-$part2"
    }

    fun registerUser(username: String): UserProfile {
        val user = UserProfile(
            id = "user-" + Random.nextInt(10000, 99999),
            username = username,
            virtualNumber = generateNumber(),
            avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            statusMessage = "Olá! Estou usando o WhatsVirtual.",
            createdAt = getNowIso()
        )
        currentUser = user
        return user
    }

    fun loginUser(number: String): UserProfile? {
        if (number == neymarProfile.virtualNumber) {
            currentUser = neymarProfile
            return neymarProfile
        }
        val user = UserProfile(
            id = "user-" + Random.nextInt(10000, 99999),
            username = "Usuário Virtual Recorrente",
            virtualNumber = number,
            avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            statusMessage = "Olá! Estou usando o WhatsVirtual.",
            createdAt = getNowIso()
        )
        currentUser = user
        return user
    }

    fun logout() {
        currentUser = null
        resetData()
    }

    fun createChat(targetNumber: String): Chat {
        val normalized = targetNumber.trim()
        val existing = chats.find { it.type == ChatType.INDIVIDUAL && it.participants.contains(normalized) }
        if (existing != null) return existing

        val name = if (normalized == systemBotProfile.virtualNumber) {
            systemBotProfile.username
        } else if (normalized == neymarProfile.virtualNumber) {
            neymarProfile.username
        } else {
            "Número $normalized"
        }

        val avatar = if (normalized == systemBotProfile.virtualNumber) {
            systemBotProfile.avatar
        } else if (normalized == neymarProfile.virtualNumber) {
            neymarProfile.avatar
        } else {
            "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80"
        }

        val newChat = Chat(
            id = "chat-" + Random.nextInt(10000, 99999),
            name = name,
            type = ChatType.INDIVIDUAL,
            avatar = avatar,
            participants = listOf(currentUser?.virtualNumber ?: "", normalized),
            createdAt = getNowIso()
        )

        chats = chats + newChat
        return newChat
    }

    fun createGroupChat(name: String): Chat {
        val newChat = Chat(
            id = "chat-" + Random.nextInt(10000, 99999),
            name = name,
            type = ChatType.GROUP,
            avatar = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80",
            participants = listOf(currentUser?.virtualNumber ?: "", systemBotProfile.virtualNumber),
            createdAt = getNowIso()
        )
        chats = chats + newChat
        return newChat
    }

    fun sendMessage(
        chatId: String,
        text: String,
        type: MessageType,
        encrypted: Boolean = true,
        fileName: String? = null,
        fileSize: String? = null,
        location: LocationData? = null
    ) {
        val user = currentUser ?: return
        val finalPayload = if (encrypted && type == MessageType.TEXT) Crypto.encryptMessage(text) else text

        val newMessage = Message(
            id = "msg-" + Random.nextInt(1000000, 9999999),
            chatId = chatId,
            senderNumber = user.virtualNumber,
            senderName = user.username,
            text = finalPayload,
            encrypted = encrypted,
            type = type,
            fileName = fileName,
            fileSize = fileSize,
            location = location,
            timestamp = getNowIso(),
            status = MessageStatus.SENT
        )

        messages = messages + newMessage

        // Update last message in Chat
        chats = chats.map {
            if (it.id == chatId) {
                it.copy(lastMessage = newMessage)
            } else {
                it
            }
        }

        // Trigger auto simulated responses
        simulateReplies(chatId, text, type)
    }

    private fun simulateReplies(chatId: String, text: String, type: MessageType) {
        val chat = chats.find { it.id == chatId } ?: return
        if (chat.type == ChatType.INDIVIDUAL) {
            val otherParticipant = chat.participants.firstOrNull { it != currentUser?.virtualNumber } ?: return
            
            // Wait 1.5 seconds and trigger reply
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                val replyText = when (otherParticipant) {
                    systemBotProfile.virtualNumber -> {
                        getBotReply(text, type)
                    }
                    neymarProfile.virtualNumber -> {
                        getNeymarReply(text, type)
                    }
                    else -> {
                        "Olá! Recebi seu arquivo/mensagem de forma 100% segura e descriptografada no meu celular WhatsVirtual! 🔒📱"
                    }
                }

                val botMessage = Message(
                    id = "msg-" + Random.nextInt(1000000, 9999999),
                    chatId = chatId,
                    senderNumber = otherParticipant,
                    senderName = if (otherParticipant == systemBotProfile.virtualNumber) systemBotProfile.username else neymarProfile.username,
                    text = Crypto.encryptMessage(replyText),
                    encrypted = true,
                    type = MessageType.TEXT,
                    timestamp = getNowIso(),
                    status = MessageStatus.READ
                )

                messages = messages + botMessage
                chats = chats.map {
                    if (it.id == chatId) {
                        it.copy(lastMessage = botMessage)
                    } else {
                        it
                    }
                }
            }, 1200)
        } else {
            // Group Chat - support bot replies
            if (text.contains("@suporte", ignoreCase = true) || text.contains("ajuda", ignoreCase = true)) {
                android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                    val botMessage = Message(
                        id = "msg-" + Random.nextInt(1000000, 9999999),
                        chatId = chatId,
                        senderNumber = systemBotProfile.virtualNumber,
                        senderName = systemBotProfile.username,
                        text = "Olá grupo! Como Suporte Virtual AI, estou aqui para garantir o funcionamento do app. Envie mensagens criptografadas ou faça chamadas simuladas de voz/vídeo para testar os recursos de privacidade!",
                        encrypted = false,
                        type = MessageType.TEXT,
                        timestamp = getNowIso(),
                        status = MessageStatus.READ
                    )
                    messages = messages + botMessage
                    chats = chats.map {
                        if (it.id == chatId) {
                            it.copy(lastMessage = botMessage)
                        } else {
                            it
                        }
                    }
                }, 1500)
            }
        }
    }

    private fun getBotReply(userText: String, type: MessageType): String {
        if (type == MessageType.AUDIO) {
            return "Recebi sua nota de voz! 🎙️ Ela foi criptografada de ponta a ponta. Nosso sistema decodificou os pacotes localmente com sucesso!"
        }
        if (type == MessageType.LOCATION) {
            return "Opa, recebi sua localização! 📍 Excelente ver que o simulador de localização por GPS está operando perfeitamente."
        }
        if (type == MessageType.IMAGE || type == MessageType.VIDEO) {
            return "Que foto/vídeo bacana! 🖼️ Ele foi transmitido em canais virtuais seguros com tamanho otimizado."
        }
        
        val input = userText.lowercase()
        return when {
            input.contains("cripto") || input.contains("e2ee") || input.contains("segurança") -> {
                "O WhatsVirtual utiliza criptografia XOR de fluxo ponta-a-ponta (E2EE). O payload viaja codificado como 'e2ee::BASE64' para que ninguém no trânsito possa lê-lo!"
            }
            input.contains("chamada") || input.contains("ligar") || input.contains("fone") -> {
                "Você pode fazer chamadas de áudio/vídeo clicando nos botões de chamada no topo do chat. Como não exige chip físico, a conexão é direta e instantânea!"
            }
            input.contains("status") -> {
                "Você pode postar atualizações de status em formato de texto com fundo colorido ou imagem na aba 'Status'. Eles expiram após 24h!"
            }
            input.contains("chip") || input.contains("número") -> {
                "Exato! Cada conta gera um número exclusivo da faixa '+888' que funciona como um chip virtual definitivo para backup e acesso de qualquer lugar."
            }
            else -> {
                "Olá! Sou o assistente do WhatsVirtual. Nosso aplicativo nativo de Kotlin + Jetpack Compose oferece total autonomia sem necessidade de chip físico! 🔒🚀"
            }
        }
    }

    private fun getNeymarReply(userText: String, type: MessageType): String {
        val input = userText.lowercase()
        return when {
            input.contains("gol") || input.contains("futebol") || input.contains("bola") -> {
                "O futebol é minha vida! Saudades de campo. Mas o WhatsVirtual está sempre comigo para conversar com os parças! ⚽🤙"
            }
            input.contains("oi") || input.contains("olá") || input.contains("tudo bem") -> {
                "E aí parça! Tudo excelente por aqui. E com você? Ligado no WhatsVirtual sem precisar de chip! 😎"
            }
            else -> {
                "Opa! Tmj sempre. Ousadia e alegria na conversa 100% segura do WhatsVirtual! ⚡📱"
            }
        }
    }

    fun startCall(receiverNumber: String, receiverName: String, type: CallType) {
        val user = currentUser ?: return
        val session = CallSession(
            id = "call-" + Random.nextInt(10000, 99999),
            callerNumber = user.virtualNumber,
            callerName = user.username,
            receiverNumber = receiverNumber,
            receiverName = receiverName,
            type = type,
            status = CallStatus.RINGING,
            timestamp = getNowIso(),
            duration = 0
        )
        activeCall = session
        callsHistory = listOf(session) + callsHistory
    }

    fun connectCall() {
        val call = activeCall ?: return
        activeCall = call.copy(status = CallStatus.CONNECTED)
        callsHistory = callsHistory.map {
            if (it.id == call.id) it.copy(status = CallStatus.CONNECTED) else it
        }
    }

    fun endCall(durationSec: Int = 0) {
        val call = activeCall ?: return
        val finalStatus = if (call.status == CallStatus.RINGING) CallStatus.DECLINED else CallStatus.ENDED
        activeCall = null
        callsHistory = callsHistory.map {
            if (it.id == call.id) {
                it.copy(status = finalStatus, duration = durationSec)
            } else {
                it
            }
        }
    }

    fun postStatus(type: StatusType, content: String, background: String? = null) {
        val user = currentUser ?: return
        val newStatus = StatusUpdate(
            id = "status-" + Random.nextInt(10000, 99999),
            userNumber = user.virtualNumber,
            username = user.username,
            userAvatar = user.avatar,
            type = type,
            content = content,
            background = background,
            timestamp = getNowIso()
        )
        statuses = listOf(newStatus) + statuses
    }
}
