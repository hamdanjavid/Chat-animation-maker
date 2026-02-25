import React, { useState } from 'react';
import { ChatEditor } from './components/ChatEditor';
import { PhonePreview } from './components/PhonePreview';
import { Message, ChatSettings } from './types';
import { MessageSquare, Github, Share2, Info } from 'lucide-react';

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'them',
    text: "Hey! Did you check out ChatFlow yet?",
    timestamp: "10:00 AM",
    status: 'read',
    type: 'text'
  },
  {
    id: '2',
    sender: 'me',
    text: "Not yet, what is it?",
    timestamp: "10:01 AM",
    status: 'read',
    type: 'text'
  },
  {
    id: '3',
    sender: 'them',
    text: "It's a tool to create WhatsApp chat animations for videos. It's super smooth!",
    timestamp: "10:02 AM",
    status: 'read',
    type: 'text'
  },
  {
    id: '4',
    sender: 'me',
    text: "Whoa, just tried it. The animations are crisp! 🔥",
    timestamp: "10:05 AM",
    status: 'read',
    type: 'text'
  }
];

const INITIAL_SETTINGS: ChatSettings = {
  contactName: "Alex Rivera",
  contactStatus: "online",
  contactImage: "https://picsum.photos/seed/alex/200/200",
  theme: 'dark',
  platform: 'ios',
  showNetwork: true,
  batteryLevel: 85,
  currentTime: "10:15 AM",
  wallpaper: "https://storage.googleapis.com/ghost-studio-prod-v1-public/67bc9f99f7kdmplgfnfxkbaflb7rbu/input_file_0.png",
  wallpaperColor: "#0b141a"
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [settings, setSettings] = useState<ChatSettings>(INITIAL_SETTINGS);
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePlay = () => {
    setIsAnimating(true);
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-sans">
      {/* Sidebar Editor */}
      <ChatEditor 
        settings={settings}
        setSettings={setSettings}
        messages={messages}
        setMessages={setMessages}
        onPlay={handlePlay}
        isAnimating={isAnimating}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
        {/* Phone Preview Container */}
        <div className="relative transform scale-[0.85] lg:scale-100 transition-transform duration-500">
          {/* Decorative Glow */}
          <div className="absolute -inset-20 bg-emerald-500/5 rounded-[100px] blur-[100px] pointer-events-none" />
          
          <PhonePreview 
            settings={settings}
            messages={messages}
            isAnimating={isAnimating}
            onAnimationComplete={() => setIsAnimating(false)}
          />
        </div>

        {/* Bottom Status */}
        <div className="mt-8 flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          <span className="hover:text-emerald-600 cursor-help transition-colors">Auto-Save Enabled</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="hover:text-blue-600 cursor-help transition-colors">High Fidelity Mode</span>
        </div>
      </main>
    </div>
  );
}
