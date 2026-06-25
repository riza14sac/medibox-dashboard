import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Sunset, 
  Moon, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  BellRing,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { thingsboardService, getSimState } from '../services/thingsboardService';

export default function JadwalObat() {
  const [telemetry, setTelemetry] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRtcSimulated, setIsRtcSimulated] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(new Date());

  const fetchTelemetry = async () => {
    try {
      const data = await thingsboardService.fetchLatestTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    
    // Poll updates
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 2000);

    const handleStateChange = () => {
      fetchTelemetry();
    };

    window.addEventListener('medibox_state_changed', handleStateChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('medibox_state_changed', handleStateChange);
    };
  }, []);

  // Separate effect for clock ticker to avoid resetting interval on state updates
  useEffect(() => {
    const clockInterval = setInterval(() => {
      if (isRtcSimulated) {
        setSimulatedTime(prev => {
          const next = new Date(prev.getTime() + 1000);
          
          // Format as HH:mm:ss for comparison
          const timeStr = next.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g, ':');
          
          if (timeStr === '07:00:00') {
            thingsboardService.triggerAlarm('Pagi');
          } else if (timeStr === '13:00:00') {
            thingsboardService.triggerAlarm('Siang');
          } else if (timeStr === '19:00:00') {
            thingsboardService.triggerAlarm('Malam');
          }
          
          setCurrentTime(next);
          return next;
        });
      } else {
        setCurrentTime(new Date());
      }
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [isRtcSimulated]);

  const setRtcSimulatedTime = (hours, minutes, seconds) => {
    const time = new Date();
    time.setHours(hours);
    time.setMinutes(minutes);
    time.setSeconds(seconds);
    setSimulatedTime(time);
    setCurrentTime(time);
    setIsRtcSimulated(true);
  };

  const resetRtcToRealTime = () => {
    setIsRtcSimulated(false);
    setCurrentTime(new Date());
  };

  if (!telemetry) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Diambil': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Menunggu': return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'Terlewat': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Diambil': return <CheckCircle2 size={16} className="text-emerald-600" />;
      case 'Menunggu': return <Clock size={16} className="text-amber-600 animate-spin" />;
      case 'Terlewat': return <XCircle size={16} className="text-rose-600" />;
      default: return <AlertCircle size={16} className="text-slate-600" />;
    }
  };

  // Schedule template structure
  const schedules = [
    {
      id: 'pagi',
      name: 'Pagi',
      time: '07:00 WIB',
      icon: Sun,
      iconBg: 'bg-amber-100 text-amber-700',
      pills: ['Amoxicillin (1 Pcs)', 'Vitamin C (1 Pcs)'],
      status: telemetry.status_pagi,
      key: 'Pagi'
    },
    {
      id: 'siang',
      name: 'Siang',
      time: '13:00 WIB',
      icon: Sunset,
      iconBg: 'bg-orange-100 text-orange-700',
      pills: ['Paracetamol (500mg)', 'Vitamin B Complex'],
      status: telemetry.status_siang,
      key: 'Siang'
    },
    {
      id: 'malam',
      name: 'Malam',
      time: '19:00 WIB',
      icon: Moon,
      iconBg: 'bg-indigo-100 text-indigo-700',
      pills: ['Atorvastatin (10mg)', 'Obat Batuk Syrup (1 Sendok)'],
      status: telemetry.status_malam,
      key: 'Malam'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner (Clock and Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between lg:col-span-2 gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Atur & Simulasikan Waktu RTC</h3>
            <p className="text-xs text-slate-400">
              Uji alarm otomatis ketika jam internal RTC DS3231 menyentuh jadwal obat.
            </p>
            {isRtcSimulated && (
              <span className="inline-block bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 mt-1">
                ⚠️ Menjalankan Waktu RTC Buatan
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRtcSimulatedTime(6, 59, 53)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-amber-200 transition"
              title="Set jam RTC ke 06:59:53 untuk melihat alarm jam 07:00"
            >
              ⏱️ Pagi (06:59:53)
            </button>
            <button
              onClick={() => setRtcSimulatedTime(12, 59, 53)}
              className="bg-orange-50 hover:bg-orange-100 text-orange-800 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-orange-200 transition"
              title="Set jam RTC ke 12:59:53 untuk melihat alarm jam 13:00"
            >
              ⏱️ Siang (12:59:53)
            </button>
            <button
              onClick={() => setRtcSimulatedTime(18, 59, 53)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-indigo-200 transition"
              title="Set jam RTC ke 18:59:53 untuk melihat alarm jam 19:00"
            >
              ⏱️ Malam (18:59:53)
            </button>
            {isRtcSimulated && (
              <button
                onClick={resetRtcToRealTime}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-rose-200 transition"
              >
                🔄 Reset Nyata
              </button>
            )}
          </div>
        </div>

        {/* Real-time Clock Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between items-center text-center">
          <span className="text-[10px] bg-slate-800 text-slate-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            {isRtcSimulated ? 'WAKTU RTC DS3231 (SIMULASI)' : 'WAKTU RTC DS3231 (SYNC LOKAL)'}
          </span>
          <div className="text-2xl font-extrabold tracking-tight my-2">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g, ':')} WIB
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Schedules list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {schedules.map((sched) => (
          <div 
            key={sched.id} 
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all duration-300"
          >
            {/* Header card color indicator */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-2xl ${sched.iconBg}`}>
                  <sched.icon size={22} />
                </div>
                
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${getStatusColor(sched.status)}`}>
                  {getStatusIcon(sched.status)}
                  {sched.status}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-800">Shift {sched.name}</h4>
                <p className="text-xs text-slate-400 font-semibold">{sched.time}</p>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Pills List */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Daftar Obat:</span>
                <ul className="space-y-1.5">
                  {sched.pills.map((pill, idx) => (
                    <li key={idx} className="text-xs text-slate-600 font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {pill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Simulated actions inside the card */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
              {/* Trigger alarm simulation */}
              <button
                onClick={() => thingsboardService.triggerAlarm(sched.key)}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <BellRing size={12} className="text-amber-500" />
                Picu Alarm
              </button>

              {/* Reset schedule status */}
              <button
                onClick={() => {
                  const state = getSimState();
                  if (sched.key === 'Pagi') state.telemetry.status_pagi = 'Menunggu';
                  else if (sched.key === 'Siang') state.telemetry.status_siang = 'Menunggu';
                  else if (sched.key === 'Malam') state.telemetry.status_malam = 'Menunggu';
                  thingsboardService.saveSimState(state);
                }}
                className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 p-2 rounded-xl transition shadow-sm"
                title="Reset status jadwal"
              >
                <RotateCcw size={12} />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Simulator instructions alert */}
      <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-5 flex items-start space-x-3.5 shadow-sm">
        <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
          <Sparkles size={16} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-800">Info Uji Presentasi (Dosen):</h4>
          <p className="text-[11px] text-amber-700/90 leading-relaxed">
            Klik <strong>"Picu Alarm"</strong> pada salah satu jadwal di atas untuk menyimulasikan alarm berbunyi (buzzer berbunyi, LED merah menyala). Gunakan panel kontrol di header atas untuk mengeksekusi aksi pasien seperti <strong>"Ambil Obat"</strong> (untuk menyimulasikan load cell membaca perubahan berat obat saat diangkat) atau <strong>"Lewatkan"</strong> jika pasien tidak kunjung mengambil obat setelah durasi waktu habis.
          </p>
        </div>
      </div>

    </div>
  );
}
