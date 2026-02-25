import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, ChatSettings } from '../types';
import { cn } from '../lib/utils';
import { playSound } from '../services/soundService';
import { Check, CheckCheck, Battery, Wifi, Signal, Camera, Phone, MoreVertical, ChevronLeft, Plus, Mic, Video } from 'lucide-react';

interface PhonePreviewProps {
  settings: ChatSettings;
  messages: Message[];
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({ 
  settings, 
  messages, 
  isAnimating,
  onAnimationComplete 
}) => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Expose the ref to the parent via a global or just keep it local if we handle recording here
  useEffect(() => {
    if (phoneRef.current) {
      (window as any).phonePreviewRef = phoneRef.current;
    }
  }, []);

  useEffect(() => {
    if (!isAnimating) {
      setVisibleMessages(messages);
      return;
    }

    setVisibleMessages([]);
    let currentIdx = 0;
    
    const showNextMessage = async () => {
      if (currentIdx >= messages.length) {
        onAnimationComplete?.();
        return;
      }

      const msg = messages[currentIdx];
      
      if (msg.sender === 'them') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
        setIsTyping(false);
        
        // Play receive sound
        playSound('https://cdn.pixabay.com/audio/2022/03/10/audio_c3508d674a.mp3', 0.5);
      } else {
        await new Promise(r => setTimeout(r, 600));
        
        // Play send sound
        playSound('https://cdn.pixabay.com/audio/2022/03/15/audio_783d1a0e02.mp3', 0.4);
      }

      setVisibleMessages(prev => [...prev, msg]);
      currentIdx++;
      showNextMessage();
    };

    showNextMessage();
  }, [isAnimating, messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages, isTyping]);

  const isDark = settings.theme === 'dark';

  return (
    <div 
      ref={phoneRef}
      className={cn(
      "relative w-[375px] h-[812px] rounded-[55px] border-[12px] border-[#1a1a1a] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.2)] transition-colors duration-300 flex flex-col",
      isDark ? "bg-[#0B141A]" : ""
    )}
    style={{ backgroundColor: !isDark ? settings.wallpaperColor : undefined }}
    >
      {/* iOS Notch Area */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[#1a1a1a] rounded-b-3xl z-50" />

      {/* iOS Status Bar */}
      <div className={cn(
        "h-11 px-8 pt-2 flex items-center justify-between text-[13px] font-semibold z-40 shrink-0",
        isDark ? "bg-[#202c33] text-white" : "bg-[#f6f6f6] text-black"
      )}>
        <span>{settings.currentTime.split(' ')[0]}</span>
        <div className="flex items-center gap-1.5">
          <Signal size={14} fill="currentColor" />
          <Wifi size={14} fill="currentColor" />
          <div className="relative w-6 h-3 border border-current rounded-[3px] flex items-center px-[1px]">
            <div className="h-full bg-current rounded-[1px]" style={{ width: `${settings.batteryLevel}%` }} />
            <div className="absolute -right-[3px] w-[2px] h-1 bg-current rounded-r-full" />
          </div>
        </div>
      </div>

      {/* iOS WhatsApp Header */}
      <div className={cn(
        "h-14 px-2 flex items-center justify-between border-b z-30 shrink-0",
        isDark ? "bg-[#202c33] border-[#2a3942] text-[#e9edef]" : "bg-[#f6f6f6] border-[#e0e0e0] text-black"
      )}>
        <div className="flex items-center gap-0">
          <button className="flex items-center text-[#007aff] -ml-1">
            <ChevronLeft size={28} strokeWidth={2.5} />
            <span className="text-[17px] -ml-1">Back</span>
          </button>
          
          <div className="flex items-center gap-2 ml-2">
            <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden">
              {settings.contactImage ? (
                <img src={settings.contactImage} alt="Contact" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#dfe5e7] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">?</span>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-bold leading-tight">
                {settings.contactName}
              </span>
              <span className={cn(
                "text-[11px] leading-tight",
                isDark ? "text-[#8696a0]" : "text-[#667781]"
              )}>
                {isTyping ? 'typing...' : settings.contactStatus}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-5 pr-3 text-[#007aff]">
          <Video size={22} strokeWidth={2} />
          <Phone size={20} strokeWidth={2} />
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 scroll-smooth relative"
        style={{ 
          backgroundImage: settings.wallpaper ? `url(${settings.wallpaper})` : 'none',
          backgroundSize: 'cover',
          backgroundColor: !settings.wallpaper && !isDark ? settings.wallpaperColor : undefined
        }}
      >
        {/* Date Header */}
        <div className="flex justify-center my-2">
          <span className={cn(
            "px-2 py-1 rounded-md text-[11px] font-semibold uppercase shadow-sm",
            isDark ? "bg-[#182229] text-[#8696a0]" : "bg-[#d1d7db] text-[#54656f]"
          )}>
            Today
          </span>
        </div>

        <AnimatePresence initial={false}>
          {visibleMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "max-w-[75%] p-2 px-3 rounded-[18px] text-[15px] shadow-sm relative mb-1",
                msg.sender === 'me' 
                  ? "self-end whatsapp-bubble-me rounded-tr-[4px]" 
                  : "self-start whatsapp-bubble-them rounded-tl-[4px]",
                isDark && "shadow-none"
              )}
            >
              {msg.type === 'image' && msg.imageUrl && (
                <img src={msg.imageUrl} alt="Shared" className="rounded-lg mb-1 max-w-full" />
              )}
              <div className="flex flex-col">
                <p className="leading-snug break-words">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 -mb-1 -mr-1 self-end">
                  <span className={cn(
                    "text-[10px] opacity-60 leading-none",
                    isDark ? "text-[#8696a0]" : "text-[#667781]"
                  )}>{msg.timestamp}</span>
                  {msg.sender === 'me' && (
                    <span className="text-[#34b7f1] leading-none">
                      {msg.status === 'read' ? <CheckCheck size={13} /> : <Check size={13} />}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "self-start whatsapp-bubble-them rounded-[18px] rounded-tl-[4px] p-2 px-4 shadow-sm flex gap-1 items-center"
            )}
          >
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </motion.div>
        )}
      </div>

      {/* iOS WhatsApp Input Area */}
      <div className={cn(
        "h-[90px] px-2 pt-2 pb-8 flex items-center gap-2",
        isDark ? "bg-[#0B141A]" : "bg-[#f6f6f6]"
      )}>
        <button className="text-[#007aff] p-1">
          <Plus size={28} />
        </button>
        
        <div className={cn(
          "flex-1 h-9 rounded-full flex items-center px-3 border",
          isDark ? "bg-[#2a3942] border-[#2a3942] text-white" : "bg-white border-[#e0e0e0] text-black"
        )}>
          <span className="flex-1 text-[15px] opacity-40">Type a message</span>
          <div className="flex gap-3 text-[#007aff]">
            {/* iOS style input icons */}
          </div>
        </div>
        
        <div className="flex items-center gap-4 px-1 text-[#007aff]">
          <Camera size={24} />
          <Mic size={24} />
        </div>
      </div>

      {/* iOS Home Indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-400/50 rounded-full z-50" />
    </div>
  );
};
