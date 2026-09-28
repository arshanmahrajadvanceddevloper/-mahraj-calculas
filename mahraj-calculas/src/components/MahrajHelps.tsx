import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  RefreshCw, 
  StopCircle,
  Radio,
  Eye,
  Loader2,
  Camera,
  Image as ImageIcon,
  SwitchCamera,
  Maximize2,
  FileText,
  Scan,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Play,
  Check,
  Globe,
  SlidersHorizontal,
  Copy,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../FirebaseProvider';
import { GeminiFormattedText } from './GeminiFormattedText';
import { InteractiveAstraWallpaper } from './InteractiveAstraWallpaper';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string;
  timestamp: Date;
}

interface MahrajHelpsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: any;
}

export function MahrajHelps({ isOpen, onClose, currentTheme }: MahrajHelpsProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Greetings, ${profile?.displayName || 'Scholar'}! I am Mahraj helps — your universal AI assistant. You can type any question, speak via the mic, or use Camera 📷 / Gallery 🖼️ to solve question papers, formulas, and scan documents.`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Voice Selection & Studio States
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<'female' | 'male'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mahraj_voice_gender') as 'female' | 'male') || 'female';
    }
    return 'female';
  });
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<'female' | 'male' | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Image & Camera States
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);

  // Voice Conversation States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isReadingScreen, setIsReadingScreen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeAudioContextRef = useRef<AudioContext | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isVoiceModeRef = useRef(false);
  isVoiceModeRef.current = voiceModeActive;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Stop all active audio playback safely
  const stopAllSpeech = useCallback(() => {
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.stop();
      } catch (_) {}
      activeAudioSourceRef.current = null;
    }
    if (activeAudioContextRef.current) {
      try {
        activeAudioContextRef.current.close();
      } catch (_) {}
      activeAudioContextRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }

    activeUtteranceRef.current = null;
    setIsSpeaking(false);
    setIsReadingScreen(false);
    setIsPlayingPreview(null);
    setSpeakingMessageId(null);
  }, []);

  // Native Web Speech Fallback with Multilingual & Native Accent adaptation
  const playNativeTTS = useCallback((text: string, onComplete?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onComplete) onComplete();
      return;
    }

    stopAllSpeech();
    setIsSpeaking(true);

    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*#_`~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/(\d+)\s*\+\s*(\d+)/g, '$1 plus $2')
      .replace(/(\d+)\s*-\s*(\d+)/g, '$1 minus $2')
      .replace(/(\d+)\s*\*\s*(\d+)/g, '$1 times $2')
      .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 divided by $2')
      .replace(/(\d+)\s*=\s*(\d+)/g, '$1 equals $2')
      .replace(/\n+/g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const isHindi = /[\u0900-\u097F]/.test(cleanText);
    const isUrduOrArabic = /[\u0600-\u06FF]/.test(cleanText);
    const isRomanHindiUrdu = /\b(hai|hain|kya|karein|kaise|karna|hota|hoti|hote|suno|bilkul|bhai|sakte|chahiye|batao|aap|hum|apne|isko|kuch|bahut|acha|accha|shukriya|namaste|salaam)\b/i.test(cleanText);

    let matchingVoices = voices.filter(v => {
      if (isHindi) return v.lang.startsWith('hi') || v.lang.includes('IN');
      if (isUrduOrArabic) return v.lang.startsWith('ur') || v.lang.startsWith('ar');
      if (isRomanHindiUrdu) return v.lang.includes('IN') || v.lang.startsWith('hi') || v.name.includes('India');
      return v.lang.startsWith('en');
    });

    if (matchingVoices.length === 0) {
      matchingVoices = voices;
    }

    let voice = null;
    if (selectedVoiceGender === 'female') {
      voice = matchingVoices.find(v => /female|woman|zira|samantha|swara|lekha|kavya|veena|heera|priya|neerja|victoria|karen/i.test(v.name))
        || matchingVoices.find(v => !/male|man|david|george|daniel|hemant|madhur|rishi|prabhat/i.test(v.name))
        || matchingVoices[0];
    } else {
      voice = matchingVoices.find(v => /male|man|david|george|daniel|hemant|madhur|rishi|prabhat|alex|fred/i.test(v.name))
        || matchingVoices[0];
    }

    if (voice) utterance.voice = voice;

    // Smooth, sweet & natural tone fine-tuning
    if (selectedVoiceGender === 'female') {
      utterance.rate = 0.96;
      utterance.pitch = 1.05;
    } else {
      utterance.rate = 0.94;
      utterance.pitch = 0.92;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      activeUtteranceRef.current = null;
      if (onComplete) onComplete();
      if (isVoiceModeRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      activeUtteranceRef.current = null;
      if (onComplete) onComplete();
    };

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      if (onComplete) onComplete();
    }
  }, [stopAllSpeech, selectedVoiceGender]);

  // Play Raw PCM Audio with anti-harshness filter & soft gain envelope
  const playPCMAudio = useCallback(async (base64Data: string, fallbackText: string, onEndedCallback?: () => void) => {
    try {
      stopAllSpeech();
      setIsSpeaking(true);

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const buffer = bytes.buffer;
      const int16Array = new Int16Array(buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      if (activeAudioContextRef.current) {
        try {
          activeAudioContextRef.current.close();
        } catch (_) {}
        activeAudioContextRef.current = null;
      }

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      activeAudioContextRef.current = audioCtx;

      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Soft Warm Filter & Fade Envelope for velvety audio
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 14500;

      const gainNode = audioCtx.createGain();
      const duration = float32Array.length / 24000;
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.03);
      if (duration > 0.07) {
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime + duration - 0.03);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
      }

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      source.onended = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        activeAudioSourceRef.current = null;
        if (onEndedCallback) {
          onEndedCallback();
        }
        if (isVoiceModeRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (_) {}
        }
      };

      activeAudioSourceRef.current = source;
      source.start(0);
    } catch (err) {
      playNativeTTS(fallbackText, onEndedCallback);
    }
  }, [stopAllSpeech, playNativeTTS]);

  // Master Voice Speaker with Gender & Native Accent Support (Instant zero-delay response)
  const speakTextWithVoice = useCallback((text: string, onComplete?: () => void) => {
    stopAllSpeech();
    // Zero network latency, instant natural speech playback
    playNativeTTS(text, onComplete);
  }, [stopAllSpeech, playNativeTTS]);

  // Voice Sample Preview Player (Instant playback)
  const handlePlayVoicePreview = (gender: 'female' | 'male') => {
    if (isPlayingPreview) {
      stopAllSpeech();
      setIsPlayingPreview(null);
      return;
    }

    setSelectedVoiceGender(gender);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahraj_voice_gender', gender);
    }
    setIsPlayingPreview(gender);

    const sampleText = gender === 'female' 
      ? 'Namaste! Main Mahraj female voice hoon. Main aapke sawalon ka foran jawab dene ke liye tayyar hoon.'
      : 'Greetings! Main Mahraj male voice hoon. Main aapke har sawal aur equation ko instant solve kar sakta hoon.';

    playNativeTTS(sampleText, () => setIsPlayingPreview(null));
  };

  // Read screen text aloud with Mahraj Voice
  const readScreenTextWithGeminiVoice = async () => {
    if (isReadingScreen || isSpeaking) {
      stopAllSpeech();
      return;
    }

    const calcDisplay = document.querySelector('[data-calculator-display]')?.textContent || '';
    const formulaDisplay = document.querySelector('[data-calculator-formula]')?.textContent || '';
    const textToRead = [formulaDisplay, calcDisplay].filter(Boolean).join('. Result is: ');

    if (!textToRead.trim()) {
      playNativeTTS('Calculator display is empty.');
      return;
    }

    setIsReadingScreen(true);
    speakTextWithVoice(`Screen calculation: ${textToRead}`, () => setIsReadingScreen(false));
  };

  // Copy text helper
  const handleCopyText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  // Image Processing & Compression Helper
  const processImageFile = useCallback((file: File | Blob) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          setAttachedImage(compressed);
        } else {
          setAttachedImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraStarting(false);
    setCameraError(null);
  }, []);

  // Start live camera viewfinder
  const startCamera = useCallback(async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    setIsCameraStarting(true);
    setIsCameraOpen(true);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Direct camera is not accessible in this browser. Please use the Upload button or native camera.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraStarting(false);
    } catch (err: any) {
      console.warn('Live camera error:', err);
      setCameraError(err.message || 'Unable to access camera.');
      setIsCameraStarting(false);
    }
  }, [cameraFacingMode]);

  // Switch front/back camera
  const switchCameraFacing = async () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    await startCamera(nextMode);
  };

  // Capture photo from live camera canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (cameraFacingMode === 'user') {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAttachedImage(dataUrl);
      }
      stopCamera();
    } catch (e) {
      console.error('Error capturing photo:', e);
    }
  };

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript, true); // Voice Input triggers automatic voice response!
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      stopCamera();
      stopAllSpeech();
    };
  }, [stopCamera, stopAllSpeech]);

  // Pre-load speech synthesis voices on component mount for zero-latency instant speech
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      };
    }
  }, []);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      stopAllSpeech();
      setIsVoiceMenuOpen(false);
    }
  }, [isOpen, stopCamera, stopAllSpeech]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Toggle Continuous Hands-Free Voice Mode
  const toggleVoiceMode = () => {
    if (voiceModeActive) {
      setVoiceModeActive(false);
      stopAllSpeech();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    } else {
      setVoiceModeActive(true);
      stopAllSpeech();
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (_) {}
      }
    }
  };

  // Toggle Single-shot Voice Input
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      stopAllSpeech();
      recognitionRef.current.start();
    }
  };

  // Clear Chat Log
  const handleClearChat = () => {
    stopAllSpeech();
    setAttachedImage(null);
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        content: `Session refreshed. Ready for our next inquiry, ${profile?.displayName || 'Scholar'}! Ask any question, or upload/capture a document or question paper to solve.`,
        timestamp: new Date()
      }
    ]);
  };

  // Stop ongoing AI calculation immediately
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (_) {}
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    stopAllSpeech();
  };

  // Submit text, image, or voice message to Mahraj server API
  // isVoiceInput: If true (asked by voice), AI responds in voice. If false (asked by typing), AI responds in text only.
  const handleSendMessage = async (textToSend?: string, isVoiceInput: boolean = voiceModeActive) => {
    const text = (textToSend || inputText).trim();
    if (!text && !attachedImage) return;

    const currentImageToSend = attachedImage;
    setAttachedImage(null);

    if (!textToSend) {
      setInputText('');
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    stopAllSpeech();

    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch (_) {}
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: text || (currentImageToSend ? 'Please analyze this image, solve any questions or equations, or scan this document.' : ''),
      image: currentImageToSend || undefined,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsGenerating(true);

    // Lightweight, ultra-fast payload: Only attach the image for the current active query!
    // Historical messages retain their text answers without re-uploading massive base64 payloads
    const boundedPayload = updatedMessages.slice(-6).map((m, idx, arr) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content.slice(0, 3000) : '',
      image: idx === arr.length - 1 ? m.image : undefined,
    }));

    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 35000);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: boundedPayload,
          voiceEnabled: isVoiceInput
        })
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred.');
      }

      const modelMsg: Message = {
        id: Math.random().toString(),
        role: 'model',
        content: data.text || 'Unable to generate response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMsg]);

      // Smart Voice Output Rule:
      // If user asked via voice (Mic or Hands-Free mode), automatically speak reply.
      // If user typed text, reply only in text (user can click Read button if they want to listen).
      if (isVoiceInput && data.text) {
        setSpeakingMessageId(modelMsg.id);
        speakTextWithVoice(data.text, () => setSpeakingMessageId(null));
      }

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setMessages(prev => [
          ...prev,
          {
            id: 'abort-' + Math.random(),
            role: 'model',
            content: 'Task paused. The calculation was safely halted.',
            timestamp: new Date()
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: 'error-' + Math.random(),
            role: 'model',
            content: `Connection issue: ${err.message || 'Please try again.'}`,
            timestamp: new Date()
          }
        ]);
        if (isVoiceInput) {
          playNativeTTS('Connection issue, please try again.');
        }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Quick Action Preset helper (typed question, no auto-voice)
  const handleQuickAction = (promptText: string) => {
    setInputText(promptText);
    handleSendMessage(promptText, false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", damping: 28, stiffness: 240 }}
          className="absolute inset-0 z-50 bg-[#06060a] flex flex-col justify-between overflow-hidden"
        >
          {/* Live Interactive GPT Astra 6 Mouse-Tracking Wallpaper */}
          <InteractiveAstraWallpaper className="z-0" />

          {/* Clean Minimal Header */}
          <div className="px-4 py-3.5 flex justify-between items-center bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900/80 shrink-0 relative z-20 shadow-sm">
            <div className="flex items-center gap-2">
              <img 
                src="/app-logo.png" 
                alt="Mahraj Logo" 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-contain border border-zinc-800 shadow-sm"
              />
              <div>
                <h3 className="font-bold text-white text-sm leading-none flex items-center gap-1.5">
                  Mahraj helps
                  {voiceModeActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Voice Studio & Selection Button (Male/Female & Live Conversation) */}
              <button 
                onClick={() => setIsVoiceMenuOpen(prev => !prev)}
                className={`h-8 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all relative ${
                  voiceModeActive 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse' 
                    : isVoiceMenuOpen
                    ? 'bg-zinc-800 text-white border-zinc-700'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 active:scale-95'
                }`}
                title="Voice Studio: Select Male/Female Voice & Accent"
              >
                <Radio size={13} className={voiceModeActive ? 'animate-spin text-emerald-400' : 'text-cyan-400'} />
                <span className="text-[10px] uppercase tracking-wide flex items-center gap-1">
                  <span>Voice</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-normal ${
                    selectedVoiceGender === 'female' 
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {selectedVoiceGender === 'female' ? '👩 Female' : '👨 Male'}
                  </span>
                </span>
              </button>

              {/* Close Button */}
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:text-white flex items-center justify-center text-zinc-400 hover:border-zinc-700 transition-colors"
                title="Close Mahraj helps"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* VOICE STUDIO SELECTION POPOVER */}
          <AnimatePresence>
            {isVoiceMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute top-14 right-2 sm:right-4 left-2 sm:left-auto sm:w-96 z-50 bg-zinc-950/98 border border-zinc-800 rounded-2xl shadow-2xl p-4 backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none">Mahraj Voice Studio</h4>
                      <span className="text-[10px] text-zinc-400">Smooth Multilingual & Accent Engine</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVoiceMenuOpen(false)}
                    className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Multilingual & Accent Auto-Sync Info Badge */}
                <div className="mt-3 p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-900/30 flex items-start gap-2">
                  <Globe size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    <strong className="text-cyan-300 font-semibold">Native Accent Sync:</strong> AI automatically speaks in the exact language (Hindi, Roman Urdu, Urdu, English) with natural intonation.
                  </p>
                </div>

                {/* Voice Gender Selection Cards */}
                <div className="mt-3 space-y-2">
                  {/* Female Voice Card */}
                  <div 
                    onClick={() => {
                      setSelectedVoiceGender('female');
                      localStorage.setItem('mahraj_voice_gender', 'female');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedVoiceGender === 'female'
                        ? 'bg-pink-950/20 border-pink-500/50 shadow-[0_0_15px_rgba(244,114,182,0.15)]'
                        : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                        selectedVoiceGender === 'female' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        👩
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">Female Voice</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 font-medium">Smooth & Melodious</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Ultra-sweet, calming, soothing cadence</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVoicePreview('female');
                        }}
                        className={`h-7 px-2.5 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all ${
                          isPlayingPreview === 'female'
                            ? 'bg-pink-500 text-black border-pink-400 font-bold'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                        }`}
                        title="Play audio sample"
                      >
                        {isPlayingPreview === 'female' ? <StopCircle size={12} className="animate-spin" /> : <Play size={11} />}
                        <span>{isPlayingPreview === 'female' ? 'Playing' : 'Listen'}</span>
                      </button>

                      {selectedVoiceGender === 'female' && (
                        <div className="w-5 h-5 rounded-full bg-pink-500 text-black flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Male Voice Card */}
                  <div 
                    onClick={() => {
                      setSelectedVoiceGender('male');
                      localStorage.setItem('mahraj_voice_gender', 'male');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedVoiceGender === 'male'
                        ? 'bg-blue-950/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                        : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                        selectedVoiceGender === 'male' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        👨
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">Male Voice</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-medium">Deep & Velvety</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Warm, reassuring studio baritone tone</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVoicePreview('male');
                        }}
                        className={`h-7 px-2.5 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all ${
                          isPlayingPreview === 'male'
                            ? 'bg-blue-500 text-black border-blue-400 font-bold'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                        }`}
                        title="Play audio sample"
                      >
                        {isPlayingPreview === 'male' ? <StopCircle size={12} className="animate-spin" /> : <Play size={11} />}
                        <span>{isPlayingPreview === 'male' ? 'Playing' : 'Listen'}</span>
                      </button>

                      {selectedVoiceGender === 'male' && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-black flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Continuous Hands-Free Voice Conversation Mode Toggle */}
                <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Continuous Voice Chat</span>
                    <span className="text-[10px] text-zinc-400">Speak hands-free with real-time replies</span>
                  </div>
                  <button
                    onClick={toggleVoiceMode}
                    className={`h-8 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      voiceModeActive
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Radio size={12} className={voiceModeActive ? 'animate-spin' : ''} />
                    <span>{voiceModeActive ? 'Active' : 'Turn ON'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Voice Conversation Banner (Listening or Speaking HUD) */}
          {(isSpeaking || isListening || isGenerating) && (
            <div className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/80 px-4 py-2 flex items-center justify-between shrink-0 transform-gpu relative z-20">
              <div className="flex items-center gap-2.5">
                {isListening ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                      Listening... Speak now (All Languages)
                    </span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${selectedVoiceGender === 'female' ? 'bg-pink-400' : 'bg-blue-400'}`}></span>
                    <span className={`text-xs font-semibold ${selectedVoiceGender === 'female' ? 'text-pink-400' : 'text-blue-400'}`}>
                      Mahraj ({selectedVoiceGender === 'female' ? 'Female' : 'Male'}) is speaking...
                    </span>
                    <div className="flex items-end gap-[3px] h-3 ml-1">
                      {[1, 2, 4, 3, 5, 2, 4, 1].map((h, i) => (
                        <span 
                          key={i} 
                          className={`w-[2px] rounded-full animate-pulse ${selectedVoiceGender === 'female' ? 'bg-pink-400' : 'bg-blue-400'}`}
                          style={{ height: `${h * 2.5}px`, animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-spin"></span>
                    <span className="text-xs font-semibold text-zinc-400">Analyzing & calculating...</span>
                  </>
                )}
              </div>

              {isSpeaking && (
                <button 
                  onClick={stopAllSpeech}
                  className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md hover:bg-red-500/20 font-semibold uppercase tracking-wide flex items-center gap-1 transition-colors"
                >
                  <StopCircle size={11} />
                  Mute
                </button>
              )}
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-transparent relative z-10">
            {messages.map((msg, msgIdx) => (
              <div 
                key={msg.id ? `${msg.id}-${msgIdx}` : `msg-${msgIdx}`} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? `${currentTheme.bg} text-black font-semibold shadow-md`
                      : 'bg-zinc-950/75 backdrop-blur-md border border-zinc-800/80 text-zinc-200 shadow-xl'
                  }`}
                >
                  {/* Attached Image Thumbnail */}
                  {msg.image && (
                    <div className="mb-2 relative rounded-xl overflow-hidden border border-black/20 group">
                      <img 
                        src={msg.image} 
                        alt="Question Paper or Document" 
                        className="max-h-64 w-auto rounded-xl object-contain cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setPreviewingImage(msg.image || null)}
                      />
                      <button
                        onClick={() => setPreviewingImage(msg.image || null)}
                        className="absolute bottom-1.5 right-1.5 bg-black/70 hover:bg-black text-white p-1 rounded-lg backdrop-blur-sm opacity-90 transition-opacity"
                        title="View Full Image"
                      >
                        <Maximize2 size={13} />
                      </button>
                    </div>
                  )}

                  <GeminiFormattedText content={msg.content} isUser={msg.role === 'user'} />
                </div>

                {/* Actions Bar Directly Below AI Response Text */}
                {msg.role === 'model' ? (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 px-1">
                    {/* Timestamp */}
                    <span className="text-[9px] text-zinc-600 font-mono mr-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* 1. Read / Listen Button (With selected Female/Male natural voice) */}
                    <button
                      onClick={() => {
                        if (isSpeaking && speakingMessageId === msg.id) {
                          stopAllSpeech();
                          setSpeakingMessageId(null);
                          return;
                        }
                        setSpeakingMessageId(msg.id);
                        speakTextWithVoice(msg.content, () => setSpeakingMessageId(null));
                      }}
                      className={`h-6 px-2 rounded-lg border text-[10px] font-medium flex items-center gap-1 transition-all ${
                        isSpeaking && speakingMessageId === msg.id
                          ? selectedVoiceGender === 'female' 
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm animate-pulse' 
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm animate-pulse'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                      title="Read aloud with Mahraj natural voice"
                    >
                      {isSpeaking && speakingMessageId === msg.id ? (
                        <>
                          <StopCircle size={10} className={selectedVoiceGender === 'female' ? 'text-pink-400' : 'text-blue-400'} />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={10} className={selectedVoiceGender === 'female' ? 'text-pink-400' : 'text-blue-400'} />
                          <span>Read ({selectedVoiceGender === 'female' ? 'Female' : 'Male'})</span>
                        </>
                      )}
                    </button>

                    {/* 2. Copy Button */}
                    <button
                      onClick={() => handleCopyText(msg.id, msg.content)}
                      className="h-6 px-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-[10px] font-medium flex items-center gap-1 transition-all"
                      title="Copy response text"
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check size={10} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={10} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* 3. Screen Reader Button */}
                    <button
                      onClick={readScreenTextWithGeminiVoice}
                      className={`h-6 px-2 rounded-lg border text-[10px] font-medium flex items-center gap-1 transition-all ${
                        isReadingScreen
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                      title="Read calculator display aloud"
                    >
                      {isReadingScreen ? <Loader2 size={10} className="animate-spin text-cyan-400" /> : <Eye size={10} />}
                      <span>Screen</span>
                    </button>

                    {/* 4. Reset Session Button */}
                    <button
                      onClick={handleClearChat}
                      className="h-6 px-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 text-[10px] font-medium flex items-center gap-0.5 transition-all"
                      title="Reset chat session"
                    >
                      <RefreshCw size={9} />
                      <span>Reset</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 px-1">
                    <span className="text-[9px] text-zinc-600 font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isGenerating && (
              <div className="flex flex-col items-start">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-cyan-400" />
                  <span className="text-xs text-zinc-300">Mahraj is analyzing & solving...</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached Image Tray & Quick Suggestion Chips */}
          {attachedImage && (
            <div className="px-3.5 pt-2.5 pb-1.5 bg-zinc-950/95 border-t border-zinc-850 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <img 
                    src={attachedImage} 
                    alt="Attached preview" 
                    className="w-14 h-14 object-cover rounded-xl border-2 border-emerald-500 shadow-md cursor-pointer"
                    onClick={() => setPreviewingImage(attachedImage)}
                  />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white p-0.5 rounded-full shadow-lg transition-transform active:scale-90"
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                    <CheckCircle2 size={13} />
                    <span>Photo ready for analysis</span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                    <button
                      onClick={() => handleQuickAction("Solve this question paper completely step-by-step with all explanations, formulas, and correct answers.")}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500 text-zinc-300 hover:text-white shrink-0 flex items-center gap-1"
                    >
                      <BookOpen size={11} className="text-emerald-400" />
                      Solve Question Paper
                    </button>
                    <button
                      onClick={() => handleQuickAction("Extract the equation from this photo and give the complete step-by-step mathematical solution.")}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500 text-zinc-300 hover:text-white shrink-0 flex items-center gap-1"
                    >
                      <HelpCircle size={11} className="text-cyan-400" />
                      Solve Equation
                    </button>
                    <button
                      onClick={() => handleQuickAction("Scan this document: transcribe all text clearly, list all key data, and provide a clean summary.")}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500 text-zinc-300 hover:text-white shrink-0 flex items-center gap-1"
                    >
                      <FileText size={11} className="text-amber-400" />
                      Scan Document
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processImageFile(file);
              e.target.value = '';
            }}
          />
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={nativeCameraInputRef} 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processImageFile(file);
              e.target.value = '';
            }}
          />

          {/* Footer Input Bar */}
          <div className="p-3 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900/80 shrink-0 flex items-center gap-1.5 sm:gap-2 relative z-20 shadow-lg">
            {/* Live Camera Button */}
            <button
              onClick={() => startCamera('environment')}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all shrink-0"
              title="Open Camera Scanner"
            >
              <Camera size={18} />
            </button>

            {/* Gallery Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all shrink-0"
              title="Add Image from Gallery"
            >
              <ImageIcon size={18} />
            </button>

            {/* Mic Button (Voice Input) */}
            <button
              onClick={toggleListening}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                isListening 
                  ? 'bg-red-500 text-white border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700 active:scale-95'
              }`}
              title={isListening ? "Stop listening" : "Tap to speak in English, Hindi, or Urdu"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Input field */}
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                handleSendMessage(undefined, false); // Text input sends text-only (no auto-voice)
              }}
              className="flex-1 flex gap-1.5 sm:gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  attachedImage 
                    ? "Add a note or hit send to analyze..." 
                    : isListening 
                    ? "Listening... (speak now)" 
                    : "Ask Mahraj, solve question paper..."
                }
                className="flex-1 min-w-0 bg-zinc-900 text-white border border-zinc-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-600"
                disabled={isGenerating}
              />
              
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-all shrink-0 active:scale-95 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                  title="Stop generating"
                >
                  <StopCircle size={17} className="animate-pulse" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim() && !attachedImage}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    inputText.trim() || attachedImage
                      ? `${currentTheme.bg} text-black shadow-md hover:brightness-110 active:scale-95`
                      : 'bg-zinc-900 text-zinc-700 border border-zinc-850 cursor-not-allowed'
                  }`}
                >
                  <Send size={15} />
                </button>
              )}
            </form>
          </div>

          {/* LIVE CAMERA VIEWFINDER MODAL */}
          <AnimatePresence>
            {isCameraOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 bg-black flex flex-col justify-between"
              >
                {/* Camera Top Bar */}
                <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
                  <div className="flex items-center gap-2">
                    <Scan className="text-emerald-400" size={18} />
                    <span className="text-white text-xs font-semibold tracking-wide uppercase">Document & Paper Scanner</span>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Viewfinder Center Area */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
                  {cameraError ? (
                    <div className="text-center p-6 max-w-xs">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                        <Camera size={24} />
                      </div>
                      <p className="text-white text-xs font-medium mb-1.5">Direct Camera Access</p>
                      <p className="text-zinc-400 text-[11px] mb-4">{cameraError}</p>
                      <button
                        onClick={() => {
                          stopCamera();
                          nativeCameraInputRef.current?.click();
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl active:scale-95 transition-all shadow-lg"
                      >
                        Open Phone Camera
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        autoPlay
                        muted
                        className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                      />
                      
                      {/* Document Scanner Guide Overlay */}
                      <div className="absolute inset-8 sm:inset-14 border-2 border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                        <div className="flex justify-between">
                          <span className="w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                          <span className="w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                        </div>
                        <p className="text-[11px] text-center text-white/80 font-medium drop-shadow bg-black/40 py-1 px-3 rounded-full mx-auto backdrop-blur-sm">
                          Align question paper, equation, or document
                        </p>
                        <div className="flex justify-between">
                          <span className="w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                          <span className="w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                        </div>
                      </div>

                      {isCameraStarting && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-white text-xs">
                          <Loader2 size={16} className="animate-spin text-emerald-400" />
                          <span>Initializing Camera...</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Camera Bottom Controls */}
                <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-around z-10">
                  {/* Flip Front/Rear Camera */}
                  <button
                    onClick={switchCameraFacing}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-all"
                    title="Switch Camera (Front/Rear)"
                  >
                    <SwitchCamera size={20} />
                  </button>

                  {/* Shutter Capture Button */}
                  <button
                    onClick={capturePhoto}
                    disabled={!!cameraError || isCameraStarting}
                    className="w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform shadow-2xl hover:scale-105"
                    title="Snap Photo"
                  >
                    <div className="w-full h-full bg-white rounded-full active:bg-zinc-300 transition-colors" />
                  </button>

                  {/* Fallback to Native Camera / Gallery */}
                  <button
                    onClick={() => {
                      stopCamera();
                      nativeCameraInputRef.current?.click();
                    }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-all"
                    title="Use Device Native Camera"
                  >
                    <ImageIcon size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FULL IMAGE ZOOM PREVIEW MODAL */}
          <AnimatePresence>
            {previewingImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-lg"
              >
                <div className="flex justify-between items-center z-10">
                  <span className="text-white text-xs font-semibold">Image Viewer</span>
                  <button
                    onClick={() => setPreviewingImage(null)}
                    className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-center overflow-auto p-2">
                  <img 
                    src={previewingImage} 
                    alt="Full Preview" 
                    className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl" 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
