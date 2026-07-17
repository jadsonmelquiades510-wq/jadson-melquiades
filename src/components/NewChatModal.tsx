/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MessageSquare, Users, PhoneCall, Plus, Search, AlertCircle } from 'lucide-react';

interface NewChatModalProps {
  onClose: () => void;
  onStartChat: (targetNumber: string) => Promise<void>;
  onCreateGroup: (name: string) => Promise<void>;
}

const PRESET_CONTACTS = [
  { name: 'Neymar Jr', number: '+888-101-1111', desc: 'Ousadia e alegria! ⚽📱' },
  { name: 'Suporte Virtual AI', number: '+888-000-0000', desc: 'Assistente oficial do WhatsVirtual 🤖💬' },
  { name: 'Doutor Drauzio (Virtual)', number: '+888-222-3333', desc: 'Simulador de saúde e bem-estar 🩺🍎' },
];

export default function NewChatModal({
  onClose,
  onStartChat,
  onCreateGroup,
}: NewChatModalProps) {
  const [activeTab, setActiveTab] = useState<'individual' | 'group'>('individual');
  const [virtualNumber, setVirtualNumber] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartIndividualChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!virtualNumber.trim()) {
      setError('Insira um número virtual.');
      return;
    }

    // Standardize input format (+888-XXX-XXXX or +888XXXXXXX)
    let formattedNumber = virtualNumber.trim();
    if (!formattedNumber.startsWith('+888')) {
      setError('Os números virtuais do WhatsVirtual começam com +888');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onStartChat(formattedNumber);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Contato não encontrado. Verifique o número.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Insira o nome do grupo.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onCreateGroup(groupName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar grupo.');
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
            <MessageSquare className="w-4 h-4 text-[#005c4b]" />
            Nova Conversa
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#54656f] hover:text-[#1c1c1c] rounded-full bg-slate-200/50 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex bg-[#f0f2f5] p-1 border-b border-[#ececec]">
          <button
            onClick={() => {
              setActiveTab('individual');
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'individual'
                ? 'bg-white text-[#1c1c1c] shadow-sm'
                : 'text-[#54656f] hover:text-[#1c1c1c]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Conversa Privada
          </button>
          <button
            onClick={() => {
              setActiveTab('group');
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'group' 
                ? 'bg-white text-[#1c1c1c] shadow-sm' 
                : 'text-[#54656f] hover:text-[#1c1c1c]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Criar Grupo
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Individual Tab */}
        {activeTab === 'individual' ? (
          <div className="p-5 space-y-4">
            <form onSubmit={handleStartIndividualChat} className="space-y-3">
              <label className="block text-xs font-semibold text-[#54656f]">
                Número Virtual do Contato
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#54656f]">
                  <PhoneCall className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={virtualNumber}
                  onChange={(e) => setVirtualNumber(e.target.value)}
                  placeholder="Ex: +888-101-1111"
                  disabled={loading}
                  className="w-full bg-[#f0f2f5] border border-[#ececec] focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#1c1c1c] placeholder-[#a0a5ab] outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !virtualNumber.trim()}
                className="w-full py-2.5 bg-[#005c4b] hover:bg-[#004a3c] disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-white"
              >
                {loading ? 'Pesquisando...' : 'Iniciar Conversa'}
              </button>
            </form>

            <div className="pt-3 border-t border-[#ececec]">
              <span className="block text-[10px] font-bold text-[#54656f] uppercase tracking-wider mb-2">
                Contatos Disponíveis para Teste
              </span>
              <div className="space-y-2">
                {PRESET_CONTACTS.map((c) => (
                  <div
                    key={c.number}
                    onClick={() => {
                      if (!loading) {
                        setVirtualNumber(c.number);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-[#f8f9fa] hover:bg-[#f0f2f5] border border-[#ececec] cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#1c1c1c] group-hover:text-[#005c4b] transition">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[#54656f] font-mono mt-0.5">{c.number}</div>
                    </div>
                    <span className="text-[9px] text-[#005c4b] font-bold bg-[#005c4b]/5 px-2 py-0.5 rounded border border-[#005c4b]/10 group-hover:bg-[#005c4b] group-hover:text-white transition-all duration-200">
                      Adicionar
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Group Tab */
          <div className="p-5">
            <form onSubmit={handleCreateGroupChat} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#54656f]">Nome do Grupo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#54656f]">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Família WhatsVirtual"
                    disabled={loading}
                    className="w-full bg-[#f0f2f5] border border-[#ececec] focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#1c1c1c] placeholder-[#a0a5ab] outline-none transition"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="w-full py-2.5 bg-[#005c4b] hover:bg-[#004a3c] disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-white"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Criando Grupo...' : 'Criar Novo Grupo'}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
