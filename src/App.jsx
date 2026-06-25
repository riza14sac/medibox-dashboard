import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import MonitoringSensor from './pages/MonitoringSensor';
import JadwalObat from './pages/JadwalObat';
import RiwayatKepatuhan from './pages/RiwayatKepatuhan';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 ml-64 min-h-screen flex flex-col">
          {/* Header Dashboard */}
          <Header />

          {/* Dynamic Page Content */}
          <main className="flex-1 pt-28 px-8 pb-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sensor" element={<MonitoringSensor />} />
                <Route path="/jadwal" element={<JadwalObat />} />
                <Route path="/riwayat" element={<RiwayatKepatuhan />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}
