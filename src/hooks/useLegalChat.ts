import { useState, useCallback } from 'react';
import axios from 'axios';
import { createClient } from '@/utils/supabase/client';

export interface Citation {
  node_id: string;
  title: string;
  page_range: number[];
  content?: string;
}

export interface StreamStep {
  type: 'thought' | 'tool_call' | 'observation' | 'error';
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: StreamStep[];
  citations?: Citation[];
  key_provisions?: string[];
  latency_ms?: number;
  isHistory?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const supabase = createClient();

export function useLegalChat(threadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const fetchHistory = useCallback(async () => {
    const historyUrl = `${API_BASE}/api/chats/${threadId}/history`;
    console.log(`[useLegalChat] fetchHistory initiated for URL: ${historyUrl}`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await axios.get(historyUrl, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      console.log(`[useLegalChat] fetchHistory responded successfully. HTTP Status: ${response.status}`);
      
      const data = response.data;
      console.log("[useLegalChat] fetchHistory payload parsed:", data);

      const historyMsgs: ChatMessage[] = (data.messages || []).map((m: any, idx: number) => {
        console.log(`[useLegalChat] Parsing history message #${idx + 1}:`, m);
        return {
          id: crypto.randomUUID(),
          role: m.role,
          content: m.content,
          steps: m.steps || [],
          citations: m.citations || [],
          key_provisions: m.key_provisions || [],
          isHistory: true
        };
      });

      console.log(`[useLegalChat] Successfully populated ${historyMsgs.length} messages from database history.`);
      setMessages(historyMsgs);
    } catch (e: any) {
      console.error("[useLegalChat] fetchHistory failed with error:", e);
      if (e.response) {
        console.error(`[useLegalChat] Server responded with error status: ${e.response.status}`, e.response.data);
      }
    }
  }, [threadId]);

  const clearHistory = useCallback(async () => {
    const clearUrl = `${API_BASE}/api/chats/${threadId}/history`;
    console.log(`[useLegalChat] clearHistory initiated. Issuing DELETE to: ${clearUrl}`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await axios.delete(clearUrl, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      console.log(`[useLegalChat] clearHistory responded successfully. HTTP Status: ${response.status}`, response.data);
      setMessages([]);
    } catch (e: any) {
      console.error("[useLegalChat] clearHistory failed with error:", e);
      if (e.response) {
        console.error(`[useLegalChat] clearHistory server response details: ${e.response.status}`, e.response.data);
      }
      setMessages([]);
    }
  }, [threadId]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isStreaming) {
      console.warn(`[useLegalChat] Blocked sendMessage call. Message empty or stream already in progress. isStreaming: ${isStreaming}`);
      return;
    }
    
    console.log(`[useLegalChat] sendMessage call initiated for thread: ${threadId}. Message length: ${userMessage.length}`);
    setIsStreaming(true);
    
    const userMsgId = crypto.randomUUID();
    const newUserMsg: ChatMessage = { id: userMsgId, role: 'user', content: userMessage };
    
    const assistantMsgId = crypto.randomUUID();
    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      steps: []
    };
    
    console.log(`[useLegalChat] Appended placeholder user (${userMsgId}) and assistant (${assistantMsgId}) messages to UI state.`);
    setMessages(prev => [...prev, newUserMsg, newAssistantMsg]);

    const messageUrl = `${API_BASE}/api/chats/${threadId}/message`;
    console.log(`[useLegalChat] Posting query via axios request to: ${messageUrl}`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await axios.post(
        messageUrl,
        { message: userMessage },
        {
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          responseType: 'stream',
          adapter: 'fetch' // Crucial to allow ReadableStream body handling in browser environments
        }
      );

      console.log(`[useLegalChat] SSE stream request resolved successfully. Status: ${response.status}`);
      
      const stream = response.data;
      if (!stream) {
        console.error("[useLegalChat] Axios stream response body is null or undefined.");
        throw new Error("No response body returned from server.");
      }

      console.log("[useLegalChat] Stream reader retrieved. Beginning SSE chunk iteration loop.");
      const reader = stream.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let stepsAccumulator: StreamStep[] = [];
      let buffer = "";
      let chunkCount = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log(`[useLegalChat] SSE connection closed by server. Total chunks processed: ${chunkCount}`);
          break;
        }

        chunkCount++;
        const decodedText = decoder.decode(value, { stream: true });
        console.log(`[useLegalChat] Received stream chunk #${chunkCount} (size: ${decodedText.length} chars)`);
        
        buffer += decodedText;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          
          console.log(`[useLegalChat] Processing SSE line: "${cleanLine}"`);

          if (!cleanLine.startsWith("data: ")) {
            console.log(`[useLegalChat] Skipped non-data packet line: "${cleanLine}"`);
            continue;
          }
          
          const rawData = cleanLine.substring(6).trim();
          if (!rawData) {
            console.log("[useLegalChat] Empty data payload encountered.");
            continue;
          }

          try {
            const parsed = JSON.parse(rawData);
            console.log(`[useLegalChat] Successfully decoded SSE event payload of type: "${parsed.type}"`, parsed);
            
            // Handle thoughts, tool calls, and observations
            if (['thought', 'tool_call', 'observation', 'error'].includes(parsed.type)) {
              if (parsed.type === 'tool_call') {
                const toolDetails = `Calling tool: ${parsed.name} with parameters: ${JSON.stringify(parsed.args)}`;
                console.log(`[useLegalChat] [Agent Tool Call]: ${parsed.name}`, parsed.args);
                stepsAccumulator.push({
                  type: 'tool_call',
                  content: toolDetails
                });
              } else {
                console.log(`[useLegalChat] [Agent ${parsed.type.toUpperCase()}]: ${parsed.content.substring(0, 80)}...`);
                stepsAccumulator.push({
                  type: parsed.type,
                  content: parsed.content
                });
              }
              
              console.log(`[useLegalChat] Flushing updated steps accumulator (${stepsAccumulator.length} items) to UI state.`);
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { ...m, steps: [...stepsAccumulator] } : m
              ));
            }
            
            // Handle final structured response payload
            if (parsed.type === 'final_answer') {
              console.log("[useLegalChat] [Agent Final Answer Received]:", {
                citationsCount: parsed.citations?.length || 0,
                latencyMs: parsed.latency_ms,
                insufficientContext: parsed.is_insufficient_context
              });
              
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? {
                  ...m,
                  content: parsed.answer_text,
                  citations: parsed.citations,
                  key_provisions: parsed.key_provisions,
                  latency_ms: parsed.latency_ms
                } : m
              ));
            }
          } catch (e: any) {
            console.error("[useLegalChat] JSON parse error on raw event packet line:", e, rawData);
          }
        }
      }
    } catch (error: any) {
      console.error("[useLegalChat] Streaming execution encountered an unhandled error:", error);
      if (error.response) {
        console.error("[useLegalChat] Axios error response status context:", error.response.status, error.response.data);
      }
      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId ? { ...m, content: `Connection error: ${error.message}` } : m
      ));
    } finally {
      console.log("[useLegalChat] Finalizing stream; isStreaming toggled back to false.");
      setIsStreaming(false);
    }
  };

  const clearHistoryLocal = useCallback(() => {
    console.log(`[useLegalChat] Local message state cleared (no DB request) for threadId: ${threadId}`);
    setMessages([]);
  }, [threadId]);

  return { messages, sendMessage, isStreaming, fetchHistory, clearHistory, clearHistoryLocal };
}
