// Estado de la conversación: messages (persistido), isTyping, sendMessage.
// Habla con services/api.js (backend Express+RAG+Claude).
// Tipos de mensaje:
//   1) user                                          { role: 'user', text, ts }
//   2) bot con respuesta                             { role: 'bot', text, sources, topScore, ts }
//   3) bot escalado por el backend                   { role: 'bot', text, escalated: true, sources, ts }
//   4) bot con error de red                          { role: 'bot', text, isError: true, ts }
//
// La escalación ya no se decide en el frontend. El backend devuelve
// escalated: true junto con un mensaje pre-armado en reply, y la UI
// renderiza un EscalationBanner debajo de la burbuja.
import { useState } from 'react';

import { useLocalHistory } from './useLocalHistory.js';
import { askQuestion } from '../services/api.js';

const WELCOME = {
  role: 'bot',
  text: 'Hola, soy el asistente de RH de Garnier & Garnier. ¿En qué puedo ayudarte hoy?',
  ts: 0,
};

// Construye el historial en el formato que espera el backend:
// { role: 'user' | 'assistant', content: string }.
// Filtra mensajes sin texto (placeholder, errores anteriores no aportan).
function buildHistory(messages) {
  return messages
    .filter((m) => typeof m.text === 'string' && m.text.length > 0 && !m.isError)
    .map((m) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));
}

export function useChat() {
  const { history: messages, setHistory: setMessages } = useLocalHistory([WELCOME]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (text) => {
    const clean = text?.trim();
    if (!clean) return;

    const userMsg = { role: 'user', text: clean, ts: Date.now() };
    // Capturamos el historial ANTES de agregar el mensaje del usuario;
    // el backend lo recibe como "turnos previos" y la pregunta actual va aparte.
    const historyForBackend = buildHistory(messages);

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await askQuestion(clean, historyForBackend);
      const ts = Date.now();

      if (res?.isError) {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: res.reply, isError: true, ts },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: res?.reply ?? '',
          sources: Array.isArray(res?.sources) ? res.sources : [],
          topScore: res?.topScore,
          escalated: res?.escalated === true,
          ts,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return { messages, isTyping, sendMessage };
}
