package com.whatsvirtual.app.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.whatsvirtual.app.types.CallStatus
import com.whatsvirtual.app.types.CallType
import com.whatsvirtual.app.utils.AppState
import kotlinx.coroutines.delay

@Composable
fun CallScreen() {
    val activeCall = AppState.activeCall ?: return
    val isIncoming = activeCall.callerNumber != AppState.currentUser?.virtualNumber

    var callDuration by remember { mutableStateOf(0) }
    var isMuted by remember { mutableStateOf(false) }
    var isVideoOn by remember { mutableStateOf(activeCall.type == CallType.VIDEO) }

    // Pulsing circle animation for ringing state
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.4f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    // Call duration timer
    LaunchedEffect(activeCall.status) {
        if (activeCall.status == CallStatus.CONNECTED) {
            callDuration = 0
            while (AppState.activeCall?.status == CallStatus.CONNECTED) {
                delay(1000)
                callDuration++
            }
        }
    }

    // Auto-answer bot calls for funny interactive simulator feel!
    LaunchedEffect(activeCall.status) {
        if (!isIncoming && activeCall.status == CallStatus.RINGING) {
            // Auto accept by bot after 2 seconds
            delay(2000)
            AppState.connectCall()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F1B21)) // Dark slate-teal background
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxSize()
        ) {
            // Header / Metadata
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(top = 24.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    tint = Color(0xFFD9FDD3).copy(alpha = 0.5f),
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "LIGAÇÃO CRIPTOGRAFADA E2EE",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White.copy(alpha = 0.5f),
                    letterSpacing = 1.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                val displayName = if (isIncoming) activeCall.callerName else activeCall.receiverName
                Text(
                    text = displayName,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                val displayNum = if (isIncoming) activeCall.callerNumber else activeCall.receiverNumber
                Text(
                    text = displayNum,
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.7f),
                    fontFamily = FontFamily.Monospace
                )

                Spacer(modifier = Modifier.height(16.dp))

                val statusText = when (activeCall.status) {
                    CallStatus.RINGING -> if (isIncoming) "Chamada de Áudio Recebida..." else "Chamando..."
                    CallStatus.CONNECTED -> "Conectado • ${callDuration / 60}:${String.format("%02d", callDuration % 60)}"
                    else -> "Encerrando..."
                }

                Text(
                    text = statusText,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (activeCall.status == CallStatus.CONNECTED) Color(0xFF00A884) else Color.White
                )
            }

            // Central Pulsing Avatar / Mock Video View
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                if (isVideoOn && activeCall.status == CallStatus.CONNECTED) {
                    // Video mock box representation
                    Card(
                        modifier = Modifier
                            .fillMaxWidth(0.9f)
                            .height(260.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF202C33))
                    ) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.Videocam, contentDescription = null, tint = Color.White.copy(alpha = 0.3f), modifier = Modifier.size(48.dp))
                                Spacer(modifier = Modifier.height(12.dp))
                                Text("[Simulação de Vídeo Ativa]", color = Color.White, fontSize = 13.sp)
                            }

                            // PiP local avatar represent
                            Card(
                                modifier = Modifier
                                    .size(80.dp, 110.dp)
                                    .align(Alignment.BottomEnd)
                                    .padding(12.dp),
                                shape = RoundedCornerShape(8.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1B21))
                            ) {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                                }
                            }
                        }
                    }
                } else {
                    // Ring waves for standard Voice Call
                    if (activeCall.status == CallStatus.RINGING) {
                        Box(
                            modifier = Modifier
                                .size(160.dp)
                                .scale(pulseScale)
                                .border(1.5.dp, Color(0xFF00A884).copy(alpha = 0.3f), CircleShape)
                        )
                        Box(
                            modifier = Modifier
                                .size(120.dp)
                                .scale(pulseScale - 0.15f)
                                .border(1.5.dp, Color(0xFF00A884).copy(alpha = 0.5f), CircleShape)
                        )
                    }

                    // Avatar Circle
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF202C33)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (activeCall.type == CallType.VIDEO) Icons.Default.Videocam else Icons.Default.Person,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(48.dp)
                        )
                    }
                }
            }

            // Controls Block
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                if (isIncoming && activeCall.status == CallStatus.RINGING) {
                    // Incoming call sliders / accept decline buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Decline
                        IconButtonWithLabel(
                            icon = Icons.Default.CallEnd,
                            label = "Recusar",
                            backgroundColor = Color.Red
                        ) {
                            AppState.endCall()
                        }

                        // Accept
                        IconButtonWithLabel(
                            icon = Icons.Default.Call,
                            label = "Atender",
                            backgroundColor = Color(0xFF00C853)
                        ) {
                            AppState.connectCall()
                        }
                    }
                } else {
                    // Active call standard rows (Mute, Video, Speaker, End)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Mute button
                        IconButtonWithLabel(
                            icon = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                            label = if (isMuted) "Ativar" else "Silenciar",
                            backgroundColor = if (isMuted) Color.White else Color(0x33FFFFFF),
                            tint = if (isMuted) Color.Black else Color.White
                        ) {
                            isMuted = !isMuted
                        }

                        // Video toggle button
                        IconButtonWithLabel(
                            icon = if (isVideoOn) Icons.Default.VideocamOff else Icons.Default.Videocam,
                            label = if (isVideoOn) "Desl. Vídeo" else "Ligar Vídeo",
                            backgroundColor = if (isVideoOn) Color.White else Color(0x33FFFFFF),
                            tint = if (isVideoOn) Color.Black else Color.White
                        ) {
                            isVideoOn = !isVideoOn
                        }

                        // End Call
                        IconButtonWithLabel(
                            icon = Icons.Default.CallEnd,
                            label = "Desligar",
                            backgroundColor = Color.Red
                        ) {
                            AppState.endCall(callDuration)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun IconButtonWithLabel(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    backgroundColor: Color,
    tint: Color = Color.White,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(60.dp)
                .clip(CircleShape)
                .background(backgroundColor)
                .clickable { onClick() },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = tint,
                modifier = Modifier.size(28.dp)
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = label,
            fontSize = 11.sp,
            color = Color.White.copy(alpha = 0.7f),
            fontWeight = FontWeight.Medium
        )
    }
}

private val FontFamily.Companion.Monospace get() = FontFamily.Monospace
