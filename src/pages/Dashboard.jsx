import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, 
  Activity, 
  Clock, 
  Percent, 
  Volume2, 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { thingsboardService, getSimState, getHistoryLogs } from '../services/thingsboardService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSimulated, setIsSimulated] = useState(true);
  
  // Real-time weight history for Chart.js
  const [weightHistory, setWeightHistory] = useState([]);
  const maxHistoryPoints = 12;

  // Poll intervals
  const pollingRef = useRef(null);

  const fetchTelemetryData = async () => {
    try {
      const data = await thingsboardService.fetchLatestTelemetry();
      setTelemetry(data);
      
      // Update real-time weight chart history
      setWeightHistory(prev => {
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newHistory = [...prev, { time: timeStr, weight: data.berat_obat }];
        if (newHistory.length > maxHistoryPoints) {
          newHistory.shift(); // Keep only last N points
        }
        return newHistory;
      });
      
      setError(null);
    } catch (err) {
      console.error("Error fetching telemetry:", err);
      setError(`Gagal mengambil telemetry dari ThingsBoard Cloud: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync simulator mode and start polling
  useEffect(() => {
    // Initial fetch
    fetchTelemetryData();

    // Poll every 2 seconds
    pollingRef.current = setInterval(() => {
      fetchTelemetryData();
    }, 2000);

    // Sync mode indicator
    const simState = getSimState();
    setIsSimulated(simState.isSimulated);

    // Listen to changes from simulation controls
    const handleStateChange = () => {
      const state = getSimState();
      setIsSimulated(state.isSimulated);
      fetchTelemetryData();
    };

    window.addEventListener('medibox_state_changed', handleStateChange);
    return () => {
      clearInterval(pollingRef.current);
      window.removeEventListener('medibox_state_changed', handleStateChange);
    };
  }, []);

  if (loading && !telemetry) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold text-sm">Menghubungkan ke layanan telemetry...</p>
        </div>
      </div>
    );
  }

  // Fallback telemetry if null
  const t = telemetry || {
    berat_obat: 0,
    status_obat: 'Offline',
    jadwal_aktif: '-',
    pengurangan_berat: 0,
    kepatuhan_persen: 0,
    status_pagi: 'Menunggu',
    status_siang: 'Menunggu',
    status_malam: 'Menunggu',
    led_merah: 0,
    led_hijau: 0,
    buzzer: 0
  };

  // Colors based on Status Obat
  const getStatusColor = (status) => {
    switch (status) {
      case 'Diambil': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Menunggu': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Terlewat': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Diambil': 
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
            <CheckCircle2 size={12} /> Diambil
          </span>
        );
      case 'Menunggu': 
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm shadow-amber-500/20 animate-pulse">
            <Clock size={12} /> Menunggu
          </span>
        );
      case 'Terlewat': 
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm shadow-rose-500/20">
            <XCircle size={12} /> Terlewat
          </span>
        );
      default: 
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-500 text-white shadow-sm">
            <AlertCircle size={12} /> {status}
          </span>
        );
    }
  };

  // CHART 1: Real-time Weight Chart Config
  const realTimeChartData = {
    labels: weightHistory.map(d => d.time),
    datasets: [
      {
        label: 'Berat Obat (gram)',
        data: weightHistory.map(d => d.weight),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const realTimeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e293b',
        padding: 10,
        titleFont: { size: 11, family: 'Outfit' },
        bodyFont: { size: 12, family: 'Outfit', weight: 'bold' },
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, family: 'Outfit' }, color: '#94a3b8' }
      },
      y: {
        min: 0,
        suggestedMax: 300,
        ticks: { font: { size: 10, family: 'Outfit' }, color: '#94a3b8' },
        grid: { color: '#f1f5f9' }
      }
    }
  };

  // CHART 2: Weekly Adherence rate (Dummy values showing weekly metrics)
  const adherenceChartData = {
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    datasets: [
      {
        label: 'Kepatuhan (%)',
        data: [80, 100, 100, 50, 100, 100, t.kepatuhan_persen], // Last day gets real telemetry
        backgroundColor: '#6366f1',
        borderRadius: 8,
        barThickness: 16,
      }
    ]
  };

  const adherenceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, family: 'Outfit' }, color: '#94a3b8' } },
      y: { max: 100, min: 0, ticks: { font: { size: 10, family: 'Outfit' }, color: '#94a3b8' }, grid: { color: '#f1f5f9' } }
    }
  };

  // CHART 3: Schedule status distribution from local history logs
  const logs = getHistoryLogs();
  const takenCount = logs.filter(l => l.status === 'Diambil').length;
  const missedCount = logs.filter(l => l.status === 'Terlewat').length;

  const distributionChartData = {
    labels: ['Diambil', 'Terlewat'],
    datasets: [
      {
        data: [takenCount || 1, missedCount || 0], // Fallback to avoid empty chart
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }
    ]
  };

  const distributionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 11, family: 'Outfit', weight: 'bold' },
          boxWidth: 12,
          padding: 15
        }
      }
    },
    cutout: '65%'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Error alert */}
      {error && !isSimulated && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertCircle size={18} />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <button 
            onClick={fetchTelemetryData}
            className="text-xs bg-rose-200/50 hover:bg-rose-200 text-rose-800 font-bold px-3 py-1.5 rounded-lg transition"
          >
            Hubungkan Kembali
          </button>
        </div>
      )}

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Weight Sensor */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Berat Obat Saat Ini</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {t.berat_obat.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-slate-400">gram</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Pengurangan terakhir: <strong className="text-slate-600">{t.pengurangan_berat}g</strong>
            </p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:scale-110 transition duration-300">
            <Scale size={24} />
          </div>
        </div>

        {/* Card 2: Status Obat */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Obat</p>
            <div>
              {getStatusBadge(t.status_obat)}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Jadwal aktif: <span className="font-bold text-slate-700">{t.jadwal_aktif}</span>
            </p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl group-hover:scale-110 transition duration-300">
            <Activity size={24} />
          </div>
        </div>

        {/* Card 3: Adherence rate */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kepatuhan Harian</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {t.kepatuhan_persen}
              </span>
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
            <div className="flex items-center text-[10px] text-emerald-600 font-bold gap-0.5">
              <TrendingUp size={10} /> +12% dibanding kemarin
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl group-hover:scale-110 transition duration-300">
            <Percent size={24} />
          </div>
        </div>

        {/* Card 4: Actuators Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Status Aktuator Hardware</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Buzzer */}
            <div className={`p-2 rounded-xl border text-center transition duration-300 ${
              t.buzzer === 1 
                ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' 
                : 'bg-slate-50 border-slate-100 text-slate-400'
            }`}>
              <Volume2 size={16} className="mx-auto mb-1" />
              <span className="text-[10px] font-bold">Buzzer</span>
            </div>
            {/* LED Merah */}
            <div className={`p-2 rounded-xl border text-center transition duration-300 ${
              t.led_merah === 1 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-slate-50 border-slate-100 text-slate-400'
            }`}>
              <Lightbulb size={16} className="mx-auto mb-1" />
              <span className="text-[10px] font-bold">LED M</span>
            </div>
            {/* LED Hijau */}
            <div className={`p-2 rounded-xl border text-center transition duration-300 ${
              t.led_hijau === 1 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-slate-50 border-slate-100 text-slate-400'
            }`}>
              <Lightbulb size={16} className="mx-auto mb-1" />
              <span className="text-[10px] font-bold">LED H</span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time weight chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Grafik Berat Obat Real-Time</h3>
              <p className="text-xs text-slate-400">Pembacaan sensor load cell (HX711) - Update 2s</p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              <RefreshCw size={12} className="animate-spin" />
              <span>Auto Update</span>
            </div>
          </div>
          <div className="h-64 relative">
            {weightHistory.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                Menunggu telemetry data untuk direkam...
              </div>
            ) : (
              <Line data={realTimeChartData} options={realTimeChartOptions} />
            )}
          </div>
        </div>

        {/* Adherence Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Status Kepatuhan</h3>
            <p className="text-xs text-slate-400">Distribusi status dari total log tercatat</p>
          </div>
          <div className="h-48 py-2 relative">
            <Doughnut data={distributionChartData} options={distributionChartOptions} />
          </div>
          <div className="border-t border-slate-50 pt-3 flex justify-around text-center text-xs">
            <div>
              <span className="block text-emerald-600 font-extrabold text-base">{takenCount}</span>
              <span className="text-slate-400 font-semibold text-[10px]">Tepat Waktu</span>
            </div>
            <div className="w-px bg-slate-100 h-8" />
            <div>
              <span className="block text-rose-500 font-extrabold text-base">{missedCount}</span>
              <span className="text-slate-400 font-semibold text-[10px]">Terlewatkan</span>
            </div>
          </div>
        </div>

      </div>

      {/* Second Charts Row (Weekly Bar Chart & Schedule Status Badges) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Grafik Kepatuhan Harian</h3>
            <p className="text-xs text-slate-400">Statistik kepatuhan minum obat dalam 7 hari terakhir</p>
          </div>
          <div className="h-56">
            <Bar data={adherenceChartData} options={adherenceChartOptions} />
          </div>
        </div>

        {/* Quick Schedule statuses */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Status Jadwal Hari Ini</h3>
            <p className="text-xs text-slate-400">Update status per-shift waktu minum obat</p>
          </div>

          <div className="space-y-3 my-2">
            {/* Pagi */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-2.5">
                <span className="bg-amber-100 text-amber-600 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">Pagi</span>
                <span className="text-xs font-bold text-slate-600">07:00</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getStatusColor(t.status_pagi)}`}>
                {t.status_pagi}
              </span>
            </div>

            {/* Siang */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-2.5">
                <span className="bg-blue-100 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">Siang</span>
                <span className="text-xs font-bold text-slate-600">13:00</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getStatusColor(t.status_siang)}`}>
                {t.status_siang}
              </span>
            </div>

            {/* Malam */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-2.5">
                <span className="bg-indigo-100 text-indigo-600 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">Malam</span>
                <span className="text-xs font-bold text-slate-600">19:00</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getStatusColor(t.status_malam)}`}>
                {t.status_malam}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium text-center">
            Pemicu otomatis diatur berdasarkan jam internal RTC DS3231.
          </div>
        </div>

      </div>

    </div>
  );
}
