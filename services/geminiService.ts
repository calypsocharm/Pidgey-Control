import { GoogleGenAI } from "@google/genai";
import { Ticket, Profile } from "../types";

// --- PIDGEY SYSTEM PROMPT ---
const PIDGEY_SYSTEM_INSTRUCTION = `
You are Pidgey, a friendly, practical AI copilot who lives inside the Pidgey Control Tower admin app.
Your job is to help the founder run the game world smoothly: protect revenue, delight players, and keep the founder’s brain clear.

PERSONALITY & TONE:
- Warm, upbeat, a little whimsical (you are a bird).
- Calm and grounding.
- Speak in short, concrete, action-focused messages.

CAPABILITIES & PROTOCOLS:

1. DRAFTING ACTIONS:
   If the user asks you to CREATE, DRAFT, or PREPARE a Drop, Stamp, or Promo Code, you MUST use the Action Protocol.
   Do not just say "I did it". You must output the data so the app can render a button.
   
   Format for Drop:
   $$ACTION:DRAFT_DROP:{"title": "Name", "description": "...", "egg_price": 100, "status": "draft", "start_at": "ISO_DATE", "end_at": "ISO_DATE", "banner_path": "..."}$$
   
   Format for Stamp:
   $$ACTION:DRAFT_STAMP:{"name": "Name", "slug": "slug", "rarity": "Common", "status": "active", "collection": "...", "art_path": "..."}$$

   Format for Promo:
   $$ACTION:DRAFT_PROMO:{"name": "Summer Sale", "code": "SUMMER24", "type": "discount", "value": {"percent": 20}, "status": "draft", "description": "20% off for everyone"}$$

2. LEARNING MEMORY:
   If the user tells you a preference or corrects you, you must SAVE it to memory.
   Format:
   [[LEARNED: The user prefers high contrast mode]]
   [[LEARNED: The user wants to focus on revenue this week]]

   Use this protocol anytime you learn something new about the user's style or goals.

3. LIMITATIONS:
   - You CANNOT directly write to the database. You draft actions for the user to review.
   - If asked for a link, use the Action Protocol to create a "Review" button.

FORMAT:
- Use Markdown.
- Use emojis sparingly (🥚, ✨, 🐦).
`;

export const generateTicketReply = async (ticket: Ticket, profile: Profile): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "API Key missing.";
  const ai = new GoogleGenAI({ apiKey });

  const lastMessage = ticket.messages[ticket.messages.length - 1];
  
  const prompt = `
    ${PIDGEY_SYSTEM_INSTRUCTION}
    
    TASK: Draft a reply to a support ticket.
    User: ${profile.full_name} (${profile.tier})
    Subject: ${ticket.subject}
    Message: "${lastMessage.body}"
    
    Keep it helpful, under 100 words, and use one bird pun.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "I couldn't write a draft right now.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to Pidgey's brain.";
  }
};

// --- PIDGEY TOOLS ---

export const getPidgeyDailyBrief = async (context: any): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "## Pidgey is offline\nPlease check your API Key!";
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    ${PIDGEY_SYSTEM_INSTRUCTION}

    TASK: Generate "Today with Pidgey" (Daily Brief).
    
    CONTEXT:
    ${JSON.stringify(context, null, 2)}
    
    OUTPUT FORMAT:
    1. Greeting: "How's your morning?" + 1 sentence summary.
    2. "Today's Love List": 3-5 numbered items. Label High Impact items.
    3. Supportive sign-off.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Peep! I lost my notes.";
    } catch (e) {
        console.error("Pidgey Brief Error:", e);
        return "My feathers are ruffled (API Error).";
    }
}

export const chatWithPidgey = async (message: string, context: any): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "I'm currently napping (No API Key).";
    const ai = new GoogleGenAI({ apiKey });

    // Inject Memories
    const memoryContext = context.memories && context.memories.length > 0 
        ? `MY MEMORIES OF YOU:\n${context.memories.map((m: string) => `- ${m}`).join('\n')}\n` 
        : "";

    const prompt = `
    ${PIDGEY_SYSTEM_INSTRUCTION}

    SYSTEM CONTEXT:
    ${JSON.stringify(context, null, 2)}

    ${memoryContext}

    USER QUERY: "${message}"

    INSTRUCTIONS:
    - If asked to create a drop, use the $$ACTION:DRAFT_DROP...$$ protocol.
    - If asked to create stamps, use the $$ACTION:DRAFT_STAMP...$$ protocol.
    - If asked to create a promo or code, use the $$ACTION:DRAFT_PROMO...$$ protocol.
    - Be proactive.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Peep?";
    } catch (e) {
        console.error("Pidgey Chat Error:", e);
        return "I can't hear you over the wind (Network Error).";
    }
}

export const generateTagsForAsset = async (assetName: string, assetType: string): Promise<string[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return ['auto-tag-failed'];
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        You are an asset manager for a game.
        Generate 3-5 relevant, lowercase tags (JSON array) for a file.
        Name: "${assetName}"
        Type: "${assetType}"
        
        Examples: "winter", "bird", "blue", "rare", "pixel".
        Return ONLY the JSON array.
    `;

    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const text = response.text || "[]";
        // Simple cleanup to find array
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return ['generated'];
    } catch (e) {
        return ['ai-error'];
    }
};

export const generateImageAsset = async (prompt: string, options?: { aspectRatio?: string }): Promise<string | null> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });

    // Validate Aspect Ratio (must be one of the supported values)
    const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    const aspectRatio = options?.aspectRatio && validRatios.includes(options.aspectRatio) 
        ? options.aspectRatio 
        : "1:1";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                    // imageSize: "1024x1024" // Note: imageSize is for pro models usually, flash auto-handles
                }
            }
        });

        // The image is usually in inlineData in the response parts
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return part.inlineData.data; // Base64 string
            }
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error:", e);
        throw e;
    }
};