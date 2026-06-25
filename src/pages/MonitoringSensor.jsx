import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Binary, 
  Terminal, 
  RefreshCw, 
  Database,
  Sliders,
  Play,
  Pause,
  Volume2,
  Lightbulb
} from 'lucide-react';
import { thingsboardService, getSimState } from '../services/thingsboardService';

export default function MonitoringSensor() {
  const [telemetry, setTelemetry] = useState(null);
  const [streamLogs, setStreamLogs] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const pollingRef = useRef(null);
  const consoleEndRef = useRef(null);

  const fetchTelemetry = async () => {
    try {
      const data = await thingsboardService.fetchLatestTelemetry();
      setTelemetry(data);
      
      if (isLive) {
        setStreamLogs(prev => {
          const timestamp = new Date().toLocaleTimeString('id-ID');
          const newLog = `[${timestamp}] Data telemetry diterima: ${JSON.stringify(data)}`;
          const updatedLogs = [...prev, newLog];
          if (updatedLogs.length > 25) {
            updatedLogs.shift();
          }
          return updatedLogs;
        });
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRpcToggle = async (method, currentVal) => {
    const newVal = currentVal === 1 ? 0 : 1;
    try {
      setTelemetry(prev => ({
        ...prev,
        [method === 'setLedMerah' ? 'led_merah' : method === 'setLedHijau' ? 'led_hijau' : 'buzzer']: newVal
      }));
      await thingsboardService.sendRpcCommand(method, newVal);
      
      setStreamLogs(prev => {
        const timestamp = new Date().toLocaleTimeString('id-ID');
        return [...prev, `[${timestamp}] Perintah RPC Terkirim: ${method}(${newVal})`].slice(-25);
      });
    } catch (err) {
      console.error("RPC failed:", err);
      setStreamLogs(prev => {
        const timestamp = new Date().toLocaleTimeString('id-ID');
        return [...prev, `[${timestamp}] ❌ Perintah RPC Gagal: ${err.message}. (ESP32 mungkin offline atau lambat merespon).`].slice(-25);
      });
      fetchTelemetry();
    }
  };

  useEffect(() => {
    fetchTelemetry();
    
    // Set polling interval
    pollingRef.current = setInterval(() => {
      fetchTelemetry();
    }, 2000);

    const handleStateChange = () => {
      fetchTelemetry();
    };

    window.addEventListener('medibox_state_changed', handleStateChange);

    return () => {
      clearInterval(pollingRef.current);
      window.removeEventListener('medibox_state_changed', handleStateChange);
    };
  }, [isLive]);

  // Autoscroll logger console
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamLogs]);

  const clearLogs = () => {
    setStreamLogs([]);
  };

  const getRegisterMeta = (key) => {
    const meta = {
      berat_obat: { label: 'berat_obat', type: 'Float / telemetry', device: 'HX711/SF-400 Load Cell', desc: 'Membaca berat wadah obat secara realtime (gram).' },
      status_obat: { label: 'status_obat', type: 'String / telemetry', device: 'ESP32 Logic Controller', desc: 'Indikator status minum obat (Normal, Menunggu, Diambil, Terlewat).' },
      jadwal_aktif: { label: 'jadwal_aktif', type: 'String / telemetry', device: 'RTC DS3231 + Logic', desc: 'Menandai jadwal obat yang sedang aktif berbunyi (- jika kosong).' },
      pengurangan_berat: { label: 'pengurangan_berat', type: 'Float / telemetry', device: 'HX711 Load Cell', desc: 'Jumlah berat obat yang berkurang pada sesi aktif (gram).' },
      kepatuhan_persen: { label: 'kepatuhan_persen', type: 'Integer / telemetry', device: 'ESP32 Adherence Engine', desc: 'Rata-rata persentase kepatuhan minum obat harian pasien.' },
      status_pagi: { label: 'status_pagi', type: 'String / telemetry', device: 'RTC Alarm Register', desc: 'Status minum obat pada shift pagi (07:00).' },
      status_siang: { label: 'status_siang', type: 'String / telemetry', device: 'RTC Alarm Register', desc: 'Status minum obat pada shift siang (13:00).' },
      status_malam: { label: 'status_malam', type: 'String / telemetry', device: 'RTC Alarm Register', desc: 'Status minum obat pada shift malam (19:00).' },
      led_merah: { label: 'led_merah', type: 'Integer (0/1) / telemetry', device: 'Red LED Pin', desc: 'Status output pin LED merah (1 = Menyala/Alarm/Miss, 0 = Mati).' },
      led_hijau: { label: 'led_hijau', type: 'Integer (0/1) / telemetry', device: 'Green LED Pin', desc: 'Status output pin LED hijau (1 = Menyala/Sukses/Normal, 0 = Mati).' },
      buzzer: { label: 'buzzer', type: 'Integer (0/1) / telemetry', device: 'Buzzer Actuator Pin', desc: 'Status output pin Buzzer alarm suara (1 = Bunyi, 0 = Senyap).' }
    };
    return meta[key] || { label: key, type: 'telemetry', device: 'Unknown', desc: '' };
  };

  const getTelemetryValStyle = (key, val) => {
    if (['led_merah', 'led_hijau', 'buzzer'].includes(key)) {
      return val === 1 
        ? 'text-rose-600 bg-rose-50 border-rose-200' 
        : 'text-slate-400 bg-slate-50 border-slate-100';
    }
    if (key === 'led_hijau' && val === 1) {
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
    
    if (val === 'Diambil') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val === 'Menunggu') return 'text-amber-600 bg-amber-50 border-amber-200 animate-pulse';
    if (val === 'Terlewat') return 'text-rose-600 bg-rose-50 border-rose-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  if (loading || !telemetry) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page description banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 transform translate-x-12 -translate-y-6 opacity-10">
          <Cpu size={250} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="bg-blue-500/20 text-blue-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            IoT Mapping Registry
          </span>
          <h3 className="text-xl font-bold">Register Telemetry ThingsBoard Cloud</h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            Halaman ini memetakan variabel internal mikrokontroler **ESP32** (koneksi sensor HX711, RTC DS3231, buzzer, dan status LED) ke key database ThingsBoard telemetry yang siap dikonsumsi oleh dashboard.
          </p>
        </div>
      </div>

      {/* Main Grid: Telemetry Details & Console/JSON */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Telemetry Keys Details List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Sliders size={16} className="text-blue-600" />
              Detail Telemetry Registers
            </h4>

            <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
              {Object.keys(telemetry).map((key) => {
                const meta = getRegisterMeta(key);
                const value = telemetry[key];
                return (
                  <div 
                    key={key} 
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/10 transition flex items-center justify-between"
                  >
                    <div className="space-y-1 max-w-[70%]">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {meta.label}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                          {meta.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {meta.desc}
                      </p>
                      <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        Hardware: {meta.device}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`font-mono font-bold text-xs px-3 py-1.5 rounded-xl border ${getTelemetryValStyle(key, value)}`}>
                        {typeof value === 'number' ? value : String(value)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Console Logger and Raw JSON */}
        <div className="space-y-6">
          
          {/* Kendali Hardware Manual (RPC) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Cpu size={16} className="text-blue-600" />
                Kendali Aktuator Jarak Jauh (RPC)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Kirim perintah sakelar langsung ke pin output ESP32 fisik Anda.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Buzzer */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-1.5 rounded-lg ${telemetry.buzzer === 1 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Volume2 size={15} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Buzzer Alarm</span>
                </div>
                <button
                  onClick={() => handleRpcToggle('setBuzzer', telemetry.buzzer)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${
                    telemetry.buzzer === 1 ? 'bg-rose-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    telemetry.buzzer === 1 ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* LED Merah */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-1.5 rounded-lg ${telemetry.led_merah === 1 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Lightbulb size={15} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">LED Merah</span>
                </div>
                <button
                  onClick={() => handleRpcToggle('setLedMerah', telemetry.led_merah)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${
                    telemetry.led_merah === 1 ? 'bg-rose-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    telemetry.led_merah === 1 ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* LED Hijau */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-1.5 rounded-lg ${telemetry.led_hijau === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Lightbulb size={15} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">LED Hijau</span>
                </div>
                <button
                  onClick={() => handleRpcToggle('setLedHijau', telemetry.led_hijau)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${
                    telemetry.led_hijau === 1 ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    telemetry.led_hijau === 1 ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* JSON Explorer */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Database size={16} className="text-indigo-600" />
              Raw JSON Payload
            </h4>
            <p className="text-[11px] text-slate-400">
              Format payload MQTT/HTTP yang dipublish oleh ESP32 ke server cloud:
            </p>
            <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-emerald-400 border border-slate-800 overflow-x-auto shadow-inner h-40">
              <pre>{JSON.stringify(telemetry, null, 2)}</pre>
            </div>
          </div>

          {/* Console Stream Terminal */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Terminal size={16} className="text-slate-700" />
                Console Logger Stream
              </h4>
              <div className="flex space-x-1">
                <button
                  onClick={() => setIsLive(!isLive)}
                  className={`p-1.5 rounded-lg border transition ${
                    isLive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                  title={isLive ? "Pause Logs" : "Play Logs"}
                >
                  {isLive ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  onClick={clearLogs}
                  className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-lg transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 h-52 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-1.5 shadow-inner">
              {streamLogs.length === 0 ? (
                <div className="text-slate-500 italic text-center pt-20">
                  Belum ada log stream masuk.
                </div>
              ) : (
                streamLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-900/50 pb-1.5 last:border-b-0 leading-normal text-emerald-500/90">
                    {log}
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
            
            <div className="text-[9px] text-slate-400 font-semibold text-center uppercase tracking-wider flex items-center justify-center gap-1">
              <RefreshCw size={10} className="animate-spin text-blue-500" />
              Siklus request/polling: 2000ms
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
