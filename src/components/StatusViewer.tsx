/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Eye, Plus, ChevronLeft, ChevronRight, Image as ImageIcon, Send } from 'lucide-react';
import { StatusUpdate, UserProfile } from '../types';

interface StatusViewerProps {
  statuses: StatusUpdate[];
  currentUser: UserProfile;
  onPostStatus: (type: 'text' | 'image', content: string, background?: string) => Promise<void>;
  onViewStatus: (statusId: string) => void;
}

const GRADIENTS = [
  'bg-gradient-to-r from-teal-500 to-emerald-600',
  'bg-gradient-to-r from-purple-600 to-pink-500',
  'bg-gradient-to-r from-blue-500 to-indigo-600',
  'bg-gradient-to-r from-orange-400 to-rose-500',
  'bg-gradient-to-r from-slate-800 to-slate-900',
];

export default function StatusViewer({
  statuses,
  currentUser,
  onPostStatus,
  onViewStatus,
}: StatusViewerProps) {
  const [activeUserNumber, setActiveUserNumber] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPostingModal, setIsPostingModal] = useState(false);
  const [postType, setPostType] = useState<'text' | 'image'>('text');
  
  // States for creating status
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Group statuses by user number
  const groupedStatuses: { [key: string]: StatusUpdate[] } = {};
  statuses.forEach((s) => {
    if (!groupedStatuses[s.userNumber]) {
      groupedStatuses[s.userNumber] = [];
    }
    groupedStatuses[s.userNumber].push(s);
  });

  // Sort grouped slides by timestamp
  Object.keys(groupedStatuses).forEach((num) => {
    groupedStatuses[num].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  });

  const activeUserSlides = activeUserNumber ? groupedStatuses[activeUserNumber] : [];
  const activeSlide = activeUserSlides?.[activeSlideIndex];

  // Auto-progress slides
  useEffect(() => {
    let timer: any;
    if (activeUserNumber && activeUserSlides.length > 0) {
      // Mark current slide as viewed
      const currentSlide = activeUserSlides[activeSlideIndex];
      if (currentSlide && !currentSlide.views.includes(currentUser.virtualNumber)) {
        onViewStatus(currentSlide.id);
      }

      timer = setTimeout(() => {
        if (activeSlideIndex < activeUserSlides.length - 1) {
          setActiveSlideIndex((prev) => prev + 1);
        } else {
          // Close viewer
          setActiveUserNumber(null);
          setActiveSlideIndex(0);
        }
      }, 5000); // 5 seconds per slide
    }
    return () => clearTimeout(timer);
  }, [activeUserNumber, activeSlideIndex, activeUserSlides]);

  const handleNextSlide = () => {
    if (activeSlideIndex < activeUserSlides.length - 1) {
      setActiveSlideIndex((prev) => prev + 1);
    } else {
      setActiveUserNumber(null);
      setActiveSlideIndex(0);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
    } else {
      setActiveSlideIndex(0);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = postType === 'text' ? textContent : imageBase64;
    if (!content) return;

    setLoading(true);
    try {
      await onPostStatus(postType, content, postType === 'text' ? selectedGradient : undefined);
      // Reset state
      setTextContent('');
      setImageBase64(null);
      setIsPostingModal(false);
    } catch (err) {
      console.error('Error posting status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[#fdfdfd] border-b border-[#ececec] text-[#1c1c1c] font-sans">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black tracking-tight text-[#1c1c1c]">Status Atualizações</h3>
        <button
          onClick={() => setIsPostingModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005c4b] hover:bg-[#004a3c] rounded-xl text-xs font-bold text-white transition shadow-md shadow-[#005c4b]/10 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Postar Status
        </button>
      </div>

      {/* Slide Thumbnails List */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {/* Current User Post Circle */}
        <div className="flex flex-col items-center shrink-0 cursor-pointer" onClick={() => setIsPostingModal(true)}>
          <div className="relative w-14 h-14 rounded-full border border-dashed border-[#ececec] flex items-center justify-center bg-[#f0f2f5] hover:bg-slate-200 transition">
            <Plus className="w-5 h-5 text-[#005c4b]" />
            <img
              src={currentUser.avatar}
              alt="Seu Perfil"
              className="absolute inset-0 w-full h-full object-cover rounded-full p-0.5 opacity-30 pointer-events-none"
            />
          </div>
          <span className="text-[10px] text-[#54656f] mt-1.5">Meu Status</span>
        </div>

        {/* Grouped statuses of other users */}
        {Object.keys(groupedStatuses).map((num) => {
          const userSlides = groupedStatuses[num];
          const latestSlide = userSlides[userSlides.length - 1];
          const hasUnviewed = userSlides.some((s) => !s.views.includes(currentUser.virtualNumber));

          return (
            <div
              key={num}
              onClick={() => {
                setActiveUserNumber(num);
                setActiveSlideIndex(0);
              }}
              className="flex flex-col items-center shrink-0 cursor-pointer"
            >
              <div
                className={`w-14 h-14 rounded-full p-[2px] ${
                  hasUnviewed
                    ? 'bg-gradient-to-tr from-[#005c4b] to-[#00a884]'
                    : 'bg-[#ececec]'
                }`}
              >
                <img
                  src={latestSlide.userAvatar}
                  alt={latestSlide.username}
                  className="w-full h-full object-cover rounded-full border border-white bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] font-semibold text-[#54656f] mt-1.5 truncate max-w-[64px]">
                {latestSlide.username}
              </span>
            </div>
          );
        })}

        {Object.keys(groupedStatuses).length === 0 && (
          <div className="flex items-center text-xs text-slate-400 h-14 pl-2">
            Nenhuma atualização recente
          </div>
        )}
      </div>

      {/* FULLSCREEN STATUS SLIDE VIEW */}
      <AnimatePresence>
        {activeUserNumber && activeSlide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 font-sans select-none"
          >
            {/* Top Indicator Bars */}
            <div className="absolute top-4 inset-x-4 flex gap-1 z-20">
              {activeUserSlides.map((slide, index) => (
                <div key={slide.id} className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{
                      width:
                        index < activeSlideIndex
                          ? '100%'
                          : index === activeSlideIndex
                          ? '100%'
                          : '0%',
                    }}
                    transition={{
                      duration: index === activeSlideIndex ? 5 : 0,
                      ease: 'linear',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Slide Header */}
            <div className="flex items-center justify-between mt-6 z-10">
              <div className="flex items-center gap-3">
                <img
                  src={activeSlide.userAvatar}
                  alt={activeSlide.username}
                  className="w-10 h-10 rounded-full border border-white/20"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-sm text-white">{activeSlide.username}</h4>
                  <span className="text-[10px] text-white/60 font-mono">
                    {new Date(activeSlide.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveUserNumber(null);
                  setActiveSlideIndex(0);
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center p-4 relative z-0">
              {/* Prev / Next Click Overlays */}
              <button
                onClick={handlePrevSlide}
                className="absolute left-0 inset-y-0 w-1/4 z-10 cursor-left flex items-center pl-2 opacity-0 hover:opacity-100 transition"
              >
                <ChevronLeft className="w-8 h-8 text-white/50" />
              </button>
              <button
                onClick={handleNextSlide}
                className="absolute right-0 inset-y-0 w-1/4 z-10 cursor-right flex items-center pr-2 justify-end opacity-0 hover:opacity-100 transition"
              >
                <ChevronRight className="w-8 h-8 text-white/50" />
              </button>

              {activeSlide.type === 'text' ? (
                /* Text Slide with gradient background */
                <div
                  className={`w-full max-w-sm aspect-[9/16] rounded-3xl ${activeSlide.background} flex items-center justify-center p-8 text-center text-xl font-extrabold shadow-2xl overflow-hidden`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-white">
                    {activeSlide.content}
                  </p>
                </div>
              ) : (
                /* Image Slide */
                <div className="w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center relative">
                  <img
                    src={activeSlide.content}
                    alt="Status Content"
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {/* Footer with Views (if current user posted it) */}
            <div className="flex justify-center items-center gap-1.5 pb-6 text-xs text-white/60 z-10">
              {activeSlide.userNumber === currentUser.virtualNumber ? (
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {activeSlide.views.length}{' '}
                  {activeSlide.views.length === 1 ? 'visualização' : 'visualizações'}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Criptografado E2EE
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POSTING STATUS MODAL */}
      <AnimatePresence>
        {isPostingModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm text-[#1c1c1c]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-[#ececec] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-[#ececec] flex justify-between items-center bg-[#f8f9fa]">
                <h3 className="font-extrabold text-sm text-[#1c1c1c]">Postar Status Atualização</h3>
                <button
                  onClick={() => setIsPostingModal(false)}
                  className="p-1.5 text-[#54656f] hover:text-[#1c1c1c] rounded-full bg-slate-200/50 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selector */}
              <div className="flex bg-[#f0f2f5] p-1 border-b border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setPostType('text')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                    postType === 'text'
                      ? 'bg-white text-[#1c1c1c] shadow-sm'
                      : 'text-[#54656f] hover:text-[#1c1c1c]'
                  }`}
                >
                  Status de Texto
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('image')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                    postType === 'image'
                      ? 'bg-white text-[#1c1c1c] shadow-sm'
                      : 'text-[#54656f] hover:text-[#1c1c1c]'
                  }`}
                >
                  Status de Foto
                </button>
              </div>

              <form onSubmit={handlePostSubmit} className="p-5 space-y-4">
                {postType === 'text' ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#54656f]">
                        Mensagem do Status
                      </label>
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="O que está pensando?"
                        maxLength={150}
                        rows={3}
                        className="w-full bg-[#f0f2f5] border border-[#ececec] rounded-xl p-3 text-[#1c1c1c] placeholder-[#a0a5ab] outline-none focus:border-[#005c4b] resize-none text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#54656f]">
                        Escolha um Fundo
                      </label>
                      <div className="flex gap-2 pb-1 overflow-x-auto">
                        {GRADIENTS.map((grad) => (
                          <button
                            key={grad}
                            type="button"
                            onClick={() => setSelectedGradient(grad)}
                            className={`w-10 h-10 rounded-xl shrink-0 ${grad} border-2 ${
                              selectedGradient === grad ? 'border-[#005c4b]' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {textContent.trim() && (
                      <div className="border border-[#ececec] p-3 rounded-xl bg-[#f8f9fa]">
                        <span className="block text-[10px] font-bold text-[#54656f] mb-2 uppercase">
                          Prévia do Status
                        </span>
                        <div
                          className={`w-full aspect-video rounded-xl ${selectedGradient} flex items-center justify-center p-4 text-center text-xs font-bold text-white`}
                        >
                          <p className="whitespace-pre-wrap">{textContent}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#54656f]">
                        Escolha ou arraste uma foto
                      </label>
                      <div className="relative border-2 border-dashed border-[#ececec] hover:border-slate-300 bg-[#f8f9fa] rounded-2xl aspect-video flex flex-col items-center justify-center p-4 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {imageBase64 ? (
                          <img
                            src={imageBase64}
                            alt="Preview Status"
                            className="w-full h-full object-contain rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-[#54656f] mb-2" />
                            <span className="text-xs text-[#1c1c1c]">Clique para enviar imagem</span>
                            <span className="text-[10px] text-[#54656f] mt-1">PNG, JPG, GIF</span>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading || (postType === 'text' ? !textContent.trim() : !imageBase64)}
                  className="w-full py-3 bg-[#005c4b] hover:bg-[#004a3c] disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-[#005c4b]/15 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Postando...' : 'Postar Status Agora'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
