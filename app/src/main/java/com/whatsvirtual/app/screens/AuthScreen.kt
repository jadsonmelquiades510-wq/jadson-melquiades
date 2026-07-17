package com.whatsvirtual.app.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.whatsvirtual.app.types.UserProfile
import com.whatsvirtual.app.utils.AppState

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun AuthScreen(onAuthSuccess: (UserProfile) -> Unit) {
    var isRegister by remember { mutableStateOf(true) }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loginNumber by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var generatedUser by remember { mutableStateOf<UserProfile?>(null) }
    
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFFDFDFD))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        // Decorative background elements
        Box(
            modifier = Modifier
                .size(300.dp)
                .align(Alignment.TopStart)
                .offset(x = (-100).dp, y = (-100).dp)
                .background(Color(0x0F005C4B), CircleShape)
        )
        Box(
            modifier = Modifier
                .size(300.dp)
                .align(Alignment.BottomEnd)
                .offset(x = 100.dp, y = 100.dp)
                .background(Color(0x0F00A884), CircleShape)
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .maxHeight()
                .padding(top = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo / Header
            if (generatedUser == null) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0xFF005C4B)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.PhoneCallback,
                        contentDescription = "WhatsVirtual",
                        tint = Color.White,
                        modifier = Modifier.size(36.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "WhatsVirtual",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF1C1C1C)
                )

                Text(
                    text = "Mensageiro moderno sem chip físico",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF54656F),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                Spacer(modifier = Modifier.height(32.dp))
            }

            AnimatedContent(
                targetState = generatedUser,
                transitionSpec = {
                    slideInHorizontally { width -> width } + fadeIn() with
                            slideOutHorizontally { width -> -width } + fadeOut()
                },
                label = "auth_views"
            ) { user ->
                if (user == null) {
                    // Sign In / Sign Up Form Card
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, Color(0xFFECECEC), RoundedCornerShape(24.dp)),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(24.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Tab Selector
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFFF0F2F5))
                                    .border(1.dp, Color(0xFFECECEC), RoundedCornerShape(16.dp))
                                    .padding(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (isRegister) Color.White else Color.Transparent)
                                        .clickable {
                                            isRegister = true
                                            error = ""
                                        }
                                        .padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "Novo Cadastro",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isRegister) Color(0xFF1C1C1C) else Color(0xFF54656F)
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (!isRegister) Color.White else Color.Transparent)
                                        .clickable {
                                            isRegister = false
                                            error = ""
                                        }
                                        .padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "Recuperar Conta",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (!isRegister) Color(0xFF1C1C1C) else Color(0xFF54656F)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            if (error.isNotEmpty()) {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE)),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 16.dp)
                                ) {
                                    Text(
                                        text = error,
                                        color = Color(0xFFC62828),
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(12.dp),
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }

                            if (isRegister) {
                                // REGISTER
                                Text(
                                    text = "SEU NOME OU APELIDO",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF54656F),
                                    modifier = Modifier.align(Alignment.Start)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = username,
                                    onValueChange = { username = it },
                                    placeholder = { Text("Ex: Neymar Jr", fontSize = 14.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color(0xFF005C4B),
                                        unfocusedBorderColor = Color(0xFFECECEC)
                                    ),
                                    leadingIcon = {
                                        Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF54656F))
                                    },
                                    singleLine = true
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                Text(
                                    text = "CRIE UMA SENHA SEGURA",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF54656F),
                                    modifier = Modifier.align(Alignment.Start)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = password,
                                    onValueChange = { password = it },
                                    placeholder = { Text("••••••••", fontSize = 14.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    visualTransformation = PasswordVisualTransformation(),
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color(0xFF005C4B),
                                        unfocusedBorderColor = Color(0xFFECECEC)
                                    ),
                                    leadingIcon = {
                                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF54656F))
                                    },
                                    singleLine = true
                                )

                                Spacer(modifier = Modifier.height(20.dp))

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFFF0F2F5))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Shield,
                                        contentDescription = null,
                                        tint = Color(0xFF005C4B),
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Não precisa de chip físico! Ativamos uma linha virtual definitiva exclusiva e segura.",
                                        fontSize = 11.sp,
                                        color = Color(0xFF54656F),
                                        lineHeight = 15.sp
                                    )
                                }

                                Spacer(modifier = Modifier.height(24.dp))

                                Button(
                                    onClick = {
                                        if (username.trim().isEmpty() || password.trim().isEmpty()) {
                                            error = "Preencha todos os campos."
                                            return@Button
                                        }
                                        loading = true
                                        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                                            val registered = AppState.registerUser(username)
                                            generatedUser = registered
                                            loading = false
                                        }, 1500)
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF005C4B)),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    if (loading) {
                                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Text("Gerando Número Virtual...")
                                    } else {
                                        Text("Registrar e Ativar Número", fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                                    }
                                }

                            } else {
                                // LOGIN
                                Text(
                                    text = "SEU NÚMERO VIRTUAL",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF54656F),
                                    modifier = Modifier.align(Alignment.Start)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = loginNumber,
                                    onValueChange = { loginNumber = it },
                                    placeholder = { Text("Ex: +888-123-4567", fontSize = 14.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color(0xFF005C4B),
                                        unfocusedBorderColor = Color(0xFFECECEC)
                                    ),
                                    leadingIcon = {
                                        Icon(Icons.Default.DialerSip, contentDescription = null, tint = Color(0xFF54656F))
                                    },
                                    singleLine = true
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                Text(
                                    text = "SUA SENHA",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF54656F),
                                    modifier = Modifier.align(Alignment.Start)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = password,
                                    onValueChange = { password = it },
                                    placeholder = { Text("••••••••", fontSize = 14.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    visualTransformation = PasswordVisualTransformation(),
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color(0xFF005C4B),
                                        unfocusedBorderColor = Color(0xFFECECEC)
                                    ),
                                    leadingIcon = {
                                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF54656F))
                                    },
                                    singleLine = true
                                )

                                Spacer(modifier = Modifier.height(24.dp))

                                Button(
                                    onClick = {
                                        if (loginNumber.trim().isEmpty() || password.trim().isEmpty()) {
                                            error = "Preencha todos os campos."
                                            return@Button
                                        }
                                        loading = true
                                        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                                            val logged = AppState.loginUser(loginNumber)
                                            if (logged != null) {
                                                onAuthSuccess(logged)
                                            } else {
                                                error = "Número ou senha inválidos."
                                            }
                                            loading = false
                                        }, 1000)
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF005C4B)),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    if (loading) {
                                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                                    } else {
                                        Text("Recuperar Conta e Entrar", fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // CHIP CARD REVEAL VIEW
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFE8F5E9)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Color(0xFF005C4B),
                                modifier = Modifier.size(48.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "Chip Ativado!",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1C1C1C)
                        )

                        Text(
                            text = "Parabéns! Seu chip virtual está online.",
                            fontSize = 12.sp,
                            color = Color(0xFF54656F)
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // SIM Card Graphic Design
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(210.dp)
                                .border(1.dp, Color(0x3300A884), RoundedCornerShape(20.dp)),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.verticalGradient(
                                            colors = listOf(Color(0xFF005C4B), Color(0xFF004A3C))
                                        )
                                    )
                                    .padding(20.dp)
                            ) {
                                // Gold chip graphic
                                Card(
                                    modifier = Modifier
                                        .size(44.dp, 36.dp)
                                        .align(Alignment.TopEnd)
                                        .border(1.dp, Color(0xFFFFD54F), RoundedCornerShape(6.dp)),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFCA28)),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.fillMaxSize(),
                                        verticalArrangement = Arrangement.SpaceEvenly
                                    ) {
                                        Divider(color = Color(0x33000000), thickness = 1.dp)
                                        Divider(color = Color(0x33000000), thickness = 1.dp)
                                        Divider(color = Color(0x33000000), thickness = 1.dp)
                                    }
                                }

                                Column(
                                    modifier = Modifier.fillMaxSize(),
                                    verticalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "WhatsVirtual SIM CARD",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color(0xFFD9FDD3),
                                        letterSpacing = 1.sp
                                    )

                                    Column {
                                        Text(
                                            text = "NÚMERO VIRTUAL ATRIBUÍDO",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = Color.White.copy(alpha = 0.8f)
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = user.virtualNumber,
                                            fontSize = 20.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace,
                                            color = Color.White,
                                            modifier = Modifier
                                                .background(Color(0x33000000), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.Bottom
                                    ) {
                                        Column {
                                            Text(
                                                text = "USUÁRIO",
                                                fontSize = 8.sp,
                                                color = Color.White.copy(alpha = 0.7f)
                                            )
                                            Text(
                                                text = user.username,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White
                                            )
                                        }

                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(Color(0x40000000))
                                                .padding(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Text(
                                                text = "STATUS: ATIVO",
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFFD9FDD3)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Copy actions and alerts
                        OutlinedButton(
                            onClick = {
                                clipboardManager.setText(AnnotatedString(user.virtualNumber))
                                Toast.makeText(context, "Número copiado!", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF1C1C1C))
                        ) {
                            Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Copiar Número Virtual", fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF8E1)),
                            border = BoxBorder(1.dp, Color(0xFFFFECB3)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Info,
                                    contentDescription = null,
                                    tint = Color(0xFFF57F17),
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Guarde bem seu número virtual! Com ele e sua senha você pode resgatar suas conversas de qualquer dispositivo.",
                                    fontSize = 10.sp,
                                    color = Color(0xFF5D4037),
                                    lineHeight = 14.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = { onAuthSuccess(user) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF005C4B)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Entrar no WhatsVirtual", fontWeight = FontWeight.Black)
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(Icons.Default.ArrowForward, contentDescription = null)
                        }
                    }
                }
            }
        }
    }
}

// Utility to create border configuration helper since standard border is available
private fun BoxBorder(width: androidx.compose.ui.unit.Dp, color: Color) = androidx.compose.foundation.BorderStroke(width, color)
