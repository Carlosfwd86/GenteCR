// Persiste el historial de la conversación en localStorage bajo una key fija.
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'hr-assistant:history';

export function useLocalHistory(initial = []) {
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // storage lleno o bloqueado: ignorar silenciosamente
    }
  }, [history]);

  const clear = () => setHistory([]);

  return { history, setHistory, clear };
}
