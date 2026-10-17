import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom'; 
import {
  MessageSquare, Search, Send, Paperclip, MoreVertical,
  ArrowLeft, Check, CheckCheck, Phone, Video
} from 'lucide-react';

import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import defaultAvatar from '../../../assets/default-avatar.jpg';

const MessagesSection = () => {
  // =========================================================================
  // 1. HOOKS
  // =========================================================================
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0); // Pour limiter les requêtes de "typing"

  // =========================================================================
  // 2. ÉTATS
  // =========================================================================
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const currentUserId = useMemo(() => {
    return localStorage.getItem('userId') || localStorage.getItem('user_id') || '';
  }, []);

  // =========================================================================
  // 3. VARIABLES DÉRIVÉES
  // =========================================================================
  const activeConversation = useMemo(() => 
    conversations.find(c => c.id === activeConversationId), 
    [conversations, activeConversationId]
  );

  const { isOnline: activeUserIsOnline } = useOnlineStatus(activeConversation?.user?.id);

  // =========================================================================
  // 4. EFFETS (useEffect)
  // =========================================================================
  
  useEffect(() => {
    const conversationIdFromUrl = searchParams.get('conversation');
    if (conversationIdFromUrl) {
      setActiveConversationId(Number(conversationIdFromUrl));
      setShowChatOnMobile(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await apiClient.get('/dashboard/messages/conversations');
        setConversations(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Erreur chargement conversations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!conversations || conversations.length === 0) return;
    const userIds = conversations.map(c => c.user?.id).filter(Boolean);
    if (userIds.length === 0) return;

    const fetchAllUsersStatus = async () => {
      try {
        const response = await apiClient.post('/users/status/bulk', { user_ids: userIds });
        const statuses = response.data;
        setConversations(prevConversations => prevConversations.map(conv => {
          const status = statuses[conv.user?.id];
          if (status) {
            return { ...conv, user: { ...conv.user, status: status.is_online ? 'en_ligne' : 'hors_ligne' } };
          }
          return conv;
        }));
      } catch (error) {
        console.error("Erreur récupération statuts:", error);
      }
    };

    fetchAllUsersStatus();
    const intervalId = setInterval(fetchAllUsersStatus, 30000);
    return () => clearInterval(intervalId);
  }, [conversations.length]);

  useEffect(() => {
    if (!activeConversationId) return;
    const checkTyping = async () => {
      try {
        const response = await apiClient.get(`/dashboard/messages/${activeConversationId}/typing-status`);
        setIsOtherTyping(response.data.is_typing);
      } catch (err) { /* Ignorer silencieusement */ }
    };
    checkTyping();
    const typingInterval = setInterval(checkTyping, 1000);
    return () => clearInterval(typingInterval);
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      try {
        const response = await apiClient.get(`/dashboard/messages/${activeConversationId}`);
        const dataArray = Array.isArray(response.data) ? response.data : [];
        const formattedMessages = dataArray.map(msg => {
          const isMe = String(msg.sender_id) === String(currentUserId) || msg.is_mine === true;
          return {
            id: msg.id,
            senderId: isMe ? 'me' : 'other',
            text: msg.text || '',
            time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: msg.is_read ? 'lu' : 'envoyé'
          };
        });
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Erreur chargement messages:", err);
      }
    };
    
    fetchMessages();
    let intervalId = null;

    const startPolling = () => {
      if (document.visibilityState === 'visible') {
        intervalId = setInterval(fetchMessages, 4000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
        startPolling();
      } else {
        clearInterval(intervalId);
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeConversationId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversationId, isOtherTyping]);

  // =========================================================================
  // 5. GESTIONNAIRES D'ACTIONS
  // =========================================================================
  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setShowChatOnMobile(true);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setActiveConversationId(null);
    setSearchParams({});
  };

  // ✅ OPTIMISÉ : Limite les requêtes "typing" à 1 par seconde max
  const handleTyping = () => {
    if (!activeConversationId) return;

    const now = Date.now();
    // N'envoie la requête que si 1000ms (1 seconde) se sont écoulées depuis la dernière
    if (now - lastTypingSentRef.current > 1000) {
      apiClient.post(`/dashboard/messages/${activeConversationId}/typing`).catch(() => {});
      lastTypingSentRef.current = now;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Le statut expirera côté serveur après 3s si on arrête de taper
    typingTimeoutRef.current = setTimeout(() => {}, 2500);
  };

  const clearTypingStatus = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    clearTypingStatus();
    const messageText = newMessage;
    setNewMessage('');
    setIsSending(true);

    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderId: 'me',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "envoyé"
    };
    setMessages(prev => [...prev, tempMessage]);

    setConversations(prev => {
      const updated = prev.map(c => 
        c.id === activeConversationId 
          ? { ...c, lastMessage: messageText, timestamp: "À l'instant", lastMessageIsMine: true }
          : c
      );
      return [...updated].sort((a, b) => (a.id === activeConversationId ? -1 : 1));
    });

    try {
      const response = await apiClient.post(`/dashboard/messages/${activeConversationId}`, { text: messageText });
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? { ...m, id: response.data.id, status: "lu" } : m));
    } catch (err) {
      console.error("Erreur envoi message:", err);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [conversations, searchTerm]);

  // =========================================================================
  // 6. RENDU
  // =========================================================================
  if (isLoading && conversations.length === 0) {
    return (
      <div className="ls-msg-loading-wrapper">
        <Loader text="Chargement des messages..." fullScreen={false} size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="ls-msg-container"
    >
      <div className="ls-msg-layout">
        <div className={`ls-msg-sidebar ${showChatOnMobile ? 'ls-msg-sidebar--hidden-mobile' : ''}`}>
          <div className="ls-msg-sidebar-header">
            <h2 className="ls-msg-title">
              <MessageSquare size={20} className="ls-msg-title-icon" />
              Messagerie
            </h2>
            <div className="ls-msg-search-wrapper">
              <Search className="ls-msg-search-icon" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ls-msg-search-input"
                placeholder="Rechercher..."
              />
            </div>
          </div>

          <div className="ls-msg-list">
            {filteredConversations.length === 0 ? (
              <div className="ls-msg-empty-list">
                <MessageSquare size={32} className="ls-msg-empty-icon" />
                <p className="ls-msg-empty-text">Aucune conversation trouvée.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`ls-msg-item ${activeConversationId === conv.id ? 'ls-msg-item--active' : ''}`}
                >
                  <div className="ls-msg-avatar-wrapper">
                    <img src={conv.user?.avatar || defaultAvatar} alt={conv.user?.name} className="ls-msg-avatar" onError={(e) => { e.target.src = defaultAvatar; }} />
                    <span className={`ls-msg-status-dot ${conv.user?.status === 'en_ligne' ? 'ls-msg-status-dot--online' : 'ls-msg-status-dot--offline'}`}></span>
                  </div>
                  <div className="ls-msg-item-content">
                    <div className="ls-msg-item-header">
                      <span className="ls-msg-name">{conv.user?.name || 'Inconnu'}</span>
                      <span className="ls-msg-time">{conv.timestamp || ''}</span>
                    </div>
                    <div className="ls-msg-item-footer">
                      <span className={`ls-msg-preview ${conv.unreadCount > 0 ? 'ls-msg-preview--unread' : ''}`}>
                        {conv.lastMessageIsMine && <CheckCheck size={14} className="ls-msg-check-icon" />}
                        <span className="ls-msg-preview-text">{conv.lastMessage || 'Aucun message'}</span>
                      </span>
                      {conv.unreadCount > 0 && <span className="ls-msg-badge">{conv.unreadCount}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`ls-msg-main ${!showChatOnMobile ? 'ls-msg-main--hidden-mobile' : ''}`}>
          {activeConversation ? (
            <>
              <div className="ls-msg-topbar">
                <button className="ls-msg-back-btn" onClick={handleBackToList} type="button">
                  <ArrowLeft size={22} />
                </button>
                <div className="ls-msg-topbar-avatar-wrapper">
                  <img src={activeConversation.user?.avatar || defaultAvatar} alt={activeConversation.user?.name} className="ls-msg-topbar-avatar" />
                  <span className={`ls-msg-status-dot ls-msg-status-dot--small ${activeConversation.user?.status === 'en_ligne' ? 'ls-msg-status-dot--online' : 'ls-msg-status-dot--offline'}`}></span>
                </div>
                <div className="ls-msg-topbar-info">
                  <h3 className="ls-msg-contact-name">{activeConversation.user?.name}</h3>
                  <span className={`ls-msg-contact-status ${activeConversation.user?.status === 'en_ligne' ? 'ls-msg-contact-status--online' : ''}`}>
                    {activeConversation.user?.status === 'en_ligne' ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
                <div className="ls-msg-topbar-actions">
                  <button className="ls-msg-action-btn" title="Appel audio"><Phone size={18} /></button>
                  <button className="ls-msg-action-btn" title="Options"><MoreVertical size={18} /></button>
                </div>
              </div>

              <div className="ls-msg-viewport">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isMe = msg.senderId === 'me';
                    return (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`ls-msg-row ${isMe ? 'ls-msg-row--sent' : 'ls-msg-row--received'}`}
                      >
                        <div className={`ls-msg-bubble ${isMe ? 'ls-msg-bubble--sent' : 'ls-msg-bubble--received'}`}>
                          <p className="ls-msg-text">{msg.text}</p>
                          <div className="ls-msg-meta">
                            <span className="ls-msg-time-text">{msg.time}</span>
                            {isMe && (
                              <span className="ls-msg-status-icon">
                                {msg.status === 'envoyé' ? <Check size={14} /> : <CheckCheck size={14} />}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isOtherTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="ls-msg-row ls-msg-row--received"
                  >
                    <div className="ls-msg-bubble ls-msg-bubble--received ls-msg-bubble--typing">
                      <div className="ls-typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form 
                onSubmit={(e) => { clearTypingStatus(); handleSendMessage(e); }} 
                className="ls-msg-input-area"
              >
                <button type="button" className="ls-msg-attach-btn" title="Joindre un fichier">
                  <Paperclip size={22} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onBlur={clearTypingStatus}
                  placeholder="Écrire un message..."
                  className="ls-msg-input"
                  disabled={isSending}
                />
                <button 
                  type="submit" 
                  className={`ls-msg-send-btn ${!newMessage.trim() || isSending ? 'ls-msg-send-btn--disabled' : ''}`} 
                  disabled={!newMessage.trim() || isSending}
                >
                  {isSending ? <Loader size="sm" /> : <Send size={20} />}
                </button>
              </form>
            </>
          ) : (
            <div className="ls-msg-empty-state">
              <div className="ls-msg-empty-state-icon">
                <MessageSquare size={56} />
              </div>
              <h3 className="ls-msg-empty-state-title">Vos messages</h3>
              <p className="ls-msg-empty-state-text">Sélectionnez une conversation pour commencer à discuter.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ls-msg-container { height: calc(100vh - 120px); display: flex; flex-direction: column; }
        .ls-msg-loading-wrapper { display: flex; justify-content: center; align-items: center; height: 60vh; }
        .ls-msg-layout { display: flex; flex: 1; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #f3f4f6; overflow: hidden; }
        
        .ls-msg-sidebar { width: 380px; border-right: 1px solid #f3f4f6; display: flex; flex-direction: column; background: #fafafa; flex-shrink: 0; }
        .ls-msg-sidebar-header { padding: 24px; border-bottom: 1px solid #f3f4f6; background: #ffffff; }
        .ls-msg-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px 0; display: flex; align-items: center; gap: 10px; }
        .ls-msg-title-icon { color: #F26A22; }
        .ls-msg-search-wrapper { position: relative; }
        .ls-msg-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .ls-msg-search-input { width: 100%; padding: 10px 14px 10px 40px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 14px; background: #f9fafb; color: #111827; transition: all 0.2s ease; }
        .ls-msg-search-input:focus { outline: none; border-color: #F26A22; background: #ffffff; box-shadow: 0 0 0 3px rgba(242, 106, 34, 0.1); }
        
        .ls-msg-list { flex: 1; overflow-y: auto; }
        .ls-msg-item { display: flex; gap: 14px; padding: 16px 24px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-left: 3px solid transparent; }
        .ls-msg-item:hover { background: #f3f4f6; }
        .ls-msg-item--active { background: #fff7ed; border-left-color: #F26A22; }
        .ls-msg-avatar-wrapper { position: relative; flex-shrink: 0; }
        .ls-msg-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .ls-msg-status-dot { position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffffff; }
        .ls-msg-status-dot--online { background: #22c55e; }
        .ls-msg-status-dot--offline { background: #9ca3af; }
        .ls-msg-item-content { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .ls-msg-item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .ls-msg-name { font-size: 14px; font-weight: 600; color: #111827; }
        .ls-msg-time { font-size: 12px; color: #9ca3af; font-weight: 500; }
        .ls-msg-item-footer { display: flex; justify-content: space-between; align-items: center; }
        .ls-msg-preview { font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 4px; max-width: 220px; }
        .ls-msg-preview--unread { color: #111827; font-weight: 600; }
        .ls-msg-check-icon { color: #F26A22; flex-shrink: 0; }
        .ls-msg-preview-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ls-msg-badge { background: #F26A22; color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 999px; min-width: 20px; text-align: center; line-height: 1.4; }
        .ls-msg-empty-list { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; }
        .ls-msg-empty-icon { color: #d1d5db; margin-bottom: 12px; }
        .ls-msg-empty-text { font-size: 14px; color: #6b7280; margin: 0; }
        
        .ls-msg-main { flex: 1; display: flex; flex-direction: column; background: #ffffff; position: relative; }
        .ls-msg-topbar { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 14px; background: #ffffff; }
        .ls-msg-back-btn { display: none; background: none; border: none; cursor: pointer; color: #111827; padding: 8px; border-radius: 8px; transition: background 0.2s; margin-right: 4px; }
        .ls-msg-back-btn:hover { background: #f3f4f6; }
        .ls-msg-topbar-avatar-wrapper { position: relative; flex-shrink: 0; }
        .ls-msg-topbar-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        .ls-msg-status-dot--small { width: 10px; height: 10px; bottom: 0; right: 0; }
        .ls-msg-topbar-info { flex: 1; }
        .ls-msg-contact-name { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
        .ls-msg-contact-status { font-size: 12px; color: #6b7280; }
        .ls-msg-contact-status--online { color: #22c55e; font-weight: 500; }
        .ls-msg-topbar-actions { display: flex; gap: 4px; }
        .ls-msg-action-btn { background: none; border: none; cursor: pointer; color: #6b7280; padding: 8px; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .ls-msg-action-btn:hover { background: #f3f4f6; color: #F26A22; }
        
        .ls-msg-viewport { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; background: #f9fafb; }
        .ls-msg-row { display: flex; width: 100%; }
        .ls-msg-row--sent { justify-content: flex-end; }
        .ls-msg-row--received { justify-content: flex-start; }
        .ls-msg-bubble { max-width: 75%; padding: 12px 16px; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .ls-msg-bubble--sent { background: #F26A22; color: #ffffff; border-radius: 16px 16px 4px 16px; }
        .ls-msg-bubble--received { background: #ffffff; color: #111827; border: 1px solid #f3f4f6; border-radius: 16px 16px 16px 4px; }
        .ls-msg-text { font-size: 14px; line-height: 1.5; margin: 0 0 6px 0; word-wrap: break-word; }
        .ls-msg-meta { display: flex; justify-content: flex-end; align-items: center; gap: 4px; }
        .ls-msg-time-text { font-size: 11px; opacity: 0.8; }
        .ls-msg-status-icon { display: flex; align-items: center; opacity: 0.9; }
        
        .ls-msg-input-area { padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; align-items: center; gap: 12px; background: #ffffff; }
        .ls-msg-attach-btn { background: #f3f4f6; border: none; cursor: pointer; color: #4b5563; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ls-msg-attach-btn:hover { background: #e5e7eb; color: #F26A22; }
        .ls-msg-input { flex: 1; border: 1px solid #e5e7eb; border-radius: 999px; padding: 12px 16px; font-size: 14px; outline: none; transition: all 0.2s ease; background: #f9fafb; min-width: 0; }
        .ls-msg-input:focus { border-color: #F26A22; background: #ffffff; box-shadow: 0 0 0 3px rgba(242, 106, 34, 0.1); }
        .ls-msg-input:disabled { background: #f3f4f6; cursor: not-allowed; }
        .ls-msg-send-btn { background: #F26A22; color: #ffffff; border: none; border-radius: 50%; width: 44px; height: 44px; padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(242, 106, 34, 0.3); flex-shrink: 0; }
        .ls-msg-send-btn:hover:not(.ls-msg-send-btn--disabled) { background: #d95a1a; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(242, 106, 34, 0.4); }
        .ls-msg-send-btn--disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; box-shadow: none; }
        
        .ls-msg-empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; background: #f9fafb; }
        .ls-msg-empty-state-icon { color: #e5e7eb; margin-bottom: 20px; background: #ffffff; padding: 24px; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .ls-msg-empty-state-title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
        .ls-msg-empty-state-text { font-size: 14px; color: #6b7280; margin: 0; max-width: 300px; line-height: 1.5; }
        
        .ls-msg-list::-webkit-scrollbar, .ls-msg-viewport::-webkit-scrollbar { width: 6px; }
        .ls-msg-list::-webkit-scrollbar-track, .ls-msg-viewport::-webkit-scrollbar-track { background: transparent; }
        .ls-msg-list::-webkit-scrollbar-thumb, .ls-msg-viewport::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; transition: background 0.2s; }
        .ls-msg-list::-webkit-scrollbar-thumb:hover, .ls-msg-viewport::-webkit-scrollbar-thumb:hover { background: #d1d5db; }

        .ls-msg-bubble--typing {
          padding: 16px 20px !important;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 60px;
        }
        .ls-typing-dots { display: flex; gap: 4px; align-items: center; }
        .ls-typing-dots span {
          width: 8px; height: 8px; background-color: #9ca3af; border-radius: 50%;
          display: inline-block; animation: ls-typing-bounce 1.4s infinite ease-in-out both;
        }
        .ls-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .ls-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .ls-typing-dots span:nth-child(3) { animation-delay: 0s; }

        @keyframes ls-typing-bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; background-color: #F26A22; }
        }

        @media (max-width: 768px) {
          .ls-msg-container { height: calc(100vh - 140px); }
          .ls-msg-layout { position: relative; border-radius: 12px; }
          .ls-msg-sidebar { width: 100%; position: absolute; top: 0; left: 0; height: 100%; z-index: 10; border-radius: 12px; }
          .ls-msg-sidebar--hidden-mobile { display: none; }
          .ls-msg-main { width: 100%; position: absolute; top: 0; left: 0; height: 100%; z-index: 20; border-radius: 12px; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .ls-msg-main:not(.ls-msg-main--hidden-mobile) { transform: translateX(0); }
          .ls-msg-back-btn { display: flex; }
          .ls-msg-bubble { max-width: 85%; }
          .ls-msg-topbar-actions { display: none; }
          .ls-msg-input-area { padding: 12px 16px; gap: 8px; min-height: 68px; }
          .ls-msg-attach-btn { width: 40px; height: 40px; }
          .ls-msg-send-btn { width: 40px; height: 40px; }
          .ls-msg-input { padding: 10px 14px; font-size: 16px; }
        }
      `}</style>
    </motion.div>
  );
};

export default MessagesSection;