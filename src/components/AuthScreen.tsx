/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, PhoneCall, CheckCircle, Copy, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginNumber, setLoginNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedUser, setGeneratedUser] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar usuário.');
      }

      setGeneratedUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginNumber.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ virtualNumber: loginNumber, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao recuperar conta.');
      }

      onAuthSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] text-[#1c1c1c] font-sans p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#005c4b]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00a884]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-[#005c4b] rounded-2xl shadow-lg shadow-[#005c4b]/10 mb-3">
            <PhoneCall className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1c1c1c] mb-1">
            Whats<span className="text-[#005c4b]">Virtual</span>
          </h1>
          <p className="text-sm text-[#54656f]">
            Mensageiro moderno com números virtuais e segurança total
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!generatedUser ? (
            <motion.div
              key={isRegister ? 'register' : 'login'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-xl shadow-slate-100"
            >
              {/* Tab Selector */}
              <div className="flex bg-[#f0f2f5] p-1.5 rounded-2xl mb-6 border border-[#ececec]">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                  }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isRegister
                      ? 'bg-white text-[#1c1c1c] shadow-sm font-bold'
                      : 'text-[#54656f] hover:text-[#1c1c1c]'
                  }`}
                >
                  Novo Cadastro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    !isRegister
                      ? 'bg-white text-[#1c1c1c] shadow-sm font-bold'
                      : 'text-[#54656f] hover:text-[#1c1c1c]'
                  }`}
                >
                  Recuperar Conta
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl mb-4 text-center">
                  {error}
                </div>
              )}

              {isRegister ? (
                /* REGISTRATION FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#54656f] uppercase tracking-wider mb-2">
                      Seu Nome ou Apelido
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#54656f]">
                        <User className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ex: Neymar Jr"
                        disabled={loading}
                        className="w-full bg-[#f0f2f5] border border-[#ececec] focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] rounded-xl py-3 pl-11 pr-4 text-[#1c1c1c] placeholder-[#a0a5ab] outline-none transition-all duration-200 text-sm"
                        maxLength={25}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#54656f] uppercase tracking-wider mb-2">
                      Crie uma Senha Segura
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#54656f]">
                        <Lock className="w-5 h-5" />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full bg-[#f0f2f5] border border-[#ececec] focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] rounded-xl py-3 pl-11 pr-4 text-[#1c1c1c] placeholder-[#a0a5ab] outline-none transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-[#54656f] flex items-start gap-2.5 pt-1 bg-[#f0f2f5] p-3 rounded-xl border border-[#ececec]">
                    <ShieldCheck className="w-4 h-4 text-[#005c4b] shrink-0 mt-0.5" />
                    <span>
                      Você <strong>não</strong> precisa de chip de telefone. Nosso sistema gera um número virtual permanente exclusivo que você pode usar para logar em outros aparelhos.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#005c4b] hover:bg-[#004a3c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#005c4b]/10 transition-all duration-200 mt-6 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Gerando Número Virtual...
                      </>
                    ) : (
                      <>
                        Registrar e Gerar Número
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* LOGIN FORM */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#54656f] uppercase tracking-wider mb-2">
                      Seu Número Virtual
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#54656f]">
                        <PhoneCall className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        value={loginNumber}
                        onChange={(e) => setLoginNumber(e.target.value)}
                        placeholder="Ex: +888-123-4567"
                        disabled={loading}
                        className="w-full bg-[#f0f2f5] border border-[#ececec] focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] rounded-xl py-3 pl-11 pr-4 text-[#1c1c1c] placeholder-[#a0a5ab] outline-none transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#54656f] uppercase tracking-wider mb-2">
                      Sua Senha
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#54656f]">
                        <Lock className="w-5 h-5" />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full bg-[#f0f2f5] border border-[#ececec] focus:border-[#005c4b] focus:ring-1 focus:ring-[#005c4b] rounded-xl py-3 pl-11 pr-4 text-[#1c1c1c] placeholder-[#a0a5ab] outline-none transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#005c4b] hover:bg-[#004a3c] disabled:bg-slate-300 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#005c4b]/10 transition-all duration-200 mt-6 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Recuperar Conta e Conversas
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            /* VIRUTAL SIM / CHIP CARD REVEAL */
            <motion.div
              key="chip-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-xl text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#005c4b]/10 rounded-full blur-xl animate-pulse"></div>
                  <CheckCircle className="w-16 h-16 text-[#005c4b] relative z-10" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#1c1c1c] mb-2">Conta Criada!</h2>
                <p className="text-xs text-[#54656f]">
                  Parabéns! Seu chip virtual foi ativado e está pronto para uso.
                </p>
              </div>

              {/* SIM Card Graphic */}
              <div className="bg-gradient-to-br from-[#005c4b] to-[#004a3c] rounded-2xl p-5 text-left text-white shadow-xl relative overflow-hidden border border-emerald-400/20">
                {/* Chip decoration */}
                <div className="absolute top-4 right-4 w-12 h-10 bg-amber-400/80 rounded-lg flex flex-col justify-between p-1 shadow-inner border border-amber-300">
                  <div className="h-0.5 bg-slate-900/10 w-full"></div>
                  <div className="h-0.5 bg-slate-900/10 w-full"></div>
                  <div className="h-0.5 bg-slate-900/10 w-full"></div>
                </div>
                
                {/* Micro SIM shape outline */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 border border-white/5 rounded-full pointer-events-none"></div>

                <div className="space-y-4 relative z-10">
                  <div className="text-[10px] uppercase tracking-widest font-black text-[#d9fdd3]">
                    WhatsVirtual SIM CARD
                  </div>

                  <div>
                    <span className="block text-[10px] text-white/80 uppercase tracking-wider">
                      Número Virtual Atribuído
                    </span>
                    <span className="text-xl font-mono font-bold block mt-0.5 bg-black/20 px-2 py-1 rounded select-all">
                      {generatedUser.virtualNumber}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-2 border-t border-white/10">
                    <div>
                      <span className="block text-[9px] text-white/80 uppercase">Usuário</span>
                      <span className="text-sm font-semibold">{generatedUser.username}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#d9fdd3] bg-black/25 px-2 py-0.5 rounded">
                      STATUS: ATIVO
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedUser.virtualNumber)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#f0f2f5] hover:bg-slate-200 text-[#1c1c1c] rounded-xl text-sm font-semibold transition"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copiado!' : 'Copiar Número Virtual'}
                </button>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-left">
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    ⚠️ <strong>Guarde seu número virtual!</strong> Você precisará dele juntamente com a sua senha caso precise acessar sua conta novamente em outro dispositivo ou aba.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onAuthSuccess(generatedUser)}
                className="w-full bg-[#005c4b] hover:bg-[#004a3c] text-white py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-[#005c4b]/15 transition cursor-pointer"
              >
                Entrar no WhatsVirtual
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
