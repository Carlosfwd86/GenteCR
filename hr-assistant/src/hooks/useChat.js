// Estado de la conversación: messages (persistido), isTyping, sendMessage, escalate.
// Habla con services/api.js (mock) y maneja los 4 tipos de mensaje del contrato:
//   1) user, 2) bot con fuente, 3) bot puede_escalar, 4) bot error.
import { useState } from 'react';

import { useLocalHistory } from './useLocalHistory.js';
import { askQuestion, escalateToHR } from '../services/api.js';

const WELCOME = {
  role: 'bot',
  text: 'Hola, soy el asistente de RH de Garnier & Garnier. ¿En qué puedo ayudarte hoy?',
  ts: 0,
};

export function useChat() {
  const { history: messages, setHistory: setMessages } = useLocalHistory([WELCOME]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (text) => {
    const clean = text?.trim();
    if (!clean) return;

    const userMsg = { role: 'user', text: clean, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await askQuestion(clean);

      const ts = Date.now();
      if (res?.respuesta == null) {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: null, puede_escalar: true, pregunta_original: clean, ts },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: res.respuesta,
            fuente: res.fuente,
            confianza: res.confianza,
            ts,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'No pude conectarme. Intentá de nuevo.',
          isError: true,
          ts: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const escalate = async (message) => {
    if (!message?.puede_escalar || message.escalado) return;

    const historial = messages.map((m) => ({
      role: m.role,
      text: m.text ?? '',
    }));

    try {
      const res = await escalateToHR(message.pregunta_original, historial);
      if (res?.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.ts === message.ts ? { ...m, escalado: true } : m)),
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'No pude derivar la consulta. Intentá de nuevo en un momento.',
          isError: true,
          ts: Date.now(),
        },
      ]);
    }
  };

  return { messages, isTyping, sendMessage, escalate };
}
