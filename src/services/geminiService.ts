import { GoogleGenAI, Type } from "@google/genai";

export async function generateChatConversation(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a realistic WhatsApp conversation based on this prompt: "${prompt}". 
    Return a JSON array of messages. Each message should have:
    - sender: "me" or "them"
    - text: the message content
    - type: "text"
    - status: "read"
    - timestamp: a realistic time string (e.g. "10:05 AM")
    
    Make it natural, with realistic slang and pauses. Limit to 8-12 messages.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sender: { type: Type.STRING },
            text: { type: Type.STRING },
            type: { type: Type.STRING },
            status: { type: Type.STRING },
            timestamp: { type: Type.STRING }
          },
          required: ["sender", "text", "type", "status", "timestamp"]
        }
      }
    }
  });

  try {
    const text = response.text?.trim();
    if (!text || text === "undefined" || text === "null") {
      console.warn("Gemini returned empty or invalid text:", text);
      return [];
    }
    // Remove potential markdown code blocks if the model included them
    const cleanText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse AI response. Raw text:", response.text);
    return [];
  }
}
