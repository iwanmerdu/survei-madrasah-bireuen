import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Smartphone,
  Monitor,
  Sparkles,
  Trash2,
  ArrowLeft,
  Send,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

// ==========================================
// 1. MASUKKAN CONFIG FIREBASE BAPAK DI SINI
// ==========================================
/*
const firebaseConfig = {
  apiKey: 'ISI_DENGAN_API_KEY_BAPAK',
  authDomain: 'ISI_DENGAN_AUTH_DOMAIN_BAPAK',
  projectId: 'ISI_DENGAN_PROJECT_ID_BAPAK',
  storageBucket: 'ISI_DENGAN_STORAGE_BUCKET_BAPAK',
  messagingSenderId: 'ISI_DENGAN_SENDER_ID_BAPAK',
  appId: 'ISI_DENGAN_APP_ID_BAPAK',
};
*/

const firebaseConfig = {
  apiKey: 'AIzaSyApAfYvij7JhZPetwr2-GvyjzNQRKtdidc',
  authDomain: 'survei-madrasah-bireuen.firebaseapp.com',
  projectId: 'survei-madrasah-bireuen',
  storageBucket: 'survei-madrasah-bireuen.firebasestorage.app',
  messagingSenderId: '337502794606',
  appId: '1:337502794606:web:dc7c45b5af7545a04ac77f',
  measurementId: 'G-N9EK5QYPE9',
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Nama koleksi database di Firebase
const NAMA_KOLEKSI = 'survei_bireuen';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [responses, setResponses] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Otentikasi Anonim
  useEffect(() => {
    signInAnonymously(auth).catch((error) =>
      console.error('Auth error:', error)
    );
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Listener Real-time ke Database
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, NAMA_KOLEKSI);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setResponses(data);
      },
      (error) => {
        console.error('Snapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // STATE FORM
  const [formData, setFormData] = useState({
    jenjang: '',
    internet: '',
    website: '',
    medsos: '',
    penggunaan: '',
    platform: '',
    hambatan: '',
    kesiapan: '',
    dukungan: '',
    langkah_baru: '',
  });

  // NAVIGASI
  const goHome = () => setView('landing');
  const goForm = () => setView('form');
  const goDashboard = () => setView('dashboard');

  const handleSelect = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // KIRIM DATA KE FIREBASE
  const submitSurvey = async () => {
    if (!formData.jenjang || !formData.hambatan) {
      alert('Mohon isi setidaknya jenjang dan hambatan utama.');
      return;
    }
    if (!user) {
      alert('Sistem sedang menghubungkan ke server, mohon tunggu sebentar...');
      return;
    }

    const newResponse = { ...formData, timestamp: Date.now() };

    try {
      const colRef = collection(db, NAMA_KOLEKSI);
      await addDoc(colRef, newResponse);

      setFormData({
        jenjang: '',
        internet: '',
        website: '',
        medsos: '',
        penggunaan: '',
        platform: '',
        hambatan: '',
        kesiapan: '',
        dukungan: '',
        langkah_baru: '',
      });
      setView('success');
      setTimeout(() => setView('landing'), 3000);
    } catch (error) {
      console.error('Gagal mengirim data: ', error);
      alert('Gagal mengirim data. Pastikan API Key Firebase sudah benar.');
    }
  };

  // HAPUS SEMUA DATA FIREBASE
  const resetData = async () => {
    if (!user) return;
    if (
      confirm(
        'PERINGATAN: Hapus semua data responden di SELURUH perangkat secara permanen?'
      )
    ) {
      try {
        const colRef = collection(db, NAMA_KOLEKSI);
        const snapshot = await getDocs(colRef);
        const deletePromises = [];
        snapshot.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });
        await Promise.all(deletePromises);
        setAiAnalysis(null);
      } catch (error) {
        console.error('Gagal mereset data: ', error);
      }
    }
  };

  // SIMULASI AI
  const generateAIAnalysis = () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);

    setTimeout(() => {
      if (responses.length === 0) {
        setAiAnalysis(
          'Belum ada data untuk dianalisis. Silakan kumpulkan data terlebih dahulu.'
        );
        setIsAnalyzing(false);
        return;
      }

      const topHambatan = getTopAnswer('hambatan');
      const topJenjang = getTopAnswer('jenjang');
      const topKesiapan = getTopAnswer('kesiapan');
      const topLangkah = getTopAnswer('langkah_baru');

      let rekomendasi = '';
      if (topHambatan === 'Keterbatasan perangkat') {
        rekomendasi =
          "Terapkan metode 'Satu Proyektor, Kelas Aktif' menggunakan simulasi offline di depan kelas tanpa memaksa siswa membawa perangkat.";
      } else if (topHambatan === 'Kurang pelatihan teknis') {
        rekomendasi =
          "Segera gagas pelatihan 'Micro-Credential' langsung praktik (hands-on) bersama ahli EdTech.";
      } else {
        rekomendasi =
          'Maksimalkan penggunaan AI untuk mempercepat beban administrasi, sehingga fokus kembali ke interaksi kelas.';
      }

      const text = `Berdasarkan analisis dari ${responses.length} responden (didominasi jenjang ${topJenjang}), tantangan terbesar di Bireuen adalah "${topHambatan}". \n\nMenariknya, mayoritas guru menyatakan "${topKesiapan}" belajar teknologi baru, dan sangat antusias memulai langkah: "${topLangkah}".\n\nRekomendasi Taktis: ${rekomendasi}\n\nPesan untuk Guru: Antusiasme Bapak/Ibu adalah modal utama yang jauh lebih mahal dari server mana pun. Mari bergerak bersama!`;

      setAiAnalysis(text);
      setIsAnalyzing(false);
    }, 2000);
  };

  // HELPER DATA
  const totalResponden = responses.length;
  const getPercentage = (field, value) => {
    if (totalResponden === 0) return 0;
    const count = responses.filter((r) => r[field] === value).length;
    return Math.round((count / totalResponden) * 100);
  };
  const getTopAnswer = (field) => {
    if (totalResponden === 0) return 'Belum ada data';
    const counts = {};
    responses.forEach((r) => {
      counts[r[field]] = (counts[r[field]] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
  };

  const medsosAktifPct =
    totalResponden > 0
      ? Math.round(
          (responses.filter((r) => r.medsos === 'Ya, aktif').length /
            totalResponden) *
            100
        )
      : 0;
  const siapBelajarPct =
    totalResponden > 0
      ? Math.round(
          (responses.filter(
            (r) =>
              r.kesiapan === 'Sangat siap' ||
              r.kesiapan === 'Siap, asal ada pendampingan'
          ).length /
            totalResponden) *
            100
        )
      : 0;
  const topHambatanDisplay =
    totalResponden > 0 ? getTopAnswer('hambatan') : '-';

  // KOMPONEN STAT BAR
  const StatBar = ({ label, percentage }) => (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-blue-400 font-bold">{percentage}%</span>
      </div>
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -translate-x-full"></div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // VIEW: LANDING PAGE
  // ==========================================
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20">
          <BarChart3 className="text-cyan-400 w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-tight">
          Survei Digitalisasi
        </h1>
        <h2 className="text-2xl md:text-3xl font-medium text-cyan-400 text-center mb-6">
          Madrasah Kab. Bireuen
        </h2>
        <h2 className="text-xl font-semibold text-white mb-2">
          Create by. Ridwan, S.ST, M.T
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-10">
          <button
            onClick={goForm}
            className="group relative bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all overflow-hidden"
          >
            <Smartphone className="w-12 h-12 text-pink-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Isi Survei
            </h3>
            <p className="text-sm text-slate-400">Untuk peserta — dari HP</p>
          </button>
          <button
            onClick={goDashboard}
            className="group relative bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all overflow-hidden"
          >
            <Monitor className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Dashboard</h3>
            <p className="text-sm text-slate-400">
              Untuk proyektor — Live Sync
            </p>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: SUCCESS PAGE
  // ==========================================
  if (view === 'success') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-6 animate-bounce" />
        <h2 className="text-3xl font-bold mb-2">Terima Kasih!</h2>
        <p className="text-slate-400">
          Data Anda berhasil dikirim ke layar proyektor.
        </p>
      </div>
    );
  }

  // ==========================================
  // VIEW: FORM (Mobile)
  // ==========================================
  if (view === 'form') {
    const questions = [
      {
        field: 'jenjang',
        title: '1. Jenjang Madrasah tempat Anda bertugas?',
        options: ['MIN / MI', 'MTsN / MTs', 'MAN / MA', 'Pengawas'],
      },
      {
        field: 'internet',
        title: '2. Bagaimana kondisi internet di madrasah?',
        options: ['Cepat & Stabil', 'Ada, tapi lambat', 'Belum ada'],
      },
      {
        field: 'website',
        title: '3. Apakah madrasah memiliki Website resmi?',
        options: ['Ya, aktif', 'Ada, tidak aktif', 'Belum ada'],
      },
      {
        field: 'medsos',
        title: '4. Apakah memiliki Media Sosial (IG/FB/YT) aktif?',
        options: ['Ya, aktif', 'Ada, tidak aktif', 'Belum ada'],
      },
      {
        field: 'penggunaan',
        title: '5. Seberapa sering Anda menggunakan aplikasi digital?',
        options: ['Sering', 'Sesekali', 'Jarang', 'Belum pernah'],
      },
      {
        field: 'platform',
        title: '6. Platform apa yang paling sering digunakan?',
        options: [
          'WhatsApp',
          'YouTube/Video',
          'Google Classroom',
          'LMS',
          'Belum Pakai',
        ],
      },
      {
        field: 'hambatan',
        title: '7. Tantangan TERBESAR digitalisasi kelas Anda?',
        options: [
          'Keterbatasan perangkat',
          'Sinyal / Internet buruk',
          'Kurang pelatihan',
          'Tidak ada waktu',
        ],
      },
      {
        field: 'kesiapan',
        title: '8. Seberapa siap Anda belajar teknologi baru?',
        options: [
          'Sangat siap',
          'Siap, asal didampingi',
          'Masih ragu-ragu',
          'Belum Siap',
        ],
      },
      {
        field: 'dukungan',
        title: '9. Dukungan yang paling Anda butuhkan?',
        options: [
          'Bantuan perangkat',
          'Pelatihan teknis',
          'Pendampingan materi',
          'Internet stabil',
        ],
      },
      {
        field: 'langkah_baru',
        title: '10. Langkah digitalisasi yang ingin dimulai?',
        options: [
          'Platform Digital (Quizizz, Canva)',
          'Video Pembelajaran',
          'Google Classroom/LMS',
          'Aktifkan Web',
        ],
      },
    ];

    return (
      <div className="min-h-screen bg-slate-900 text-slate-200">
        <div className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <button
            onClick={goHome}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">Survei Bireuen</span>
          <div className="w-9"></div>
        </div>

        <div className="max-w-lg mx-auto p-6 space-y-8 pb-32">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50"
            >
              <h3 className="text-lg font-medium text-white mb-4">{q.title}</h3>
              <div className="space-y-3">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(q.field, opt)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      formData[q.field] === opt
                        ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {formData[q.field] === opt && (
                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900">
          <button
            onClick={submitSurvey}
            className="w-full max-w-lg mx-auto bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            Kirim Jawaban <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: DASHBOARD (Proyektor)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 p-4 md:p-8 overflow-x-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Digitalisasi Madrasah{' '}
            <span className="text-amber-500">Bireuen</span>
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-400" /> Live Sync
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-800 px-4 py-2.5 rounded-lg border border-slate-700 flex items-center gap-2">
            <span className="text-slate-400">Responden:</span>
            <span className="text-xl font-bold text-white">
              {totalResponden}
            </span>
          </div>
          <button
            onClick={generateAIAnalysis}
            className="px-5 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> Analisis AI
          </button>
          <button
            onClick={resetData}
            className="p-2.5 bg-red-950/30 text-red-400 rounded-lg border border-red-900/50"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={goHome}
            className="px-4 py-2.5 bg-slate-800 rounded-lg border border-slate-700"
          >
            ←
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/40 p-6 rounded-2xl text-center">
          <span className="text-5xl font-bold">{totalResponden}</span>
          <br />
          <span className="text-sm text-slate-400 uppercase">
            Total Responden
          </span>
        </div>
        <div className="bg-slate-800/40 p-6 rounded-2xl text-center">
          <span className="text-5xl font-bold text-cyan-400">
            {siapBelajarPct}%
          </span>
          <br />
          <span className="text-sm text-slate-400 uppercase">
            Siap Belajar AI
          </span>
        </div>
        <div className="bg-slate-800/40 p-6 rounded-2xl text-center">
          <span className="text-5xl font-bold text-blue-400">
            {medsosAktifPct}%
          </span>
          <br />
          <span className="text-sm text-slate-400 uppercase">Medsos Aktif</span>
        </div>
        <div className="bg-slate-800/40 p-6 rounded-2xl text-center">
          <span className="text-2xl font-bold text-pink-400 break-words">
            {topHambatanDisplay}
          </span>
          <br />
          <span className="text-sm text-slate-400 uppercase">
            Hambatan Utama
          </span>
        </div>
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-slate-800/40 p-6 rounded-2xl">
            <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase">
              Jenjang
            </h3>
            <StatBar
              label="MIN/MI"
              percentage={getPercentage('jenjang', 'MIN / MI')}
            />
            <StatBar
              label="MTsN/MTs"
              percentage={getPercentage('jenjang', 'MTsN / MTs')}
            />
            <StatBar
              label="MAN/MA"
              percentage={getPercentage('jenjang', 'MAN / MA')}
            />
          </div>
          <div className="bg-slate-800/40 p-6 rounded-2xl">
            <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase">
              Platform Utama
            </h3>
            <StatBar
              label="WhatsApp"
              percentage={getPercentage('platform', 'WhatsApp')}
            />
            <StatBar
              label="Google Classroom"
              percentage={getPercentage('platform', 'Google Classroom')}
            />
            <StatBar
              label="Video / YT"
              percentage={getPercentage('platform', 'YouTube/Video')}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/40 p-6 rounded-2xl">
            <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase">
              Kesiapan Guru
            </h3>
            <StatBar
              label="Sangat siap"
              percentage={getPercentage('kesiapan', 'Sangat siap')}
            />
            <StatBar
              label="Siap, butuh dampingan"
              percentage={getPercentage('kesiapan', 'Siap, asal didampingi')}
            />
            <StatBar
              label="Ragu / Belum Siap"
              percentage={
                getPercentage('kesiapan', 'Masih ragu-ragu') +
                getPercentage('kesiapan', 'Belum Siap')
              }
            />
          </div>
          <div className="bg-slate-800/40 p-6 rounded-2xl">
            <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase">
              Kebutuhan Dukungan
            </h3>
            <StatBar
              label="Bantuan Perangkat"
              percentage={getPercentage('dukungan', 'Bantuan perangkat')}
            />
            <StatBar
              label="Pelatihan Teknis"
              percentage={getPercentage('dukungan', 'Pelatihan teknis')}
            />
            <StatBar
              label="Internet Stabil"
              percentage={getPercentage('dukungan', 'Internet stabil')}
            />
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {aiAnalysis && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-8 rounded-3xl max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="text-amber-400" /> Insight AI
            </h2>
            <div className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
              {aiAnalysis}
            </div>
            <button
              onClick={() => setAiAnalysis(null)}
              className="mt-8 w-full bg-slate-700 py-3 rounded-xl text-white font-bold"
            >
              Tutup Analisis
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}
