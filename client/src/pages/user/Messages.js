import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserMessages = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchMessages(selectedGroup.id);
      const interval = setInterval(() => fetchMessages(selectedGroup.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/messages/my-groups');
      setGroups(response.data.groups);
      if (response.data.groups.length > 0 && !selectedGroup) {
        setSelectedGroup(response.data.groups[0]);
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
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`/api/messages/group/${selectedGroup.id}`, {
        message_text: newMessage
      });
      setNewMessage('');
      fetchMessages(selectedGroup.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  if (loading) {
    return (
      <>
        <div className="container">
          <div className="loading">Chargement...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container">
        <h1>Mes Messages</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', height: '600px' }}>
          <div className="card" style={{ overflowY: 'auto' }}>
            <h3>Discussions</h3>
            {groups.length === 0 ? (
              <p>Aucune discussion</p>
            ) : (
              groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    backgroundColor: selectedGroup?.id === group.id ? 'var(--bg-light)' : 'transparent',
                    borderRadius: '5px',
                    border: selectedGroup?.id === group.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)'
                  }}
                >
                  <strong>
                    {group.requester_first_name} ↔ {group.target_first_name}
                  </strong>
                  {group.unread_count > 0 && (
                    <span style={{ marginLeft: '10px', color: 'var(--secondary-color)' }}>
                      ({group.unread_count})
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            {selectedGroup ? (
              <>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
                  <h3>
                    Discussion avec {selectedGroup.target_first_name} {selectedGroup.target_last_name}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>
                    Tuteur inclus dans cette discussion
                  </p>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        padding: '10px',
                        marginBottom: '10px',
                        backgroundColor: msg.sender_role === 'guardian' ? 'var(--bg-light)' : 'transparent',
                        borderRadius: '5px'
                      }}
                    >
                      <strong>{msg.first_name} {msg.last_name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-light)', marginLeft: '10px' }}>
                        {new Date(msg.created_at).toLocaleString('fr-FR')}
                      </span>
                      {msg.sender_role === 'guardian' && (
                        <span style={{ fontSize: '12px', color: 'var(--secondary-color)', marginLeft: '10px' }}>
                          (Tuteur)
                        </span>
                      )}
                      <p style={{ marginTop: '5px' }}>{msg.message_text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendMessage}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Tapez votre message..."
                      style={{ flex: 1, padding: '10px', border: '1px solid var(--border-color)', borderRadius: '5px' }}
                    />
                    <button type="submit" className="btn btn-primary">Envoyer</button>
                  </div>
                </form>
              </>
            ) : (
              <p>Sélectionnez une discussion</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserMessages;
