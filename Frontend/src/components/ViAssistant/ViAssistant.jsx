import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessToken } from '../../services/authService';
import { getMyTrips } from '../../services/tripsService';
import {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation
} from '../../services/chatService';
import { getActivityContext, logActivity } from '../../services/activityService';
import { readCachedLocation, detectPreciseLocation, reverseGeocodeRobust } from '../../services/planMyDayService';
import ChatFlightResults from './ChatFlightResults';
import ChatHotelResults from './ChatHotelResults';
import ViConversionCard from './ViConversionCard';
import './ViAssistant.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderMarkdown = (raw) => {
  if (!raw) return '';
  const text = escapeHtml(raw);

  const lines = text.split('\n');
  const out = [];
  let inList = null;

  const closeList = () => {
    if (inList) { out.push(`</${inList}>`); inList = null; }
  };

  const inline = (s) =>
    s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(
      /(?:^|\s)\*([^*\s][^*]*?)\*(?=\s|$|[.,!?;:])/g,
      (m, p1) => m.replace(`*${p1}*`, `<em>${p1}</em>`)
    )
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`)
      .replace(/([\p{L}\p{N}])(<(?:strong|em|code|a)(?=[>\s]))/gu, '$1 $2')
      .replace(/(<\/(?:strong|em|code|a)>)([\p{L}\p{N}])/gu, '$1 $2');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      closeList();
      const level = h[1].length + 2;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    if (/^\s*[-*•]\s+/.test(line)) {
      if (inList !== 'ul') { closeList(); out.push('<ul>'); inList = 'ul'; }
      out.push(`<li>${inline(line.replace(/^\s*[-*•]\s+/, ''))}</li>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      if (inList !== 'ol') { closeList(); out.push('<ol>'); inList = 'ol'; }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      continue;
    }

    if (!line.trim()) {
      closeList();
      out.push('');
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('\n');
};

const extractJsonStringValue = (s) => {
  let result = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      const c = s[i + 1];
      if (c === 'n')       result += '\n';
      else if (c === 't')  result += '\t';
      else if (c === '"')  result += '"';
      else if (c === '\\') result += '\\';
      else if (c === 'r')  result += '\r';
      else                 result += c;
      i += 2;
    } else if (s[i] === '"') {
      break;
    } else {
      result += s[i];
      i++;
    }
  }
  return result;
};

const PROMPT_STARTERS = {
  before: [
    { icon: 'fa-suitcase', label: 'Build me a packing list', text: 'Build me a packing list for my upcoming trip' },
    { icon: 'fa-utensils', label: 'Best places to eat', text: 'What are the best places to eat at my destination?' },
    { icon: 'fa-landmark', label: 'Must-see experiences', text: 'What are the must-see experiences I should book in advance?' },
    { icon: 'fa-passport', label: 'Visa & documents', text: 'What documents and visa do I need for this trip?' },
    { icon: 'fa-money-bill-wave', label: 'Daily budget estimate', text: 'Estimate a realistic daily budget for my trip' },
    { icon: 'fa-cloud-sun', label: 'Weather & what to wear', text: 'What is the weather like, and what should I pack to wear?' }
  ],
  during: [
    { icon: 'fa-map-marker-alt', label: 'Nearby right now', text: 'What is worth seeing near me right now?' },
    { icon: 'fa-utensils', label: 'Dinner tonight', text: 'Suggest a great dinner spot near my stay tonight' },
    { icon: 'fa-bus', label: 'How to get around', text: 'What is the best way to get around the city?' },
    { icon: 'fa-exclamation-triangle', label: 'I need help', text: 'I need help — what should I do?' },
    { icon: 'fa-mug-hot', label: 'Best cafés to work', text: 'Find me good cafés to work from with WiFi' },
    { icon: 'fa-camera', label: 'Photo spots', text: 'Where are the best photo spots nearby?' }
  ],
  after: [
    { icon: 'fa-plane-departure', label: 'Plan my next trip', text: 'Help me plan my next adventure based on this one' },
    { icon: 'fa-images', label: 'Trip recap', text: 'Help me write a recap of my trip' },
    { icon: 'fa-star', label: 'Recommend somewhere new', text: 'Recommend a destination I would love based on my last trip' }
  ],
  planning: [
    { icon: 'fa-magic', label: 'Plan a perfect weekend', text: 'Plan a perfect 3-day weekend escape for me' },
    { icon: 'fa-heart', label: 'Romantic getaway', text: 'Suggest a romantic getaway for two' },
    { icon: 'fa-mountain', label: 'Adventure trip', text: 'Plan an adventure trip with hiking and great food' },
    { icon: 'fa-umbrella-beach', label: 'Beach vacation', text: 'Recommend a beach destination for next month' },
    { icon: 'fa-piggy-bank', label: 'Budget Europe', text: 'Plan a budget-friendly 7-day Europe trip' },
    { icon: 'fa-utensils', label: 'Food-focused trip', text: 'Plan a trip focused on amazing food and local culture' }
  ],
  guest: [
    { icon: 'fa-globe', label: 'Where should I go?', text: 'Where should I travel next? Help me decide.' },
    { icon: 'fa-suitcase-rolling', label: 'How to plan a trip', text: 'How do I plan a great trip from scratch?' },
    { icon: 'fa-money-bill-wave', label: 'Budget travel tips', text: 'Give me your best budget travel tips' },
    { icon: 'fa-passport', label: 'First international trip', text: 'I am planning my first international trip — what should I know?' }
  ]
};

const ViAssistant = () => {
  useTranslation();
  const { isAuthenticated, user } = useAuth();

  const [isOpen, setIsOpen]               = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [messages, setMessages]           = useState([]);
  const [inputMessage, setInputMessage]   = useState('');
  const [isTyping, setIsTyping]           = useState(false);
  const [isStreaming, setIsStreaming]     = useState(false);
  const [searchStatus, setSearchStatus]   = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const [userTrips, setUserTrips]         = useState([]);
  const [currentTrip, setCurrentTrip]     = useState(null);
  const [tripPhase, setTripPhase]         = useState('before');
  const [showTripPicker, setShowTripPicker] = useState(false);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversations, setConversations]               = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen]               = useState(false);

  const [activitySummary, setActivitySummary] = useState(null);
  const [liveLocation, setLiveLocation]       = useState(null);

  const [isRecording, setIsRecording]       = useState(false);
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [isVoiceMode, setIsVoiceMode]       = useState(false);
  const [voiceStatus, setVoiceStatus]       = useState('');
  const [playingMsgId, setPlayingMsgId]     = useState(null);
  const [speechError, setSpeechError]       = useState('');
  const [silenceCountdown, setSilenceCountdown] = useState(null);

  const messagesEndRef    = useRef(null);
  const messagesListRef   = useRef(null);
  const inputRef          = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const audioRef          = useRef(null);
  const stopTimeoutRef    = useRef(null);
  const requestAbortRef   = useRef(null);
  const tripPickerRef     = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const lastUserMessageRef  = useRef('');
  const audioCtxRef       = useRef(null);
  const animFrameRef      = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (isAuthenticated) {
      getActivityContext()
        .then(ctx => { if (ctx) setActivitySummary(ctx.summary || null); })
        .catch(() => {});
      logActivity({ type: 'chat', action: 'opened', title: 'Opened Vi assistant' });
    }

    try {
      const cached = readCachedLocation();
      const cachedLoc = cached?.location || null;
      if (cachedLoc && (cachedLoc.city || (typeof cachedLoc.lat === 'number'))) {
        setLiveLocation(cachedLoc);
      }
    } catch {}

    let cancelled = false;
    (async () => {
      try {
        const fix = await detectPreciseLocation({ targetAccuracyM: 80, hardTimeoutMs: 6000 });
        if (!fix || cancelled) return;
        const geo = await reverseGeocodeRobust(fix.lat, fix.lng).catch(() => null);
        if (cancelled) return;
        const next = {
          lat: fix.lat,
          lng: fix.lng,
          accuracy: fix.accuracy,
          city:         geo?.city         || null,
          country:      geo?.country      || null,
          neighborhood: geo?.neighborhood || null,
          label:        geo?.label        || null
        };
        if (next.city || next.label) setLiveLocation(next);
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [isOpen, isAuthenticated]);

  useEffect(() => { if (isAuthenticated && isOpen) loadUserTrips(); }, [isAuthenticated, isOpen]);

  useEffect(() => {
    if (currentTrip?.dates) {
      const today = new Date();
      const start = new Date(currentTrip.dates.start_date);
      const end   = new Date(currentTrip.dates.end_date);
      setTripPhase(today < start ? 'before' : today <= end ? 'during' : 'after');
    } else {
      setTripPhase('planning');
    }
  }, [currentTrip]);

  const loadUserTrips = async () => {
    try {
      const token    = getAccessToken();
      const response = await getMyTrips(token);
      if (response.success && response.data?.trips) {
        setUserTrips(response.data.trips);
        const now = new Date();
        const upcoming = response.data.trips.find(t => new Date(t.dates?.end_date) >= now);
        setCurrentTrip(prev => prev || upcoming || response.data.trips[0] || null);
      }
    } catch (err) {
      console.error('Error loading user trips:', err);
    }
  };

  useEffect(() => {
    if (!showTripPicker) return;
    const handler = (e) => {
      if (tripPickerRef.current && !tripPickerRef.current.contains(e.target)) {
        setShowTripPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTripPicker]);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingConversations(true);
      const token    = getAccessToken();
      const response = await getConversations(token);
      if (response.success) setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isOpen) return;
    if (isAuthenticated) loadConversations();
    else if (messages.length === 0) setMessages([makeWelcomeMessage()]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    if (conversations.length > 0 && messages.length === 0 && !activeConversationId) {
      loadConversationMessages(conversations[0].conversation_id);
    } else if (conversations.length === 0 && messages.length === 0) {
      setMessages([makeWelcomeMessage()]);
    }
  }, [conversations, isOpen, isAuthenticated]);

  const loadConversationMessages = async (convId) => {
    try {
      const token    = getAccessToken();
      const response = await getConversation(convId, token);
      if (response.success) {
        const msgs = response.data.messages.map((m, i) => ({
          id: `${convId}-${i}`,
          text: m.text,
          sender: m.role === 'assistant' ? 'bot' : 'user',
          timestamp: new Date(m.timestamp),
          type: m.type,
          quickReplies: m.quickReplies?.length > 0 ? m.quickReplies : undefined,
          results: m.results,
          resultsType: m.resultsType,
          providerStatus: m.providerStatus,
          conversion: m.conversion
        }));
        setMessages(msgs.length > 0 ? msgs : [makeWelcomeMessage()]);
        setActiveConversationId(convId);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setMessages([makeWelcomeMessage()]);
    }
  };

  const handleSelectConversation = (convId) => {
    if (convId === activeConversationId) return;
    cancelRequest();
    setMessages([]);
    loadConversationMessages(convId);
    setIsSidebarOpen(false);
  };

  const handleNewConversation = () => {
    cancelRequest();
    setMessages([makeWelcomeMessage()]);
    setActiveConversationId(null);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      const token = getAccessToken();
      await deleteConversation(convId, token);
      setConversations(prev => prev.filter(c => c.conversation_id !== convId));
      if (activeConversationId === convId) {
        setMessages([makeWelcomeMessage()]);
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const makeWelcomeMessage = () => {
    let text = '';

    if (!isAuthenticated || !user) {
      text = `Hi! 👋 I'm **Vi**, your Travel Partner. Ask me anything about destinations, packing, or trip planning — and sign in to save trips and unlock personalized help.`;
      return { id: 'welcome', text, sender: 'bot', timestamp: new Date(), type: 'welcome', isWelcome: true };
    }

    const firstName = user.name?.split(' ')[0] || 'there';
    text = `Hi ${firstName}! 👋 I'm **Vi**, your Travel Partner. `;

    const placeLabel = liveLocation?.neighborhood
      || liveLocation?.city
      || liveLocation?.label
      || null;
    if (placeLabel) {
      text += `I can see you're in **${placeLabel}** right now${liveLocation?.country ? `, ${liveLocation.country}` : ''} — happy to help with anything nearby. `;
    }

    if (currentTrip) {
      const dest = currentTrip.destination?.name || 'your destination';
      if (tripPhase === 'before') text += `\n\nI also see your upcoming trip to **${dest}** — I can help you prep, build a packing list, line up must-do experiences, or refine your itinerary day-by-day.`;
      else if (tripPhase === 'during') text += `\n\nHope you're enjoying **${dest}**! Ping me for nearby spots, directions, dinner picks, or anything that comes up on the ground.`;
      else text += `\n\nHow was **${dest}**? I can help you plan what's next, or capture memories from your trip.`;
    }

    const recentDest = activitySummary?.recentDestination;
    const interests  = activitySummary?.interests || [];
    if (!currentTrip && recentDest) {
      text += `\n\nYou were just exploring **${recentDest}** — want to keep building on that, or start something new?`;
    } else if (!currentTrip && interests.length) {
      text += `\n\nBased on what you've been exploring (${interests.slice(0, 3).join(', ')}), I can suggest your next move — just say the word.`;
    } else if (!currentTrip) {
      text += `Tell me what you're thinking — a beach getaway, a city break, a road trip — and I'll help you shape it.`;
    }

    return { id: 'welcome', text, sender: 'bot', timestamp: new Date(), type: 'welcome', isWelcome: true };
  };

  useEffect(() => {
    if (!isOpen) return;
    setMessages(prev => {
      if (!prev.length) return prev;
      if (prev.length === 1 && prev[0].isWelcome)
        return [makeWelcomeMessage()];
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveLocation, activitySummary, currentTrip, tripPhase]);

  const handleMessagesScroll = () => {
    const el = messagesListRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distFromBottom < 80;
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const cancelRequest = () => {
    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
      requestAbortRef.current = null;
    }
    setIsTyping(false);
    setIsStreaming(false);
  };

  const dispatchMessage = async (userText) => {
    cancelRequest();
    lastUserMessageRef.current = userText;
    shouldAutoScrollRef.current = true;

    setMessages(prev => {
      const stripped = prev.filter(m => !m.isWelcome);
      return [...stripped, { id: `u-${Date.now()}`, text: userText, sender: 'user', timestamp: new Date() }];
    });

    setIsTyping(true);
    const controller = new AbortController();
    requestAbortRef.current = controller;
    const token = isAuthenticated ? getAccessToken() : null;

    const body = { message: userText };
    if (currentTrip?.trip_id)  body.tripId = currentTrip.trip_id;
    if (activeConversationId)  body.conversationId = activeConversationId;
    if (liveLocation && (liveLocation.city || liveLocation.label || typeof liveLocation.lat === 'number')) {
      body.location = liveLocation;
    }

    // Guests have no server-side conversation record, so the backend has no
    // memory of anything said earlier in this chat unless we send it —
    // without this, every guest turn looked like the very first message.
    const recentHistory = messages
      .filter(m => !m.isWelcome && (m.sender === 'user' || m.sender === 'bot') && m.text)
      .slice(-16)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
        ...(m.sender === 'bot' && m.pendingSearch ? { pendingSearch: m.pendingSearch } : {})
      }));
    if (recentHistory.length) body.history = recentHistory;

    const streamMsgId = `b-${Date.now()}`;
    let rawBuffer  = '';
    let msgStart   = -1;
    let streamText = '';

    try {
      const response = await fetch(`${API_BASE}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let lineBuf = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuf += decoder.decode(value, { stream: true });
        const lines = lineBuf.split('\n');
        lineBuf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          let event;
          try { event = JSON.parse(payload); } catch { continue; }

          if (event.status === 'searching_flights') {
            setSearchStatus('Searching flights across sources…');
            continue;
          }

          if (event.status === 'searching_hotels') {
            setSearchStatus('Searching hotels across sources…');
            continue;
          }

          if (event.done) {
            setMessages(prev => prev.map(m =>
              m.id === streamMsgId
                ? {
                    ...m,
                    text: streamText || m.text,
                    type: event.type || 'general',
                    quickReplies: event.quickReplies?.length ? event.quickReplies : undefined,
                    results: event.results || undefined,
                    resultsType: event.resultsType || undefined,
                    providerStatus: event.providerStatus || undefined,
                    pendingSearch: event.pendingSearch || undefined,
                    conversion: event.conversion || undefined,
                    isStreaming: false
                  }
                : m
            ));
            setIsTyping(false);
            setIsStreaming(false);
            setSearchStatus(null);

            if (event.conversationId && event.conversationId !== activeConversationId) {
              setActiveConversationId(event.conversationId);
            }
            if (isVoiceMode && streamText) speakText(streamText, streamMsgId);
            if (isAuthenticated) {
              getConversations(token)
                .then(r => { if (r.success) setConversations(r.data.conversations || []); })
                .catch(() => {});
            }
            return;
          }

          if (event.error) throw new Error('Server stream error');

          if (event.delta) {
            rawBuffer += event.delta;
            setSearchStatus(null);

            if (msgStart === -1) {
              const match = rawBuffer.match(/"message"\s*:\s*"/);
              if (match) {
                msgStart = match.index + match[0].length;
                setIsTyping(false);
                setIsStreaming(true);
                setMessages(prev => {
                  if (prev.some(m => m.id === streamMsgId)) return prev;
                  return [...prev, { id: streamMsgId, text: '', sender: 'bot', timestamp: new Date(), type: 'general', isStreaming: true }];
                });
              }
            }

            if (msgStart !== -1) {
              streamText = extractJsonStringValue(rawBuffer.slice(msgStart));
              setMessages(prev => prev.map(m =>
                m.id === streamMsgId ? { ...m, text: streamText } : m
              ));
            }
          }
        }
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;

      console.error('Vi stream error:', err);
      setMessages(prev => {
        const withoutPlaceholder = prev.filter(m => !(m.id === streamMsgId && m.isStreaming));
        return [
          ...withoutPlaceholder,
          {
            id: `b-${Date.now()}`,
            text: "I'm having trouble reaching the server right now. Please try again in a moment.",
            sender: 'bot',
            timestamp: new Date(),
            type: 'error',
            isError: true
          }
        ];
      });
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      setSearchStatus(null);
      requestAbortRef.current = null;
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault?.();
    if (!inputMessage.trim() || isTyping) return;
    const text = inputMessage.trim();
    setInputMessage('');
    await dispatchMessage(text);
  };

  const sendVoiceMessage = async (text) => {
    if (!text || isTyping) return;
    await dispatchMessage(text);
  };

  const handleRegenerate = () => {
    if (!lastUserMessageRef.current) return;
    setMessages(prev => {
      const lastBotIdx = [...prev].reverse().findIndex(m => m.sender === 'bot' && !m.isWelcome);
      if (lastBotIdx === -1) return prev;
      const idx = prev.length - 1 - lastBotIdx;
      return prev.slice(0, idx);
    });
    dispatchMessage(lastUserMessageRef.current);
  };

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false); setPlayingMsgId(null);
  };

  const speakText = async (text, msgId = null) => {
    stopAudio();
    if (!text) return;
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^#{1,3}\s+/gm, '')
      .replace(/^[-*•]\s+/gm, '');

    try {
      setIsSpeaking(true);
      setPlayingMsgId(msgId);
      setVoiceStatus('Speaking...');

      const response = await fetch(`${API_BASE}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: 'nova' }),
      });
      if (!response.ok) throw new Error('TTS failed');

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false); setPlayingMsgId(null); setVoiceStatus('');
        URL.revokeObjectURL(url); audioRef.current = null;
        if (isVoiceMode) setTimeout(() => startRecording(), 800);
      };
      audio.onerror = () => {
        setIsSpeaking(false); setPlayingMsgId(null); setVoiceStatus(''); audioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false); setPlayingMsgId(null); setVoiceStatus('');
    }
  };

  const stopSilenceDetection = () => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    setSilenceCountdown(null);
  };

  const startSilenceDetection = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const THRESHOLD = 12;
      const DELAY_MS  = 3000;
      let hasSpoken    = false;
      let silenceStart = null;

      let lastCountdown = null;
      const tick = () => {
        if (!audioCtxRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;

        if (avg > THRESHOLD) {
          hasSpoken    = true;
          silenceStart = null;
          if (lastCountdown !== null) { lastCountdown = null; setSilenceCountdown(null); }
        } else if (hasSpoken) {
          if (!silenceStart) silenceStart = Date.now();
          const elapsed   = Date.now() - silenceStart;
          const remaining = Math.ceil((DELAY_MS - elapsed) / 1000);
          const next      = remaining > 0 ? remaining : null;
          if (next !== lastCountdown) { lastCountdown = next; setSilenceCountdown(next); }
          if (elapsed >= DELAY_MS) {
            stopSilenceDetection();
            stopRecording();
            return;
          }
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn('Silence detection unavailable:', e);
    }
  };

  const startRecording = async () => {
    if (isRecording) { stopRecording(); return; }
    setSpeechError('');
    setVoiceStatus('Listening...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setVoiceStatus('Transcribing...');
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        await transcribeAndSend(blob, mimeType || 'audio/webm');
      };
      recorder.start();
      setIsRecording(true);
      startSilenceDetection(stream);
      stopTimeoutRef.current = setTimeout(() => stopRecording(), 30000);
    } catch (err) {
      console.error('Mic error:', err);
      setSpeechError(err.name === 'NotAllowedError' ? 'Microphone access denied.' : 'Could not access microphone.');
      setVoiceStatus('');
    }
  };

  const stopRecording = () => {
    stopSilenceDetection();
    clearTimeout(stopTimeoutRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const transcribeAndSend = async (audioBlob, mimeType) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording.${mimeType.includes('ogg') ? 'ogg' : 'webm'}`);
      const response = await fetch(`${API_BASE}/api/voice/transcribe`, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.text) {
        setSpeechError('Could not understand audio. Please try again.');
        setVoiceStatus(''); return;
      }
      setVoiceStatus('');
      const transcribedText = data.text.trim();
      if (isVoiceMode) await sendVoiceMessage(transcribedText);
      else { setInputMessage(transcribedText); inputRef.current?.focus(); }
    } catch (err) {
      console.error('Transcription error:', err);
      setSpeechError('Transcription failed. Please try again.');
      setVoiceStatus('');
    }
  };

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      stopRecording(); stopAudio();
      setIsVoiceMode(false); setVoiceStatus('');
    } else {
      setIsVoiceMode(true);
      startRecording();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopSilenceDetection(); stopRecording(); stopAudio(); cancelRequest();
      setIsVoiceMode(false); setVoiceStatus(''); setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => () => {
    stopSilenceDetection(); stopRecording(); stopAudio(); cancelRequest();
    clearTimeout(stopTimeoutRef.current);
  }, []);

  const handleQuickReply = (reply) => {
    if (isTyping) return;
    dispatchMessage(reply);
  };

  const handleStarterClick = (text) => {
    if (isTyping) return;
    dispatchMessage(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const toggleChat = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      setTimeout(() => inputRef.current?.focus(), 300);
      if (isAuthenticated) setIsSidebarOpen(true);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      setIsOpen(true);
      setTimeout(() => {
        if (e.detail?.message) setInputMessage(e.detail.message);
        inputRef.current?.focus();
      }, 300);
      if (isAuthenticated) setIsSidebarOpen(true);
    };
    window.addEventListener('vi:open', handler);
    return () => window.removeEventListener('vi:open', handler);
  }, [isAuthenticated]);

  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleSwitchTrip = (trip) => {
    cancelRequest();
    setCurrentTrip(trip);
    setShowTripPicker(false);
    setMessages([makeWelcomeMessage()]);
    setActiveConversationId(null);
  };

  const starterKey = !isAuthenticated ? 'guest' : (currentTrip ? tripPhase : 'planning');
  const starters = PROMPT_STARTERS[starterKey] || PROMPT_STARTERS.planning;

  const lastBotMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'bot' && !messages[i].isWelcome) return messages[i].id;
    }
    return null;
  }, [messages]);

  const showStarters = messages.length > 0 && messages.every(m => m.isWelcome) && !isTyping;

  const micBtnClass = ['vi-mic-btn',
    isRecording ? 'vi-mic-btn--recording' : '',
    isVoiceMode ? 'vi-mic-btn--voice-mode' : '',
  ].filter(Boolean).join(' ');

  const windowClass = ['vi-window',
    isSidebarOpen ? 'vi-window--with-sidebar' : '',
    isFullscreen  ? 'vi-window--fullscreen'   : '',
  ].filter(Boolean).join(' ');

  return (
    <>

      <div className={`vi-button ${isOpen ? 'active' : ''}`} onClick={toggleChat} title="Chat with Vi">
        {!isOpen ? (
          <>
            <div className="vi-button-icon">
              <i className="fas fa-plane vi-btn-plane"></i>
              <span className="vi-logo">Vi</span>
            </div>
            <span className="vi-pulse"></span>
          </>
        ) : (
          <i className="fas fa-times"></i>
        )}
      </div>


      {isOpen && (
        <div className={windowClass}>


          {isSidebarOpen && (
            <div className="vi-sidebar">
              <div className="vi-sidebar__header">
                <span className="vi-sidebar__title">Conversations</span>
                <button className="vi-sidebar__new-btn" onClick={handleNewConversation} title="New conversation">
                  <i className="fas fa-plus"></i> New chat
                </button>
              </div>
              <div className="vi-sidebar__list">
                {isLoadingConversations ? (
                  <div className="vi-sidebar__loading">
                    <span className="vi-sidebar__loading-dots"><span/><span/><span/></span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="vi-sidebar__empty">No past conversations yet</div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.conversation_id}
                      className={`vi-sidebar__item${conv.conversation_id === activeConversationId ? ' vi-sidebar__item--active' : ''}`}
                      onClick={() => handleSelectConversation(conv.conversation_id)}
                    >
                      <div className="vi-sidebar__item-icon">
                        <i className="fas fa-comment-dots"></i>
                      </div>
                      <div className="vi-sidebar__item-body">
                        <span className="vi-sidebar__item-title">{conv.title}</span>
                        <span className="vi-sidebar__item-time">{formatRelativeTime(conv.last_message_at)}</span>
                      </div>
                      <button
                        className="vi-sidebar__item-delete"
                        onClick={(e) => handleDeleteConversation(e, conv.conversation_id)}
                        title="Delete conversation"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}


          <div className="vi-chat-main">


            <div className="vi-header">
              <div className="vi-header-content">
                {isAuthenticated && (
                  <button
                    className={`vi-btn-icon vi-btn-history${isSidebarOpen ? ' active' : ''}`}
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    title="Conversation history"
                  >
                    <i className="fas fa-history"></i>
                  </button>
                )}
                <div className="vi-avatar">
                  {isSpeaking ? (
                    <div className="vi-speaking-animation">
                      <span/><span/><span/><span/><span/>
                    </div>
                  ) : (
                    <i className="fas fa-plane-departure vi-avatar-icon"></i>
                  )}
                </div>
                <div className="vi-header-info">
                  <span className="vi-header-name">Vi <span className="vi-header-tag">Travel Partner</span></span>
                  <span className="vi-status">
                    <span className={`status-dot${isSpeaking ? ' speaking' : isRecording ? ' recording' : ''}`}></span>
                    {isSpeaking      ? 'Vi is speaking...'
                      : isRecording  ? (silenceCountdown !== null ? `🎙️ Sending in ${silenceCountdown}s…` : '🎙️ Listening...')
                      : isTyping     ? 'Vi is thinking...'
                      : isAuthenticated ? `Ready when you are, ${user?.name?.split(' ')[0] || 'traveler'} 🌍`
                      : 'Your Personal Travel Partner'}
                  </span>
                </div>
              </div>
              <div className="vi-header-actions">
                <button
                  className={`vi-btn-icon vi-voice-mode-btn${isVoiceMode ? ' active' : ''}`}
                  onClick={toggleVoiceMode}
                  title={isVoiceMode ? 'Exit voice mode' : 'Voice mode'}
                >
                  <i className={`fas ${isVoiceMode ? 'fa-phone-slash' : 'fa-phone'}`}></i>
                </button>
                <button
                  className="vi-btn-icon"
                  onClick={() => setIsFullscreen(p => !p)}
                  title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
                >
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                </button>
                <button className="vi-btn-icon" onClick={handleNewConversation} title="New conversation">
                  <i className="fas fa-edit"></i>
                </button>
                <button className="vi-btn-icon" onClick={toggleChat} title="Close chat">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>


            {isAuthenticated && (currentTrip || userTrips.length > 0) && (
              <div className="vi-trip-bar" ref={tripPickerRef}>
                <button
                  type="button"
                  className="vi-trip-bar__chip"
                  onClick={() => setShowTripPicker(p => !p)}
                  disabled={userTrips.length === 0}
                >
                  <i className={`fas ${tripPhase === 'during' ? 'fa-plane' : tripPhase === 'before' ? 'fa-calendar-check' : tripPhase === 'after' ? 'fa-flag-checkered' : 'fa-compass'}`}></i>
                  <span className="vi-trip-bar__text">
                    {currentTrip
                      ? <>
                          <strong>{currentTrip.destination?.name || 'Trip'}</strong>
                          <span className="vi-trip-bar__sub">
                            {tripPhase === 'before' ? ' · upcoming'
                              : tripPhase === 'during' ? ' · happening now'
                              : tripPhase === 'after' ? ' · past'
                              : ''}
                          </span>
                        </>
                      : <>Pick a trip to focus on</>
                    }
                  </span>
                  {userTrips.length > 0 && <i className="fas fa-chevron-down vi-trip-bar__caret"></i>}
                </button>
                {showTripPicker && userTrips.length > 0 && (
                  <div className="vi-trip-picker">
                    <div className="vi-trip-picker__title">Switch trip context</div>
                    {userTrips.map(t => (
                      <button
                        key={t.trip_id}
                        type="button"
                        className={`vi-trip-picker__item${currentTrip?.trip_id === t.trip_id ? ' vi-trip-picker__item--active' : ''}`}
                        onClick={() => handleSwitchTrip(t)}
                      >
                        <i className="fas fa-location-dot"></i>
                        <div className="vi-trip-picker__body">
                          <span className="vi-trip-picker__name">{t.destination?.name || 'Trip'}</span>
                          <span className="vi-trip-picker__dates">
                            {t.dates?.start_date} → {t.dates?.end_date}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}


            {isVoiceMode && (
              <div className="vi-voice-banner">
                <div className="vi-voice-banner__content">
                  <div className={`vi-voice-orb${isRecording ? ' vi-voice-orb--listening' : isSpeaking ? ' vi-voice-orb--speaking' : ''}`}>
                    <i className={`fas ${isSpeaking ? 'fa-volume-high' : 'fa-microphone'}`}></i>
                  </div>
                  <span className="vi-voice-banner__label">
                    {isRecording
                      ? (silenceCountdown !== null
                          ? `Sending in ${silenceCountdown}s…`
                          : 'Listening… speak now')
                      : isSpeaking
                        ? 'Vi is responding…'
                        : 'Voice mode — tap mic to speak'}
                  </span>
                </div>
              </div>
            )}


            {showDisclaimer && (
              <div className="vi-disclaimer">
                <div className="disclaimer-content">
                  <i className="fas fa-info-circle"></i>
                  <span>I give general travel guidance — always double-check critical details (prices, schedules, visa rules) before you book.</span>
                </div>
                <button className="disclaimer-close" onClick={() => setShowDisclaimer(false)} title="Got it">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}


            <div className="vi-messages" ref={messagesListRef} onScroll={handleMessagesScroll}>
              {messages.map((message) => {
                const isLastBot = message.id === lastBotMessageId;
                return (
                  <div key={message.id} className={`vi-message ${message.sender}${message.isError ? ' is-error' : ''}${message.isStreaming ? ' is-streaming' : ''}`}>
                    {message.sender === 'bot' && (
                      <div className="message-avatar">
                        <i className="fas fa-plane vi-msg-icon"></i>
                      </div>
                    )}
                    <div className="message-content">
                      {message.sender === 'bot'
                        ? (
                          <div
                            className="vi-md"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) || '<p class="vi-thinking-line">Thinking…</p>' }}
                          />
                        )
                        : <p className="vi-user-text">{message.text}</p>
                      }


                      {message.resultsType === 'flights' && message.results?.length > 0 && (
                        <ChatFlightResults
                          results={message.results}
                          providerStatus={message.providerStatus}
                          destination={message.results[0]?.destination}
                        />
                      )}

                      {message.resultsType === 'hotels' && message.results?.length > 0 && (
                        <ChatHotelResults
                          results={message.results}
                          providerStatus={message.providerStatus}
                          destination={message.results[0]?.location?.name}
                        />
                      )}

                      {message.sender === 'bot' && message.conversion && (
                        <ViConversionCard conversion={message.conversion} />
                      )}


                      {message.quickReplies && (
                        <div className="quick-replies">
                          {message.quickReplies.map((reply, idx) => (
                            <button
                              key={idx}
                              className="quick-reply-btn"
                              onClick={() => handleQuickReply(reply)}
                              disabled={isTyping || isStreaming}
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}


                      {message.sender === 'bot' && !message.isWelcome && !message.isStreaming && message.text && (
                        <div className="vi-msg-actions">
                          <button
                            className={`vi-msg-action${playingMsgId === message.id ? ' vi-msg-action--active' : ''}`}
                            onClick={() => playingMsgId === message.id ? stopAudio() : speakText(message.text, message.id)}
                            title={playingMsgId === message.id ? 'Stop audio' : 'Listen'}
                          >
                            <i className={`fas ${playingMsgId === message.id ? 'fa-stop' : 'fa-volume-up'}`}></i>
                          </button>
                          <button
                            className="vi-msg-action"
                            onClick={() => handleCopyMessage(message.text)}
                            title="Copy reply"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                          {isLastBot && (
                            <button
                              className="vi-msg-action"
                              onClick={handleRegenerate}
                              title="Regenerate reply"
                              disabled={isTyping || isStreaming}
                            >
                              <i className="fas fa-redo"></i>
                            </button>
                          )}
                        </div>
                      )}

                      <span className="message-time">
                        {message.timestamp instanceof Date
                          ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}


              {showStarters && (
                <div className="vi-starters">
                  <div className="vi-starters__title">Try asking Vi:</div>
                  <div className="vi-starters__grid">
                    {starters.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="vi-starter"
                        onClick={() => handleStarterClick(s.text)}
                        disabled={isTyping}
                      >
                        <span className="vi-starter__icon"><i className={`fas ${s.icon}`}></i></span>
                        <span className="vi-starter__label">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="vi-message bot typing">
                  <div className="message-avatar"><i className="fas fa-plane vi-msg-icon"></i></div>
                  <div className="message-content">
                    {searchStatus && <span className="vi-search-status">{searchStatus}</span>}
                    <div className="typing-indicator"><span/><span/><span/></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>


            <div className="vi-input-container">
              {(speechError || voiceStatus) && (
                <p className={`vi-speech-error${voiceStatus && !speechError ? ' vi-speech-status' : ''}`}>
                  <i className={`fas ${speechError ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
                  {speechError || voiceStatus}
                </p>
              )}


              {(isTyping || isStreaming) && (
                <button type="button" className="vi-stop-gen" onClick={cancelRequest}>
                  <i className="fas fa-stop"></i> Stop generating
                </button>
              )}

              <form onSubmit={handleSendMessage}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  className={`vi-input${isRecording ? ' vi-input--listening' : ''}`}
                  placeholder={
                    isRecording ? '🎙️ Recording — click mic to stop...'
                    : isVoiceMode ? '🔊 Voice mode active'
                    : isAuthenticated
                      ? (currentTrip
                          ? `Ask Vi about your trip to ${currentTrip.destination?.name || 'your destination'}…`
                          : 'Ask Vi anything — destinations, packing, itineraries…')
                      : 'Ask me about travel…'
                  }
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                  }}
                  onKeyDown={handleKeyPress}
                  disabled={isVoiceMode}
                />
                <button
                  type="button"
                  className={micBtnClass}
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? 'Stop recording' : 'Record voice message'}
                  disabled={isSpeaking}
                >
                  <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                  {isRecording && <span className="vi-mic-pulse"></span>}
                </button>
                <button
                  type="submit"
                  className="vi-send-btn"
                  disabled={!inputMessage.trim() || isTyping || isStreaming || isVoiceMode}
                  title="Send message"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
              <p className="vi-input-hint">
                {isVoiceMode
                  ? 'Voice mode — tap the phone icon in the header to exit'
                  : <>Press <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for newline · 🎙️ for voice</>}
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ViAssistant;
