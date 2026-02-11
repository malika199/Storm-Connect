import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './Discussions.css';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔝', '🔙', '🔛', '🔜', '🔚', '〽️',
];

const GuardianDiscussions = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      const groupId = selectedGroup.id || selectedGroup._id;
      if (groupId) {
        fetchMessages(groupId);
        const interval = setInterval(() => fetchMessages(groupId), 3000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedGroup]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setZoomedImage(null);
    };
    if (zoomedImage) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [zoomedImage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/guardians/group-chats');
      setGroups(response.data.groupChats || []);
      if (response.data.groupChats?.length > 0 && !selectedGroup) {
        setSelectedGroup(response.data.groupChats[0]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Erreur lors du chargement des discussions');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (groupId) => {
    try {
      const response = await axios.get(`/api/messages/group/${groupId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 403) {
        toast.error('Accès non autorisé à ce groupe');
      }
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup || sendingMessage) return;

    setSendingMessage(true);
    try {
      const groupId = selectedGroup.id || selectedGroup._id;
      await axios.post(`/api/messages/group/${groupId}`, {
        message_text: newMessage
      });
      setNewMessage('');
      await fetchMessages(groupId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const insertEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const leaveGroup = async () => {
    if (!selectedGroup || !selectedGroup.match_id || leavingGroup) return;
    
    const confirmLeave = window.confirm('Êtes-vous sûr de vouloir quitter ce groupe ? Vous pourrez toujours voir les messages mais ne pourrez plus en envoyer.');
    if (!confirmLeave) return;

    setLeavingGroup(true);
    try {
      await axios.post(`/api/matching/matches/${selectedGroup.match_id}/leave-group`);
      toast.success('Vous avez quitté le groupe. Vous pouvez toujours voir les messages mais ne pouvez plus en envoyer.');
      // Rafraîchir les groupes pour mettre à jour le flag readonly
      await fetchGroups();
      // Mettre à jour le groupe sélectionné avec le flag readonly
      const updatedGroup = groups.find(g => {
        const gId = g.id || g._id;
        const selectedId = selectedGroup.id || selectedGroup._id;
        return gId === selectedId;
      });
      if (updatedGroup) {
        setSelectedGroup({ ...updatedGroup, readonly: true });
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la sortie du groupe';
      toast.error(errorMsg);
    } finally {
      setLeavingGroup(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="conversations-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des discussions...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="conversations-container">
        <div className="conversations-layout">
          {/* Liste des groupes */}
          <div className="matches-sidebar">
            <div className="sidebar-header">
              <h2>💬 Discussions</h2>
            </div>
            
            {groups.length === 0 ? (
              <div className="no-matches">
                <span className="no-matches-icon">💭</span>
                <p>Aucune discussion</p>
              </div>
            ) : (
              <div className="matches-list">
                {groups.map(group => {
                  const groupId = group.id || group._id;
                  const isSelected = selectedGroup && (selectedGroup.id === groupId || selectedGroup._id === groupId);
                  
                  return (
                    <div
                      key={groupId}
                      className={`match-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div className="match-avatar">
                        {group.type === 'match' && group.participants && group.participants.length > 0 ? (
                          <div className="group-avatar-placeholder" style={{ fontSize: '1.2rem' }}>
                            {group.participants.filter(p => p.role !== 'guardian').slice(0, 2).map(p => p.first_name?.[0] || '?').join('')}
                          </div>
                        ) : (
                          <div className="avatar-placeholder">
                            👥
                          </div>
                        )}
                      </div>
                      <div className="match-info">
                        <div className="match-info-header">
                          <h3>
                            {group.type === 'match' && group.candidates
                              ? group.candidates.map(c => `${c.first_name} ${c.last_name}`).join(' ↔ ')
                              : `${group.requester_first_name || ''} ↔ ${group.target_first_name || ''}`
                            }
                          </h3>
                          {group.updatedAt && (
                            <span className="match-time">{formatTime(group.updatedAt)}</span>
                          )}
                        </div>
                        <p className="match-preview">
                          {group.type === 'match' 
                            ? `Groupe (${group.participants?.length || 0} participants)`
                            : 'Discussion matchmaking'
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Zone de conversation */}
          <div className="chat-area">
            {selectedGroup ? (
              <>
                <div className="chat-header">
                  {selectedGroup.type === 'match' ? (
                    <div className="group-header-info">
                      <div className="group-avatars">
                        {selectedGroup.participants && selectedGroup.participants.length > 0 ? (
                          selectedGroup.participants.filter(p => p.role !== 'guardian').slice(0, 3).map((p, idx) => (
                            <div key={p.user_id} className="group-avatar-item" style={{ zIndex: 10 - idx }}>
                              <div className="group-avatar-placeholder">
                                {p.first_name?.[0] || '?'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="group-avatar-placeholder">👥</div>
                        )}
                        {selectedGroup.participants && selectedGroup.participants.filter(p => p.role !== 'guardian').length > 3 && (
                          <div className="group-avatar-more">
                            +{selectedGroup.participants.filter(p => p.role !== 'guardian').length - 3}
                          </div>
                        )}
                      </div>
                      <div className="group-info">
                        <h3>
                          {selectedGroup.candidates && selectedGroup.candidates.length > 0
                            ? selectedGroup.candidates.map(c => `${c.first_name} ${c.last_name}`).join(', ')
                            : 'Groupe de discussion'
                          }
                        </h3>
                        <p className="group-participants-count">
                          {selectedGroup.participants?.length || 0} {selectedGroup.participants?.length !== 1 ? 'participants' : 'participant'}
                          {selectedGroup.participants && selectedGroup.participants.filter(p => p.role === 'guardian').length > 0 && (
                            <span className="guardians-badge">
                              {' • '}{selectedGroup.participants.filter(p => p.role === 'guardian').length} {selectedGroup.participants.filter(p => p.role === 'guardian').length > 1 ? 'parents' : 'parent'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="chat-user-info">
                      <div className="chat-avatar">
                        <div className="avatar-placeholder">
                          👥
                        </div>
                      </div>
                      <div>
                        <h3>
                          {selectedGroup.requester_first_name || ''} ↔ {selectedGroup.target_first_name || ''}
                        </h3>
                        <p>Discussion matchmaking</p>
                      </div>
                    </div>
                  )}
                  {/* Bouton quitter le groupe pour les parents (uniquement pour les groupes de type match) */}
                  {selectedGroup.type === 'match' && selectedGroup.match_id && (
                    <div className="chat-header-actions">
                      <button
                        type="button"
                        className="leave-group-header-btn"
                        onClick={leaveGroup}
                        disabled={leavingGroup}
                        title="Quitter le groupe"
                      >
                        {leavingGroup ? '...' : '🚪 Quitter'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <div className="wave-emoji">👋</div>
                      <h3>Commencez la conversation !</h3>
                      <p>Dites bonjour aux participants</p>
                    </div>
                  ) : (
                    <div className="messages-list">
                      {messages.map((msg, index) => {
                        const senderId = msg.sender_id?._id || msg.sender_id?.id || msg.sender_id;
                        const isOwn = user && (senderId === user.id || senderId === user._id || senderId?.toString() === user.id?.toString() || senderId?.toString() === user._id?.toString());
                        const showDate = index === 0 || 
                          new Date(msg.createdAt || msg.created_at).toDateString() !== 
                          new Date(messages[index - 1].createdAt || messages[index - 1].created_at).toDateString();
                        
                        return (
                          <React.Fragment key={msg._id || msg.id || index}>
                            {showDate && (
                              <div className="date-separator">
                                <span>{new Date(msg.createdAt || msg.created_at).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                })}</span>
                              </div>
                            )}
                            <div className={`message ${isOwn ? 'own' : 'other'}`}>
                              {!isOwn && (
                                <span className="message-sender-label">
                                  {msg.first_name || msg.sender_id?.first_name} {msg.last_name || msg.sender_id?.last_name}
                                  {msg.sender_role === 'guardian' && ' (Parent)'}
                                </span>
                              )}
                              <div className="message-bubble">
                                {msg.image_url && (
                                  <div
                                    className="message-image clickable"
                                    onClick={() => setZoomedImage(msg.image_url)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && setZoomedImage(msg.image_url)}
                                  >
                                    <img src={msg.image_url} alt="Photo envoyée" />
                                  </div>
                                )}
                                {msg.message_text && msg.message_text !== '📷 Photo' && <p>{msg.message_text}</p>}
                                <span className="message-time">
                                  {new Date(msg.createdAt || msg.created_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                  {isOwn && (
                                    <span className="message-read-status">
                                      {msg.is_read ? ' · Vu' : ''}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {selectedGroup.readonly && (
                  <div className="readonly-notice" style={{ 
                    padding: '10px', 
                    backgroundColor: '#fff3cd', 
                    border: '1px solid #ffc107', 
                    borderRadius: '5px', 
                    marginBottom: '10px',
                    textAlign: 'center',
                    color: '#856404'
                  }}>
                    ⚠️ Vous avez quitté ce groupe. Vous pouvez voir les messages mais ne pouvez plus en envoyer.
                  </div>
                )}

                <form className="message-input-form" onSubmit={sendMessage}>
                  <div className="message-input-wrapper">
                    <button
                      type="button"
                      className="action-btn emoji-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Emojis"
                      disabled={selectedGroup.readonly}
                    >
                      😊
                    </button>
                    {showEmojiPicker && (
                      <div className="emoji-picker">
                        {EMOJIS.map((emoji, i) => (
                          <button
                            key={i}
                            type="button"
                            className="emoji-item"
                            onClick={() => insertEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={selectedGroup.readonly ? "Vous avez quitté ce groupe..." : "Écrivez votre message..."}
                      disabled={sendingMessage || selectedGroup.readonly}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="send-btn"
                    disabled={(!newMessage.trim() || sendingMessage || selectedGroup.readonly)}
                  >
                    {sendingMessage ? '...' : '➤'}
                  </button>
                </form>
              </>
            ) : (
              <div className="no-messages">
                <div className="wave-emoji">💬</div>
                <h3>Sélectionnez une discussion</h3>
                <p>Choisissez une conversation dans la liste</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image zoom modal */}
      {zoomedImage && (
        <div 
          className="image-zoom-overlay"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="Zoom" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
};

export default GuardianDiscussions;
