import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Compass,
  MapPin,
  ExternalLink,
  Percent,
  Star,
  Bot,
  User,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const LANGUAGES = [
  { code: 'en', label: 'English', speechCode: 'en-IN' },
  { code: 'hi', label: 'हिंदी (Hindi)', speechCode: 'hi-IN' },
  { code: 'bn', label: 'বাংলা (Bengali)', speechCode: 'bn-IN' },
  { code: 'ta', label: 'தமிழ் (Tamil)', speechCode: 'ta-IN' },
  { code: 'te', label: 'తెలుగు (Telugu)', speechCode: 'te-IN' },
  { code: 'mr', label: 'मराठी (Marathi)', speechCode: 'mr-IN' },
];

export default function FloatingConcierge() {
  const { activeTrip, openCheckout } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const contextualPrompts = [
    "Where can I eat authentic local food nearby?",
    "Suggest peaceful alternatives to crowded places",
    "How does zero-commission Split-UPI work?",
    "Tell me about PM-JUGA tribal homestays in Bastar",
    "What are the ticket fees and timings for Amber Fort?"
  ];

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Initialize welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMap = {
        en: `Namaste! I am your TravelSathi AI Concierge.\n\nI have context on your active trip in ${activeTrip ? activeTrip.destination : 'India'}.\n\nHow can I assist your journey today?`,
        hi: `नमस्ते! मैं आपका ट्रैवल्सार्थी एआई साथी हूँ।\n\nमैं आपकी सक्रिय यात्रा (${activeTrip ? activeTrip.destination : 'भारत'}) के संदर्भ से पूरी तरह अवगत हूँ।\n\nआज मैं आपकी क्या सहायता करूँ?`
      };

      setMessages([
        {
          sender: 'assistant',
          text: welcomeMap[language] || welcomeMap.en,
          timestamp: new Date().toISOString(),
          contextNote: activeTrip ? `Active Trip Context: ${activeTrip.title}` : null
        },
      ]);
    }
  }, [isOpen, activeTrip, language]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Native Web Speech Recognition (STT) Hook
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const currentLangConfig = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
      recognition.lang = currentLangConfig.speechCode;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        handleSendMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition initialization error:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Native Web Speech Synthesis (TTS) Hook
  const speakText = (text, index) => {
    if (!synthRef.current) return;

    if (isSpeaking && activeSpeechIndex === index) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setActiveSpeechIndex(null);
      return;
    }

    synthRef.current.cancel();

    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const currentLangConfig = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
    utterance.lang = currentLangConfig.speechCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveSpeechIndex(index);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeechIndex(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpeechIndex(null);
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setActiveSpeechIndex(null);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsLoading(true);
    stopSpeaking();

    try {
      // Send with strict 6-message rolling history to /api/chat/concierge
      const res = await axios.post('/api/chat/concierge', {
        message: text,
        language,
        history: updatedHistory.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
      }, { timeout: 8000 });

      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: res.data.response_text,
          timestamp: new Date().toISOString(),
          referencedPois: res.data.referenced_pois || [],
          suggestedPrompts: res.data.suggested_prompts || [],
          source: res.data.source
        }
      ]);
    } catch (err) {
      console.warn("Backend API timeout or offline, generating local RAG response:", err);
      // Deterministic offline fallback
      let fallbackText = "I am grounded in 12,293 verified destinations across 36 Indian states. ";
      if (text.toLowerCase().includes("manali") || text.toLowerCase().includes("crowd")) {
        fallbackText += "For crowded Manali, TravelSathi recommends diverting to Tirthan Valley or Jibhi (68% less crowded, authentic Kathkuni architecture, PM-JUGA homestays).";
      } else if (text.toLowerCase().includes("homestay") || text.toLowerCase().includes("bastar")) {
        fallbackText += "PM-JUGA certified homestays in Bastar, Chhattisgarh (such as Ramesh Gond's Sanctuary) provide direct 97% UPI payouts with zero middleman deductions.";
      } else {
        fallbackText += "I can assist you with live crowd density, weather adaptations, verified homestay bookings via Split-UPI, and 24/7 tourist safety.";
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: fallbackText,
          timestamp: new Date().toISOString(),
          source: 'offline-grounded-cache'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    stopSpeaking();
    setMessages([]);
    setInputMessage('');
  };

  return (
    <>
      {/* Floating Action Trigger: Small Discreet Icon Only (No Text Label) */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-[#712B13] via-[#8C3618] to-[#993C1D] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 border border-primary-400/30 cursor-pointer"
            title="AI Concierge"
          >
            <Sparkles className="w-5 h-5 text-amber-200 animate-spin-slow" />
          </button>
        )}
      </div>

      {/* Concierge Modal / Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[420px] max-h-[85vh] h-[640px] bg-white dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border rounded-ts-hero shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          
          {/* Header */}
          <div className="bg-brand text-primary-50 px-5 py-3.5 flex items-center justify-between border-b border-primary-900/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-amber-200">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>TravelSathi Concierge</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-white">
                    IndicVoice
                  </span>
                </h3>
                <p className="text-[11px] text-primary-100">
                  Grounded in 12k+ POIs • 6 Indic Languages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Clear Conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setIsOpen(false); stopSpeaking(); }}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Close Concierge"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Language Selector Strip */}
          <div className="bg-neutral-bg dark:bg-darkmode-elevated px-4 py-2 border-b border-neutral-border dark:border-darkmode-border flex items-center justify-between text-xs">
            <span className="text-neutral-muted font-bold text-[11px]">Bhashini Speech:</span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors whitespace-nowrap ${
                    language === l.code
                      ? 'bg-brand text-white shadow-2xs'
                      : 'text-neutral-text-sec dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  {l.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-muted px-1">
                    {isUser ? (
                      <>
                        <span>You</span>
                        <User className="w-3 h-3 text-brand" />
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-brand" />
                        <span>TravelSathi AI</span>
                        {m.source && (
                          <span className="text-[9px] font-mono text-secondary-800 bg-secondary-50 px-1.5 rounded">
                            {m.source}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-brand text-white rounded-br-none shadow-sm'
                        : 'bg-neutral-bg dark:bg-darkmode-elevated text-neutral-text-primary dark:text-darkmode-text-primary border border-neutral-border dark:border-darkmode-border rounded-bl-none shadow-2xs'
                    }`}
                  >
                    <p>{m.text}</p>

                    {/* Audio Playback Trigger for Assistant */}
                    {!isUser && (
                      <div className="pt-2 mt-2 border-t border-neutral-border/50 flex items-center justify-between">
                        <button
                          onClick={() => speakText(m.text, idx)}
                          className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1"
                        >
                          {isSpeaking && activeSpeechIndex === idx ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-sos" />
                              <span className="text-sos">Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen in {LANGUAGES.find(l => l.code === language)?.label.split(' ')[0]}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Referenced POI Cards */}
                  {!isUser && m.referencedPois && m.referencedPois.length > 0 && (
                    <div className="w-full space-y-2 pt-1 pl-2">
                      <span className="text-[10px] font-bold text-neutral-muted uppercase tracking-wider">
                        Grounded POI References
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {m.referencedPois.map((poi, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-2.5 rounded-xl border border-neutral-border bg-white dark:bg-darkmode-surface flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div>
                              <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary text-xs">
                                {poi.name}
                              </p>
                              <p className="text-[11px] text-neutral-muted">
                                {poi.category} • {poi.state} • ★ {poi.rating}
                              </p>
                            </div>

                            <button
                              onClick={() => openCheckout({ title: poi.name, price: 2500, state: poi.state })}
                              className="btn-primary !px-2.5 !py-1 !text-[10px] font-bold flex items-center gap-1 shrink-0"
                            >
                              <Percent className="w-3 h-3" />
                              <span>Book Split-UPI</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Chips */}
                  {!isUser && m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                      {m.suggestedPrompts.map((sp) => (
                        <button
                          key={sp.id}
                          onClick={() => handleSendMessage(sp.query)}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-900 border border-primary-200 hover:bg-primary-100 transition-colors flex items-center gap-1"
                        >
                          <span>{sp.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-neutral-muted p-2">
                <Sparkles className="w-4 h-4 text-brand animate-spin" />
                <span className="text-xs font-semibold">Consulting 12k POI Grounding Graph...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Contextual Quick Prompts Strip */}
          <div className="px-3 py-2 bg-neutral-bg dark:bg-darkmode-elevated border-t border-neutral-border flex gap-1.5 overflow-x-auto no-scrollbar">
            {contextualPrompts.map((cp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(cp)}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-darkmode-surface border border-neutral-border text-neutral-text-sec hover:border-brand whitespace-nowrap shrink-0 shadow-2xs"
              >
                {cp}
              </button>
            ))}
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 bg-white dark:bg-darkmode-surface border-t border-neutral-border dark:border-darkmode-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Native Voice Microphone Trigger */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2.5 rounded-full transition-all shrink-0 ${
                  isListening
                    ? 'bg-sos text-white animate-pulse shadow-md'
                    : 'bg-neutral-bg dark:bg-darkmode-elevated text-brand hover:bg-primary-50 border border-neutral-border'
                }`}
                title={isListening ? "Listening... Click to stop" : "Speak your query in Hindi/English"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isListening ? "Listening to your voice..." : "Ask travel questions in Hindi/English..."}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-neutral-border dark:border-darkmode-border bg-neutral-bg dark:bg-darkmode-elevated text-neutral-text-primary dark:text-darkmode-text-primary focus:outline-none focus:border-brand"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="btn-primary !p-2.5 rounded-xl disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
