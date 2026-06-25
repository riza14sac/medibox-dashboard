import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Wifi, 
  WifiOff, 
  Bell, 
  Play, 
  Settings, 
  RotateCcw,
  Volume2,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { getSimState, saveSimState, thingsboardService } from '../services/thingsboardService';

export default function Header() {
  const location = useLocation();
  const [simState, setSimState] = useState(getSimState());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    host: simState.settings.host,
    deviceToken: simState.settings.deviceToken,
    deviceId: simState.settings.deviceId,
    jwtToken: simState.settings.jwtToken,
    useDeviceTokenApi: simState.settings.useDeviceTokenApi,
    username: simState.settings.username || '',
    password: simState.settings.password || '',
  });

  // Track page titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Utama';
      case '/sensor': return 'Monitoring Sensor';
      case '/jadwal': return 'Jadwal Obat';
      case '/riwayat': return 'Riwayat Kepatuhan';
      default: return 'MediBox';
    }
  };

  useEffect(() => {
    const handleStateChange = () => {
      setSimState(getSimState());
    };
    
    window.addEventListener('medibox_state_changed', handleStateChange);
    return () => {
      window.removeEventListener('medibox_state_changed', handleStateChange);
    };
  }, []);

  // Update settings form when simState settings change
  useEffect(() => {
    setSettingsForm({ ...simState.settings });
  }, [simState.settings]);

  // Generate dynamic alerts based on system state
  useEffect(() => {
    const alerts = [];
    const t = simState.telemetry;

    // 1. Connection Alert
    if (!simState.isConnected) {
      alerts.push({
        id: 'conn',
        type: 'error',
        message: 'Koneksi ke ThingsBoard Cloud terputus!',
      });
    }

    // 2. Alarm Active / Medication Waiting
    if (t.status_obat === 'Menunggu' && t.jadwal_aktif !== '-') {
      alerts.push({
        id: 'waiting',
        type: 'warning',
        message: `Jadwal obat ${t.jadwal_aktif} aktif. Segera ambil obat!`,
      });
    }

    // 3. Medication Missed
    if (t.status_obat === 'Terlewat') {
      alerts.push({
        id: 'missed',
        type: 'error',
        message: 'Pasien melewatkan jadwal obat terakhir!',
      });
    }

    // 4. Buzzer active
    if (t.buzzer === 1) {
      alerts.push({
        id: 'buzzer',
        type: 'danger',
        message: 'Buzzer Aktif! Alarm berbunyi mendengung.',
      });
    }

    setNotifications(alerts);
  }, [simState]);

  const toggleConnection = () => {
    const newState = { ...simState, isConnected: !simState.isConnected };
    saveSimState(newState);
  };

  const toggleSimulatorMode = () => {
    const newState = { ...simState, isSimulated: !simState.isSimulated };
    saveSimState(newState);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    thingsboardService.updateSettings(settingsForm);
    setShowSettingsModal(false);
  };

  return (
    <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10 shadow-sm">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          {getPageTitle()}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {simState.isSimulated ? (
            <span className="text-amber-500 font-semibold flex items-center gap-1">
              <Sparkles size={12} /> Mode Simulasi Aktif (Presentasi Dosen)
            </span>
          ) : (
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              🟢 Terhubung ke Cloud ThingsBoard
            </span>
          )}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-6">
        
        {/* SIMULATOR QUICK CONTROL BUTTONS (Always visible if Simulator mode is ON) */}
        {simState.isSimulated && (
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-2 flex items-center space-x-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Simulasi:</span>
            
            {/* Alarm Trigger Dropdown/Buttons */}
            <div className="flex space-x-1.5">
              <button 
                onClick={() => thingsboardService.triggerAlarm('Pagi')}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold px-2 py-1 rounded-md transition duration-200 shadow-sm"
                title="Picu Alarm Pagi"
              >
                ⏰ Pagi
              </button>
              <button 
                onClick={() => thingsboardService.triggerAlarm('Siang')}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold px-2 py-1 rounded-md transition duration-200 shadow-sm"
                title="Picu Alarm Siang"
              >
                ⏰ Siang
              </button>
              <button 
                onClick={() => thingsboardService.triggerAlarm('Malam')}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold px-2 py-1 rounded-md transition duration-200 shadow-sm"
                title="Picu Alarm Malam"
              >
                ⏰ Malam
              </button>
            </div>

            <div className="h-4 w-px bg-amber-200" />

            {/* Action simulation */}
            <button
              onClick={() => thingsboardService.takeMedication()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md transition duration-200 shadow-sm flex items-center gap-1"
            >
              <CheckCircle size={10} /> Ambil Obat
            </button>
            
            <button
              onClick={() => thingsboardService.missMedication()}
              className="bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md transition duration-200 shadow-sm flex items-center gap-1"
            >
              <AlertTriangle size={10} /> Lewatkan
            </button>

            <button
              onClick={() => thingsboardService.refillMedication(250)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold p-1 rounded-md transition duration-200 shadow-sm"
              title="Isi Ulang Wadah Obat (Refill)"
            >
              <RotateCcw size={11} />
            </button>
          </div>
        )}

        {/* Global Controls */}
        <div className="flex items-center space-x-3.5 border-l border-slate-100 pl-6">
          {/* Mode Switcher Toggle */}
          <button
            onClick={toggleSimulatorMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all duration-200 ${
              simState.isSimulated
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            {simState.isSimulated ? 'Ganti ke Live Cloud' : 'Ganti ke Simulator'}
          </button>

          {/* Connection status for cloud */}
          {simState.isSimulated ? (
            <button 
              onClick={toggleConnection}
              className={`p-2 rounded-xl border transition duration-200 ${
                simState.isConnected 
                  ? 'bg-slate-50 text-emerald-600 border-slate-100 hover:bg-slate-100' 
                  : 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100'
              }`}
              title={simState.isConnected ? "Simulasikan Koneksi OK" : "Simulasikan Koneksi Terputus"}
            >
              {simState.isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
            </button>
          ) : (
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Wifi size={18} />
            </div>
          )}

          {/* Settings button */}
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100 rounded-xl transition duration-200"
            title="ThingsBoard Integration Settings"
          >
            <Settings size={18} />
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl border transition duration-200 relative ${
                notifications.length > 0
                  ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 animate-bounce'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-100'
              }`}
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3.5 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="px-4 pb-2 border-b border-slate-50 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-800">Notifikasi Sistem</h4>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                    {notifications.length} Info
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <CheckCircle className="mx-auto text-emerald-400 mb-2" size={24} />
                      <p className="text-xs text-slate-400">Semua sistem normal. Tidak ada alert aktif.</p>
                    </div>
                  ) : (
                    notifications.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`px-4 py-3 border-b border-slate-50/50 flex items-start space-x-3 last:border-b-0 ${
                          alert.type === 'error' || alert.id === 'buzzer' ? 'bg-rose-50/30' : 'bg-amber-50/30'
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-lg ${
                          alert.type === 'error' || alert.id === 'buzzer' 
                            ? 'bg-rose-100 text-rose-600' 
                            : 'bg-amber-100 text-amber-600'
                        }`}>
                          {alert.id === 'buzzer' ? <Volume2 size={14} className="animate-bounce" /> : <AlertTriangle size={14} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-700">{alert.message}</p>
                          <span className="text-[9px] text-slate-400">Sensor Telemetri • Live</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Settings Modal (ThingsBoard config) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-[500px] border border-slate-100 shadow-2xl p-7 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                  <Settings size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Pengaturan ThingsBoard</h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1.5 hover:bg-slate-50 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  ThingsBoard Host
                </label>
                <input 
                  type="text" 
                  value={settingsForm.host}
                  onChange={(e) => setSettingsForm({ ...settingsForm, host: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, useDeviceTokenApi: true })}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition ${
                    settingsForm.useDeviceTokenApi 
                      ? 'bg-blue-50 text-blue-600 border-blue-200' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Device Access Token (Attributes API)
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, useDeviceTokenApi: false })}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition ${
                    !settingsForm.useDeviceTokenApi 
                      ? 'bg-blue-50 text-blue-600 border-blue-200' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ThingsBoard REST API (Timeseries)
                </button>
              </div>

              {settingsForm.useDeviceTokenApi ? (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Device Access Token
                  </label>
                  <input 
                    type="password" 
                    value={settingsForm.deviceToken}
                    onChange={(e) => setSettingsForm({ ...settingsForm, deviceToken: e.target.value })}
                    placeholder="Masukkan Token Akses ESP32"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Mengambil dari data client attributes. Pastikan ESP32 mengupload data telemetry ke client-side attributes.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Device ID (UUID)
                    </label>
                    <input 
                      type="text" 
                      value={settingsForm.deviceId}
                      onChange={(e) => setSettingsForm({ ...settingsForm, deviceId: e.target.value })}
                      placeholder="Contoh: b21368f0-6ef7-11f1-85a3-7f815107dff5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required={!settingsForm.useDeviceTokenApi}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Email Akun ThingsBoard
                    </label>
                    <input 
                      type="email" 
                      value={settingsForm.username}
                      onChange={(e) => setSettingsForm({ ...settingsForm, username: e.target.value })}
                      placeholder="Contoh: riddo23@mhs.usk.ac.id"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required={!settingsForm.useDeviceTokenApi}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Password Akun ThingsBoard
                    </label>
                    <input 
                      type="password" 
                      value={settingsForm.password}
                      onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
                      placeholder="Masukkan password akun Anda"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required={!settingsForm.useDeviceTokenApi}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Digunakan untuk mengambil data telemetry/timeseries secara aman melalui auto-login REST API ThingsBoard.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20"
                >
                  Simpan & Hubungkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </header>
  );
}
