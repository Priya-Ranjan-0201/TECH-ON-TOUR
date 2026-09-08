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
  ChevronRight,
  ShieldCheck,
  Bot,
  User,
  Star,
  ExternalLink,
} from 'lucide-react';
import Button from '../ui/Button';

const LANGUAGES = [
  { code: 'en', label: 'English', speechCode: 'en-IN' },
  { code: 'hi', label: 'हिंदी (Hindi)', speechCode: 'hi-IN' },
  { code: 'bn', label: 'বাংলা (Bengali)', speechCode: 'bn-IN' },
  { code: 'ta', label: 'தமிழ் (Tamil)', speechCode: 'ta-IN' },
  { code: 'te', label: 'తెలుగు (Telugu)', speechCode: 'te-IN' },
  { code: 'mr', label: 'मराठी (Marathi)', speechCode: 'mr-IN' },
];

export default function ConciergeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize Speech Synthesis and Initial Prompts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    loadInitialPrompts(language);
  }, [language]);

  // Load starter messages when widget first opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMap = {
        en: "Namaste! I am your TravelSathi AI Concierge, grounded in 12,293 verified Indian destinations.\n\nAsk me about PM-JUGA tribal homestays, hidden gem alternatives to congested hotspots, ticket timings, or zero-commission DPI savings!",
        hi: "नमस्ते! मैं आपका ट्रैवल्सार्थी एआई टूरिज़्म कॉन्सिअर्ज हूँ।\n\nमुझसे बस्तर के पीएम-जुगा जनजातीय होमस्टे, मनाली के शांत विकल्प, आमेर किले के समय व टिकट या शून्य-कमीशन बचत के बारे में पूछें!",
        bn: "নমস্কার! আমি আপনার ট্রাভেলসাথী এআই পর্যটন সহকারী।\n\nভারতের ১২,২৯৩টি যাচাইকৃত গন্তব্য, উপজাতীয় হোমস্টে এবং শূন্য-কমিশন ভ্রমণ সংক্রান্ত যেকোনো তথ্য জানতে আমাকে প্রশ্ন করুন।",
        ta: "வணக்கம்! நான் உங்கள் ட்ராவல்சாதி ஏஐ சுற்றுலா உதவியாளர்.\n\nபழங்குடியினர் தங்குமிடங்கள் மற்றும் நேரடி முன்பதிவு பற்றி என்னிடம் கேட்கலாம்.",
        te: "నమస్కారం! నేను మీ ట్రావెల్సాథీ ఏఐ టూరిజం అసిస్టెంట్‌ని.\n\nభారతదేశంలోని పర్యాటక ప్రాంతాలు, గిరిజన హోమ్‌స్టేలు మరియు జీరో-కమీషన్ బుకింగ్ గురించి అడగండి.",
        mr: "नमस्कार! मी तुमचा ट्रॅव्हलसाथी एआय सहाय्यक आहे.\n\nप्रमाणित पर्यटन स्थळे, आदिवासी होमस्टे आणि शून्य-कमिशन मॉडेलबाबत प्रश्न विचारा.",
      };

      setMessages([
        {
          sender: 'assistant',
          text: welcomeMap[language] || welcomeMap.en,
          timestamp: new Date().toISOString(),
          referenced_pois: [],
        },
      ]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadInitialPrompts = async (langCode) => {
    try {
      const res = await axios.get(`/api/chat/prompts?language=${langCode}`);
      setSuggestedPrompts(res.data);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    }
  };

  const handleSendMessage = async (textToSend) => {
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

    // Stop ongoing speech
    stopSpeaking();

    try {
      const payload = {
        message: text,
        language,
        history: updatedHistory.slice(-6).map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
      };

      const res = await axios.post('/api/chat/message', payload);
      const assistantMsg = {
        sender: 'assistant',
        text: res.data.response_text,
        timestamp: new Date().toISOString(),
        referenced_pois: res.data.referenced_pois || [],
        source: res.data.source,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (res.data.suggested_prompts?.length > 0) {
        setSuggestedPrompts(res.data.suggested_prompts);
      }
    } catch (err) {
      console.error('Error in chat message:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I encountered an issue retrieving that information. Please try again or rephrase your query.',
          timestamp: new Date().toISOString(),
          referenced_pois: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Web Speech API: Voice Recognition (Speech-to-Text)
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
    const recognition = new SpeechRecognition();
    recognition.lang = currentLangObj.speechCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      handleSendMessage(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Web Speech API: Text-to-Speech Synthesis
  const handleSpeak = (text, index) => {
    if (!synthRef.current) return;

    if (isSpeaking && activeSpeechIndex === index) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
    utterance.lang = currentLangObj.speechCode;
    utterance.rate = 1.0;

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

  const handleClearChat = () => {
    stopSpeaking();
    setMessages([]);
    loadInitialPrompts(language);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-primary-800 text-white shadow-2xl hover:bg-primary-900 border-2 border-accent-400 transition-all duration-300 transform hover:scale-105"
          aria-label="Open AI Multilingual Concierge"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-accent-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent-400 border border-primary-900"></span>
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-bold font-display leading-tight">
              AI Concierge
            </span>
            <span className="block text-[10px] text-accent-200 font-sans">
              6 Indic Languages
            </span>
          </div>
        </button>
      )}

      {/* Slide-Up / Expanded Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[440px] h-[600px] max-h-[92vh] bg-surface rounded-2xl shadow-2xl border border-neutral-300 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary-900 via-primary-800 to-terracotta text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent-500/20 border border-accent-400/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent-300" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold leading-tight flex items-center gap-1.5">
                  TravelSathi Concierge
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-forest-700 text-forest-100 font-semibold">
                    DPI Verified
                  </span>
                </h3>
                <span className="text-[10px] text-accent-200 font-sans">
                  Grounded in 12,293 POIs
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language Switcher Dropdown */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-[11px] font-bold bg-primary-950/80 text-white rounded-lg px-2 py-1 border border-primary-700 focus:outline-hidden cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-neutral-900 text-white">
                    {l.label}
                  </option>
                ))}
              </select>

              {/* Clear Chat Button */}
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-primary-700/50 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-primary-700/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sand-50/40 text-xs">
            {messages.map((msg, index) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} space-y-1.5`}
                >
                  <div className="flex items-start gap-2 max-w-[88%]">
                    {isAssistant && (
                      <div className="w-6 h-6 rounded-full bg-primary-100 border border-primary-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-primary-800" />
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed shadow-xs ${
                        isAssistant
                          ? 'bg-white text-neutral-900 border border-neutral-200/90 rounded-tl-xs'
                          : 'bg-primary-800 text-white rounded-tr-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line text-xs">{msg.text}</p>

                      {/* Text-to-Speech Audio Playback Button */}
                      {isAssistant && (
                        <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-neutral-100 text-[10px] text-neutral-500">
                          <button
                            type="button"
                            onClick={() => handleSpeak(msg.text, index)}
                            className="flex items-center gap-1 hover:text-primary-800 transition-colors font-medium"
                          >
                            {isSpeaking && activeSpeechIndex === index ? (
                              <>
                                <VolumeX className="w-3 h-3 text-red-600 animate-pulse" />
                                <span className="text-red-600">Stop Speaking</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 text-primary-700" />
                                <span>Listen in {LANGUAGES.find((l) => l.code === language)?.label.split(' ')[0]}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grounded Referenced POI Cards inside Assistant response */}
                  {isAssistant && msg.referenced_pois && msg.referenced_pois.length > 0 && (
                    <div className="w-full pl-8 pr-2 space-y-2 pt-1">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                        Verified Grounding POIs:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.referenced_pois.map((poi, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-primary-300 shadow-xs transition-all"
                          >
                            {poi.image_url && (
                              <img
                                src={poi.image_url}
                                alt={poi.name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-neutral-100 border border-neutral-200"
                                onError={(e) => {
                                  e.target.src =
                                    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80';
                                }}
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h5 className="font-bold text-neutral-900 text-xs truncate">
                                  {poi.name}
                                </h5>
                                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                  {poi.rating}
                                </span>
                              </div>

                              <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                <span className="truncate">{poi.state}</span>
                                <span>•</span>
                                <span className="font-medium text-forest-800">
                                  {poi.price_range || poi.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator Spinner */}
            {isLoading && (
              <div className="flex items-center gap-2 text-neutral-500 text-xs pl-8">
                <span className="animate-spin text-sm">⏳</span>
                <span>TravelSathi AI is retrieving authentic guidance...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Suggestion Pills */}
          {suggestedPrompts.length > 0 && (
            <div className="px-3 py-2 bg-white border-t border-neutral-200 overflow-x-auto scrollbar-none flex items-center gap-1.5">
              {suggestedPrompts.slice(0, 3).map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => handleSendMessage(prompt.query)}
                  className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sand-100 text-primary-950 border border-sand-200 hover:bg-accent-100 hover:border-accent-300 transition-colors"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer Bar */}
          <div className="p-3 bg-white border-t border-neutral-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              {/* Web Speech Voice Toggle Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-red-500 text-white border-red-600 animate-pulse'
                    : 'bg-sand-100 text-primary-900 border-neutral-200 hover:bg-sand-200'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Click to speak in your language'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening... speak now...'
                    : language === 'hi'
                    ? 'हिंदी में प्रश्न पूछें...'
                    : language === 'bn'
                    ? 'বাংলায় প্রশ্ন জিজ্ঞাসা করুন...'
                    : 'Ask in English or Indic languages...'
                }
                className="flex-1 text-xs py-2 px-3 rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-primary-700 bg-neutral-50"
              />

              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 transition-colors"
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
