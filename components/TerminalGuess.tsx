'use client';

import { useEffect, useRef, useState } from 'react';

const MIN = 1;
const MAX = 100;

type GuessLine =
  | { id: number; kind: 'system'; text: string }
  | { id: number; kind: 'guess'; value: string }
  | { id: number; kind: 'hint'; text: string; tone?: 'ok' | 'err' };

function roll(): number {
  return MIN + Math.floor(Math.random() * (MAX - MIN + 1));
}

const guessCss = `
.guess-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  outline: none;
}
.guess-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 10px;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
  font-size: inherit;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
}
.guess-meta span { white-space: nowrap; }
.guess-log {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.guess-line {
  margin-bottom: 8px;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
}
.guess-row {
  display: flex;
  align-items: baseline;
  gap: 1ch;
}
.guess-prompt {
  flex: none;
  font-weight: 700;
  color: #00ff00;
  white-space: nowrap;
}
.guess-accent {
  color: #ffffff;
  text-shadow: 0 0 5px #ffffff;
}
.guess-ok {
  color: #7dff7d;
}
.guess-err {
  color: #ff3333;
  text-shadow: 0 0 5px #ff3333;
}
.guess-form {
  display: flex;
  align-items: baseline;
  gap: 1ch;
  flex-wrap: nowrap;
  margin-top: 10px;
}
.guess-field {
  flex: 1;
  width: auto;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #00ff00;
  font: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-shadow: inherit;
  font-family: 'Courier New', Courier, monospace;
}
@media (max-width: 768px) {
  .guess-field { font-size: 16px; }
}
`;

export default function TerminalGuess({
  active,
  onQuit,
}: {
  active: boolean;
  onQuit: (attempts: number, won: boolean) => void;
}) {
  const [secret, setSecret] = useState(roll);
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [lines, setLines] = useState<GuessLine[]>(() => [
    {
      id: 0,
      kind: 'system',
      text: `Tebak angka dari ${MIN} sampai ${MAX}. Ketik angka lalu Enter.`,
    },
    { id: 1, kind: 'system', text: 'Perintah: q keluar · r ulang (setelah menang).' },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(2);
  const attemptsRef = useRef(0);
  const wonRef = useRef(false);

  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);
  useEffect(() => {
    wonRef.current = won;
  }, [won]);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active, won]);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [lines]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onQuit(attemptsRef.current, wonRef.current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onQuit]);

  function push(line: Omit<GuessLine, 'id'> & { id?: number }) {
    const id = idRef.current++;
    setLines((current) => [...current, { ...line, id } as GuessLine]);
  }

  function restart() {
    const next = roll();
    setSecret(next);
    setAttempts(0);
    attemptsRef.current = 0;
    setWon(false);
    wonRef.current = false;
    push({ kind: 'system', text: ' ' });
    push({
      kind: 'system',
      text: `Round baru. Tebak angka dari ${MIN} sampai ${MAX}.`,
    });
  }

  function handleSubmit(raw: string) {
    const value = raw.trim().toLowerCase();
    if (!value) return;

    push({ kind: 'guess', value: raw });

    if (value === 'q' || value === '/quit' || value === 'quit') {
      onQuit(attemptsRef.current, wonRef.current);
      return;
    }

    if (won) {
      if (value === 'r' || value === 'restart') {
        restart();
        return;
      }
      push({
        kind: 'hint',
        tone: 'err',
        text: 'Sudah selesai. Ketik r untuk ulang, atau q untuk keluar.',
      });
      return;
    }

    if (value === 'r' || value === 'restart') {
      restart();
      return;
    }

    if (!/^\d+$/.test(value)) {
      push({ kind: 'hint', tone: 'err', text: 'Masukkan angka bulat, atau q untuk keluar.' });
      return;
    }

    const n = Number(value);
    if (n < MIN || n > MAX) {
      push({
        kind: 'hint',
        tone: 'err',
        text: `Angka harus antara ${MIN} dan ${MAX}.`,
      });
      return;
    }

    const nextAttempts = attemptsRef.current + 1;
    attemptsRef.current = nextAttempts;
    setAttempts(nextAttempts);

    if (n === secret) {
      wonRef.current = true;
      setWon(true);
      push({
        kind: 'hint',
        tone: 'ok',
        text: `Benar! Angkanya ${secret}. Tebakan: ${nextAttempts}x. Ketik r ulang, q keluar.`,
      });
      return;
    }

    push({
      kind: 'hint',
      text: n < secret ? `${n} terlalu kecil.` : `${n} terlalu besar.`,
    });
  }

  return (
    <div className="guess-panel">
      <style href="terminal-guess" precedence="default">
        {guessCss}
      </style>
      <div className="guess-meta">
        <span>
          GUESS <span className="guess-accent">v1</span>
        </span>
        <span>
          range: {MIN}–{MAX}
        </span>
        <span>tries: {attempts}</span>
        <span>{won ? 'solved' : 'playing'}</span>
      </div>
      <div className="guess-log" ref={logRef}>
        {lines.map((line) => {
          if (line.kind === 'guess') {
            return (
              <div key={line.id} className="guess-line guess-row">
                <span className="guess-prompt">guess&gt;</span>
                <span>{line.value}</span>
              </div>
            );
          }
          if (line.kind === 'hint') {
            const tone =
              line.tone === 'ok' ? 'guess-ok' : line.tone === 'err' ? 'guess-err' : '';
            return (
              <div key={line.id} className={`guess-line ${tone}`}>
                {line.text}
              </div>
            );
          }
          return (
            <div key={line.id} className="guess-line">
              {line.text}
            </div>
          );
        })}
      </div>
      <form
        className="guess-form"
        onSubmit={(event) => {
          event.preventDefault();
          const input = inputRef.current;
          if (!input || !active) return;
          handleSubmit(input.value);
          input.value = '';
        }}
      >
        <span className="guess-prompt">guess&gt;</span>
        <input
          ref={inputRef}
          className="guess-field"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={!active}
          aria-label="Tebakan angka"
          placeholder={won ? 'r / q' : `${MIN}–${MAX}`}
        />
      </form>
    </div>
  );
}
