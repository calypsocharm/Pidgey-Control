import { GoogleGenAI } from "@google/genai";
import { Ticket, Profile } from "../types";

// In a real app, this would be a secure backend call. 
// For this frontend-only demo, we use the client directly but advise on security.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateTicketReply = async (ticket: Ticket, profile: Profile): Promise<string> => {
  if (!apiKey) {
    return "API Key not configured. Please set process.env.API_KEY to use AI features.";
  }

  const lastMessage = ticket.messages[ticket.messages.length - 1];
  
  const prompt = `
    You are Pidgey Support Bot, a helpful and slightly whimsical assistant for a greeting card SaaS.
    User Name: ${profile.full_name}
    User Tier: ${profile.tier}
    Ticket Subject: ${ticket.subject}
    User Message: "${lastMessage.body}"
    
    Draft a polite, helpful response. 
    If it's a bug, apologize and say we are looking into it.
    If it's a sales question, explain the value.
    Keep it under 100 words. Use one bird pun if possible.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service.";
  }
};

export const analyzeSentiment = async (text: string): Promise<string> => {
    if (!apiKey) return "Unknown";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the sentiment of this text: "${text}". Return only one word: Positive, Neutral, or Negative.`,
        });
        return response.text?.trim() || "Neutral";
    } catch (e) {
        return "Neutral";
    }
}
