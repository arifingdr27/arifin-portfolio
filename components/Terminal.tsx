'use client';

import { useEffect, useRef, useState } from 'react';

const portfolioData: Record<string, string> = {
  about:
    'Halo! Saya adalah Software Engineer yang berfokus pada Backend & Microservices.\nSaya suka membangun sistem yang scalable dan menyelesaikan masalah kompleks.',
  skills:
    '- Bahasa: Go, Python, JavaScript\n- Database: PostgreSQL, Redis, MongoDB\n- Infrastruktur: Docker, Kubernetes, Linux, AWS\n- Arsitektur: Microservices, RESTful API, gRPC',
  projects:
    '1. [Sistem GPS Tracking] - Backend realtime menggunakan Go & WebSockets.\n2. [Data Pipeline] - Ekstraksi dan transformasi data jutaan baris per hari.\n3. [E-Commerce API] - Microservices berbasis event-driven architecture.',
  contact:
    'Email   : engineer@contoh.com\nLinkedIn: linkedin.com/in/contoh\nGitHub  : github.com/contoh',
};

const bootSequence = [
  'Memulai Engineer-OS v1.0.0...',
  'Memeriksa memori utama... OK',
  'Memuat modul microservices... OK',
  'Menghubungkan ke database PostgreSQL... Terhubung',
  'Sistem siap.',
  ' ',
];

type LineBody =
  | { kind: 'text'; text: string }
  | { kind: 'hint' }
  | { kind: 'command'; value: string }
  | { kind: 'help' }
  | { kind: 'error'; command: string };

type Line = LineBody & { id: number };

const helpItems = [
  ['/help', 'Daftar perintah'],
  ['about', 'Tentang saya'],
  ['skills', 'Keahlian teknis'],
  ['projects', 'Daftar proyek'],
  ['contact', 'Informasi kontak'],
  ['clear', 'Membersihkan layar'],
  ['/quit', 'Menutup terminal'],
] as const;

const terminalCss = `
.terminal-screen {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 12px;
  background-color: #0a0a0a;
  background-image:
    linear-gradient(rgba(0, 255, 0, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 0, 0.05) 1px, transparent 1px);
  background-size: 2px 2px;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
  font-size: clamp(11px, 1.15vw, 16px);
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
  touch-action: manipulation;
}
@media (max-width: 768px) {
  .terminal-overlay {
    top: max(12px, env(safe-area-inset-top)) !important;
    right: max(12px, env(safe-area-inset-right)) !important;
    bottom: max(12px, env(safe-area-inset-bottom)) !important;
    left: max(12px, env(safe-area-inset-left)) !important;
    width: auto !important;
    height: auto !important;
    border-radius: 16px !important;
  }
  .terminal-screen {
    padding: 14px;
    font-size: 16px;
  }
  .terminal-input {
    flex-wrap: wrap;
  }
  .terminal-field {
    flex: 1 1 8rem;
    min-width: 0;
    font-size: 16px;
  }
}
.terminal-line {
  margin-bottom: 8px;
  line-height: 1.4;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.terminal-input {
  display: flex;
  align-items: center;
  margin-top: 10px;
}
.terminal-prompt {
  margin-right: 8px;
  font-weight: 700;
  color: #00ff00;
}
.terminal-field {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #00ff00;
  font: inherit;
  text-shadow: inherit;
}
.terminal-accent {
  color: #ffffff;
  text-shadow: 0 0 5px #ffffff;
}
.terminal-error {
  color: #ff3333;
  text-shadow: 0 0 5px #ff3333;
}
.terminal-screen::-webkit-scrollbar { width: 8px; }
.terminal-screen::-webkit-scrollbar-track { background: #0a0a0a; }
.terminal-screen::-webkit-scrollbar-thumb { background: #00ff00; }
`;

export default function Terminal({ active, onQuit }: { active: boolean; onQuit: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  function pushLine(line: LineBody) {
    const id = idRef.current++;
    setLines((current) => [...current, { ...line, id } as Line]);
  }

  useEffect(() => {
    let index = 0;
    let timer = 0;

    const step = () => {
      if (index < bootSequence.length) {
        pushLine({ kind: 'text', text: bootSequence[index] });
        index += 1;
        timer = window.setTimeout(step, 300);
        return;
      }
      pushLine({ kind: 'hint' });
      setReady(true);
    };

    timer = window.setTimeout(step, 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (active && ready) inputRef.current?.focus();
  }, [active, ready]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [lines]);

  function handleCommand(raw: string) {
    const command = raw.trim().toLowerCase();
    pushLine({ kind: 'command', value: raw });

    if (command === '') return;

    if (command === '/help') {
      pushLine({ kind: 'help' });
      return;
    }

    if (command === '/quit') {
      onQuit();
      return;
    }

    if (command === 'clear') {
      setLines([]);
      return;
    }

    const entry = portfolioData[command];
    if (entry) {
      for (const text of entry.split('\n')) pushLine({ kind: 'text', text });
      return;
    }

    pushLine({ kind: 'error', command });
  }

  return (
    <div
      ref={scrollerRef}
      className="terminal-screen"
      onClick={() => inputRef.current?.focus()}
    >
      <style href="terminal-screen" precedence="default">
        {terminalCss}
      </style>
      <div>
        {lines.map((line) => {
          if (line.kind === 'text') {
            return (
              <div key={line.id} className="terminal-line">
                {line.text}
              </div>
            );
          }
          if (line.kind === 'hint') {
            return (
              <div key={line.id} className="terminal-line">
                Ketik <span className="terminal-accent">/help</span> untuk melihat daftar perintah yang tersedia.
              </div>
            );
          }
          if (line.kind === 'command') {
            return (
              <div key={line.id} className="terminal-line">
                <span className="terminal-prompt">visitor@portfolio:~$</span> {line.value}
              </div>
            );
          }
          if (line.kind === 'help') {
            return (
              <div key={line.id}>
                <div className="terminal-line">Perintah yang tersedia:</div>
                {helpItems.map(([name, description]) => (
                  <div key={name} className="terminal-line">
                    {'  '}
                    <span className="terminal-accent">{name.padEnd(8, ' ')}</span>
                    {' - '}
                    {description}
                  </div>
                ))}
              </div>
            );
          }
          return (
            <div key={line.id} className="terminal-line terminal-error">
              Perintah tidak ditemukan: {line.command}. Ketik &apos;/help&apos; untuk daftar perintah.
            </div>
          );
        })}
      </div>
      <form
        className="terminal-input"
        onSubmit={(event) => {
          event.preventDefault();
          const input = inputRef.current;
          if (!input || !ready) return;
          handleCommand(input.value);
          input.value = '';
        }}
      >
        <span className="terminal-prompt">visitor@portfolio:~$</span>
        <input
          ref={inputRef}
          className="terminal-field"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={!ready}
          aria-label="Perintah terminal"
        />
      </form>
    </div>
  );
}
