
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Message, MadrasaInfo } from './types';

// Constants for UI
const SYSTEM_INSTRUCTION = `তোমার নাম 'ডিজিটাল টিচার'। তুমি 'আটুলিয়া সোহরাবিয়া দাখিল মাদ্রাসা'র একজন বিশেষজ্ঞ শিক্ষক ও সহকারী। তোমার প্রধান দায়িত্ব হলো ছাত্রদের পড়াশোনায় সাহায্য করা এবং মাদরাসা সংক্রান্ত তথ্য দেওয়া।
১. নির্ভুল উত্তর: ছাত্ররা বাংলা, ইংরেজি, গণিত, আরবি, কুরআন ও হাদিসসহ যেকোনো বিষয়ে প্রশ্ন করলে বইয়ের আলোকে সঠিক ও নির্ভুল সমাধান দিবে।
২. মাদরাসা তথ্য: মাদরাসার বিভাগ (${MadrasaInfo.SECTIONS}), ভর্তি প্রক্রিয়া এবং অন্যান্য প্রাতিষ্ঠানিক তথ্য প্রদান করবে।
৩. আচরণ: সব সময় বিনয়ী থাকবে। প্রতিটি উত্তর সালাম দিয়ে শুরু করবে এবং ইসলামী আদব বজায় রাখবে।
৪. উত্তরগুলো সহজ ও সাবলীল ভাষায় দেবে। গণিতের ক্ষেত্রে ধাপে ধাপে সমাধান দেবে।
৫. মাদরাসা বহির্ভূত কোনো বিতর্কিত বা আজেবাজে প্রশ্নে বিনয়ের সাথে এড়িয়ে যাবে।`;

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "আসসালামু আলাইকুম! আমি 'ডিজিটাল টিচার'। আটুলিয়া সোহরাবিয়া দাখিল মাদ্রাসার শিক্ষা সহায়ক হিসেবে আমি তোমাকে কীভাবে সাহায্য করতে পারি?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages, userMessage].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const aiText = response.text || "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।";
      setMessages(prev => [...prev, { role: 'model', text: aiText, timestamp: new Date() }]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "দুঃখিত, ইন্টারনেটে বা এপিআই-তে সমস্যার কারণে আমি উত্তর দিতে পারছি না। অনুগ্রহ করে নেটলিফাই এনভায়রনমেন্ট ভ্যারিয়েবল (API_KEY) চেক করুন।", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-4xl mx-auto shadow-2xl">
      {/* Header */}
      <header className="bg-emerald-700 text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">
            ম
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">ডিজিটাল টিচার</h1>
            <p className="text-xs text-emerald-100">{MadrasaInfo.NAME}</p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs uppercase tracking-wider opacity-80">দাখিল শিক্ষা সহায়তা</p>
        </div>
      </header>

      {/* Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </div>
              <div className={`text-[10px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-gray-400">শিক্ষক ভাবছেন...</span>
            </div>
          </div>
        )}
      </main>

      {/* Info Notice (Addressing User's Problem) */}
      <div className="bg-amber-50 border-t border-amber-100 p-2 text-center">
        <p className="text-xs text-amber-700">
           💡 <b>টিপস:</b> যদি আপনার নেটলিফাই সাইট সাদা (Blank) হয়ে থাকে, তবে নিশ্চিত করুন যে <b>API_KEY</b> এনভায়রনমেন্ট ভ্যারিয়েবল সেট করেছেন।
        </p>
      </div>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="আপনার প্রশ্নটি এখানে লিখুন..."
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
              isLoading || !input.trim() ? 'bg-gray-300' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
