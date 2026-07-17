package com.whatsvirtual.app.screens

import android.media.MediaPlayer
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.whatsvirtual.app.types.*
import com.whatsvirtual.app.utils.AppState
import com.whatsvirtual.app.utils.Crypto
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatDetailScreen(
    chat: Chat,
    onBack: () -> Unit
) {
    var textMessage by remember { mutableStateOf("") }
    var showRawPayload by remember { mutableStateOf(false) }
    var showAttachmentMenu by remember { mutableStateOf(false) }

    // Voice Note States
    var isRecording by remember { mutableStateOf(false) }
    var recordingSeconds by remember { mutableStateOf(0) }

    val coroutineScope = rememberCoroutineScope()
    val listState = rememberLazyListState()
    val context = LocalContext.current

    val chatMessages = AppState.messages.filter { it.chatId == chat.id }
    val currentUser = AppState.currentUser ?: return

    // Auto scroll to bottom
    LaunchedEffect(chatMessages.size) {
        if (chatMessages.isNotEmpty()) {
            listState.animateScrollToItem(chatMessages.size - 1)
        }
    }

    // Recording timer simulation
    LaunchedEffect(isRecording) {
        if (isRecording) {
            recordingSeconds = 0
            while (isRecording) {
                delay(1000)
                recordingSeconds++
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable {
                            // View details
                        }
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFECECEC)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (chat.type == ChatType.GROUP) Icons.Default.Groups else Icons.Default.Person,
                                contentDescription = null,
                                tint = Color(0xFF54656F)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = chat.name,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = "E2EE Ativo",
                                    tint = Color(0xFFD9FDD3),
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                            Text(
                                text = if (chat.type == ChatType.GROUP) "Grupo Oficial" else "Linha Virtual Criptografada",
                                fontSize = 11.sp,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Voltar", tint = Color.White)
                    }
                },
                actions = {
                    val other = chat.participants.firstOrNull { it != currentUser.virtualNumber } ?: ""
                    IconButton(onClick = {
                        AppState.startCall(other, chat.name, CallType.VOICE)
                    }) {
                        Icon(Icons.Default.Phone, contentDescription = "Ligação de Áudio", tint = Color.White)
                    }
                    IconButton(onClick = {
                        AppState.startCall(other, chat.name, CallType.VIDEO)
                    }) {
                        Icon(Icons.Default.Videocam, contentDescription = "Ligação de Vídeo", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF005C4B))
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFEFEAE2)) // WhatsApp standard chat background color
        ) {
            // Raw Payload Switch Banner
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFE1F5FE))
                    .border(0.5.dp, Color(0xFFB3E5FC))
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Security, contentDescription = null, tint = Color(0xFF0288D1), modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Visualizador de Criptografia E2EE:",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF01579B)
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = if (showRawPayload) "Payload Bruto" else "Descriptografado",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (showRawPayload) Color.Red else Color(0xFF005C4B)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Switch(
                        checked = showRawPayload,
                        onCheckedChange = { showRawPayload = it },
                        modifier = Modifier.scale(0.6f)
                    )
                }
            }

            // Message list
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(top = 12.dp, bottom = 12.dp)
            ) {
                // Info safety box
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFE082)),
                            shape = RoundedCornerShape(8.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF5D4037), modifier = Modifier.size(12.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "As mensagens são protegidas por criptografia de ponta a ponta.",
                                    fontSize = 10.sp,
                                    color = Color(0xFF5D4037),
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }

                items(chatMessages) { message ->
                    val isOwn = message.senderNumber == currentUser.virtualNumber
                    MessageBubble(message = message, isOwn = isOwn, showRawPayload = showRawPayload)
                }
            }

            // Attachments overlay menu
            AnimatedVisibility(
                visible = showAttachmentMenu,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .border(1.dp, Color(0xFFECECEC))
                        .padding(vertical = 16.dp, horizontal = 24.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    AttachmentItem(icon = Icons.Default.Image, label = "Imagem", color = Color(0xFFE040FB)) {
                        AppState.sendMessage(chat.id, "[MOCK_IMAGE_URL]", MessageType.IMAGE)
                        showAttachmentMenu = false
                    }
                    AttachmentItem(icon = Icons.Default.Description, label = "Documento", color = Color(0xFF5C6BC0)) {
                        AppState.sendMessage(chat.id, "documento_financeiro.pdf", MessageType.DOCUMENT, fileName = "documento_financeiro.pdf", fileSize = "2.4 MB")
                        showAttachmentMenu = false
                    }
                    AttachmentItem(icon = Icons.Default.LocationOn, label = "Localização", color = Color(0xFF00C853)) {
                        AppState.sendMessage(chat.id, "Localização de GPS", MessageType.LOCATION, location = LocationData(-23.5505, -46.6333, "Avenida Paulista, São Paulo"))
                        showAttachmentMenu = false
                    }
                    AttachmentItem(icon = Icons.Default.Videocam, label = "Vídeo", color = Color(0xFFFF5252)) {
                        AppState.sendMessage(chat.id, "[MOCK_VIDEO_URL]", MessageType.VIDEO)
                        showAttachmentMenu = false
                    }
                }
            }

            // Bottom Input Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF0F2F5))
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (isRecording) {
                    // Recording simulator UI
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(Color.Red)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Gravando Nota de Voz... ${recordingSeconds / 60}:${String.format("%02d", recordingSeconds % 60)}",
                                color = Color.Red,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text(
                            text = "Cancelar",
                            color = Color(0xFF54656F),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { isRecording = false }
                        )
                    }

                    FloatingActionButton(
                        onClick = {
                            isRecording = false
                            AppState.sendMessage(chat.id, "[MOCK_AUDIO_VOICE_NOTE]", MessageType.AUDIO, fileSize = "${recordingSeconds} seg")
                        },
                        containerColor = Color(0xFF00A884),
                        contentColor = Color.White,
                        shape = CircleShape,
                        modifier = Modifier.size(44.dp)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Enviar Áudio")
                    }

                } else {
                    IconButton(onClick = { showAttachmentMenu = !showAttachmentMenu }) {
                        Icon(Icons.Default.AttachFile, contentDescription = "Anexos", tint = Color(0xFF54656F))
                    }

                    OutlinedTextField(
                        value = textMessage,
                        onValueChange = { textMessage = it },
                        placeholder = { Text("Mensagem", fontSize = 15.sp) },
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 4.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White,
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent
                        ),
                        singleLine = true
                    )

                    if (textMessage.trim().isEmpty()) {
                        IconButton(onClick = { isRecording = true }) {
                            Icon(Icons.Default.Mic, contentDescription = "Gravar Áudio", tint = Color(0xFF54656F))
                        }
                    } else {
                        FloatingActionButton(
                            onClick = {
                                if (textMessage.trim().isNotEmpty()) {
                                    AppState.sendMessage(chat.id, textMessage, MessageType.TEXT)
                                    textMessage = ""
                                }
                            },
                            containerColor = Color(0xFF00A884),
                            contentColor = Color.White,
                            shape = CircleShape,
                            modifier = Modifier.size(44.dp)
                        ) {
                            Icon(Icons.Default.Send, contentDescription = "Enviar", modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MessageBubble(message: Message, isOwn: Boolean, showRawPayload: Boolean) {
    val bubbleColor = if (isOwn) Color(0xFFD9FDD3) else Color.White
    val align = if (isOwn) Alignment.CenterEnd else Alignment.CenterStart

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        contentAlignment = align
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = bubbleColor),
            shape = RoundedCornerShape(
                topStart = 12.dp,
                topEnd = 12.dp,
                bottomStart = if (isOwn) 12.dp else 0.dp,
                bottomEnd = if (isOwn) 0.dp else 12.dp
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Column(modifier = Modifier.padding(8.dp)) {
                if (chatHasParticipants(message.chatId) && !isOwn) {
                    Text(
                        text = message.senderName,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF128C7E),
                        modifier = Modifier.padding(bottom = 2.dp)
                    )
                }

                when (message.type) {
                    MessageType.TEXT -> {
                        val textToDisplay = if (message.encrypted && !showRawPayload) {
                            Crypto.decryptMessage(message.text)
                        } else {
                            message.text
                        }

                        Text(
                            text = textToDisplay,
                            fontSize = 14.sp,
                            color = Color(0xFF1C1C1C)
                        )
                    }
                    MessageType.IMAGE -> {
                        Column {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(150.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.LightGray),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Image, contentDescription = null, tint = Color.White, modifier = Modifier.size(48.dp))
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Simulação de Imagem Criptografada", fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                    MessageType.DOCUMENT -> {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .background(Color(0x1A000000), RoundedCornerShape(6.dp))
                                .padding(8.dp)
                        ) {
                            Icon(Icons.Default.Description, contentDescription = null, tint = Color(0xFF005C4B))
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(message.fileName ?: "Documento", fontSize = 13.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                                Text(message.fileSize ?: "Desconhecido", fontSize = 11.sp, color = Color.Gray)
                            }
                        }
                    }
                    MessageType.LOCATION -> {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Map, contentDescription = null, tint = Color(0xFF00C853))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Localização Compartilhada", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                            message.location?.address?.let {
                                Text(it, fontSize = 11.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp))
                            }
                        }
                    }
                    MessageType.AUDIO -> {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = {
                                // simulated audio note playing
                            }) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Play Áudio", tint = Color(0xFF005C4B))
                            }
                            Column {
                                Slider(value = 0.3f, onValueChange = {}, modifier = Modifier.width(130.dp))
                                Text("Nota de Voz • ${message.fileSize}", fontSize = 11.sp, color = Color.Gray)
                            }
                        }
                    }
                    MessageType.VIDEO -> {
                        Column {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(150.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.DarkGray),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.PlayCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(48.dp))
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Vídeo Encriptado Seguramente", fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Time and Status checks
                Row(
                    modifier = Modifier.align(Alignment.End),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val timeStr = message.timestamp.substring(11, 16)
                    Text(
                        text = timeStr,
                        fontSize = 10.sp,
                        color = Color.Gray
                    )
                    
                    if (isOwn) {
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            imageVector = if (message.status == MessageStatus.READ) Icons.Default.DoneAll else Icons.Default.Done,
                            contentDescription = null,
                            tint = if (message.status == MessageStatus.READ) Color(0xFF34B7F1) else Color.Gray,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AttachmentItem(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, color: Color, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable { onClick() }
    ) {
        Box(
            modifier = Modifier
                .size(52.dp)
                .clip(CircleShape)
                .background(color),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(24.dp))
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(label, fontSize = 12.sp, color = Color(0xFF54656F))
    }
}

// Check if group to render sender name
private fun chatHasParticipants(chatId: String): Boolean {
    val chat = AppState.chats.find { it.id == chatId }
    return chat?.type == ChatType.GROUP
}

// Scale and standard modifiers
private fun Modifier.scale(scale: Float) = this.then(
    androidx.compose.ui.graphics.graphicsLayer(scaleX = scale, scaleY = scale)
)
