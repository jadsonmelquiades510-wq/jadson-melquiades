package com.whatsvirtual.app.types

data class UserProfile(
    val id: String,
    val username: String,
    val virtualNumber: String,
    val avatar: String,
    val statusMessage: String,
    val createdAt: String
)

enum class ChatType {
    INDIVIDUAL, GROUP
}

data class Chat(
    val id: String,
    val name: String,
    val type: ChatType,
    val avatar: String,
    val participants: List<String>, // virtual numbers
    val createdAt: String,
    var lastMessage: Message? = null,
    var unreadCount: Int = 0
)

enum class MessageType {
    TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, LOCATION
}

enum class MessageStatus {
    SENT, DELIVERED, READ
}

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val address: String? = null
)

data class Message(
    val id: String,
    val chatId: String,
    val senderNumber: String,
    val senderName: String,
    val text: String, // Might be encrypted
    val encrypted: Boolean,
    val type: MessageType,
    val fileUrl: String? = null,
    val fileName: String? = null,
    val fileSize: String? = null,
    val location: LocationData? = null,
    val timestamp: String,
    val status: MessageStatus
)

enum class StatusType {
    TEXT, IMAGE
}

data class StatusUpdate(
    val id: String,
    val userNumber: String,
    val username: String,
    val userAvatar: String,
    val type: StatusType,
    val content: String,
    val background: String? = null, // e.g. color hex or label
    val timestamp: String,
    val views: List<String> = emptyList()
)

enum class CallType {
    VOICE, VIDEO
}

enum class CallStatus {
    RINGING, CONNECTED, MISSED, ENDED, DECLINED
}

data class CallSession(
    val id: String,
    val callerNumber: String,
    val callerName: String,
    val receiverNumber: String,
    val receiverName: String,
    val type: CallType,
    val status: CallStatus,
    val timestamp: String,
    val duration: Int // in seconds
)
