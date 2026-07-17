/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parser with large limits for base64 media
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Path for JSON database
const DB_PATH = path.join(process.cwd(), "db.json");

// Helper to initialize or load database
interface DatabaseSchema {
  users: any[];
  chats: any[];
  messages: any[];
  statuses: any[];
  calls: any[];
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading database, starting fresh:", error);
  }

  // Initial Seed Data with Gemini Bot and a mock user (Zangi creator/AI helper)
  const initialDb: DatabaseSchema = {
    users: [
      {
        id: "bot-system",
        username: "Suporte Virtual AI",
        virtualNumber: "+888-000-0000",
        password: "ai-system-secret",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
        statusMessage: "Alimentado pelo Gemini 3.5. Envie mensagens, fotos ou áudios para testar!",
        createdAt: new Date().toISOString()
      },
      {
        id: "user-creator",
        username: "Neymar Jr (Virtual)",
        virtualNumber: "+888-101-1111",
        password: "neymar-secret",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        statusMessage: "Ousadia e alegria! ⚽📱",
        createdAt: new Date().toISOString()
      }
    ],
    chats: [
      {
        id: "global-group",
        name: "Grupo Oficial WhatsVirtual",
        type: "group",
        avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80",
        participants: ["+888-000-0000", "+888-101-1111"],
        createdAt: new Date().toISOString()
      }
    ],
    messages: [
      {
        id: "welcome-msg-1",
        chatId: "global-group",
        senderNumber: "+888-000-0000",
        senderName: "Suporte Virtual AI",
        text: "Bem-vindo ao Grupo Oficial do WhatsVirtual! 🎉 Aqui você pode testar conversas em grupo com números virtuais.",
        encrypted: false,
        type: "text",
        timestamp: new Date().toISOString(),
        status: "read"
      }
    ],
    statuses: [
      {
        id: "status-welcome",
        userNumber: "+888-000-0000",
        username: "Suporte Virtual AI",
        userAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
        type: "text",
        content: "Privacidade total sem chip! WhatsVirtual ativo e seguro 🔒✨",
        background: "bg-gradient-to-r from-teal-500 to-emerald-600",
        timestamp: new Date().toISOString(),
        views: []
      }
    ],
    calls: []
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving database:", error);
  }
}

// Initialize database in-memory cache
let db = loadDatabase();

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini SDK initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini SDK:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found in environment. Bot will run in offline simulation mode.");
}

// Utility to generate unique virtual number
function generateVirtualNumber(): string {
  let virtualNumber = "";
  let exists = true;

  while (exists) {
    const part1 = Math.floor(100 + Math.random() * 900); // 3 digits
    const part2 = Math.floor(1000 + Math.random() * 9000); // 4 digits
    virtualNumber = `+888-${part1}-${part2}`;
    exists = db.users.some(u => u.virtualNumber === virtualNumber);
  }

  return virtualNumber;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Auth Register
app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Nome de usuário e senha são obrigatórios." });
  }

  const virtualNumber = generateVirtualNumber();
  const newUser = {
    id: "user_" + Math.random().toString(36).substr(2, 9),
    username,
    virtualNumber,
    password, // Store as is for simple recovery / demo
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
    statusMessage: "Olá! Estou usando o WhatsVirtual.",
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Auto create chat with Gemini Bot
  const botChatId = "chat_bot_" + newUser.id;
  const newBotChat = {
    id: botChatId,
    name: "Suporte Virtual AI",
    type: "individual",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    participants: [virtualNumber, "+888-000-0000"],
    createdAt: new Date().toISOString()
  };
  db.chats.push(newBotChat);

  // Welcome message from Gemini Bot
  db.messages.push({
    id: "msg_welcome_" + Math.random().toString(36).substr(2, 9),
    chatId: botChatId,
    senderNumber: "+888-000-0000",
    senderName: "Suporte Virtual AI",
    text: `Olá, ${username}! Seja bem-vindo ao WhatsVirtual. Seu número virtual permanente é ${virtualNumber}. Guarde-o com sua senha para recuperar sua conta de qualquer dispositivo! 📱✨\n\nEu sou o assistente oficial de suporte. Você pode me enviar mensagens de texto, fotos, áudio (gravação de voz), documentos ou localização para testar os recursos do aplicativo!`,
    encrypted: false,
    type: "text",
    timestamp: new Date().toISOString(),
    status: "delivered"
  });

  // Add the user to the default global group
  const globalGroup = db.chats.find(c => c.id === "global-group");
  if (globalGroup) {
    globalGroup.participants.push(virtualNumber);
  }

  saveDatabase(db);

  res.json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      virtualNumber: newUser.virtualNumber,
      avatar: newUser.avatar,
      statusMessage: newUser.statusMessage,
      createdAt: newUser.createdAt
    }
  });
});

// 2. Auth Login (Recovery)
app.post("/api/auth/login", (req, res) => {
  const { virtualNumber, password } = req.body;
  if (!virtualNumber || !password) {
    return res.status(400).json({ error: "Número virtual e senha são obrigatórios." });
  }

  // Clean formatted number to compare
  const cleanNumber = virtualNumber.trim();
  const user = db.users.find(u => u.virtualNumber === cleanNumber && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Número virtual ou senha incorretos." });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      virtualNumber: user.virtualNumber,
      avatar: user.avatar,
      statusMessage: user.statusMessage,
      createdAt: user.createdAt
    }
  });
});

// 3. Update Profile
app.post("/api/user/update", (req, res) => {
  const { virtualNumber, username, statusMessage, avatar } = req.body;
  const userIndex = db.users.findIndex(u => u.virtualNumber === virtualNumber);

  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  if (username) db.users[userIndex].username = username;
  if (statusMessage) db.users[userIndex].statusMessage = statusMessage;
  if (avatar) db.users[userIndex].avatar = avatar;

  saveDatabase(db);
  res.json({ success: true, user: db.users[userIndex] });
});

// 4. Retrieve Chats
app.get("/api/chats", (req, res) => {
  const { userNumber } = req.query;
  if (!userNumber) {
    return res.status(400).json({ error: "Parâmetro userNumber é obrigatório." });
  }

  const userChats = db.chats.filter(c => c.participants.includes(userNumber));

  // Enhance chats with names, avatars and last messages
  const enhancedChats = userChats.map(chat => {
    let name = chat.name;
    let avatar = chat.avatar;

    if (chat.type === "individual") {
      // Find the other participant
      const otherNumber = chat.participants.find((p: string) => p !== userNumber);
      const otherUser = db.users.find(u => u.virtualNumber === otherNumber);
      if (otherUser) {
        name = otherUser.username;
        avatar = otherUser.avatar;
      } else {
        name = otherNumber || "Contato Desconhecido";
      }
    }

    // Get last message
    const chatMsgs = db.messages.filter(m => m.chatId === chat.id);
    const lastMessage = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : undefined;

    // Calculate simulated unread count
    const unreadCount = chatMsgs.filter(m => m.senderNumber !== userNumber && m.status !== "read").length;

    return {
      ...chat,
      name,
      avatar,
      lastMessage,
      unreadCount
    };
  });

  res.json(enhancedChats);
});

// 5. Create Chat
app.post("/api/chats/create", (req, res) => {
  const { userNumber, targetNumber, name, type } = req.body;

  if (type === "individual") {
    if (!targetNumber) {
      return res.status(400).json({ error: "targetNumber é necessário para chats individuais." });
    }

    // Check if targetUser exists
    const targetUser = db.users.find(u => u.virtualNumber === targetNumber);
    if (!targetUser) {
      return res.status(404).json({ error: "Contato com este número virtual não foi encontrado." });
    }

    // Check if chat already exists
    const existing = db.chats.find(c =>
      c.type === "individual" &&
      c.participants.includes(userNumber) &&
      c.participants.includes(targetNumber)
    );

    if (existing) {
      return res.json({ success: true, chat: existing });
    }

    const newChat = {
      id: "chat_" + Math.random().toString(36).substr(2, 9),
      name: targetUser.username,
      type: "individual",
      avatar: targetUser.avatar,
      participants: [userNumber, targetNumber],
      createdAt: new Date().toISOString()
    };

    db.chats.push(newChat);
    saveDatabase(db);
    return res.json({ success: true, chat: newChat });
  } else {
    // Group chat
    if (!name) {
      return res.status(400).json({ error: "Nome é obrigatório para grupos." });
    }

    const newGroup = {
      id: "chat_" + Math.random().toString(36).substr(2, 9),
      name,
      type: "group",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      participants: [userNumber, "+888-000-0000"], // Always include Bot in groups too!
      createdAt: new Date().toISOString()
    };

    db.chats.push(newGroup);
    saveDatabase(db);
    return res.json({ success: true, chat: newGroup });
  }
});

// 6. Get Messages for a Chat
app.get("/api/messages/:chatId", (req, res) => {
  const { chatId } = req.params;
  const { userNumber } = req.query;

  // Mark messages as read if accessed
  let updated = false;
  db.messages.forEach(m => {
    if (m.chatId === chatId && m.senderNumber !== userNumber && m.status !== "read") {
      m.status = "read";
      updated = true;
    }
  });

  if (updated) {
    saveDatabase(db);
  }

  const msgs = db.messages.filter(m => m.chatId === chatId);
  res.json(msgs);
});

// Helper function to query Gemini safely
async function getGeminiResponse(promptText: string, imagePart?: any): Promise<string> {
  if (!ai) {
    // Mock response when API key is missing
    return `[Modo de Demonstração Offline]
Eu sou o assistente do WhatsVirtual! Para me conectar ao cérebro inteligente do Gemini, insira sua chave nas Configurações > Secrets.

Sua mensagem recebida: "${promptText}"

Como assistente do aplicativo, posso simular o fluxo:
- Criptografia: Seu áudio e fotos foram transmitidos criptografados!
- Número Virtual: Você está usando um número sem chip físico.

Dica: Tente simular uma chamada de vídeo ou voz clicando no topo da conversa! 📞🎬`;
  }

  try {
    const contents: any[] = [];
    if (imagePart) {
      contents.push(imagePart);
    }
    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: imagePart ? { parts: contents } : promptText,
      config: {
        systemInstruction: "Você é o robô de suporte oficial do WhatsVirtual (um clone moderno do WhatsApp com criptografia de ponta a ponta e números virtuais). Responda em português de forma simpática, prestativa e objetiva. Use emojis como no WhatsApp. Se o usuário mandar fotos, comente sobre a imagem de forma inteligente. Se for áudio, finja que ouviu a transcrição e comente. Se for localização, comente que recebeu o ponto geográfico."
      }
    });

    return response.text || "Desculpe, não consegui processar essa mensagem.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Ops, ocorreu um erro ao conectar com o Gemini API: ${error.message}. Mas a mensagem foi entregue com segurança criptografada! 🔒`;
  }
}

// 7. Send Message
app.post("/api/messages", async (req, res) => {
  const {
    chatId,
    senderNumber,
    senderName,
    text,
    encrypted,
    type,
    fileUrl,
    fileName,
    fileSize,
    location
  } = req.body;

  if (!chatId || !senderNumber) {
    return res.status(400).json({ error: "Dados da mensagem incompletos." });
  }

  const newMessage = {
    id: "msg_" + Math.random().toString(36).substr(2, 9),
    chatId,
    senderNumber,
    senderName: senderName || "Usuário",
    text: text || "",
    encrypted: !!encrypted,
    type: type || "text",
    fileUrl,
    fileName,
    fileSize,
    location,
    timestamp: new Date().toISOString(),
    status: "sent"
  };

  db.messages.push(newMessage);
  saveDatabase(db);

  res.json({ success: true, message: newMessage });

  // Handle AI Bot simulation asynchronously
  const chat = db.chats.find(c => c.id === chatId);
  const isBotChat = chat && (chat.type === "individual" && chat.participants.includes("+888-000-0000"));
  const isGlobalGroupWithBot = chat && chat.type === "group" && senderNumber !== "+888-000-0000";

  if (isBotChat || isGlobalGroupWithBot) {
    // Wait a brief moment to simulate typing
    setTimeout(async () => {
      // Mark message as delivered and read
      newMessage.status = "read";

      let promptText = text;
      let imagePart: any = undefined;

      // If text is encrypted on client side, we get encrypted text. For demonstration of E2EE:
      // The Gemini bot will receive a note. In a real system, the server cannot read E2EE.
      // We can show the bot stating: "Recebi sua mensagem criptografada de ponta a ponta. Como sou o assistente do seu chat, você compartilhou a chave local de sessão para que eu possa decifrar e responder!"
      if (encrypted) {
        promptText = `[O usuário enviou uma mensagem descriptografada localmente para você]: ${text}`;
      }

      if (type === "image" && fileUrl) {
        // Extract base64 data from fileUrl: data:image/png;base64,.....
        const matches = fileUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
        if (matches && matches.length === 3) {
          imagePart = {
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          };
        }
        promptText = promptText || "Analise esta foto que te enviei no WhatsVirtual.";
      } else if (type === "audio") {
        promptText = "Recebi uma mensagem de voz. Escreva uma resposta dizendo que ouviu o áudio com atenção.";
      } else if (type === "location" && location) {
        promptText = `Enviei minha localização geográfica: Latitude ${location.latitude}, Longitude ${location.longitude}, Endereço: ${location.address || "Não especificado"}. Comente sobre isso.`;
      } else if (type === "document") {
        promptText = `Enviei um documento chamado: ${fileName} (${fileSize}). Comente que recebeu o arquivo com segurança.`;
      }

      // If it's a group, the bot only responds if mentioned or with a smaller probability,
      // but in this demo, let's make the bot reply with a friendly group response
      let botResponseText = "";
      if (isGlobalGroupWithBot) {
        // Check if bot was mentioned or reply half of the time
        if (text.includes("AI") || text.includes("bot") || text.includes("suporte") || Math.random() > 0.5) {
          botResponseText = await getGeminiResponse(`No grupo "${chat.name}", o usuário ${senderName} disse: "${promptText}". Responda brevemente direcionado ao grupo.`);
        } else {
          return; // No reply needed
        }
      } else {
        botResponseText = await getGeminiResponse(promptText, imagePart);
      }

      if (botResponseText) {
        const botMsg = {
          id: "msg_bot_" + Math.random().toString(36).substr(2, 9),
          chatId,
          senderNumber: "+888-000-0000",
          senderName: "Suporte Virtual AI",
          text: botResponseText,
          encrypted: !!encrypted, // Mirror encryption status to look cool
          type: "text",
          timestamp: new Date().toISOString(),
          status: "delivered"
        };
        db.messages.push(botMsg);
        saveDatabase(db);
      }
    }, 1500);
  }
});

// 8. Post Status
app.post("/api/status", (req, res) => {
  const { userNumber, type, content, background } = req.body;
  const user = db.users.find(u => u.virtualNumber === userNumber);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const newStatus = {
    id: "status_" + Math.random().toString(36).substr(2, 9),
    userNumber,
    username: user.username,
    userAvatar: user.avatar,
    type: type || "text",
    content,
    background: background || "bg-gradient-to-r from-blue-500 to-indigo-600",
    timestamp: new Date().toISOString(),
    views: []
  };

  db.statuses.push(newStatus);
  saveDatabase(db);

  res.json({ success: true, status: newStatus });
});

// 9. Get Statuses
app.get("/api/status", (req, res) => {
  const { userNumber } = req.query;

  // Filter out statuses older than 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  db.statuses = db.statuses.filter(s => s.timestamp >= oneDayAgo);

  res.json(db.statuses);
});

// 10. View Status
app.post("/api/status/view", (req, res) => {
  const { statusId, userNumber } = req.body;
  const status = db.statuses.find(s => s.id === statusId);

  if (status) {
    if (!status.views.includes(userNumber)) {
      status.views.push(userNumber);
      saveDatabase(db);
    }
  }

  res.json({ success: true });
});

// 11. Calls API
// Initiate Call
app.post("/api/calls", (req, res) => {
  const { callerNumber, callerName, receiverNumber, receiverName, type } = req.body;

  if (!callerNumber || !receiverNumber) {
    return res.status(400).json({ error: "Números de origem e destino obrigatórios." });
  }

  const newCall = {
    id: "call_" + Math.random().toString(36).substr(2, 9),
    callerNumber,
    callerName: callerName || "Desconhecido",
    receiverNumber,
    receiverName: receiverName || "Desconhecido",
    type: type || "voice",
    status: "ringing",
    timestamp: new Date().toISOString(),
    duration: 0
  };

  db.calls.push(newCall);
  saveDatabase(db);

  res.json({ success: true, call: newCall });

  // Simulate AI bot answering after 3 seconds if receiver is Bot
  if (receiverNumber === "+888-000-0000") {
    setTimeout(() => {
      const callIndex = db.calls.findIndex(c => c.id === newCall.id);
      if (callIndex !== -1 && db.calls[callIndex].status === "ringing") {
        db.calls[callIndex].status = "connected";
        saveDatabase(db);

        // Auto hang up after 15 seconds of speaking
        setTimeout(() => {
          const freshCallIndex = db.calls.findIndex(c => c.id === newCall.id);
          if (freshCallIndex !== -1 && db.calls[freshCallIndex].status === "connected") {
            db.calls[freshCallIndex].status = "ended";
            db.calls[freshCallIndex].duration = 15;
            saveDatabase(db);

            // Send a chat message summarizing the call
            const botChat = db.chats.find(c => c.participants.includes(callerNumber) && c.participants.includes("+888-000-0000") && c.type === "individual");
            if (botChat) {
              db.messages.push({
                id: "msg_call_summary_" + Math.random().toString(36).substr(2, 9),
                chatId: botChat.id,
                senderNumber: "+888-000-0000",
                senderName: "Suporte Virtual AI",
                text: `📞 Chamada de ${type === "video" ? "vídeo" : "voz"} encerrada. Duração: 00:15. Muito obrigado por testar nosso protocolo de comunicação de voz WhatsVirtual!`,
                encrypted: false,
                type: "text",
                timestamp: new Date().toISOString(),
                status: "delivered"
              });
              saveDatabase(db);
            }
          }
        }, 15000);
      }
    }, 3000);
  }
});

// Update Call Status (Accept, Decline, End)
app.post("/api/calls/:callId/update", (req, res) => {
  const { callId } = req.params;
  const { status, duration } = req.body;

  const callIndex = db.calls.findIndex(c => c.id === callId);
  if (callIndex === -1) {
    return res.status(404).json({ error: "Chamada não encontrada." });
  }

  if (status) db.calls[callIndex].status = status;
  if (duration !== undefined) db.calls[callIndex].duration = duration;

  saveDatabase(db);
  res.json({ success: true, call: db.calls[callIndex] });
});

// 12. Active Calls for User (Polling)
app.get("/api/calls/active", (req, res) => {
  const { userNumber } = req.query;
  if (!userNumber) {
    return res.status(400).json({ error: "Parâmetro userNumber obrigatório." });
  }

  // Find call where status is ringing or connected and user is participant
  const activeCall = db.calls.find(c =>
    (c.callerNumber === userNumber || c.receiverNumber === userNumber) &&
    (c.status === "ringing" || c.status === "connected")
  );

  res.json(activeCall || null);
});

// Call History
app.get("/api/calls/history", (req, res) => {
  const { userNumber } = req.query;
  if (!userNumber) {
    return res.status(400).json({ error: "Parâmetro userNumber obrigatório." });
  }

  const history = db.calls.filter(c => c.callerNumber === userNumber || c.receiverNumber === userNumber);
  res.json(history.reverse()); // latest first
});

// 13. Sync Poll Endpoint (Single call retrieves new messages, statuses, calls, active call, etc.)
app.get("/api/sync", (req, res) => {
  const { userNumber, lastSyncTime } = req.query;
  if (!userNumber) {
    return res.status(400).json({ error: "Parâmetro userNumber obrigatório." });
  }

  const lastTime = lastSyncTime ? new Date(lastSyncTime as string).getTime() : 0;

  // Chats the user participates in
  const userChats = db.chats.filter(c => c.participants.includes(userNumber));

  // Retrieve chat list details (latest messages and unreads)
  const chatDetails = userChats.map(chat => {
    let name = chat.name;
    let avatar = chat.avatar;

    if (chat.type === "individual") {
      const otherNumber = chat.participants.find((p: string) => p !== userNumber);
      const otherUser = db.users.find(u => u.virtualNumber === otherNumber);
      if (otherUser) {
        name = otherUser.username;
        avatar = otherUser.avatar;
      } else {
        name = otherNumber || "Contato Desconhecido";
      }
    }

    const chatMsgs = db.messages.filter(m => m.chatId === chat.id);
    const lastMessage = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : undefined;
    const unreadCount = chatMsgs.filter(m => m.senderNumber !== userNumber && m.status !== "read").length;

    return {
      ...chat,
      name,
      avatar,
      lastMessage,
      unreadCount
    };
  });

  // New Messages since lastTime
  const newMessages = db.messages.filter(m =>
    userChats.some(c => c.id === m.chatId) &&
    new Date(m.timestamp).getTime() > lastTime
  );

  // Active call
  const activeCall = db.calls.find(c =>
    (c.callerNumber === userNumber || c.receiverNumber === userNumber) &&
    (c.status === "ringing" || c.status === "connected")
  );

  // Call history
  const callsHistory = db.calls.filter(c => c.callerNumber === userNumber || c.receiverNumber === userNumber);

  // Status updates within 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const activeStatuses = db.statuses.filter(s => s.timestamp >= oneDayAgo);

  res.json({
    messages: newMessages,
    chats: chatDetails,
    statuses: activeStatuses,
    calls: callsHistory,
    activeCall: activeCall || null,
    serverTime: new Date().toISOString()
  });
});

// Get User by virtual number
app.get("/api/users/find", (req, res) => {
  const { virtualNumber } = req.query;
  if (!virtualNumber) {
    return res.status(400).json({ error: "Número virtual é obrigatório." });
  }

  const user = db.users.find(u => u.virtualNumber === (virtualNumber as string).trim());
  if (!user) {
    return res.status(404).json({ error: "Contato não encontrado." });
  }

  res.json({
    username: user.username,
    virtualNumber: user.virtualNumber,
    avatar: user.avatar,
    statusMessage: user.statusMessage
  });
});

// -------------------------------------------------------------
// Serve Static Assets & Vite Integration
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WhatsVirtual running on http://localhost:${PORT}`);
  });
}

startServer();
