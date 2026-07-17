/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MessageSquare,
  Phone,
  Video,
  LogOut,
  Plus,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  MapPin,
  Mic,
  MicOff,
  User,
  ShieldAlert,
  Info,
  ChevronRight,
  Shield,
  CirclePlay,
  Play,
  Pause,
  ArrowLeft,
  X,
  Volume2
} from 'lucide-react';
import { Chat, Message, UserProfile, StatusUpdate, CallSession } from './types';
import { encryptMessage, decryptMessage } from './utils/crypto';
import AuthScreen from './components/AuthScreen';
import CallScreen from './components/CallScreen';
import StatusViewer from './components/StatusViewer';
import NewChatModal from './components/NewChatModal';
import ProfileModal from './components/ProfileModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'chats' | 'status' | 'calls'>('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  
  // Data lists
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [callsHistory, setCallsHistory] = useState<CallSession[]>([]);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  
  // Modal toggles
  const [isNewChatModal, setIsNewChatModal] = useState(false);
  const [isProfileModal, setIsProfileModal] = useState(false);
  
  // Input fields
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  
  // E2EE visualizer toggle
  const [showRawPayload, setShowRawPayload] = useState(false);
  
  // Audio voice note states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Sync / Polling states
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const pollingIntervalRef = useRef<any>(null);
  
  // Auto scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sound effects helper using AudioContext
  const playSoundEffect = (type: 'incoming_msg' | 'outgoing_msg' | 'notification') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      if (type === 'incoming_msg') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'outgoing_msg') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      setTimeout(() => audioCtx.close(), 1000);
    } catch (e) {
      console.warn('AudioContext sound blocked or unsupported by browser', e);
    }
  };

  // Restore user session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('whats_virtual_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem('whats_virtual_user');
      }
    }
  }, []);

  // Poll server for live updates (sync)
  useEffect(() => {
    if (!currentUser) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Initial load
    fetchSyncData();

    // Start Polling every 1.5 seconds for extremely live chat sync and call detections
    pollingIntervalRef.current = setInterval(fetchSyncData, 1500);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentUser, lastSyncTime, selectedChat?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Main sync call to pull new messages, status updates, calls
  const fetchSyncData = async () => {
    if (!currentUser) return;

    try {
      const url = `/api/sync?userNumber=${encodeURIComponent(currentUser.virtualNumber)}&lastSyncTime=${encodeURIComponent(lastSyncTime)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Sync failed');

      const data = await res.json();
      
      // Update chats list
      setChats(data.chats);
      
      // Update statuses
      setStatuses(data.statuses);
      
      // Update call history
      setCallsHistory(data.calls);
      
      // Update active incoming/outgoing call session
      setActiveCall(data.activeCall);

      // Append new messages if any
      if (data.messages && data.messages.length > 0) {
        // If there are new messages for the currently selected chat
        const currentChatNewMsgs = data.messages.filter((m: Message) => m.chatId === selectedChat?.id);
        if (currentChatNewMsgs.length > 0) {
          setMessages((prev) => {
            // Filter duplicates (idempotency)
            const ids = new Set(prev.map((m) => m.id));
            const filteredNew = currentChatNewMsgs.filter((m: Message) => !ids.has(m.id));
            if (filteredNew.length > 0) {
              playSoundEffect('incoming_msg');
              return [...prev, ...filteredNew];
            }
            return prev;
          });
        } else {
          // Play notification sound if message for another chat
          const otherMsgs = data.messages.filter((m: Message) => m.senderNumber !== currentUser.virtualNumber);
          if (otherMsgs.length > 0) {
            playSoundEffect('incoming_msg');
          }
        }
      }

      setLastSyncTime(data.serverTime);
    } catch (err) {
      console.warn('Sync connection warning:', err);
    }
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('whats_virtual_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedChat(null);
    setChats([]);
    setMessages([]);
    setLastSyncTime('');
    localStorage.removeItem('whats_virtual_user');
  };

  // Handle selected chat change
  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setMessages([]); // clear old screen first for nice transition

    if (!currentUser) return;

    try {
      const res = await fetch(`/api/messages/${chat.id}?userNumber=${encodeURIComponent(currentUser.virtualNumber)}`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  // Start chat with input virtual number
  const handleStartChat = async (targetNumber: string) => {
    if (!currentUser) return;
    
    const res = await fetch('/api/chats/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userNumber: currentUser.virtualNumber,
        targetNumber,
        type: 'individual',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao iniciar conversa.');
    }

    // Refresh chats
    await fetchSyncData();
    // Select the new chat
    handleSelectChat(data.chat);
  };

  // Create a group
  const handleCreateGroup = async (groupName: string) => {
    if (!currentUser) return;

    const res = await fetch('/api/chats/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userNumber: currentUser.virtualNumber,
        name: groupName,
        type: 'group',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao criar grupo.');
    }

    // Refresh chats
    await fetchSyncData();
    // Select group chat
    handleSelectChat(data.chat);
  };

  // Post new status
  const handlePostStatus = async (type: 'text' | 'image', content: string, background?: string) => {
    if (!currentUser) return;

    const res = await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userNumber: currentUser.virtualNumber,
        type,
        content,
        background,
      }),
    });

    if (res.ok) {
      playSoundEffect('notification');
      fetchSyncData();
    }
  };

  // Mark status slide as viewed
  const handleViewStatus = async (statusId: string) => {
    if (!currentUser) return;

    await fetch('/api/status/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statusId,
        userNumber: currentUser.virtualNumber,
      }),
    });
  };

  // Update profile
  const handleUpdateProfile = async (username: string, statusMessage: string) => {
    if (!currentUser) return;

    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        virtualNumber: currentUser.virtualNumber,
        username,
        statusMessage,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setCurrentUser(data.user);
      localStorage.setItem('whats_virtual_user', JSON.stringify(data.user));
    }
  };

  // Send message helper
  const sendMessage = async (
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location',
    payload: {
      text?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: string;
      location?: { latitude: number; longitude: number; address?: string };
    }
  ) => {
    if (!currentUser || !selectedChat) return;

    let messageText = payload.text || '';
    
    // Encrypt text client-side if we are encrypting!
    // Since WhatsVirtual implements E2EE, ALL message bodies are encrypted on the client before transmission!
    // Non-text types also send encrypted captions or captions are encrypted.
    const shouldEncrypt = true;
    let encryptedText = messageText;
    if (shouldEncrypt && messageText) {
      encryptedText = encryptMessage(messageText);
    }

    const payloadBody = {
      chatId: selectedChat.id,
      senderNumber: currentUser.virtualNumber,
      senderName: currentUser.username,
      text: encryptedText,
      encrypted: shouldEncrypt,
      type,
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      location: payload.location,
    };

    // Optimistic local add (temporarily pending)
    const tempId = 'temp_' + Date.now();
    const tempMsg: Message = {
      id: tempId,
      chatId: selectedChat.id,
      senderNumber: currentUser.virtualNumber,
      senderName: currentUser.username,
      text: messageText, // Keep readable locally
      encrypted: false,
      type,
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      location: payload.location,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputMessage('');
    playSoundEffect('outgoing_msg');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
      });

      if (!res.ok) throw new Error('Send failed');
      const data = await res.json();

      // Replace optimistic temporary message with server-confirmed message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...data.message, text: messageText } : m))
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      // Mark as failed/error
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' as any } : m))
      );
    }
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage('text', { text: inputMessage.trim() });
  };

  // Upload attachment and convert to base64
  const handleAttachmentUpload = (type: 'image' | 'document', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAttachmentOpen(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      
      if (type === 'image') {
        sendMessage('image', {
          fileUrl: base64Data,
          text: `Enviou uma foto: ${file.name}`,
        });
      } else {
        sendMessage('document', {
          fileUrl: base64Data,
          fileName: file.name,
          fileSize: sizeStr,
          text: `Compartilhou o arquivo: ${file.name}`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Send Geolocation map card
  const handleSendLocation = () => {
    setIsAttachmentOpen(false);
    
    if (!navigator.geolocation) {
      alert('Seu navegador não suporta geolocalização.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        sendMessage('location', {
          location: {
            latitude,
            longitude,
            address: 'Ponto Geográfico WhatsVirtual',
          },
          text: `Compartilhou localização geográfica: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`,
        });
      },
      (err) => {
        // Fallback simulated center if blocked (e.g., in iframe sometimes geolocation is blocked)
        console.warn('Geolocation blocked, using mock center coordinate:', err);
        sendMessage('location', {
          location: {
            latitude: -23.5505,
            longitude: -46.6333,
            address: 'Praça da Sé, São Paulo, SP (Simulado)',
          },
          text: 'Compartilhou localização (Simulada)',
        });
      }
    );
  };

  // Voice Recording (Envio de áudios)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendMessage('audio', {
            fileUrl: base64Audio,
            text: 'Enviou uma mensagem de voz 🎤',
          });
        };
        reader.readAsDataURL(audioBlob);

        // stop mic track
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Não foi possível acessar seu microfone para gravação de áudio.');
    }
  };

  const stopRecording = (cancel = false) => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }
    
    setIsRecording(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      if (cancel) {
        // override onstop to not send
        mediaRecorderRef.current.onstop = () => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
          }
        };
      }
      mediaRecorderRef.current.stop();
    }
  };

  // Calls Actions
  const initiateCall = async (type: 'voice' | 'video') => {
    if (!currentUser || !selectedChat) return;

    // Get contact profile
    const otherNumber = selectedChat.participants.find((p) => p !== currentUser.virtualNumber);
    if (!otherNumber) return;

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerNumber: currentUser.virtualNumber,
          callerName: currentUser.username,
          receiverNumber: otherNumber,
          receiverName: selectedChat.name,
          type,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveCall(data.call);
      }
    } catch (e) {
      console.error('Call initialization failed', e);
    }
  };

  const acceptCall = async () => {
    if (!activeCall) return;

    await fetch(`/api/calls/${activeCall.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'connected' }),
    });

    fetchSyncData();
  };

  const declineCall = async () => {
    if (!activeCall) return;

    await fetch(`/api/calls/${activeCall.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'declined' }),
    });

    setActiveCall(null);
    fetchSyncData();
  };

  const endCall = async (durationSecs: number) => {
    if (!activeCall) return;

    await fetch(`/api/calls/${activeCall.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ended', duration: durationSecs }),
    });

    setActiveCall(null);
    fetchSyncData();
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen bg-[#fdfdfd] text-[#1c1c1c] font-sans overflow-hidden">
      {/* 1. LEFT PANEL / SIDEBAR */}
      <div className={`w-full md:w-96 flex flex-col border-r border-[#ececec] bg-[#f8f9fa] h-full ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Left Sidebar Header */}
        <div className="p-4 bg-white flex justify-between items-center border-b border-[#ececec]">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsProfileModal(true)} className="relative hover:opacity-85 transition cursor-pointer">
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-10 h-10 rounded-full border-2 border-[#005c4b] bg-[#f0f2f5]"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-white rounded-full"></span>
            </button>
            <div>
              <h3 className="font-extrabold text-sm truncate max-w-[140px] text-[#1c1c1c]">{currentUser.username}</h3>
              <span className="text-[10px] font-mono text-[#005c4b] font-semibold">{currentUser.virtualNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewChatModal(true)}
              className="p-2 text-[#54656f] hover:text-[#1c1c1c] rounded-full bg-[#f0f2f5] hover:bg-slate-200 transition cursor-pointer"
              title="Nova Conversa"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-red-500 hover:text-red-600 rounded-full bg-red-50 hover:bg-red-100 transition cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Buttons Selector (Chats, Status, Chamadas) */}
        <div className="flex bg-[#f0f2f5] p-1 border-b border-[#ececec] text-xs">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'chats' ? 'bg-white text-[#005c4b] shadow-sm' : 'text-[#54656f] hover:text-[#1c1c1c]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Conversas
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'status' ? 'bg-white text-[#005c4b] shadow-sm' : 'text-[#54656f] hover:text-[#1c1c1c]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Status
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`flex-1 py-2 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'calls' ? 'bg-white text-[#005c4b] shadow-sm' : 'text-[#54656f] hover:text-[#1c1c1c]'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Chamadas
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto bg-white">
          {activeTab === 'chats' && (
            <div className="flex flex-col h-full bg-white">
              {/* Search Bar */}
              <div className="p-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#54656f]">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar conversa..."
                    className="w-full bg-[#f0f2f5] border border-[#ececec] rounded-xl py-2.5 pl-9 pr-4 text-xs text-[#1c1c1c] placeholder-slate-400 outline-none focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] transition"
                  />
                </div>
              </div>

              {/* Chats List */}
              <div className="flex-1 overflow-y-auto space-y-1 px-2">
                {filteredChats.map((chat) => {
                  const isSelected = selectedChat?.id === chat.id;
                  const decryptedLastMsg = chat.lastMessage?.encrypted
                    ? decryptMessage(chat.lastMessage.text)
                    : chat.lastMessage?.text;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                        isSelected ? 'bg-[#f0f2f5] text-[#1c1c1c]' : 'hover:bg-[#f8f9fa] text-[#54656f]'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={chat.avatar}
                          alt={chat.name}
                          className="w-11 h-11 rounded-full border border-[#ececec] bg-[#f0f2f5] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-xs truncate text-[#1c1c1c]">{chat.name}</h4>
                          <p className="text-[10px] text-[#54656f] truncate mt-0.5">
                            {decryptedLastMsg || 'Nenhuma mensagem recente'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[9px] text-[#54656f] font-mono">
                          {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : ''}
                        </span>
                        {chat.unreadCount && chat.unreadCount > 0 ? (
                          <span className="w-4 h-4 rounded-full bg-[#005c4b] text-white font-bold text-[9px] flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {filteredChats.length === 0 && (
                  <div className="text-center text-xs text-[#54656f] pt-8">
                    Nenhuma conversa encontrada. <br />
                    Clique no botão (+) acima para começar!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <StatusViewer
              statuses={statuses}
              currentUser={currentUser}
              onPostStatus={handlePostStatus}
              onViewStatus={handleViewStatus}
            />
          )}

          {activeTab === 'calls' && (
            <div className="p-4 space-y-3 bg-white">
              <h3 className="text-sm font-black text-[#54656f] uppercase tracking-wider mb-2">
                Histórico de Chamadas
              </h3>
              <div className="space-y-2">
                {callsHistory.map((call) => {
                  const isIncomingCall = call.receiverNumber === currentUser.virtualNumber;
                  const contactName = isIncomingCall ? call.callerName : call.receiverName;
                  const contactNum = isIncomingCall ? call.callerNumber : call.receiverNumber;

                  return (
                    <div
                      key={call.id}
                      className="p-3 bg-[#f8f9fa] border border-[#ececec] rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#005c4b]/5 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[#005c4b]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#1c1c1c]">{contactName}</h4>
                          <span className="text-[9px] text-[#54656f] font-mono block mt-0.5">
                            {call.type === 'video' ? '🎥 Chamada de Vídeo' : '📞 Chamada de Voz'} •{' '}
                            {new Date(call.timestamp).toLocaleString([], {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {call.status === 'connected' || call.status === 'ended' ? (
                          <span className="text-[10px] text-[#005c4b] font-bold font-mono">
                            {Math.floor(call.duration / 60)}m {call.duration % 60}s
                          </span>
                        ) : call.status === 'declined' ? (
                          <span className="text-[9px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            Recusada
                          </span>
                        ) : (
                          <span className="text-[9px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded animate-pulse">
                            Não Atendida
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {callsHistory.length === 0 && (
                  <div className="text-center text-xs text-[#54656f] pt-8">
                    Nenhuma chamada realizada ou recebida ainda.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN CHAT PANEL WINDOW */}
      <div className={`flex-1 flex flex-col h-full bg-[#efeae2] ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat ? (
          /* ACTIVE CONVERSATION */
          <div className="flex flex-col h-full relative">
            
            {/* Chat Window Header */}
            <div className="p-4 bg-[#f0f2f5] flex items-center justify-between border-b border-[#ececec]">
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="p-1 text-[#54656f] hover:text-[#1c1c1c] bg-[#ececec] rounded-full md:hidden mr-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <img
                  src={selectedChat.avatar}
                  alt={selectedChat.name}
                  className="w-10 h-10 rounded-full border border-[#ececec] bg-[#f0f2f5] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-sm truncate text-[#1c1c1c]">{selectedChat.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-[#005c4b] font-semibold font-mono mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></span>
                    🔒 WhatsVirtual E2EE Seguro
                  </div>
                </div>
              </div>

              {/* Call Buttons & Options */}
              <div className="flex items-center gap-2">
                {selectedChat.type === 'individual' && (
                  <>
                    <button
                      onClick={() => initiateCall('voice')}
                      className="p-2 text-[#005c4b] hover:text-[#004a3c] rounded-xl bg-white border border-[#ececec] hover:shadow-sm transition cursor-pointer"
                      title="Chamada de Voz"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => initiateCall('video')}
                      className="p-2 text-[#005c4b] hover:text-[#004a3c] rounded-xl bg-white border border-[#ececec] hover:shadow-sm transition cursor-pointer"
                      title="Chamada de Vídeo"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* E2EE Payload Switcher Visualizer */}
                <div className="flex items-center gap-1.5 bg-white p-1.5 px-2.5 rounded-xl border border-[#ececec]">
                  <input
                    type="checkbox"
                    id="e2ee-toggle"
                    checked={showRawPayload}
                    onChange={(e) => setShowRawPayload(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#005c4b] rounded cursor-pointer"
                  />
                  <label htmlFor="e2ee-toggle" className="text-[9px] text-[#54656f] cursor-pointer font-bold uppercase select-none">
                    Raw Payload (Server View)
                  </label>
                </div>
              </div>
            </div>

            {/* Chat Body (Messages list with WhatsApp background pattern) */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 relative"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,92,75,0.04) 1px, transparent 0)`,
                backgroundSize: '24px 24px',
              }}
            >
              <div className="bg-white/85 border border-[#ececec] rounded-2xl p-3.5 text-center text-[10px] text-[#54656f] max-w-sm mx-auto space-y-1.5 shadow-sm">
                <span className="font-bold text-[#005c4b] block">🔒 Criptografado de Ponta a Ponta</span>
                <span>As mensagens e chamadas nesta conversa são privadas e protegidas por criptografia do lado do cliente. Nem mesmo nossos servidores WhatsVirtual podem lê-las.</span>
              </div>

              {messages.map((m) => {
                const isMe = m.senderNumber === currentUser.virtualNumber;
                
                // Show raw encrypted string if toggled, otherwise decrypt
                const isEncrypted = m.encrypted;
                const displayText = showRawPayload
                  ? m.text // Show raw e2ee::... string
                  : isEncrypted
                  ? decryptMessage(m.text)
                  : m.text;

                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 shadow-sm relative group ${
                        isMe
                          ? 'bg-[#d9fdd3] text-[#1c1c1c] rounded-tr-none border border-[#c1f3b3]'
                          : 'bg-white text-[#1c1c1c] rounded-tl-none border border-[#ececec]'
                      }`}
                    >
                      {/* Sender metadata for groups */}
                      {!isMe && selectedChat.type === 'group' && (
                        <span className="block text-[10px] font-bold text-[#005c4b] font-mono mb-1">
                          {m.senderName} ({m.senderNumber})
                        </span>
                      )}

                      {/* Decrypted / Raw payload Indicator badge */}
                      {isEncrypted && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mb-1.5 select-none ${
                            showRawPayload
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : 'bg-[#e1f3fc] text-[#027eb5] border border-[#b3e0f2]'
                          }`}
                        >
                          {showRawPayload ? 'Raw Server (🔒 Encrypted)' : 'Client Decrypted (🔓)'}
                        </span>
                      )}

                      {/* Content rendering based on type */}
                      {m.type === 'text' && (
                        <p className="text-xs whitespace-pre-wrap leading-relaxed break-words">
                          {displayText}
                        </p>
                      )}

                      {m.type === 'image' && (
                        <div className="space-y-2">
                          <img
                            src={m.fileUrl}
                            alt="Media"
                            className="rounded-xl max-h-60 object-cover w-full cursor-pointer border border-[#ececec]"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-xs italic text-[#54656f] break-all">{displayText}</p>
                        </div>
                      )}

                      {m.type === 'document' && (
                        <div className="flex items-center gap-3 bg-black/5 p-2.5 rounded-xl border border-black/5">
                          <FileText className="w-8 h-8 text-[#005c4b] shrink-0" />
                          <div className="overflow-hidden">
                            <span className="block text-xs font-bold truncate text-[#1c1c1c]">{m.fileName}</span>
                            <span className="block text-[10px] text-[#54656f] font-mono mt-0.5">
                              {m.fileSize || 'Desconhecido'}
                            </span>
                          </div>
                          <a
                            href={m.fileUrl}
                            download={m.fileName}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-xs text-[#1c1c1c] font-bold rounded-lg ml-auto shrink-0 transition"
                          >
                            Baixar
                          </a>
                        </div>
                      )}

                      {m.type === 'location' && m.location && (
                        <div className="space-y-2">
                          <div className="bg-black/5 border border-black/5 p-2 rounded-xl flex items-center gap-2.5">
                            <MapPin className="w-5 h-5 text-[#005c4b] animate-bounce" />
                            <div>
                              <span className="block text-xs font-bold text-[#1c1c1c]">Localização compartilhada</span>
                              <span className="block text-[9px] text-[#54656f] font-mono">
                                Lat: {m.location.latitude.toFixed(4)}, Lng:{' '}
                                {m.location.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>
                          {/* Map container mockup */}
                          <div className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            <div className="absolute w-4 h-4 rounded-full bg-[#005c4b]/20 border-2 border-[#005c4b] flex items-center justify-center animate-ping"></div>
                            <div className="absolute w-2.5 h-2.5 rounded-full bg-[#005c4b] border border-white"></div>
                            <span className="absolute bottom-1.5 inset-x-2 text-[9px] font-bold bg-[#1c1c1c]/80 text-white text-center py-1 rounded backdrop-blur-sm truncate">
                              {m.location.address || 'São Paulo, Brasil'}
                            </span>
                          </div>
                        </div>
                      )}

                      {m.type === 'audio' && m.fileUrl && (
                        /* Beautiful functional HTML5 audio player */
                        <div className="flex items-center gap-3 min-w-[200px] bg-black/5 p-2 rounded-xl border border-black/5">
                          <div className="w-8 h-8 rounded-full bg-[#005c4b]/10 border border-[#005c4b]/20 flex items-center justify-center text-[#005c4b]">
                            <Play className="w-4 h-4 fill-[#005c4b]" />
                          </div>
                          <audio controls className="w-full max-w-[150px] h-8 accent-[#005c4b]" src={m.fileUrl} />
                        </div>
                      )}

                      {/* Timestamp & Status Icon */}
                      <div className="flex justify-end items-center gap-1 mt-1 text-[8px] text-[#54656f] font-mono">
                        <span>{formatTime(m.timestamp)}</span>
                        {isMe && (
                          <span className={m.status === 'read' ? 'text-[#53bdeb] font-bold' : 'text-slate-400'}>
                            {m.status === 'read' ? '✓✓' : m.status === 'delivered' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input area */}
            <div className="p-3 bg-[#f0f2f5] border-t border-[#ececec] relative z-10">
              
              {/* Attachment Popup menu */}
              <AnimatePresence>
                {isAttachmentOpen && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="absolute bottom-20 left-4 bg-white border border-[#ececec] p-3 rounded-2xl shadow-xl flex flex-col gap-2 z-20 w-44"
                  >
                    <label className="flex items-center gap-2.5 p-2 hover:bg-[#f0f2f5] rounded-xl cursor-pointer text-xs text-[#1c1c1c] font-semibold transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAttachmentUpload('image', e)}
                        className="hidden"
                      />
                      <ImageIcon className="w-4 h-4 text-[#005c4b]" />
                      Enviar Imagem
                    </label>

                    <label className="flex items-center gap-2.5 p-2 hover:bg-[#f0f2f5] rounded-xl cursor-pointer text-xs text-[#1c1c1c] font-semibold transition">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={(e) => handleAttachmentUpload('document', e)}
                        className="hidden"
                      />
                      <FileText className="w-4 h-4 text-teal-600" />
                      Enviar Documento
                    </label>

                    <button
                      onClick={handleSendLocation}
                      className="flex items-center gap-2.5 p-2 hover:bg-[#f0f2f5] rounded-xl text-left text-xs text-[#1c1c1c] font-semibold transition w-full cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-rose-500" />
                      Enviar Localização
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${
                    isAttachmentOpen ? 'bg-white text-[#005c4b] shadow-sm' : 'text-[#54656f] hover:text-[#1c1c1c]'
                  }`}
                  title="Anexos"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Voice Recorder button (Click / hold) */}
                {!inputMessage && (
                  <button
                    onClick={isRecording ? () => stopRecording(false) : startRecording}
                    className={`p-2.5 rounded-xl transition cursor-pointer ${
                      isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-[#54656f] hover:text-[#1c1c1c]'
                    }`}
                    title={isRecording ? 'Parar Gravação' : 'Gravar Áudio'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}

                {/* Main Text input */}
                {isRecording ? (
                  /* Audio recording active display */
                  <div className="flex-1 bg-red-50 border border-red-100 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-red-500">
                    <span className="flex items-center gap-2 font-bold font-mono">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      GRAVANDO DE VOZ: {recordingSeconds}s
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => stopRecording(true)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#54656f] rounded-lg text-[10px] font-bold border border-[#ececec] cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => stopRecording(false)}
                        className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Enviar Áudio
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard text input */
                  <form onSubmit={handleSendTextMessage} className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Digite uma mensagem segura..."
                      className="flex-1 bg-white border border-[#ececec] rounded-xl py-2.5 px-4 text-xs text-[#1c1c1c] placeholder-slate-400 outline-none focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] transition"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="p-2.5 bg-[#005c4b] hover:bg-[#004a3c] disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl text-white shadow-md transition shrink-0 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* NO CONVERSATION ACTIVE CHOSEN */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white">
            <div className="p-4 bg-[#005c4b]/5 border border-[#005c4b]/10 rounded-3xl inline-flex justify-center items-center shadow-md animate-bounce">
              <Shield className="w-12 h-12 text-[#005c4b]" />
            </div>
            
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-extrabold text-[#1c1c1c]">WhatsVirtual Sem Chip Ativo</h2>
              <p className="text-xs text-[#54656f] leading-relaxed">
                Cada cadastro recebe automaticamente um número virtual permanente. Não coletamos chips de celulares físicos nem enviamos SMS. Comece uma conversa criptografada ou teste com nossos contatos assistentes de IA!
              </p>
            </div>

            <button
              onClick={() => setIsNewChatModal(true)}
              className="py-2.5 px-6 bg-[#005c4b] hover:bg-[#004a3c] rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md shadow-[#005c4b]/10 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Nova Conversa
            </button>
          </div>
        )}
      </div>

      {/* FULLSCREEN ACTIVE OR INCOMING CALL WINDOW */}
      <AnimatePresence>
        {activeCall && (
          <CallScreen
            call={activeCall}
            userNumber={currentUser.virtualNumber}
            onDecline={declineCall}
            onAccept={acceptCall}
            onEnd={endCall}
          />
        )}
      </AnimatePresence>

      {/* NEW CHAT MODAL */}
      <AnimatePresence>
        {isNewChatModal && (
          <NewChatModal
            onClose={() => setIsNewChatModal(false)}
            onStartChat={handleStartChat}
            onCreateGroup={handleCreateGroup}
          />
        )}
      </AnimatePresence>

      {/* PROFILE UPDATE MODAL */}
      <AnimatePresence>
        {isProfileModal && (
          <ProfileModal
            user={currentUser}
            onClose={() => setIsProfileModal(false)}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
