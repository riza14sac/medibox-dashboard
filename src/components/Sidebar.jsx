import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Calendar, 
  ClipboardList, 
  Pill,
  User
} from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard Utama', path: '/', icon: LayoutDashboard },
    { name: 'Monitoring Sensor', path: '/sensor', icon: Activity },
    { name: 'Jadwal Obat', path: '/jadwal', icon: Calendar },
    { name: 'Riwayat Kepatuhan', path: '/riwayat', icon: ClipboardList },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-20 border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-blue-600 p-2.5 rounded-xl shadow-md shadow-blue-500/20 text-white">
          <Pill size={22} className="animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            MediBox
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
            Smart Pillbox IoT
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }
            `}
          >
            <item.icon size={18} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Patient Profile Card */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30 flex items-center space-x-3">
          <div className="bg-slate-700 p-2 rounded-xl text-slate-300">
            <User size={18} />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-slate-200 truncate">
              Bpk. Budi Santoso
            </h4>
            <p className="text-[10px] text-slate-400 truncate">
              ID Pasien: PX-99281
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
