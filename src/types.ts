export type MessageSender = 'me' | 'them';

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image';
  imageUrl?: string;
  delay?: number; // delay before this message appears in animation
}

export interface ChatSettings {
  contactName: string;
  contactStatus: string;
  contactImage?: string;
  wallpaper?: string;
  wallpaperColor?: string;
  theme: 'light' | 'dark';
  platform: 'ios' | 'android';
  showNetwork: boolean;
  batteryLevel: number;
  currentTime: string;
}

export interface ChatProject {
  id: string;
  settings: ChatSettings;
  messages: Message[];
}
