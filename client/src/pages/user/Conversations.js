import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import BlockUserButton from '../../components/BlockUserButton';
import './Conversations.css';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔝', '🔙', '🔛', '🔜', '🔚', '〽️',
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
  '✨', '⭐', '🌟', '💫', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌫️', '🔥', '💥', '⚡', '🌟', '🌙', '🌛', '🌜', '🌞', '🪐', '⭐', '💫', '✨', '🌍', '🌎', '🌏', '🌐', '🗺️', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪹', '🪺', '🍄', '🍄', '🌰', '🦀', '🦞', '🦐', '🦑', '🦪',
  '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🫘', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🧃', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧃', '🧉', '🍽️', '🍴', '🥄', '🔪', '🍽️', '🫙', '🏺',
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '⛹️', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎁', '🎫', '🎟️', '🎪', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🪗', '🪕', '🎺', '🎷', '🪈', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🕹️', '🎰', '🧩',
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🛞', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '🛶', '⛵', '🛳️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⌛', '⏳', '⏰', '⏱️', '⏲️', '🕰️', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌡️', '☀️', '🌝', '🌞', '🪐', '⭐', '🌟', '💫', '✨', '🌠', '🌌', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🔔', '🔕', '📡', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚',
  '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧒', '👨', '👩', '🧑', '👴', '👵', '🧓', '👴', '👵', '👲', '👳', '🧕', '👮', '👷', '💂', '🕵️', '👩‍⚕️', '👨‍⚕️', '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓', '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭', '👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨', '👩‍🚒', '👨‍🚒', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '👰', '🤵', '👸', '🤴', '🥷', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🏃', '💃', '🕺', '🕴️', '👯', '🧖', '🧗', '🤸', '🏌️', '🏇', '⛷️', '🏂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🤹', '🧘', '🛀', '🛌', '👭', '👫', '👬', '💏', '💑', '👪', '🗣️', '👤', '👥', '🫂', '👣', '🦰', '🦱', '🦳', '🦲', '🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐦‍⬛', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🪸', '🪼', '🦑', '🦐', '🦞', '🦀', '🦪', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞', '🦗', '🪳', '🕷️', '🦂', '🦟', '🪰', '🪱', '🦠', '💐', '🌸', '💮', '🪷', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪹', '🪺', '🍄', '🌰', '🫚', '🫛',
  '🎉', '🎊', '🎈', '🎁', '🎀', '🎗️', '🎖️', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🤹', '🧘', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🪗', '🪕', '🎺', '🎷', '🪈', '🎸', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🕹️', '🎰', '🧩',
];

const UserConversations = () => {
  const navigate = useNavigate();
  const { user, refreshUnreadCount } = useAuth();
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [guardiansWithAccount, setGuardiansWithAccount] = useState([]);
  const [currentParticipants, setCurrentParticipants] = useState([]);
  const [addingParent, setAddingParent] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  // Rafraîchir la liste des matches périodiquement (style WhatsApp - prévisualisation des nouveaux messages)
  useEffect(() => {
    const interval = setInterval(fetchMatches, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      fetchMessages(selectedMatch.id);
      const interval = setInterval(() => fetchMessages(selectedMatch.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedMatch]);

  // Charger les participants quand une conversation de groupe est sélectionnée
  useEffect(() => {
    if (selectedMatch?.group_chat_id) {
      fetchParticipants(selectedMatch.id);
    } else {
      setParticipants([]);
    }
  }, [selectedMatch?.id, selectedMatch?.group_chat_id]);

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

  // Fonction pour sélectionner un match et rafraîchir le compteur
  const handleSelectMatch = async (match) => {
    setSelectedMatch(match);
    // Attendre un peu que les messages soient marqués comme lus puis rafraîchir le compteur
    setTimeout(() => {
      refreshUnreadCount();
    }, 500);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get('/api/matching/matches');
      // Uniquement les matches validés par l'admin : pas d'accès aux conversations tant que le match n'est pas validé
      const validatedOnly = (response.data.matches || []).filter(
        (m) => m && m.status === 'validated'
      );
      setMatches(validatedOnly);
      if (validatedOnly.length > 0 && !selectedMatch) {
        setSelectedMatch(validatedOnly[0]);
        setTimeout(() => refreshUnreadCount(), 500);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId) => {
    try {
      const response = await axios.get(`/api/matching/matches/${matchId}/messages`);
      setMessages(response.data.messages || []);
    } catch (error) {
      // Si le match n'est pas validé, on ne charge pas les messages
      if (error.response?.status === 403) {
        setMessages([]);
      } else {
        console.error('Error fetching messages:', error);
        setMessages([]);
      }
    }
  };

  const fetchParticipants = async (matchId) => {
    try {
      const response = await axios.get(`/api/matching/matches/${matchId}/participants`);
      setParticipants(response.data.participants || []);
    } catch (error) {
      if (error.response?.status !== 403) console.error('Error fetching participants:', error);
      setParticipants([]);
    }
  };

  const openAddParentModal = async () => {
    if (!selectedMatch) return;
    setShowAddParentModal(true);
    setGuardiansWithAccount([]);
    setCurrentParticipants([]);
    try {
      // Récupérer les participants directement
      const participantsRes = await axios.get(`/api/matching/matches/${selectedMatch.id}/participants`);
      const fetchedParticipants = participantsRes.data.participants || [];
      setCurrentParticipants(fetchedParticipants);
      
      const guardiansRes = await axios.get('/api/guardians/my-guardians-with-account');
      const guardians = guardiansRes.data.guardians || [];
      
      console.log('[DEBUG] Loaded guardians:', guardians);
      console.log('[DEBUG] Fetched participants:', fetchedParticipants);
      
      // Normaliser les IDs pour la comparaison
      const participantIds = fetchedParticipants.map((p) => String(p.user_id).trim().toLowerCase());
      console.log('[DEBUG] Participant IDs (normalized):', participantIds);
      
      const guardianIds = guardians.map((g) => {
        const id = getParentUserId(g);
        return String(id).trim().toLowerCase();
      });
      console.log('[DEBUG] Guardian IDs (normalized):', guardianIds);
      
      setGuardiansWithAccount(guardians);
      if (guardians.length === 0) {
        toast.info('Aucun parent avec compte trouvé. Vérifiez que votre parent a bien créé son compte via le lien d\'invitation.');
      }
    } catch (error) {
      console.error('Error loading guardians:', error);
      toast.error('Impossible de charger la liste des parents');
    }
  };

  const getParentUserId = (guardian) => {
    const id = guardian.guardian_user_id;
    if (typeof id === 'string') return id;
    if (id && typeof id === 'object' && id.$oid) return id.$oid;
    if (id && typeof id.toString === 'function') return id.toString();
    return id;
  };

  const addParentToConversation = async (parentUserId) => {
    if (!selectedMatch || addingParent) return;
    const idToSend = typeof parentUserId === 'string' ? parentUserId : getParentUserId({ guardian_user_id: parentUserId });
    if (!idToSend) {
      toast.error('ID du parent invalide');
      return;
    }
    console.log('[DEBUG] Adding parent:', { parentUserId, idToSend, matchId: selectedMatch.id });
    setAddingParent(true);
    try {
      const response = await axios.post(`/api/matching/matches/${selectedMatch.id}/add-parent`, {
        parent_user_id: idToSend
      });
      console.log('[DEBUG] Add parent success:', response.data);
      toast.success(response.data.message || 'Parent ajouté à la conversation');
      setShowAddParentModal(false);
      // Rafraîchir les participants et les messages
      await fetchParticipants(selectedMatch.id);
      await fetchMessages(selectedMatch.id);
      // Rafraîchir aussi la liste des matches pour mettre à jour l'affichage
      fetchMatches();
    } catch (error) {
      console.error('Error adding parent:', error);
      console.error('[DEBUG] Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'ajout du parent';
      toast.error(errorMsg);
    } finally {
      setAddingParent(false);
    }
  };

  const leaveGroup = async () => {
    if (!selectedMatch || !selectedMatch.group_chat_id || leavingGroup) return;
    
    const confirmLeave = window.confirm('Êtes-vous sûr de vouloir quitter ce groupe ? Vous pourrez toujours voir les messages mais ne pourrez plus en envoyer.');
    if (!confirmLeave) return;

    setLeavingGroup(true);
    try {
      await axios.post(`/api/matching/matches/${selectedMatch.id}/leave-group`);
      toast.success('Vous avez quitté le groupe. Vous pouvez toujours voir les messages mais ne pouvez plus en envoyer.');
      // Ne pas retirer de la liste des matches, juste rafraîchir les participants
      await fetchParticipants(selectedMatch.id);
      fetchMatches(); // Rafraîchir la liste pour mettre à jour l'affichage
    } catch (error) {
      console.error('Error leaving group:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la sortie du groupe';
      toast.error(errorMsg);
    } finally {
      setLeavingGroup(false);
    }
  };

  // Vérifier si l'utilisateur actuel est un parent dans le groupe
  const isCurrentUserParent = () => {
    if (!user || !selectedMatch?.group_chat_id || !participants.length) return false;
    return participants.some(p => 
      (p.user_id === user.id || p.user_id === user._id) && p.role === 'guardian'
    );
  };

  // Vérifier si l'utilisateur actuel est en lecture seule (a quitté le groupe)
  const isCurrentUserReadonly = () => {
    if (!user || !selectedMatch?.group_chat_id || !participants.length) return false;
    const currentUserParticipant = participants.find(p => 
      p.user_id === user.id || p.user_id === user._id
    );
    return currentUserParticipant && currentUserParticipant.readonly === true;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || sendingMessage) return;

    setSendingMessage(true);
    try {
      await axios.post(`/api/matching/matches/${selectedMatch.id}/messages`, {
        message_text: newMessage
      });
      setNewMessage('');
      setShowEmojiPicker(false);
      fetchMessages(selectedMatch.id);
      fetchMatches(); // Mettre à jour la prévisualisation du dernier message
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const insertEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };

  const sendPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMatch || sendingMessage) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, GIF)');
      return;
    }

    setSendingMessage(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('message_text', newMessage.trim());

    try {
      await axios.post(`/api/matching/matches/${selectedMatch.id}/messages/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewMessage('');
      fetchMessages(selectedMatch.id);
      fetchMatches(); // Mettre à jour la prévisualisation
    } catch (error) {
      console.error('Error sending photo:', error);
      toast.error('Erreur lors de l\'envoi de la photo');
    } finally {
      setSendingMessage(false);
      e.target.value = '';
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return d.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <>
        <div className="conversations-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des conversations...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="conversations-container">
        <div className="conversations-layout">
          {/* Liste des matches */}
          <div className="matches-sidebar">
            <div className="sidebar-header">
              <h2>💬 Conversations</h2>
            </div>
            
            {matches.length === 0 ? (
              <div className="no-matches">
                <span className="no-matches-icon">💭</span>
                <p>Pas encore de matches</p>
                <a href="/user/match" className="discover-link">Découvrir des profils</a>
              </div>
            ) : (
              <div className="matches-list">
                {matches.map(match => (
                  <div
                    key={match.id}
                    className={`match-item ${selectedMatch?.id === match.id ? 'active' : ''} ${match.unread_count > 0 ? 'unread' : ''}`}
                    onClick={() => handleSelectMatch(match)}
                  >
                    <div className="match-avatar">
                      {match.user.profile_picture_url ? (
                        <img src={match.user.profile_picture_url} alt={match.user.first_name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {match.user.first_name[0]}
                        </div>
                      )}
                      {match.unread_count > 0 && (
                        <span className="match-unread-badge">{match.unread_count > 99 ? '99+' : match.unread_count}</span>
                      )}
                    </div>
                    <div className="match-info">
                      <div className="match-info-header">
                        <h3>{match.user.first_name} {match.user.last_name}</h3>
                        <span className="match-time">
                          {match.last_message_at ? formatTime(match.last_message_at) : formatTime(match.created_at)}
                        </span>
                      </div>
                      <p className="match-preview">
                        {match.last_message_preview
                          ? (match.is_last_from_me ? 'Vous: ' : '') + (match.last_message_preview.length > 40 ? match.last_message_preview.substring(0, 40) + '...' : match.last_message_preview)
                          : 'Match depuis ' + formatTime(match.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zone de conversation */}
          <div className="chat-area">
            {selectedMatch ? (
              <>
                <div className="chat-header">
                  {selectedMatch.group_chat_id ? (
                    // Header pour groupe (style WhatsApp)
                    <div className="group-header-info">
                      <div className="group-avatars">
                        {participants.length > 0 ? (
                          participants.slice(0, 3).map((p, idx) => (
                            <div key={p.user_id} className="group-avatar-item" style={{ zIndex: 10 - idx }}>
                              {p.first_name ? (
                                <div className="group-avatar-placeholder">
                                  {p.first_name[0]}
                                </div>
                              ) : (
                                <div className="group-avatar-placeholder">?</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="group-avatar-placeholder">👥</div>
                        )}
                        {participants.length > 3 && (
                          <div className="group-avatar-more">+{participants.length - 3}</div>
                        )}
                      </div>
                      <div className="group-info">
                        <h3>
                          {participants.length > 0 
                            ? participants.filter(p => p.role !== 'guardian').map(p => p.first_name).join(', ') || 'Groupe'
                            : 'Groupe de discussion'
                          }
                        </h3>
                        <p className="group-participants-count">
                          {participants.length} {participants.length > 1 ? 'participants' : 'participant'}
                          {participants.filter(p => p.role === 'guardian').length > 0 && (
                            <span className="guardians-badge">
                              {' • '}{participants.filter(p => p.role === 'guardian').length} {participants.filter(p => p.role === 'guardian').length > 1 ? 'parents' : 'parent'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Header pour conversation individuelle
                    <div
                      className="chat-user-info clickable"
                      onClick={() => selectedMatch.user && navigate(`/user/profiles/${selectedMatch.user.id || selectedMatch.user._id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && selectedMatch.user && navigate(`/user/profiles/${selectedMatch.user.id || selectedMatch.user._id}`)}
                      title="Voir le profil"
                    >
                      <div className="chat-avatar">
                        {selectedMatch.user?.profile_picture_url ? (
                          <img src={selectedMatch.user.profile_picture_url} alt={selectedMatch.user.first_name || ''} />
                        ) : (
                          <div className="avatar-placeholder">
                            {selectedMatch.user?.first_name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3>{selectedMatch.user?.first_name || ''} {selectedMatch.user?.last_name || ''}</h3>
                        <p>Match depuis {formatTime(selectedMatch.created_at)}</p>
                      </div>
                    </div>
                  )}
                  <div className="chat-header-actions">
                    {selectedMatch.group_chat_id && (
                      <>
                        <button
                          type="button"
                          className="group-info-btn"
                          onClick={() => {
                            // Afficher les détails du groupe
                            setShowAddParentModal(true);
                          }}
                          title="Informations du groupe"
                        >
                          ℹ️
                        </button>
                        <button
                          type="button"
                          className="add-parent-btn"
                          onClick={openAddParentModal}
                          title="Ajouter un parent à la conversation"
                        >
                          👤+ Ajouter
                        </button>
                      </>
                    )}
                    {!selectedMatch.group_chat_id && selectedMatch.user && (
                      <BlockUserButton
                        userId={selectedMatch.user.id}
                        userName={`${selectedMatch.user.first_name || ''} ${selectedMatch.user.last_name || ''}`}
                        onBlockChange={(blocked) => {
                          setSelectedMatch(prev => prev ? { ...prev, is_blocked: blocked } : null);
                          fetchMatches();
                        }}
                      />
                    )}
                  </div>
                </div>

                {(selectedMatch.is_blocked === true || selectedMatch.is_blocked_by_them === true) && (
                  <div className="blocked-conversation-banner">
                    <span>🚫</span>
                    {selectedMatch.is_blocked === true
                      ? 'Vous avez bloqué cet utilisateur. Les messages sont désactivés.'
                      : 'Cet utilisateur vous a bloqué. Les messages sont désactivés.'}
                  </div>
                )}
                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <div className="wave-emoji">👋</div>
                      <h3>Commencez la conversation !</h3>
                      <p>Dites bonjour à {selectedMatch.user?.first_name || 'l\'utilisateur'}</p>
                    </div>
                  ) : (
                    <div className="messages-list">
                      {messages.map((msg, index) => {
                        const isOwn = msg.sender_id._id === user.id || msg.sender_id === user.id;
                        const showDate = index === 0 || 
                          new Date(msg.createdAt).toDateString() !== 
                          new Date(messages[index - 1].createdAt).toDateString();
                        
                        return (
                          <React.Fragment key={msg._id}>
                            {showDate && (
                              <div className="date-separator">
                                <span>{new Date(msg.createdAt).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                })}</span>
                              </div>
                            )}
                            <div className={`message ${isOwn ? 'own' : 'other'}`}>
                              {!isOwn && selectedMatch.group_chat_id && (
                                <span className="message-sender-label">
                                  {msg.sender_id?.first_name} {msg.sender_id?.last_name}
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
                                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
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

                {selectedMatch && selectedMatch.is_blocked !== true && selectedMatch.is_blocked_by_them !== true && (
                <>
                  {isCurrentUserReadonly() && (
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
                      disabled={isCurrentUserReadonly()}
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
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={sendPhoto}
                      style={{ display: 'none' }}
                      disabled={isCurrentUserReadonly()}
                    />
                    <button
                      type="button"
                      className="action-btn photo-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sendingMessage || isCurrentUserReadonly()}
                      title="Envoyer une photo"
                    >
                      📷
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isCurrentUserReadonly() ? "Vous avez quitté ce groupe..." : "Écrivez votre message..."}
                      disabled={sendingMessage || isCurrentUserReadonly()}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="send-btn"
                    disabled={(!newMessage.trim() || sendingMessage || isCurrentUserReadonly())}
                  >
                    {sendingMessage ? '...' : '➤'}
                  </button>
                </form>
                </>
                )}
              </>
            ) : (
              <div className="no-chat-selected">
                <div className="no-chat-icon">💌</div>
                <h3>Sélectionnez une conversation</h3>
                <p>Choisissez un match pour commencer à discuter</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Ajouter un parent */}
      {showAddParentModal && (
        <div
          className="add-parent-modal-overlay"
          onClick={() => !addingParent && setShowAddParentModal(false)}
          role="dialog"
          aria-label="Ajouter un parent à la conversation"
        >
          <div className="add-parent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-parent-modal-header">
              <h3>👥 Informations du groupe</h3>
              <button
                type="button"
                className="add-parent-modal-close"
                onClick={() => !addingParent && setShowAddParentModal(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            
            {/* Liste des participants */}
            {currentParticipants.length > 0 && (
              <div className="group-participants-section">
                <h4 className="section-title">Participants ({currentParticipants.length})</h4>
                <div className="participants-list">
                  {currentParticipants.map((p) => (
                    <div key={p.user_id} className="participant-item">
                      <div className="participant-avatar">
                        {p.first_name ? p.first_name[0] : '?'}
                      </div>
                      <div className="participant-info">
                        <span className="participant-name">
                          {p.first_name} {p.last_name}
                          {(p.user_id === user.id || p.user_id === user._id) && ' (Vous)'}
                        </span>
                        <span className="participant-role">
                          {p.role === 'user1' || p.role === 'user2' ? '👤 Candidat' : '👨‍👩‍👧 Parent'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Bouton quitter le groupe pour les parents */}
                {isCurrentUserParent() && (
                  <div className="leave-group-section">
                    <button
                      type="button"
                      className="leave-group-btn"
                      onClick={leaveGroup}
                      disabled={leavingGroup}
                    >
                      {leavingGroup ? '...' : '🚪 Quitter le groupe'}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="add-parent-section">
              <h4 className="section-title">Ajouter un parent</h4>
              <p className="add-parent-modal-hint">
                Vous pouvez ajouter un de vos parents (ayant déjà un compte) pour discuter en groupe.
              </p>
            {guardiansWithAccount.length === 0 ? (
              <p className="add-parent-modal-empty">
                Aucun parent avec compte. Votre parent doit d&apos;abord créer son compte via le lien d&apos;invitation que vous avez envoyé.
              </p>
            ) : (
              (() => {
                // Utiliser currentParticipants au lieu de participants pour éviter les problèmes de state
                const participantsToCheck = currentParticipants.length > 0 ? currentParticipants : participants;
                
                console.log('[DEBUG] Modal - participantsToCheck:', participantsToCheck);
                console.log('[DEBUG] Modal - guardiansWithAccount:', guardiansWithAccount);
                
                // Filtrer pour ne garder que les guardians (exclure user1 et user2 qui sont les candidats)
                const guardianParticipants = participantsToCheck.filter((p) => p.role === 'guardian');
                console.log('[DEBUG] Modal - guardianParticipants (role=guardian):', guardianParticipants);
                
                // Créer un Set avec les IDs des participants guardians (normalisés en string)
                const participantIdSet = new Set();
                guardianParticipants.forEach((p) => {
                  if (p.user_id) {
                    const idStr = String(p.user_id).trim();
                    participantIdSet.add(idStr);
                    console.log(`[DEBUG] Added participant ID to set: "${idStr}" (from participant:`, p, ')');
                  }
                });
                
                console.log('[DEBUG] Modal - participantIdSet (all IDs):', Array.from(participantIdSet));
                console.log('[DEBUG] Modal - guardiansWithAccount:', guardiansWithAccount.map(g => ({ 
                  name: g.guardian_name, 
                  id: getParentUserId(g),
                  idType: typeof getParentUserId(g)
                })));
                
                // Filtrer les guardians qui ne sont PAS dans les participants
                // Utiliser une comparaison stricte
                const addable = guardiansWithAccount.filter((g) => {
                  const guardianId = getParentUserId(g);
                  if (!guardianId) {
                    console.log(`[DEBUG] Guardian ${g.guardian_name}: no ID - INCLUDING in addable`);
                    return true; // Si pas d'ID, on peut quand même essayer de l'ajouter
                  }
                  
                  const guardianIdStr = String(guardianId).trim();
                  
                  // Vérifier si l'ID est dans le set (comparaison exacte)
                  const isInParticipants = participantIdSet.has(guardianIdStr);
                  
                  // Vérifier aussi avec chaque participant individuellement pour debug
                  let foundMatch = false;
                  guardianParticipants.forEach((p, idx) => {
                    const pIdStr = String(p.user_id).trim();
                    if (pIdStr === guardianIdStr) {
                      foundMatch = true;
                      console.log(`[DEBUG] Match found! Guardian "${g.guardian_name}" (${guardianIdStr}) matches participant ${idx} (${pIdStr})`);
                    }
                  });
                  
                  console.log(`[DEBUG] Guardian "${g.guardian_name}" (ID: "${guardianIdStr}") - Set has: ${isInParticipants}, Found match: ${foundMatch}`);
                  
                  if (isInParticipants || foundMatch) {
                    console.log(`[DEBUG] ⚠️ Guardian "${g.guardian_name}" is already in participants, excluding from addable list`);
                    return false;
                  } else {
                    console.log(`[DEBUG] ✅ Guardian "${g.guardian_name}" is NOT in participants, can be added`);
                    return true;
                  }
                });
                
                console.log('[DEBUG] Modal - addable guardians count:', addable.length);
                console.log('[DEBUG] Modal - addable guardians:', addable.map(g => ({ name: g.guardian_name, id: getParentUserId(g) })));
                
                // Si aucun guardian n'est disponible mais qu'il y a des guardians avec compte,
                // afficher quand même la liste pour permettre l'ajout (le backend vérifiera)
                if (addable.length === 0 && guardiansWithAccount.length > 0) {
                  console.warn('[WARNING] Aucun guardian addable trouvé, mais affichage de tous les guardians pour permettre l\'ajout');
                  console.warn('Guardians disponibles:', guardiansWithAccount.map(g => ({ name: g.guardian_name, id: getParentUserId(g) })));
                  console.warn('Participants guardians:', guardianParticipants.map(p => ({ id: p.user_id, role: p.role })));
                  
                  // Afficher tous les guardians pour permettre l'ajout (le backend vérifiera la duplication)
                  return (
                    <ul className="add-parent-list">
                      {guardiansWithAccount.map((guardian) => (
                        <li key={getParentUserId(guardian)} className="add-parent-item">
                          <span className="add-parent-name">
                            {guardian.guardian_name}
                            {guardian.guardian_email && (
                              <small> ({guardian.guardian_email})</small>
                            )}
                          </span>
                          <button
                            type="button"
                            className="add-parent-add-btn"
                            onClick={() => addParentToConversation(getParentUserId(guardian))}
                            disabled={addingParent}
                          >
                            {addingParent ? '...' : 'Ajouter'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  );
                }
                
                if (addable.length === 0) {
                  return (
                    <p className="add-parent-modal-empty">
                      Tous vos parents font déjà partie de cette conversation.
                    </p>
                  );
                }
                return (
                  <ul className="add-parent-list">
                    {addable.map((guardian) => (
                      <li key={getParentUserId(guardian)} className="add-parent-item">
                        <span className="add-parent-name">
                          {guardian.guardian_name}
                          {guardian.guardian_email && (
                            <small> ({guardian.guardian_email})</small>
                          )}
                        </span>
                        <button
                          type="button"
                          className="add-parent-add-btn"
                          onClick={() => addParentToConversation(getParentUserId(guardian))}
                          disabled={addingParent}
                        >
                          {addingParent ? '...' : 'Ajouter'}
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              })()
            )}
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div
          className="image-zoom-overlay"
          onClick={() => setZoomedImage(null)}
          role="button"
          aria-label="Fermer le zoom (Échap)"
        >
          <img
            src={zoomedImage}
            alt="Photo agrandie"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default UserConversations;
