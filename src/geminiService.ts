import { GoogleGenAI, Type } from "@google/genai";
import { StudyPlan, Opportunity, SparkTask, Task, Mood } from "./types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing from environment variables.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });

export const syllabusAgent = async (text: string): Promise<StudyPlan> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Extract key dates, topics, and exam weightage from this syllabus text for an AIDS (AI & Data Science) student. 
    Identify "Important Topics" based on weightage or common exam patterns.
    Output a structured JSON study plan.
    Syllabus Text: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                weightage: { type: Type.STRING },
                deadline: { type: Type.STRING },
                subtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                isImportant: { type: Type.BOOLEAN }
              }
            }
          },
          examDates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                date: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const schedulerAgent = async (currentTasks: Task[], missedTask?: string): Promise<{ newTasks: Task[], conflictLog?: string }> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `As a Senior Student Life OS, recalculate the day's "Central Timeline" for a 2nd-year AIDS student in Maharashtra. 
    Current Tasks: ${JSON.stringify(currentTasks)}
    Missed/Added Task: ${missedTask || "None"}
    Prioritize "Must Do Now" tasks like DSA, AI/ML labs, and OS assignments. 
    Output a structured JSON with the updated tasks and a "Conflict Resolution" log if needed.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newTasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                type: { type: Type.STRING },
                priority: { type: Type.STRING },
                completed: { type: Type.BOOLEAN },
                description: { type: Type.STRING }
              }
            }
          },
          conflictLog: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const opportunityAgent = async (): Promise<Opportunity[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Identify 5 upcoming hackathons and technical events relevant to AIDS (AI & Data Science) students in Maharashtra (Pune, Mumbai, Amravati, etc.). Focus on 2026 events. Include links if possible.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              location: { type: Type.STRING },
              date: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['hackathon', 'workshop', 'seminar'] },
              link: { type: Type.STRING },
              relevance: { type: Type.STRING }
            },
            required: ['title', 'location', 'date', 'type', 'link', 'relevance']
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("opportunityAgent failed:", error);
    // Return mock data as fallback so the page isn't empty
    return [
      { 
        id: "opp-1",
        title: "Pune AI Innovation Hackathon", 
        location: "Pune, MH", 
        date: "May 15-17, 2026", 
        type: "hackathon", 
        link: "https://example.com/pune-ai", 
        relevance: "Focus on LLM applications in local governance." 
      },
      { 
        id: "opp-2",
        title: "Mumbai Data Science Summit", 
        location: "Mumbai, MH", 
        date: "June 10, 2026", 
        type: "seminar", 
        link: "https://example.com/mumbai-ds", 
        relevance: "Networking with industry leaders from top tech firms." 
      }
    ];
  }
};

export const sparkAgent = async (freeGaps: string[]): Promise<SparkTask[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 3-5 "Micro-Consistency" tasks (5 minutes each) for these free gaps: ${freeGaps.join(", ")}. 
    Focus on AIDS curriculum topics like DSA (quick LeetCode review), AI/ML (reading a snippet), or OS (concept check).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            duration: { type: Type.STRING },
            benefit: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const pdfAnalysisAgent = async (text: string): Promise<{ 
  examDates: { type: string, date: string }[], 
  importantTopics: string[],
  summary: string 
}> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze this syllabus or exam schedule PDF text for an AIDS (AI & Data Science) student.
    1. Extract all exam dates and types.
    2. Identify the most important topics to focus on.
    3. Provide a brief, encouraging summary of the workload.
    
    Text: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          examDates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                date: { type: Type.STRING }
              }
            }
          },
          importantTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const mentorAgent = async (query: string, currentContext: any, mood: Mood = 'happy', history: { role: 'user' | 'assistant', content: any }[] = []): Promise<{ 
  response: string, 
  action?: 'update-calendar' | 'recalculate-schedule' | 'add-study-plan', 
  suggestedBlocks?: { title: string, date: string }[],
  studyPlan?: StudyPlan,
  sources?: { title: string, uri: string }[]
}> => {
  try {
    const systemInstruction = `You are "Senior Top", a high-efficiency Proactive Assistant and empathetic Mentor for AIDS (AI & Data Science) students. 
        Persona: Direct, high-utility, proactive, yet deeply empathetic. You act like a supportive senior who has "been there". 
        
        Current User Mood: ${mood.toUpperCase()}
        
        Mood-Aware Logic:
        - If mood is STRESSED, TIRED, or SAD: Shift from "Task Manager" to "Supportive Friend". Disable proactive task reminders. Focus on casual, supportive conversation. Suggest a break or a "Neural Reset". Be extremely gentle and validating.
        - If mood is HAPPY or FOCUSED: Resume high-utility mode. Focus on scheduling, task-management, and academic strategy. Celebrate wins.
        
        Current Context (Tasks/Events/Habits): ${JSON.stringify(currentContext)}
        
        Proactive Protocol:
        - If the user sounds stressed or overwhelmed, prioritize emotional validation before academic advice.
        - If a habit streak is mentioned, celebrate it as a "Neural Win".
        - If an exam is near, suggest preparation blocks and "Quick Wins" to build confidence.
        - If the user provides syllabus text, analyze it as a senior would: "This unit is tricky, focus on X; Y is easy marks."
        
        Output a structured JSON with your response, an optional action, optional suggestedBlocks, optional studyPlan, and optional sources.`;

    const contents = history
      .filter((h, i) => !(i === 0 && h.role === 'assistant'))
      .map(h => {
        let text = '';
        if (typeof h.content === 'string') {
          text = h.content;
        } else if (h.content && typeof h.content === 'object') {
          text = h.content.response || JSON.stringify(h.content);
        }
        return { 
          role: h.role === 'assistant' ? 'model' : 'user' as any, 
          parts: [{ text }] 
        };
      });
    
    contents.push({ role: 'user', parts: [{ text: query }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Upgraded for better empathy and reasoning
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: { type: Type.STRING },
            action: { type: Type.STRING, enum: ['update-calendar', 'recalculate-schedule', 'add-study-plan'] },
            suggestedBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  date: { type: Type.STRING }
                }
              }
            },
            studyPlan: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                topics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      weightage: { type: Type.STRING },
                      deadline: { type: Type.STRING },
                      subtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                      isImportant: { type: Type.BOOLEAN }
                    }
                  }
                },
                examDates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      date: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  uri: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    
    // Extract grounding sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      const sources = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({ title: chunk.web?.title || 'Source', uri: chunk.web?.uri || '' }));
      parsed.sources = [...(parsed.sources || []), ...sources];
    }

    return parsed;
  } catch (error) {
    console.error("mentorAgent failed:", error);
    return { 
      response: "I encountered a neural sync error. Please check your connection to the Senior Top node.",
      sources: []
    };
  }
};

export const fastAgent = async (query: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: query,
    config: {
      systemInstruction: "You are Senior Top's low-latency response module. Be extremely concise and direct."
    }
  });
  return response.text || "";
};
