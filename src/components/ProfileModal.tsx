/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, User, MessageCircle, Save, PhoneCall, Check } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateProfile: (username: string, statusMessage: string, avatar?: string) => Promise<void>;
}

export default function ProfileModal({ user, onClose, onUpdateProfile }: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [statusMessage, setStatusMessage] = useState(user.statusMessage);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !statusMessage.trim()) return;

    setLoading(true);
    setSuccess(false);

    try {
      await onUpdateProfile(username, statusMessage);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm font-sans text-[#1c1c1c]">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-[#ececec] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#ececec] flex justify-between items-center bg-[#f8f9fa]">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-[#005c4b]" />
            Meu Perfil Virtual
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#54656f] hover:text-[#1c1c1c] rounded-full bg-slate-200/50 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex flex-col items-center space-y-3 pb-3 border-b border-[#ececec]">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-20 h-20 rounded-full border-2 border-[#005c4b] bg-[#f0f2f5] shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            
            <div className="text-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#005c4b]">
                Seu Chip Virtual
              </span>
              <div className="text-sm font-mono font-bold text-[#1c1c1c] bg-[#f0f2f5] px-3 py-1 rounded-xl mt-1 border border-[#ececec]">
                {user.virtualNumber}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Username field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#54656f]">Nome de Exibição</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#54656f]">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={25}
                  className="w-full bg-[#f0f2f5] border border-[#ececec] focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#1c1c1c] placeholder-slate-400 outline-none transition"
                />
              </div>
            </div>

            {/* Status Message field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#54656f]">Recado / Status</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#54656f]">
                  <MessageCircle className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  maxLength={60}
                  className="w-full bg-[#f0f2f5] border border-[#ececec] focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#1c1c1c] placeholder-slate-400 outline-none transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              success
                ? 'bg-[#00a884] text-white shadow-lg'
                : 'bg-[#005c4b] hover:bg-[#004a3c] text-white'
            }`}
          >
            {loading ? (
              'Salvando alterações...'
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Perfil Atualizado!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
