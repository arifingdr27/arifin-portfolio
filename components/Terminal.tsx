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
    'Frontend\n' +
    '  React, Redux, Vite, Tailwind CSS\n' +
    '\n' +
    'AI\n' +
    '  Gemini, Groq\n' +
    '\n' +
    'Yang sering dikerjakan\n' +
    '  Worker dan antrian pesan, ETL, optimasi query, migrasi skema, integrasi sistem luar',
  projects:
    '--------------------------------\n' +
    'TRANSJAKARTA\n' +
    'Agustus 2025–sekarang. Sistem di belakang operasional bus.\n' +
    '\n' +
    '1. Data operasional bus\n' +
    '   Data perusahaan operator, jatah jumlah bus, jarak tempuh standar tiap rute,\n' +
    '   jadwal kerja sopir, dan jadwal perjalanan.\n' +
    '   Siapa yang boleh mengubah data diatur, dan datanya bisa diunduh.\n' +
    '   Perubahan jadwal harian tersimpan. Perintah membuat jadwal dikirim langsung ke sistem lain.\n' +
    '   Masalah: rute yang sama tersimpan dobel, jadwal harian bentrok dengan yang sudah tayang,\n' +
    '   dan tidak semua orang boleh mengubah data sopir.\n' +
    '\n' +
    '2. Pengolahan lokasi bus\n' +
    '   Lokasi bus, riwayat perjalanan, dan lama bus tidak mengirim sinyal\n' +
    '   diolah otomatis per bus dan per surat tugas hari itu.\n' +
    '   Waktu olah turun dari 5–6 menit menjadi 10–20 detik.\n' +
    '   Keterlambatan dihitung dari rata-rata waktu di perangkat GPS.\n' +
    '   Kalau sinyal kosong, yang dipakai adalah jadwal resmi perjalanan.\n' +
    '   Masalah: lokasi baru selesai diolah setelah 5–6 menit, dan banyak bus yang sinyalnya putus\n' +
    '   sehingga keterlambatan tidak bisa dihitung dari perangkat saja.\n' +
    '\n' +
    '3. Layar info penumpang di halte\n' +
    '   Menyiapkan bus yang akan tiba di tiap halte dan pintu halte.\n' +
    '   Data masuk langsung, antrian pesan menjaga proses tetap teratur,\n' +
    '   dan hasil sementaranya disimpan supaya cepat dibaca.\n' +
    '   Kedatangan yang dobel dibereskan, jadi tiap halte menampilkan bus yang benar.\n' +
    '   Perkiraan waktu tiba yang tidak masuk akal tidak ditampilkan.\n' +
    '   Masalah: satu bus muncul dua kali di layar halte, dan perkiraan tiba kadang minus\n' +
    '   sehingga penumpang melihat info yang salah.\n' +
    '\n' +
    '4. Pemantau surat tugas bus\n' +
    '   Memantau surat tugas baru: bus tepat waktu atau terlambat,\n' +
    '   lalu mengirim kabar ke tim operasional.\n' +
    '   Layar pantau menampilkan surat tugas baru dan keterlambatan yang tidak wajar.\n' +
    '   Masalah: surat tugas baru kadang tidak ikut terbarui di layar,\n' +
    '   dan keterlambatan kecil bercampur dengan yang benar-benar bermasalah.\n' +
    '\n' +
    '5. Pembuat jadwal bus\n' +
    '   Menyusun jadwal sebulan dan perubahan harian.\n' +
    '   Bus dibagi per halte, bisa dicek dulu sebelum ditayangkan,\n' +
    '   termasuk bus yang lanjut ke jadwal berikutnya.\n' +
    '   Masalah: jumlah bus tidak selalu cukup. Bus dari jadwal sebelumnya bisa menempati slot biasa,\n' +
    '   dan perubahan harian berisiko menimpa jadwal yang sudah ditayangkan.\n' +
    '\n' +
    '6. Penataan penyimpanan data\n' +
    '   Data jadwal, jarak tempuh, dan jatah bus operator ditata\n' +
    '   supaya tidak dobel, rapi, dan cepat dicari.\n' +
    '   Masalah: data lama sudah ada yang dobel. Kalau aturan baru dipasang langsung,\n' +
    '   penyimpanan gagal dan sistem tidak bisa jalan.\n' +
    '\n' +
    '--------------------------------\n' +
    'LENNA.AI\n' +
    'Januari 2022–Agustus 2025.\n' +
    'Klien antara lain BNI, Mega Insurance, dan Bank Indonesia.\n' +
    '\n' +
    'Yang dibangun:\n' +
    '1. Sambungan lebih dari 10 sistem, supaya alur kerja klien berjalan otomatis.\n' +
    '   Masalah: tiap sistem bank punya cara kirim data sendiri. Satu sambungan putus, proses klien ikut berhenti.\n' +
    '2. Alur komplain mesin gesek kartu (EDC).\n' +
    '   Masalah: laporan kerusakan masuk tercecer, sulit dilacak sampai benar-benar selesai.\n' +
    '3. Chatbot agar balasan ke pengguna lebih cepat.\n' +
    '   Masalah: pengguna menunggu jawaban, sementara petugas tidak sanggup membalas satu per satu.\n' +
    '4. Waktu respons sistem sempat lebih cepat sampai sekitar 20%.\n' +
    '   Masalah: sistem terasa lambat saat banyak permintaan masuk bersamaan.\n' +
    '5. Rilis aplikasi otomatis ke server Amazon (AWS).\n' +
    '   Masalah: rilis manual mudah keliru dan lama, padahal klien butuh perbaikan cepat.\n' +
    '\n' +
    'Sistem bank yang didampingi (kebutuhan, pantauan, atau permintaan perubahan):\n' +
    '1. Transfer cepat antarbank (BI-FAST) untuk nasabah bisnis, satuan maupun massal.\n' +
    '   Masalah: transfer bisnis harus cepat dan tepat, baik satu transaksi maupun ribuan sekaligus.\n' +
    '2. Mesin setor tunai.\n' +
    '   Masalah: setoran di mesin harus masuk ke pembukuan bank tanpa selisih.\n' +
    '3. Penilaian layak tidaknya pengajuan kredit.\n' +
    '   Masalah: aturan kelayakan kredit berubah, dan keputusan tidak boleh meleset.\n' +
    '4. Cek yang baru bisa dicairkan di tanggal nanti.\n' +
    '   Masalah: cek mudah dicairkan lebih awal kalau tanggal berlakunya tidak dijaga.\n' +
    '5. Dealer mata uang ringgit Malaysia.\n' +
    '   Masalah: kebutuhan dan batas waktu proyek harus selaras dengan sistem perbankan yang sudah jalan.\n' +
    '6. Laporan lalu lintas devisa.\n' +
    '   Masalah: aturan devisa baru, laporan lama tidak lagi diterima pengawas.\n' +
    '7. Laporan riwayat kredit ke OJK (SLIK).\n' +
    '   Masalah: laporan harian wajib terus jalan. Sekali macet, kepatuhan ikut terganggu.\n' +
    '8. Pengecekan riwayat kredit ke Bank Indonesia.\n' +
    '   Masalah: pengecekan harian sering error, dan kesalahan kecil berdampak ke keputusan kredit.\n' +
    '9. Pelaporan bank ke Bank Indonesia (Antasena).\n' +
    '   Masalah: format laporan pengawas berubah, sistem lama tidak langsung ikut berubah.\n' +
    '10. Penyesuaian nomor NPWP.\n' +
    '    Masalah: format NPWP baru membuat data nasabah lama tidak lagi cocok.\n' +
    '11. Pembersihan data debitur supaya tetap akurat.\n' +
    '    Masalah: data debitur kotor menumpuk tiap bulan dan ikut merusak laporan.\n' +
    '\n' +
    'Proyek lain, 2023:\n' +
    '1. Dashboard kinerja Kota Palopo: satu layar berisi grafik data kota.\n' +
    '   Masalah: data dinas tercecer di banyak tempat, pimpinan tidak bisa melihat satu gambaran.\n' +
    '2. Digitalisasi tambang: hitung aktivitas alat berat dari rekaman video.\n' +
    '   Masalah: aktivitas ekskavator dan dumptruck sulit dihitung manual dari lapangan.\n' +
    '3. CCTV kota DKI: peringatan banjir, genangan, pedagang kaki lima, kerumunan, dan lalu lintas.\n' +
    '   Masalah: kamera banyak, tetapi peringatan ke dinas tetap lambat dan terpisah-pisah.\n' +
    '\n' +
    '--------------------------------\n' +
    'SPLITBILL — proyek pribadi\n' +
    'https://splitbill.nrarivin.online\n' +
    '\n' +
    'Aplikasi bagi tagihan dari foto struk: siapa pesan apa, dan berapa yang harus dibayar.\n' +
    'Login Google, unggah atau foto struk, lalu AI membaca item, pajak, biaya lain, dan total.\n' +
    'Hasil bisa dikoreksi. Item dibagi ke teman, termasuk barang patungan seperti kantong atau ongkir.\n' +
    'Sisa pembagian rata; bahasa struk ikut terbaca, jadi layar dan PDF menyesuaikan.\n' +
    '\n' +
    'Masalah:\n' +
    '1. Foto struk sering buram, dan harga bisa terbaca salah, misalnya kurang atau lebih tiga nol.\n' +
    '2. AI utama kadang lambat atau gagal, padahal pengguna sedang menunggu hasil.\n' +
    '3. Pemakaian AI berbayar. Tanpa batas, biaya model bisa melonjak.\n' +
    '4. Kantong dan ongkir tidak boleh ditagih ke satu orang, dan sisa rupiah harus habis terbagi.\n' +
    '\n' +
    'Backend (Go, Fiber, PostgreSQL)\n' +
    '  API ekstraksi struk. Gemini dicoba lebih dulu.\n' +
    '  Groq jalan sebagai cadangan kalau Gemini lambat atau gagal.\n' +
    '  Login Google ditukar menjadi JWT. Kuota OCR bulanan dan rate limit membatasi pemakaian.\n' +
    '  Foto struk disimpan di disk server atau Firebase.\n' +
    '\n' +
    'Frontend (React, Redux, Tailwind, Vite)\n' +
    '  Alur: unggah, cek detail, tambah teman, bagi item, selesai, unduh PDF.\n' +
    '  Di-build lalu di-serve Nginx lewat Docker.\n' +
    '\n' +
    'Infra\n' +
    '  API ikut jaringan Docker shared-infra.\n' +
    '  Postgres 16 dipakai bersama, datanya di volume, port hanya di localhost.\n' +
    '  Stack yang sama juga menjalankan Redis dan RabbitMQ untuk aplikasi lain.',
  contact:
    'Email    : arifingdr@gmail.com\nLinkedIn : linkedin.com/in/nur-arivin\nWeb      : nrarivin.online',
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

  const fitToVisibleArea = useRef(() => {});

  useEffect(() => {
    const fit = () => {
      const screen = scrollerRef.current;
      const viewport = window.visualViewport;
      if (!screen || !viewport) return;
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      if (!mobile) {
        screen.style.position = '';
        screen.style.top = '';
        screen.style.left = '';
        screen.style.width = '';
        screen.style.height = '';
        return;
      }
      screen.style.position = 'fixed';
      screen.style.top = `${viewport.offsetTop}px`;
      screen.style.left = '0';
      screen.style.width = '100%';
      screen.style.height = `${viewport.height}px`;
      screen.scrollTop = screen.scrollHeight;
    };
    fitToVisibleArea.current = fit;
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', fit);
    viewport?.addEventListener('scroll', fit);
    window.addEventListener('orientationchange', fit);
    fit();
    return () => {
      viewport?.removeEventListener('resize', fit);
      viewport?.removeEventListener('scroll', fit);
      window.removeEventListener('orientationchange', fit);
    };
  }, []);

  useEffect(() => {
    if (active && ready) inputRef.current?.focus();
  }, [active, ready]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    fitToVisibleArea.current();
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
          onFocus={() => {
            window.setTimeout(() => fitToVisibleArea.current(), 50);
            window.setTimeout(() => fitToVisibleArea.current(), 300);
          }}
        />
      </form>
    </div>
  );
}
