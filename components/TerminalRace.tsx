'use client';

import { useEffect, useRef, useState } from 'react';

const ROUNDS = 3;

const PHRASES = [
  'go fiber postgresql redis rabbitmq',
  'docker compose up --build -d',
  'create index concurrently on bookings',
  'select * from drivers where active = true',
  'kubectl rollout restart deployment api',
  'mqtt publish bus/location payload',
  'airflow dag trigger etl_gps_cleanup',
  'git commit -m fix race condition',
  'curl -X POST /api/v1/schedules',
  'redis-cli blpop queue:jobs 0',
  'migrate schema without downtime',
  'graceful shutdown for go workers',
  'jwt auth rate limit and cors',
  'explain analyze slow query plan',
  'nginx reverse proxy to upstream',
];

type Phase = 'typing' | 'round-done' | 'finished';

function pickPhrase(exclude: string[]): string {
  const pool = PHRASES.filter((p) => !exclude.includes(p));
  const source = pool.length > 0 ? pool : PHRASES;
  return source[Math.floor(Math.random() * source.length)];
}

function calcWpm(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  return Math.max(0, Math.round(chars / 5 / (ms / 60000)));
}

function calcAccuracy(correct: number, typed: number): number {
  if (typed <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((correct / typed) * 100)));
}

const raceCss = `
.race-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  outline: none;
}
.race-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 10px;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
  font-size: inherit;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
}
.race-meta span { white-space: nowrap; }
.race-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.race-line {
  margin-bottom: 10px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
}
.race-target {
  padding: 10px 0;
  font-size: clamp(14px, 2.2vw, 20px);
  letter-spacing: 0.02em;
}
.race-char { color: #3a6b3a; text-shadow: none; }
.race-char.ok {
  color: #ffffff;
  text-shadow: 0 0 5px #ffffff;
}
.race-char.bad {
  color: #ff3333;
  text-shadow: 0 0 5px #ff3333;
  text-decoration: underline;
}
.race-char.cursor {
  background: rgba(0, 255, 0, 0.22);
  color: #00ff00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
}
.race-accent {
  color: #ffffff;
  text-shadow: 0 0 5px #ffffff;
}
.race-ok { color: #7dff7d; }
.race-muted { color: #7dff7d; opacity: 0.85; }
.race-form {
  display: flex;
  align-items: baseline;
  gap: 1ch;
  flex-wrap: nowrap;
  margin-top: 10px;
}
.race-prompt {
  flex: none;
  font-weight: 700;
  color: #00ff00;
  white-space: nowrap;
  font-family: 'Courier New', Courier, monospace;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
}
.race-field {
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
  .race-field { font-size: 16px; }
}
`;

export default function TerminalRace({
  active,
  onQuit,
}: {
  active: boolean;
  onQuit: (bestWpm: number, rounds: number) => void;
}) {
  const [round, setRound] = useState(1);
  const [phrase, setPhrase] = useState(() => pickPhrase([]));
  const [used, setUsed] = useState<string[]>(() => [phrase]);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [keystrokes, setKeystrokes] = useState(0);
  const [lastWpm, setLastWpm] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState(100);
  const [scores, setScores] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef(0);
  const scoresRef = useRef<number[]>([]);
  const roundRef = useRef(1);
  const usedRef = useRef<string[]>([phrase]);
  const phraseRef = useRef(phrase);
  const startedAtRef = useRef<number | null>(null);
  const keystrokesRef = useRef(0);

  const bestWpm = scores.length > 0 ? Math.max(...scores) : 0;
  const status =
    phase === 'finished' ? 'done' : phase === 'round-done' ? 'round ok' : 'racing';

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);
  useEffect(() => {
    roundRef.current = round;
  }, [round]);
  useEffect(() => {
    usedRef.current = used;
  }, [used]);
  useEffect(() => {
    phraseRef.current = phrase;
  }, [phrase]);
  useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);
  useEffect(() => {
    keystrokesRef.current = keystrokes;
  }, [keystrokes]);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active, phase, round]);

  useEffect(() => {
    return () => window.clearTimeout(advanceTimer.current);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onQuit(
          scoresRef.current.length > 0 ? Math.max(...scoresRef.current) : 0,
          scoresRef.current.length,
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onQuit]);

  function startFresh() {
    window.clearTimeout(advanceTimer.current);
    const first = pickPhrase([]);
    setRound(1);
    roundRef.current = 1;
    setPhrase(first);
    phraseRef.current = first;
    setUsed([first]);
    usedRef.current = [first];
    setTyped('');
    setPhase('typing');
    setStartedAt(null);
    startedAtRef.current = null;
    setKeystrokes(0);
    keystrokesRef.current = 0;
    setLastWpm(0);
    setLastAccuracy(100);
    setScores([]);
    scoresRef.current = [];
  }

  function advanceAfterRound(nextScores: number[]) {
    if (roundRef.current >= ROUNDS) {
      setScores(nextScores);
      scoresRef.current = nextScores;
      setTyped('');
      setPhase('finished');
      return;
    }
    const next = pickPhrase(usedRef.current);
    const nextUsed = [...usedRef.current, next];
    usedRef.current = nextUsed;
    setUsed(nextUsed);
    const nextRound = roundRef.current + 1;
    roundRef.current = nextRound;
    setRound(nextRound);
    phraseRef.current = next;
    setPhrase(next);
    setTyped('');
    setPhase('typing');
    setStartedAt(null);
    startedAtRef.current = null;
    setKeystrokes(0);
    keystrokesRef.current = 0;
  }

  function completeRound(finalTyped: string) {
    const target = phraseRef.current;
    const ended = Date.now();
    const started = startedAtRef.current ?? ended;
    const ms = Math.max(ended - started, 1);
    let correct = 0;
    for (let i = 0; i < target.length; i += 1) {
      if (finalTyped[i] === target[i]) correct += 1;
    }
    const wpm = calcWpm(target.length, ms);
    const accuracy = calcAccuracy(correct, Math.max(keystrokesRef.current, finalTyped.length));
    const nextScores = [...scoresRef.current, wpm];
    scoresRef.current = nextScores;
    setLastWpm(wpm);
    setLastAccuracy(accuracy);
    setScores(nextScores);
    setPhase('round-done');
    advanceTimer.current = window.setTimeout(() => advanceAfterRound(nextScores), 900);
  }

  function onType(value: string) {
    if (phase !== 'typing') return;

    if (!startedAtRef.current && value.length > 0) {
      const now = Date.now();
      startedAtRef.current = now;
      setStartedAt(now);
    }

    if (value.length > typed.length) {
      keystrokesRef.current += 1;
      setKeystrokes(keystrokesRef.current);
    }

    const clipped = value.slice(0, phrase.length);
    setTyped(clipped);
    if (clipped === phrase) completeRound(clipped);
  }

  function handleCommand(raw: string) {
    const value = raw.trim().toLowerCase();
    if (!value) return;
    if (value === 'q' || value === 'quit' || value === '/quit') {
      onQuit(bestWpm, scores.length);
      return;
    }
    if (value === 'r' || value === 'restart') startFresh();
  }

  return (
    <div className="race-panel" onClick={() => inputRef.current?.focus()}>
      <style href="terminal-race" precedence="default">
        {raceCss}
      </style>
      <div className="race-meta">
        <span>
          RACE <span className="race-accent">v1</span>
        </span>
        <span>
          round: {Math.min(round, ROUNDS)}/{ROUNDS}
        </span>
        <span>best: {bestWpm} wpm</span>
        <span>{status}</span>
      </div>
      <div className="race-body">
        <div className="race-line race-muted">
          Ketik ulang teks di bawah. Esc / q keluar · r ulang setelah selesai.
        </div>
        <div className="race-line race-target" aria-label="Teks target">
          {phrase.split('').map((ch, i) => {
            let cls = 'race-char';
            if (phase !== 'typing') {
              cls += ' ok';
            } else if (i < typed.length) {
              cls += typed[i] === ch ? ' ok' : ' bad';
            } else if (i === typed.length) {
              cls += ' cursor';
            }
            return (
              <span key={`${i}-${ch}`} className={cls}>
                {ch}
              </span>
            );
          })}
        </div>
        {phase === 'round-done' && (
          <div className="race-line race-ok">
            Round {round} selesai — {lastWpm} WPM · akurasi {lastAccuracy}%
          </div>
        )}
        {phase === 'round-done' && round < ROUNDS && (
          <div className="race-line race-muted">Round berikutnya...</div>
        )}
        {phase === 'finished' && (
          <div className="race-line race-ok">
            Selesai! Best {bestWpm} WPM dari {scores.length} round. Ketik{' '}
            <span className="race-accent">r</span> ulang,{' '}
            <span className="race-accent">q</span> keluar.
          </div>
        )}
      </div>
      <form
        className="race-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (phase === 'typing') return;
          handleCommand(typed);
          setTyped('');
        }}
      >
        <span className="race-prompt">race&gt;</span>
        <input
          ref={inputRef}
          className="race-field"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={!active || phase === 'round-done'}
          aria-label="Ketik teks race"
          value={typed}
          placeholder={phase === 'finished' ? 'r / q' : 'mulai mengetik...'}
          onChange={(event) => {
            if (phase === 'typing') onType(event.target.value);
            else if (phase === 'finished') setTyped(event.target.value);
          }}
        />
      </form>
    </div>
  );
}
