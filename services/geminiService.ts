import { GoogleGenAI } from "@google/genai";
import { Ticket, Profile } from "../types";

// In a real app, this would be a secure backend call. 
// For this frontend-only demo, we use the client directly but advise on security.

export const generateTicketReply = async (ticket: Ticket, profile: Profile): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key not configured. Please set process.env.API_KEY to use AI features.";
  }
  const ai = new GoogleGenAI({ apiKey });

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
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Unknown";
    const ai = new GoogleGenAI({ apiKey });
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

// --- JARVIS AGENT CAPABILITIES ---

export const getJarvisDailyBrief = async (context: any): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "## System Offline\nPlease configure your API Key to enable Pidgey JARVIS.";
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    You are Pidgey JARVIS, the Ops Copilot for Pidgey Control Tower.
    
    Analyze the following system context and generate a "Daily Brief" for the admin.
    
    CONTEXT:
    ${JSON.stringify(context, null, 2)}
    
    INSTRUCTIONS:
    1. Summarize the overall system health.
    2. Identify top 3 priorities (e.g., high priority tickets, revenue dips, abandoned carts).
    3. Suggest one specific action item for the admin.
    4. Keep it professional but slightly robotic/AI-persona.
    5. Format in clean Markdown with headers and bullet points.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Unable to generate brief.";
    } catch (e) {
        console.error("Jarvis Brief Error:", e);
        return "Error generating daily brief.";
    }
}

export const chatWithJarvis = async (message: string, context: any): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "I am offline. Please check my power source (API Key).";
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    You are Pidgey JARVIS, an advanced AI operations assistant for the Pidgey Greeting Card SaaS.
    You have access to the current system state provided below.

    SYSTEM CONTEXT:
    ${JSON.stringify(context, null, 2)}

    USER QUERY: "${message}"

    INSTRUCTIONS:
    - Answer the user's question based strictly on the provided context.
    - If you need to perform an action (like "refund"), pretend you can do it and say "Initiating refund process..." or "Action queued."
    - Be helpful, concise, and use a "Jarvis-like" tone (efficient, polite).
    - If the user asks about data not in context, say you don't have visibility into that yet.
    - Format output with Markdown if needed (e.g., tables for data).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "I processed that, but have no output.";
    } catch (e) {
        console.error("Jarvis Chat Error:", e);
        return "Communication link unstable.";
    }
}