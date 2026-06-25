import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Scale, 
  Activity, 
  CalendarRange
} from 'lucide-react';
import { getHistoryLogs, clearHistoryLogs } from '../services/thingsboardService';

export default function RiwayatKepatuhan() {
  const [logs, setLogs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterJadwal, setFilterJadwal] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = () => {
    setLogs(getHistoryLogs());
  };

  useEffect(() => {
    loadLogs();
    
    // Listen to history changes from other events
    window.addEventListener('medibox_history_changed', loadLogs);
    return () => {
      window.removeEventListener('medibox_history_changed', loadLogs);
    };
  }, []);

  const handleClear = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua riwayat kepatuhan? Tindakan ini berguna untuk mereset demo.")) {
      clearHistoryLogs();
    }
  };

  // Filter & Search logic
  const filteredLogs = logs.filter(log => {
    const matchesStatus = filterStatus === 'Semua' || log.status === filterStatus;
    const matchesJadwal = filterJadwal === 'Semua' || log.jadwal === filterJadwal;
    
    const formattedDate = new Date(log.waktu).toLocaleString('id-ID');
    const matchesSearch = searchTerm === '' || 
      log.jadwal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formattedDate.includes(searchTerm);

    return matchesStatus && matchesJadwal && matchesSearch;
  });

  // Calculate stats from filtered logs
  const totalLogsCount = logs.length;
  const takenCount = logs.filter(l => l.status === 'Diambil').length;
  const missedCount = logs.filter(l => l.status === 'Terlewat').length;
  const totalWeightReduced = logs.reduce((acc, curr) => acc + (curr.pengurangan || 0), 0);

  const getStatusStyle = (status) => {
    return status === 'Diambil'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-rose-50 text-rose-700 border-rose-100';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Jadwal Alaram</p>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-extrabold text-slate-800">{totalLogsCount}</span>
            <span className="text-xs text-slate-400 font-semibold">kali</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Log kepatuhan terekam</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Obat Diambil</p>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-extrabold text-emerald-600">{takenCount}</span>
            <span className="text-xs text-emerald-500 font-semibold">kali</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Tepat waktu terkonfirmasi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Obat Terlewat</p>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-extrabold text-rose-500">{missedCount}</span>
            <span className="text-xs text-rose-400 font-semibold">kali</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Pasien mangkir dari jadwal</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Akumulasi Pengurangan Berat</p>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-extrabold text-blue-600">{totalWeightReduced}</span>
            <span className="text-xs text-blue-500 font-semibold">gram</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Total dosis obat diambil</p>
        </div>

      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Table Filters & Header Actions */}
        <div className="p-6 border-b border-slate-50 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
              <ClipboardList size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Tabel Riwayat Kepatuhan</h3>
              <p className="text-xs text-slate-400">Daftar rekaman perubahan berat wadah obat load cell</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
            </div>

            {/* Filter Status */}
            <div className="flex items-center space-x-1">
              <Filter className="text-slate-400" size={13} />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600 font-semibold"
              >
                <option value="Semua">Semua Status</option>
                <option value="Diambil">Diambil</option>
                <option value="Terlewat">Terlewat</option>
              </select>
            </div>

            {/* Filter Jadwal */}
            <select 
              value={filterJadwal}
              onChange={(e) => setFilterJadwal(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600 font-semibold"
            >
              <option value="Semua">Semua Jadwal</option>
              <option value="Pagi">Pagi</option>
              <option value="Siang">Siang</option>
              <option value="Malam">Malam</option>
              <option value="Ad-hoc (Manual)">Ad-hoc</option>
            </select>

            <div className="h-6 w-px bg-slate-100" />

            {/* Reset Logs Action */}
            <button
              onClick={handleClear}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
              title="Kosongkan Database Riwayat"
            >
              <Trash2 size={13} /> Clear Logs
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Waktu & Tanggal</th>
                <th className="py-4 px-6">Sesi Jadwal</th>
                <th className="py-4 px-6 text-center">Berat Awal</th>
                <th className="py-4 px-6 text-center">Berat Akhir</th>
                <th className="py-4 px-6 text-center">Pengurangan (Dosis)</th>
                <th className="py-4 px-6 text-center">Status Kepatuhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada riwayat kepatuhan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.waktu);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 font-semibold">
                        {dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                          {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          log.jadwal === 'Pagi' ? 'bg-amber-50 text-amber-600' :
                          log.jadwal === 'Siang' ? 'bg-blue-50 text-blue-600' :
                          log.jadwal === 'Malam' ? 'bg-indigo-50 text-indigo-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {log.jadwal}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-mono">{log.beratAwal}g</td>
                      <td className="py-4 px-6 text-center font-mono">{log.beratAkhir}g</td>
                      <td className={`py-4 px-6 text-center font-mono font-bold ${
                        log.pengurangan > 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {log.pengurangan > 0 ? `-${log.pengurangan}g` : '0g'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold border ${getStatusStyle(log.status)}`}>
                          {log.status === 'Diambil' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
