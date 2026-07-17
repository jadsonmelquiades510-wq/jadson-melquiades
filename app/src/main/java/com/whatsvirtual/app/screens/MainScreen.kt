package com.whatsvirtual.app.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.whatsvirtual.app.types.*
import com.whatsvirtual.app.utils.AppState
import com.whatsvirtual.app.utils.Crypto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onSelectChat: (Chat) -> Unit,
    onLogout: () -> Unit
) {
    var activeTab by remember { mutableStateOf(0) } // 0 = Conversas, 1 = Status, 2 = Chamadas
    var searchQuery by remember { mutableStateOf("") }
    
    // Modal states
    var showNewChatDialog by remember { mutableStateOf(false) }
    var showProfileDialog by remember { mutableStateOf(false) }
    var showStatusViewer by remember { mutableStateOf<StatusUpdate?>(null) }
    var showCreateTextStatusDialog by remember { mutableStateOf(false) }

    val currentUser = AppState.currentUser ?: return
    val context = LocalContext.current

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Text(
                            text = "WhatsVirtual",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF005C4B)),
                    actions = {
                        IconButton(onClick = { showProfileDialog = true }) {
                            Icon(Icons.Default.AccountCircle, contentDescription = "Perfil", tint = Color.White)
                        }
                        IconButton(onClick = onLogout) {
                            Icon(Icons.Default.Logout, contentDescription = "Sair", tint = Color.White)
                        }
                    }
                )

                // Tab selectors (Conversas, Status, Chamadas)
                TabRow(
                    selectedTabIndex = activeTab,
                    containerColor = Color(0xFF005C4B),
                    contentColor = Color.White,
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(
                            modifier = Modifier.tabIndicatorOffset(tabPositions[activeTab]),
                            color = Color(0xFFD9FDD3)
                        )
                    }
                ) {
                    Tab(
                        selected = activeTab == 0,
                        onClick = { activeTab = 0 },
                        text = { Text("Conversas", fontWeight = FontWeight.Bold, fontSize = 14.sp) }
                    )
                    Tab(
                        selected = activeTab == 1,
                        onClick = { activeTab = 1 },
                        text = { Text("Status", fontWeight = FontWeight.Bold, fontSize = 14.sp) }
                    )
                    Tab(
                        selected = activeTab == 2,
                        onClick = { activeTab = 2 },
                        text = { Text("Chamadas", fontWeight = FontWeight.Bold, fontSize = 14.sp) }
                    )
                }
            }
        },
        floatingActionButton = {
            if (activeTab == 0) {
                FloatingActionButton(
                    onClick = { showNewChatDialog = true },
                    containerColor = Color(0xFF00A884),
                    contentColor = Color.White,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Message, contentDescription = "Nova Conversa")
                }
            } else if (activeTab == 1) {
                Column(horizontalAlignment = Alignment.End) {
                    FloatingActionButton(
                        onClick = { showCreateTextStatusDialog = true },
                        containerColor = Color(0xFFECECEC),
                        contentColor = Color(0xFF54656F),
                        shape = CircleShape,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Novo Status de Texto")
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    FloatingActionButton(
                        onClick = {
                            // Add image status
                            val imagePool = listOf(
                                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
                                "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
                                "https://images.unsplash.com/photo-1472214222541-d510753a8707?auto=format&fit=crop&w=600&q=80"
                            )
                            AppState.postStatus(StatusType.IMAGE, imagePool.random())
                            Toast.makeText(context, "Status de imagem publicado!", Toast.LENGTH_SHORT).show()
                        },
                        containerColor = Color(0xFF00A884),
                        contentColor = Color.White,
                        shape = CircleShape
                    ) {
                        Icon(Icons.Default.PhotoCamera, contentDescription = "Novo Status de Imagem")
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFF8F9FA))
        ) {
            when (activeTab) {
                0 -> ChatsTab(searchQuery, onSelectChat)
                1 -> StatusTab(onViewStatus = { showStatusViewer = it })
                2 -> CallsTab()
            }

            // MODALS / DIALOGS
            if (showNewChatDialog) {
                NewChatDialog(
                    onDismiss = { showNewChatDialog = false },
                    onStartChat = { number ->
                        val chat = AppState.createChat(number)
                        onSelectChat(chat)
                        showNewChatDialog = false
                    },
                    onCreateGroup = { groupName ->
                        val chat = AppState.createGroupChat(groupName)
                        onSelectChat(chat)
                        showNewChatDialog = false
                    }
                )
            }

            if (showProfileDialog) {
                ProfileDialog(
                    onDismiss = { showProfileDialog = false }
                )
            }

            if (showCreateTextStatusDialog) {
                CreateTextStatusDialog(
                    onDismiss = { showCreateTextStatusDialog = false },
                    onPublish = { text, bg ->
                        AppState.postStatus(StatusType.TEXT, text, bg)
                        showCreateTextStatusDialog = false
                        Toast.makeText(context, "Status publicado!", Toast.LENGTH_SHORT).show()
                    }
                )
            }

            showStatusViewer?.let { status ->
                StatusViewerScreen(
                    status = status,
                    onDismiss = { showStatusViewer = null }
                )
            }
        }
    }
}

@Composable
fun ChatsTab(searchQuery: String, onSelectChat: (Chat) -> Unit) {
    val chats = AppState.chats.filter {
        it.name.contains(searchQuery, ignoreCase = true) || 
        it.participants.any { num -> num.contains(searchQuery) }
    }

    if (chats.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Default.ChatBubbleOutline,
                    contentDescription = null,
                    tint = Color(0xFFBAC0C5),
                    modifier = Modifier.size(64.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Nenhuma conversa encontrada",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF54656F)
                )
                Text(
                    text = "Toque no botão + para iniciar",
                    fontSize = 13.sp,
                    color = Color(0xFF8696A0)
                )
            }
        }
    } else {
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(chats) { chat ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectChat(chat) }
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Avatar Image
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFECECEC))
                    ) {
                        // In real code we use AsyncImage or Painter, here we draw a nice placeholder or icon if image loads fails
                        Icon(
                            imageVector = if (chat.type == ChatType.GROUP) Icons.Default.Groups else Icons.Default.Person,
                            contentDescription = null,
                            tint = Color(0xFF54656F),
                            modifier = Modifier
                                .size(32.dp)
                                .align(Alignment.Center)
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1.f)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = chat.name,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1C1C1C)
                            )
                            
                            val timeStr = chat.lastMessage?.timestamp?.substring(11, 16) ?: ""
                            Text(
                                text = timeStr,
                                fontSize = 12.sp,
                                color = Color(0xFF8696A0)
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (chat.lastMessage?.encrypted == true) {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = "Criptografada",
                                        tint = Color(0xFF00A884),
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                }
                                
                                val rawText = chat.lastMessage?.text ?: "Nenhuma mensagem enviada."
                                val previewText = if (chat.lastMessage?.encrypted == true) {
                                    Crypto.decryptMessage(rawText)
                                } else {
                                    rawText
                                }

                                Text(
                                    text = previewText,
                                    fontSize = 14.sp,
                                    color = Color(0xFF54656F),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            if (chat.unreadCount > 0) {
                                Box(
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(Color(0xFF00A884))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = chat.unreadCount.toString(),
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
                Divider(
                    color = Color(0xFFECECEC),
                    thickness = 0.5.dp,
                    modifier = Modifier.padding(start = 84.dp, end = 16.dp)
                )
            }
        }
    }
}

@Composable
fun StatusTab(onViewStatus: (StatusUpdate) -> Unit) {
    val statuses = AppState.statuses
    val currentUser = AppState.currentUser ?: return

    Column(modifier = Modifier.fillMaxSize()) {
        // My Status Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF005C4B)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(32.dp))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text("Meu Status", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1C1C1C))
                Text("Toque para postar uma atualização", fontSize = 13.sp, color = Color(0xFF8696A0))
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFECECEC))
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            Text("ATUALIZAÇÕES RECENTES", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF54656F))
        }

        if (statuses.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Nenhum status recente", color = Color(0xFF8696A0), fontSize = 14.sp)
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(statuses) { status ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onViewStatus(status) }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Colored ring for status
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .border(2.dp, Color(0xFF00A884), CircleShape)
                                .padding(3.dp)
                                .clip(CircleShape)
                                .background(
                                    if (status.type == StatusType.TEXT) {
                                        Color(android.graphics.Color.parseColor(status.background ?: "#005C4B"))
                                    } else {
                                        Color.LightGray
                                    }
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (status.type == StatusType.TEXT) {
                                Text(
                                    text = if (status.content.length > 5) status.content.take(4) + ".." else status.content,
                                    fontSize = 8.sp,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center,
                                    maxLines = 1
                                )
                            } else {
                                Icon(Icons.Default.Image, contentDescription = null, tint = Color.White)
                            }
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Column {
                            Text(
                                text = status.username,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1C1C1C)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            val timeStr = status.timestamp.substring(11, 16)
                            Text(
                                text = "Hoje, $timeStr",
                                fontSize = 13.sp,
                                color = Color(0xFF8696A0)
                            )
                        }
                    }
                    Divider(color = Color(0xFFECECEC), thickness = 0.5.dp, modifier = Modifier.padding(start = 84.dp))
                }
            }
        }
    }
}

@Composable
fun CallsTab() {
    val history = AppState.callsHistory

    if (history.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.PhoneMissed, contentDescription = null, tint = Color(0xFFBAC0C5), modifier = Modifier.size(64.dp))
                Spacer(modifier = Modifier.height(16.dp))
                Text("Nenhuma chamada efetuada", color = Color(0xFF54656F), fontWeight = FontWeight.Medium)
            }
        }
    } else {
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(history) { call ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFECECEC)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF54656F))
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        val displayName = if (call.callerNumber == AppState.currentUser?.virtualNumber) call.receiverName else call.callerName
                        Text(displayName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1C1C1C))
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (call.status == CallStatus.MISSED) Icons.Default.CallMissed else Icons.Default.CallReceived,
                                contentDescription = null,
                                tint = if (call.status == CallStatus.MISSED) Color.Red else Color(0xFF00A884),
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            val timeStr = call.timestamp.substring(11, 16)
                            Text("Hoje, $timeStr • ${call.duration} seg", fontSize = 13.sp, color = Color(0xFF8696A0))
                        }
                    }

                    IconButton(onClick = {
                        // Start simulated call back
                        val targetNum = if (call.callerNumber == AppState.currentUser?.virtualNumber) call.receiverNumber else call.callerNumber
                        val targetName = if (call.callerNumber == AppState.currentUser?.virtualNumber) call.receiverName else call.callerName
                        AppState.startCall(targetNum, targetName, call.type)
                    }) {
                        Icon(
                            imageVector = if (call.type == CallType.VIDEO) Icons.Default.Videocam else Icons.Default.Phone,
                            contentDescription = "Chamar",
                            tint = Color(0xFF005C4B)
                        )
                    }
                }
                Divider(color = Color(0xFFECECEC), thickness = 0.5.dp, modifier = Modifier.padding(start = 80.dp))
            }
        }
    }
}

// Dialog definitions
@Composable
fun NewChatDialog(
    onDismiss: () -> Unit,
    onStartChat: (String) -> Unit,
    onCreateGroup: (String) -> Unit
) {
    var isGroupTab by remember { mutableStateOf(false) }
    var targetNumber by remember { mutableStateOf("") }
    var groupName by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(if (isGroupTab) "Criar Novo Grupo" else "Iniciar Nova Conversa", fontWeight = FontWeight.Bold)
        },
        text = {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                        .background(Color(0xFFF0F2F5), RoundedCornerShape(8.dp))
                        .padding(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { isGroupTab = false }
                            .background(if (!isGroupTab) Color.White else Color.Transparent, RoundedCornerShape(6.dp))
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Individual", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { isGroupTab = true }
                            .background(if (isGroupTab) Color.White else Color.Transparent, RoundedCornerShape(6.dp))
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Grupo", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                if (!isGroupTab) {
                    Text("Digite o Número Virtual do contato (Ex: +888-000-0000):", fontSize = 12.sp, color = Color(0xFF54656F))
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = targetNumber,
                        onValueChange = { targetNumber = it },
                        placeholder = { Text("+888-000-0000") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF005C4B))
                    )
                } else {
                    Text("Digite o nome do Grupo:", fontSize = 12.sp, color = Color(0xFF54656F))
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = groupName,
                        onValueChange = { groupName = it },
                        placeholder = { Text("Ex: Parças de Treino") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF005C4B))
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (isGroupTab) {
                        if (groupName.trim().isNotEmpty()) onCreateGroup(groupName)
                    } else {
                        if (targetNumber.trim().isNotEmpty()) onStartChat(targetNumber)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF005C4B))
            ) {
                Text("Confirmar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = Color(0xFF54656F))
            }
        }
    )
}

@Composable
fun ProfileDialog(onDismiss: () -> Unit) {
    val currentUser = AppState.currentUser ?: return
    var username by remember { mutableStateOf(currentUser.username) }
    var statusMessage by remember { mutableStateOf(currentUser.statusMessage) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Seu Perfil Virtual", fontWeight = FontWeight.Bold) },
        text = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF005C4B)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(48.dp))
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = currentUser.virtualNumber,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFF005C4B)
                )
                Text("Seu Número de Linha Virtual Permanente", fontSize = 11.sp, color = Color(0xFF8696A0))

                Spacer(modifier = Modifier.height(20.dp))

                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("Apelido") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF005C4B))
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = statusMessage,
                    onValueChange = { statusMessage = it },
                    label = { Text("Mensagem de Recado") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF005C4B))
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    AppState.currentUser = currentUser.copy(username = username, statusMessage = statusMessage)
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF005C4B))
            ) {
                Text("Salvar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Fechar", color = Color(0xFF54656F))
            }
        }
    )
}

@Composable
fun CreateTextStatusDialog(
    onDismiss: () -> Unit,
    onPublish: (String, String) -> Unit
) {
    var text by remember { mutableStateOf("") }
    val colors = listOf("#005C4B", "#00A884", "#128C7E", "#25D366", "#34B7F1", "#9C27B0", "#E91E63")
    var selectedColor by remember { mutableStateOf(colors[0]) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Criar Status de Texto", fontWeight = FontWeight.Bold) },
        text = {
            Column {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(android.graphics.Color.parseColor(selectedColor))),
                    contentAlignment = Alignment.Center
                ) {
                    OutlinedTextField(
                        value = text,
                        onValueChange = { text = it },
                        placeholder = { Text("Escreva algo legal...", color = Color.White.copy(alpha = 0.6f)) },
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        textStyle = LocalTextStyle.current.copy(color = Color.White, textAlign = TextAlign.Center, fontWeight = FontWeight.Bold),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent
                        )
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text("Escolha a cor de fundo:", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF54656F))
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    colors.forEach { col ->
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(Color(android.graphics.Color.parseColor(col)))
                                .border(
                                    width = if (selectedColor == col) 2.dp else 0.dp,
                                    color = if (selectedColor == col) Color.Black else Color.Transparent,
                                    shape = CircleShape
                                )
                                .clickable { selectedColor = col }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { if (text.trim().isNotEmpty()) onPublish(text, selectedColor) },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF005C4B))
            ) {
                Text("Publicar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = Color(0xFF54656F))
            }
        }
    )
}

@Composable
fun StatusViewerScreen(
    status: StatusUpdate,
    onDismiss: () -> Unit
) {
    var progress by remember { mutableStateOf(0f) }

    LaunchedEffect(Unit) {
        // Auto-close after 4 seconds
        val steps = 100
        for (i in 1..steps) {
            kotlinx.coroutines.delay(40)
            progress = i / 100f
        }
        onDismiss()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .clickable { onDismiss() }
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Segmented Indicators (Status Progress Bar)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                LinearProgressIndicator(
                    progress = progress,
                    modifier = Modifier
                        .weight(1f)
                        .height(3.dp),
                    color = Color.White,
                    trackColor = Color.White.copy(alpha = 0.3f)
                )
            }

            // Status Creator info
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color.Gray),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = Color.White)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(status.username, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("Hoje, ${status.timestamp.substring(11, 16)}", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
                }
            }

            // Status Main Display Content
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .background(
                        if (status.type == StatusType.TEXT) {
                            Color(android.graphics.Color.parseColor(status.background ?: "#005C4B"))
                        } else {
                            Color.DarkGray
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (status.type == StatusType.TEXT) {
                    Text(
                        text = status.content,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(32.dp)
                    )
                } else {
                    // Image status placeholder
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Image, contentDescription = null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(64.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("[Imagem Status - Toque para Fechar]", color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

// Support fonts in Compose standard imports
private val FontFamily.Companion.Monospace get() = FontFamily.Monospace
private val TextAlign.Companion.Center get() = androidx.compose.ui.text.style.TextAlign.Center
