'use client';

import { useEffect, useRef, useState } from 'react';

const portfolioData: Record<string, string> = {
  about:
    'Nur Arifin — Backend Engineer, Jakarta.\n' +
    '3+ tahun membangun API, pipeline data, dan worker yang berjalan terus.\n' +
    '\n' +
    'Sekarang: Senior Backend Engineer, PT Transportasi Jakarta (Agu 2025–sekarang).\n' +
    'API operasional bus, GPS, Passenger Information System (PIS), dan pembersihan data.\n' +
    '\n' +
    'Sebelumnya: Lenna.ai / PT Sinergi Digital Teknologi (Jan 2022–Agu 2025).\n' +
    'Backend Engineer, lalu Senior. Integrasi API untuk bank dan perusahaan.\n' +
    '\n' +
    'S1 Informatika, Universitas Nasional Jakarta (2018–2022), IPK 3.85.',
  skills:
    'Bahasa\n' +
    '  Go, PHP, JavaScript, SQL\n' +
    '\n' +
    'Backend & data\n' +
    '  REST API, PostgreSQL, Redis, RabbitMQ, MQTT, Apache Airflow\n' +
    '\n' +
    'Infra\n' +
    '  Docker, CI/CD, AWS, Linux, Grafana\n' +
    '\n' +
    'Yang sering dikerjakan\n' +
    '  Worker dan antrian pesan, ETL, optimasi query, migrasi skema, integrasi sistem luar',
  projects:
    'TRANSJAKARTA\n' +
    'Dari commit GitLab, Agu 2025–sekarang.\n' +
    '\n' +
    '1. API operasional bus (Go, PostgreSQL)\n' +
    '   Master data operator dan kuota bus, KM baku, rostering pramudi,\n' +
    '   jadwal (timetable lite), hak akses, dan export.\n' +
    '   Riwayat ubah harian ikut tersimpan; generate jadwal lewat MQTT.\n' +
    '\n' +
    '2. Pipeline GPS (Apache Airflow)\n' +
    '   Monitoring GPS, riwayat perjalanan, dan downtime per bus serta delivery order.\n' +
    '   Proses GPS dan travel history turun dari 5–6 menit menjadi 10–20 detik.\n' +
    '   Delay GPS memakai rata-rata berbobot dari timestamp perangkat, dengan jadwal GTFS\n' +
    '   sebagai acuan kalau data perangkat kosong.\n' +
    '\n' +
    '3. PIS — info kedatangan penumpang\n' +
    '   Worker Go dan cron API untuk halte serta gate.\n' +
    '   MQTT untuk data masuk, RabbitMQ untuk antrian, Redis untuk cache.\n' +
    '   Duplikat kedatangan dibereskan; tiap gate/halte memetakan bus yang unik.\n' +
    '   ETA kumulatif yang negatif disaring sebelum tayang.\n' +
    '\n' +
    '4. Listener delivery order\n' +
    '   Status keterlambatan DO, simpan ke Redis, publish MQTT,\n' +
    '   dan kirim notifikasi operasional. Dashboard memantau DO baru dan delay anomali.\n' +
    '\n' +
    '5. Generator jadwal\n' +
    '   Generate bulanan dan ubah harian: alokasi bus, preview, publish per halte,\n' +
    '   plus bus yang dibawa ke slot berikutnya.\n' +
    '\n' +
    '6. Migrasi database\n' +
    '   Skema PostgreSQL untuk jadwal, KM baku, kuota operator, dan index.\n' +
    '\n' +
    'LENNA.AI\n' +
    'Jan 2022–Agu 2025. Klien antara lain BNI, Mega Insurance, dan Bank Indonesia.\n' +
    '\n' +
    'Yang dibangun:\n' +
    '  Integrasi 10+ API, alur komplain mesin EDC, dan chatbot.\n' +
    '  Response time backend sempat membaik sampai sekitar 20%.\n' +
    '  Deploy lewat Docker dan CI/CD di AWS.\n' +
    '\n' +
    'Sistem bank yang didampingi (requirement, monitoring, atau change request):\n' +
    '  BI-FAST wholesale (single dan bulk), mesin setor tunai, credit underwriting,\n' +
    '  cek mundur, dan dealer lintas mata uang MYR.\n' +
    '  Pelaporan: LLD, SLIK OJK, BI Checking, Antasena, penyesuaian NPWP,\n' +
    '  dan scrubbing data SID.\n' +
    '\n' +
    'Proyek lain, 2023:\n' +
    '  Dashboard kinerja Kota Palopo (Svelte, Rust, Docker, PostgreSQL).\n' +
    '  Digitalisasi tambang: hitung aktivitas alat berat dari video.\n' +
    '  CCTV smart city DKI: banjir, genangan, PKL, kerumunan, dan lalu lintas.',
  contact:
    'Email    : arifingdr@gmail.com\nLinkedIn : linkedin.com/in/nur-arivin\nWeb      : arifinportfolio.my.id',
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
  .terminal-field {
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
  flex-wrap: nowrap;
  margin-top: 10px;
}
.terminal-prompt {
  flex: none;
  margin-right: 8px;
  font-weight: 700;
  color: #00ff00;
  white-space: nowrap;
}
.terminal-field {
  flex: 1;
  width: auto;
  min-width: 0;
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
                <span className="terminal-prompt">visitor@arifin-portfolio:~$</span> {line.value}
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
        <span className="terminal-prompt">visitor@arifin-portfolio:~$</span>
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
