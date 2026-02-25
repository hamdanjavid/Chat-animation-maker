import React, { useState, useCallback } from 'react';
import { Message, MessageSender, ChatSettings } from '../types';
import { Plus, Trash2, User, Settings, Image as ImageIcon, Sparkles, Play, RotateCcw, Download, Upload, Video as VideoIcon, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateChatConversation } from '../services/geminiService';
import { useDropzone } from 'react-dropzone';
import * as htmlToImage from 'html-to-image';
import { getAudioStream, getAudioContext } from '../services/soundService';

interface ChatEditorProps {
  settings: ChatSettings;
  setSettings: (s: ChatSettings) => void;
  messages: Message[];
  setMessages: (m: Message[]) => void;
  onPlay: () => void;
  isAnimating: boolean;
}

export const ChatEditor: React.FC<ChatEditorProps> = ({
  settings,
  setSettings,
  messages,
  setMessages,
  onPlay,
  isAnimating
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'settings'>('messages');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const onDropContact = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSettings({ ...settings, contactImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }, [settings, setSettings]);

  const onDropWallpaper = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSettings({ ...settings, wallpaper: reader.result as string, wallpaperColor: '' });
      };
      reader.readAsDataURL(file);
    }
  }, [settings, setSettings]);

  const { getRootProps: getContactProps, getInputProps: getContactInputProps } = useDropzone({ 
    onDrop: onDropContact,
    multiple: false
  } as any);

  const { getRootProps: getWallpaperProps, getInputProps: getWallpaperInputProps } = useDropzone({ 
    onDrop: onDropWallpaper,
    multiple: false
  } as any);

  const addMessage = () => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'me',
      text: 'New message',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      type: 'text'
    };
    setMessages([...messages, newMessage]);
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(messages.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    const generated = await generateChatConversation(aiPrompt);
    if (generated && generated.length > 0) {
      const formatted = generated.map((m: any) => ({
        ...m,
        id: Math.random().toString(36).substr(2, 9)
      }));
      setMessages(formatted);
    }
    setIsGenerating(false);
  };

  const handleExportVideo = async () => {
    const element = (window as any).phonePreviewRef;
    if (!element) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // 1080p Resolution (maintaining aspect ratio 375:812)
      const targetWidth = 1080;
      const targetHeight = Math.round(1080 * (812 / 375)); // ~2338

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Check for MP4 support, fallback to WebM
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') 
        ? 'video/mp4;codecs=avc1' 
        : 'video/webm;codecs=vp9';
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';

      const videoStream = canvas.captureStream(30);
      const { mediaStreamDestination } = getAudioContext();
      const audioStream = mediaStreamDestination?.stream;
      
      const tracks = [...videoStream.getVideoTracks()];
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        tracks.push(...audioStream.getAudioTracks());
      }
      
      const combinedStream = new MediaStream(tracks);
      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whatsapp-chat-${Date.now()}.${extension}`;
        a.click();
        setIsExporting(false);
      };

      recorder.start();

      // Trigger the animation
      onPlay();

      // We'll capture frames for the duration of the animation
      const duration = messages.length * 3000 + 2000; // More generous duration
      const startTime = Date.now();
      
      let isRecording = true;
      
      const recordLoop = async () => {
        while (isRecording) {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          setExportProgress(Math.round(progress * 100));

          try {
            // Use toCanvas for potentially better performance
            const tempCanvas = await htmlToImage.toCanvas(element, {
              width: 375,
              height: 812,
              pixelRatio: targetWidth / 375,
              cacheBust: true,
              skipFonts: false,
            });

            ctx.clearRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
          } catch (e) {
            console.warn("Frame capture failed, skipping", e);
          }

          if (progress >= 1) {
            isRecording = false;
            setTimeout(() => recorder.stop(), 500); // Small buffer at the end
          } else {
            // Reduced delay to try and get more frames
            await new Promise(r => setTimeout(r, 16)); 
          }
        }
      };

      recordLoop();
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full max-w-md shadow-xl z-20">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('messages')}
          className={cn(
            "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all",
            activeTab === 'messages' ? "text-[#128C7E] border-b-2 border-[#128C7E] bg-emerald-50/30" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Play size={18} />
          MESSAGES
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all",
            activeTab === 'settings' ? "text-[#128C7E] border-b-2 border-[#128C7E] bg-emerald-50/30" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Settings size={18} />
          SETTINGS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        {activeTab === 'messages' ? (
          <>
            {/* AI Generator */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Sparkles size={18} className="text-emerald-500" />
                AI Conversation Magic
              </div>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Describe the conversation vibe..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm"
                />
                <button
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="w-full bg-[#128C7E] text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-[#075E54] disabled:opacity-50 transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  {isGenerating ? <RotateCcw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {isGenerating ? 'Generating...' : 'Generate Conversation'}
                </button>
              </div>
            </div>

            {/* Message List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Chat History</h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {messages.length} Messages
                </span>
              </div>
              
              {messages.map((msg, idx) => (
                <div key={msg.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 group hover:border-emerald-200 transition-colors relative">
                  <div className="flex items-center justify-between">
                    <div className="flex p-1 bg-gray-200 rounded-lg gap-1">
                      <button
                        onClick={() => updateMessage(msg.id, { sender: 'me' })}
                        className={cn(
                          "px-3 py-1.5 text-[10px] rounded-md font-black uppercase tracking-wider transition-all",
                          msg.sender === 'me' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Me
                      </button>
                      <button
                        onClick={() => updateMessage(msg.id, { sender: 'them' })}
                        className={cn(
                          "px-3 py-1.5 text-[10px] rounded-md font-black uppercase tracking-wider transition-all",
                          msg.sender === 'them' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Them
                      </button>
                    </div>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    value={msg.text}
                    onChange={(e) => updateMessage(msg.id, { text: e.target.value })}
                    className="w-full p-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
                    rows={2}
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Time</label>
                      <input
                        type="text"
                        value={msg.timestamp}
                        onChange={(e) => updateMessage(msg.id, { timestamp: e.target.value })}
                        className="w-24 px-2 py-1.5 text-[11px] font-medium border border-gray-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addMessage}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} />
                Add New Message
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="space-y-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Receiver Profile</h3>
              
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                    {settings.contactImage ? (
                      <img src={settings.contactImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                  <div {...getContactProps()} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                    <input {...getContactInputProps()} />
                    <Upload className="text-white" size={24} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-700">Click to upload photo</p>
                  <p className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Contact Name</label>
                  <input
                    type="text"
                    value={settings.contactName}
                    onChange={(e) => setSettings({ ...settings, contactName: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Status Message</label>
                  <input
                    type="text"
                    value={settings.contactStatus}
                    onChange={(e) => setSettings({ ...settings, contactStatus: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Interface Theme</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-sm font-bold flex flex-col items-center gap-2 transition-all",
                    settings.theme === 'light' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-100" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm" />
                  Light
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-sm font-bold flex flex-col items-center gap-2 transition-all",
                    settings.theme === 'dark' ? "bg-gray-900 border-gray-700 text-white shadow-md shadow-black/20" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 shadow-sm" />
                  Dark
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Environment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Status Bar Time</label>
                  <input
                    type="text"
                    value={settings.currentTime}
                    onChange={(e) => setSettings({ ...settings, currentTime: e.target.value })}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="e.g. 10:15 AM"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Battery Level ({settings.batteryLevel}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.batteryLevel}
                    onChange={(e) => setSettings({ ...settings, batteryLevel: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Wallpaper Presets</label>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[
                      { name: 'Default', color: '#efe7de' },
                      { name: 'Teal', color: '#7acba5' },
                      { name: 'Blue', color: '#7eb6d9' },
                      { name: 'Purple', color: '#b3a7d3' },
                      { name: 'Pink', color: '#e6a4b4' },
                    ].map((wp) => (
                      <button
                        key={wp.name}
                        onClick={() => setSettings({ ...settings, wallpaper: '', wallpaperColor: wp.color })}
                        className={cn(
                          "w-full aspect-square rounded-lg border shadow-sm transition-transform active:scale-90",
                          settings.wallpaperColor === wp.color && !settings.wallpaper ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-gray-200"
                        )}
                        style={{ backgroundColor: wp.color }}
                        title={wp.name}
                      />
                    ))}
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div {...getWallpaperProps()} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2 font-bold cursor-pointer text-xs">
                      <input {...getWallpaperInputProps()} />
                      <ImageIcon size={16} />
                      Upload Custom Background
                    </div>
                    
                    <div className="relative">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Or Wallpaper URL</label>
                      <input
                        type="text"
                        value={settings.wallpaper || ''}
                        onChange={(e) => setSettings({ ...settings, wallpaper: e.target.value, wallpaperColor: '' })}
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
        <button
          onClick={onPlay}
          disabled={isAnimating || isExporting}
          className="flex-1 bg-[#128C7E] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-[#075E54] transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 active:scale-95"
        >
          {isAnimating ? <RotateCcw size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
          {isAnimating ? 'ANIMATING...' : 'RENDER PREVIEW'}
        </button>
        <button
          onClick={handleExportVideo}
          disabled={isAnimating || isExporting}
          className={cn(
            "bg-gray-50 border border-gray-200 text-gray-700 px-5 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95 flex items-center gap-2",
            isExporting && "text-emerald-600 border-emerald-200 bg-emerald-50"
          )}
          title="Export Video"
        >
          {isExporting ? <Loader2 size={20} className="animate-spin" /> : <VideoIcon size={20} />}
          {isExporting && <span className="text-xs">{exportProgress}%</span>}
        </button>
      </div>
    </div>
  );
};
