/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX, User } from 'lucide-react';
import { CallSession } from '../types';

interface CallScreenProps {
  call: CallSession;
  userNumber: string;
  onDecline: () => void;
  onAccept: () => void;
  onEnd: (duration: number) => void;
}

export default function CallScreen({
  call,
  userNumber,
  onDecline,
  onAccept,
  onEnd,
}: CallScreenProps) {
  const isIncoming = call.receiverNumber === userNumber && call.status === 'ringing';
  const isOutgoing = call.callerNumber === userNumber && call.status === 'ringing';
  const isConnected = call.status === 'connected';

  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(call.type === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<any>(null);

  // Duration timer
  useEffect(() => {
    let timer: any;
    if (isConnected) {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected]);

  // Audio Context Ringtone Generation (No files needed!)
  useEffect(() => {
    if (call.status === 'ringing') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;

        const playRingtoneBeep = () => {
          if (!audioCtx || audioCtx.state === 'closed') return;
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(isIncoming ? 440 : 400, audioCtx.currentTime); // Caller has slightly different tone

          gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          osc.start();
          osc.stop(audioCtx.currentTime + 1.5);
        };

        // Ring every 2.5 seconds
        playRingtoneBeep();
        ringtoneIntervalRef.current = setInterval(playRingtoneBeep, 2500);
      } catch (err) {
        console.warn('Failed to start ringtone audio context:', err);
      }
    } else {
      // Clean up ringtone
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
      }
      if (audioCtxRef.current) {
        // Play connect beep if changed to connected
        if (isConnected) {
          try {
            const osc = audioCtxRef.current.createOscillator();
            const gainNode = audioCtxRef.current.createGain();
            osc.frequency.setValueAtTime(600, audioCtxRef.current.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.3);
            osc.connect(gainNode);
            gainNode.connect(audioCtxRef.current.destination);
            osc.start();
            osc.stop(audioCtxRef.current.currentTime + 0.3);
          } catch (e) {}
        }
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    }

    return () => {
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [call.status, isIncoming, isConnected]);

  // Capture local camera stream for Video Call
  useEffect(() => {
    if (isVideoOn && (isConnected || isOutgoing || isIncoming)) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera permission denied or unavailable:', err);
          setIsVideoOn(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn, isConnected, isOutgoing, isIncoming]);

  const handleEndCall = () => {
    // Play end sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      setTimeout(() => audioCtx.close(), 500);
    } catch (e) {}

    onEnd(duration);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const contactName = call.callerNumber === userNumber ? call.receiverName : call.callerName;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#1c1c1c] text-white flex flex-col items-center justify-between p-8 overflow-hidden font-sans select-none"
    >
      {/* Video Call Background Stream */}
      {isVideoOn && streamRef.current && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 scale-x-[-1]"
        />
      )}

      {/* Header Info */}
      <div className="z-10 text-center space-y-3 mt-12 w-full max-w-sm">
        <div className="text-xs uppercase tracking-widest text-[#00a884] font-bold bg-white/10 py-1.5 px-4 rounded-full inline-block backdrop-blur-sm border border-white/10">
          Chamada de {call.type === 'video' ? 'Vídeo' : 'Voz'} {call.type === 'video' ? '🎥' : '📞'}
        </div>

        <div className="flex flex-col items-center">
          {!isVideoOn && (
            <div className="w-24 h-24 bg-[#005c4b] rounded-full flex items-center justify-center shadow-2xl border-4 border-[#1c1c1c] mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
          <h2 className="text-2xl font-black tracking-tight">{contactName}</h2>
          <p className="text-sm text-slate-400 font-mono mt-1">
            {call.callerNumber === userNumber ? call.receiverNumber : call.callerNumber}
          </p>
        </div>

        <div className="text-lg font-bold font-mono tracking-wider text-[#00a884]">
          {isConnected ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00a884] animate-ping"></span>
              {formatDuration(duration)}
            </span>
          ) : isOutgoing ? (
            'Chamando...'
          ) : (
            'Chamada Recebida'
          )}
        </div>
      </div>

      {/* Floating Small Video Preview for local user if on video call and connected */}
      {isVideoOn && isConnected && streamRef.current && (
        <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl overflow-hidden border-2 border-[#005c4b] shadow-2xl z-20">
          <video
            ref={(el) => {
              if (el) el.srcObject = streamRef.current;
            }}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>
      )}

      {/* Voice Call Animated wave visualizer */}
      {!isVideoOn && isConnected && (
        <div className="flex justify-center items-center gap-1.5 h-24 z-10">
          {[1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 4, 2, 5].map((val, i) => (
            <motion.div
              key={i}
              className="w-1 bg-[#005c4b] rounded-full"
              animate={{
                height: [16, val * 12, 16],
              }}
              transition={{
                duration: 0.8 + i * 0.05,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Interactive overlay/watermark showing encryption */}
      <div className="z-10 bg-white/5 border border-white/10 backdrop-blur-sm p-3 rounded-2xl flex items-center gap-2 text-xs text-slate-300 max-w-xs text-center mx-auto">
        <span>🔒 Criptografia WhatsVirtual E2EE ativa</span>
      </div>

      {/* Bottom Controls / Actions */}
      <div className="z-10 w-full max-w-sm flex flex-col gap-6 mb-12">
        {isIncoming ? (
          /* Incoming Call Actions: Accept & Decline */
          <div className="flex justify-evenly items-center gap-4">
            <button
              onClick={onDecline}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition cursor-pointer"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <button
              onClick={onAccept}
              className="w-16 h-16 bg-[#00a884] hover:bg-[#005c4b] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition animate-bounce cursor-pointer"
            >
              <Phone className="w-7 h-7 text-white" />
            </button>
          </div>
        ) : (
          /* Outgoing or Connected Controls */
          <div className="space-y-6">
            <div className="flex justify-center items-center gap-6">
              {/* Mute Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
                  isMuted
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-white/10 border-white/10 hover:bg-white/25 text-white cursor-pointer'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle */}
              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
                  !isVideoOn
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-white/10 border-white/10 hover:bg-white/25 text-white cursor-pointer'
                }`}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
                  !isSpeakerOn
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-white/10 border-white/10 hover:bg-white/25 text-white cursor-pointer'
                }`}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleEndCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition cursor-pointer"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
