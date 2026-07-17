package com.whatsvirtual.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.whatsvirtual.app.screens.AuthScreen
import com.whatsvirtual.app.screens.CallScreen
import com.whatsvirtual.app.screens.ChatDetailScreen
import com.whatsvirtual.app.screens.MainScreen
import com.whatsvirtual.app.types.Chat
import com.whatsvirtual.app.utils.AppState

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalAnimationApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    var selectedChat by remember { mutableStateOf<Chat?>(null) }
                    val currentUser = AppState.currentUser
                    val activeCall = AppState.activeCall

                    Box(modifier = Modifier.fillMaxSize()) {
                        // Main Routing Content
                        AnimatedContent(
                            targetState = currentUser,
                            transitionSpec = {
                                fadeIn() with fadeOut()
                            },
                            label = "auth_routing"
                        ) { user ->
                            if (user == null) {
                                AuthScreen(
                                    onAuthSuccess = {
                                        // Login/Register success, route to main dashboard
                                        selectedChat = null
                                    }
                                )
                            } else {
                                AnimatedContent(
                                    targetState = selectedChat,
                                    transitionSpec = {
                                        slideInHorizontally { width -> width } + fadeIn() with
                                                slideOutHorizontally { width -> -width } + fadeOut()
                                    },
                                    label = "chat_routing"
                                ) { chat ->
                                    if (chat == null) {
                                        MainScreen(
                                            onSelectChat = { selectedChat = it },
                                            onLogout = {
                                                AppState.logout()
                                                selectedChat = null
                                            }
                                        )
                                    } else {
                                        ChatDetailScreen(
                                            chat = chat,
                                            onBack = { selectedChat = null }
                                        )
                                    }
                                }
                            }
                        }

                        // Call Overlay (always on top of other screens if a call session is active)
                        AnimatedVisibility(
                            visible = activeCall != null,
                            enter = slideInVertically { height -> height } + fadeIn(),
                            exit = slideOutVertically { height -> height } + fadeOut()
                        ) {
                            CallScreen()
                        }
                    }
                }
            }
        }
    }
}
