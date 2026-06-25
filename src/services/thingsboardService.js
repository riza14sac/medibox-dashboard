import axios from 'axios';

// Default keys requested
export const TELEMETRY_KEYS = [
  'berat_obat',
  'status_obat',
  'jadwal_aktif',
  'pengurangan_berat',
  'kepatuhan_persen',
  'status_pagi',
  'status_siang',
  'status_malam',
  'led_merah',
  'led_hijau',
  'buzzer'
];

// In-memory/localStorage state for the Simulator
const SIMULATOR_KEY = 'medibox_simulator_state';
const HISTORY_KEY = 'medibox_history_logs';

const defaultSimState = {
  isSimulated: true,
  isConnected: true,
  telemetry: {
    berat_obat: 250.0, // gram
    status_obat: 'Normal', // Normal, Menunggu, Diambil, Terlewat
    jadwal_aktif: '-',
    pengurangan_berat: 0.0,
    kepatuhan_persen: 85,
    status_pagi: 'Diambil',
    status_siang: 'Diambil',
    status_malam: 'Menunggu',
    led_merah: 0,
    led_hijau: 1,
    buzzer: 0,
  },
  settings: {
    host: 'https://thingsboard.cloud',
    deviceToken: 'qVh2LAAadnkuIVEp9fNo',
    deviceId: 'b21368f0-6ef7-11f1-85a3-7f815107dff5',
    jwtToken: '',
    username: 'riddo23@mhs.usk.ac.id',
    password: '75864391',
    useDeviceTokenApi: true, // Default back to Attributes API (No 401 login errors!)
  }
};

// Initialize simulator state
export const getSimState = () => {
  const data = localStorage.getItem(SIMULATOR_KEY);
  if (!data) {
    localStorage.setItem(SIMULATOR_KEY, JSON.stringify(defaultSimState));
    return defaultSimState;
  }
  try {
    const parsed = JSON.parse(data);
    // Force set credentials and reset to Attributes API to bypass 401 error
    if (!parsed.settings.username || parsed.settings.username === '' || !parsed.settings.useDeviceTokenApi) {
      parsed.settings.username = defaultSimState.settings.username;
      parsed.settings.password = defaultSimState.settings.password;
      parsed.settings.deviceToken = defaultSimState.settings.deviceToken;
      parsed.settings.deviceId = defaultSimState.settings.deviceId;
      parsed.settings.useDeviceTokenApi = true; // Force to true (Attributes API)
      localStorage.setItem(SIMULATOR_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return defaultSimState;
  }
};

export const saveSimState = (state) => {
  localStorage.setItem(SIMULATOR_KEY, JSON.stringify(state));
  // Dispatch custom event to notify other components of changes
  window.dispatchEvent(new Event('medibox_state_changed'));
};

// Initialize history log
export const getHistoryLogs = () => {
  const data = localStorage.getItem(HISTORY_KEY);
  if (!data) {
    const initialHistory = [
      {
        id: '1',
        waktu: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
        jadwal: 'Pagi',
        beratAwal: 280,
        beratAkhir: 270,
        pengurangan: 10,
        status: 'Diambil'
      },
      {
        id: '2',
        waktu: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
        jadwal: 'Siang',
        beratAwal: 270,
        beratAkhir: 260,
        pengurangan: 10,
        status: 'Diambil'
      },
      {
        id: '3',
        waktu: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
        jadwal: 'Malam',
        beratAwal: 260,
        beratAkhir: 260,
        pengurangan: 0,
        status: 'Terlewat'
      },
      {
        id: '4',
        waktu: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        jadwal: 'Pagi',
        beratAwal: 260,
        beratAkhir: 250,
        pengurangan: 10,
        status: 'Diambil'
      }
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(initialHistory));
    return initialHistory;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const addHistoryLog = (log) => {
  const logs = getHistoryLogs();
  const newLog = {
    id: Date.now().toString(),
    waktu: new Date().toISOString(),
    ...log
  };
  logs.unshift(newLog);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(logs));
  window.dispatchEvent(new Event('medibox_history_changed'));
};

export const clearHistoryLogs = () => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('medibox_history_changed'));
};

/**
 * ThingsBoard API Service
 */
export const thingsboardService = {
  // Config parameters
  config: {
    host: 'https://thingsboard.cloud',
    deviceToken: '',
    deviceId: '',
    jwtToken: '',
    useDeviceTokenApi: true,
  },

  // Initialize config from saved settings
  init() {
    const state = getSimState();
    this.config = { ...state.settings };
  },

  updateSettings(settings) {
    const state = getSimState();
    state.settings = { ...state.settings, ...settings };
    this.config = { ...state.settings };
    saveSimState(state);
  },

  /**
   * Auto login REST API and get JWT
   */
  async loginAndGetJwt() {
    const { host, username, password } = this.config;
    if (!username || !password) {
      throw new Error('Email/Username atau Password akun ThingsBoard belum dimasukkan!');
    }
    
    let apiHost = host.replace(/\/$/, '');
    if (apiHost.startsWith('https://thingsboard.cloud')) {
      apiHost = '/tb-cloud';
    } else if (apiHost.startsWith('https://demo.thingsboard.io')) {
      apiHost = '/tb-demo';
    }

    const url = `${apiHost}/api/auth/login`;
    const response = await axios.post(url, {
      username: username,
      password: password
    });

    const token = response.data.token;
    
    // Save to local config and localStorage simState
    this.config.jwtToken = token;
    const state = getSimState();
    state.settings.jwtToken = token;
    saveSimState(state);

    return token;
  },

  /**
   * Fetch latest telemetry from ThingsBoard Cloud
   */
  async fetchLatestTelemetry() {
    const state = getSimState();
    
    // If running in simulator mode, return the simulated state
    if (state.isSimulated) {
      if (!state.isConnected) {
        throw new Error('Connection failed');
      }
      return state.telemetry;
    }

    // Real API integration
    const { host, deviceToken, deviceId, jwtToken, useDeviceTokenApi } = this.config;
    
    // Resolve host URL with local CORS proxies if matching public servers
    let apiHost = host.replace(/\/$/, '');
    if (apiHost.startsWith('https://thingsboard.cloud')) {
      apiHost = '/tb-cloud';
    } else if (apiHost.startsWith('https://demo.thingsboard.io')) {
      apiHost = '/tb-demo';
    }

    if (useDeviceTokenApi) {
      // Option A: Device Access Token Client Attributes Endpoint
      if (!deviceToken) {
        throw new Error('ThingsBoard Device Token is not set!');
      }
      const url = `${apiHost}/api/v1/${deviceToken}/attributes`;
      const response = await axios.get(url);
      
      // Map attributes to our telemetry structure
      const clientAttr = response.data.client || {};
      const sharedAttr = response.data.shared || {};
      const data = { ...sharedAttr, ...clientAttr };

      return this.mapTelemetryData(data);
    } else {
      // Option B: ThingsBoard REST API (timeseries endpoint)
      if (!deviceId) {
        throw new Error('ThingsBoard Device ID is not set!');
      }
      
      let token = jwtToken;
      if (!token) {
        token = await this.loginAndGetJwt();
      }
      
      const url = `${apiHost}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`;
      const keysQuery = TELEMETRY_KEYS.join(',');
      
      let response;
      try {
        response = await axios.get(url, {
          params: { keys: keysQuery },
          headers: { 'X-Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        // If unauthorized (token expired), try auto-login again
        if (err.response && err.response.status === 401) {
          token = await this.loginAndGetJwt();
          response = await axios.get(url, {
            params: { keys: keysQuery },
            headers: { 'X-Authorization': `Bearer ${token}` }
          });
        } else {
          throw err;
        }
      }

      // ThingsBoard timeseries response format:
      const data = {};
      Object.keys(response.data).forEach(key => {
        const arr = response.data[key];
        if (arr && arr.length > 0) {
          data[key] = arr[0].value;
        }
      });

      return this.mapTelemetryData(data);
    }
  },

  // Map values to appropriate types
  mapTelemetryData(data) {
    return {
      berat_obat: parseFloat(data.berat_obat !== undefined ? data.berat_obat : 0),
      status_obat: String(data.status_obat || 'Normal'),
      jadwal_aktif: String(data.jadwal_aktif || '-'),
      pengurangan_berat: parseFloat(data.pengurangan_berat !== undefined ? data.pengurangan_berat : 0),
      kepatuhan_persen: parseInt(data.kepatuhan_persen !== undefined ? data.kepatuhan_persen : 100),
      status_pagi: String(data.status_pagi || 'Menunggu'),
      status_siang: String(data.status_siang || 'Menunggu'),
      status_malam: String(data.status_malam || 'Menunggu'),
      led_merah: parseInt(data.led_merah) || 0,
      led_hijau: parseInt(data.led_hijau) || 0,
      buzzer: parseInt(data.buzzer) || 0
    };
  },

  /**
   * Simulator trigger: Alarm rings for a schedule (Pagi/Siang/Malam)
   */
  triggerAlarm(jadwal) {
    const state = getSimState();
    if (!state.isSimulated) return;

    state.telemetry.jadwal_aktif = jadwal;
    state.telemetry.status_obat = 'Menunggu';
    state.telemetry.led_merah = 1;
    state.telemetry.led_hijau = 0;
    state.telemetry.buzzer = 1;
    
    // Update the specific schedule status
    if (jadwal === 'Pagi') state.telemetry.status_pagi = 'Menunggu';
    else if (jadwal === 'Siang') state.telemetry.status_siang = 'Menunggu';
    else if (jadwal === 'Malam') state.telemetry.status_malam = 'Menunggu';

    saveSimState(state);
  },

  /**
   * Simulator trigger: Patient takes the medication
   */
  takeMedication() {
    const state = getSimState();
    if (!state.isSimulated) return;

    const currentSchedule = state.telemetry.jadwal_aktif;
    if (currentSchedule === '-' || state.telemetry.status_obat !== 'Menunggu') {
      // Manual/Adhoc pill intake when no schedule is active
      const originalWeight = state.telemetry.berat_obat;
      const takenAmount = 10; // 10 grams
      const newWeight = Math.max(0, originalWeight - takenAmount);

      state.telemetry.berat_obat = newWeight;
      state.telemetry.pengurangan_berat = takenAmount;
      state.telemetry.status_obat = 'Diambil';
      state.telemetry.led_merah = 0;
      state.telemetry.led_hijau = 1;
      state.telemetry.buzzer = 0;

      // Add to log
      addHistoryLog({
        jadwal: 'Ad-hoc (Manual)',
        beratAwal: originalWeight,
        beratAkhir: newWeight,
        pengurangan: takenAmount,
        status: 'Diambil'
      });

      // Recalculate compliance
      this.recalculateCompliance();
      return;
    }

    const originalWeight = state.telemetry.berat_obat;
    const takenAmount = 10;
    const newWeight = Math.max(0, originalWeight - takenAmount);

    state.telemetry.berat_obat = newWeight;
    state.telemetry.pengurangan_berat = takenAmount;
    state.telemetry.status_obat = 'Diambil';
    state.telemetry.led_merah = 0;
    state.telemetry.led_hijau = 1;
    state.telemetry.buzzer = 0;

    // Update specific schedule status to taken
    if (currentSchedule === 'Pagi') state.telemetry.status_pagi = 'Diambil';
    else if (currentSchedule === 'Siang') state.telemetry.status_siang = 'Diambil';
    else if (currentSchedule === 'Malam') state.telemetry.status_malam = 'Diambil';

    // Add to history log
    addHistoryLog({
      jadwal: currentSchedule,
      beratAwal: originalWeight,
      beratAkhir: newWeight,
      pengurangan: takenAmount,
      status: 'Diambil'
    });

    state.telemetry.jadwal_aktif = '-';
    saveSimState(state);
    this.recalculateCompliance();
  },

  /**
   * Simulator trigger: Patient misses the medication schedule
   */
  missMedication() {
    const state = getSimState();
    if (!state.isSimulated) return;

    const currentSchedule = state.telemetry.jadwal_aktif;
    if (currentSchedule === '-') return;

    state.telemetry.status_obat = 'Terlewat';
    state.telemetry.led_merah = 1;
    state.telemetry.led_hijau = 0;
    state.telemetry.buzzer = 0; // buzzer stops after time limit but red LED stays

    // Update specific schedule status
    if (currentSchedule === 'Pagi') state.telemetry.status_pagi = 'Terlewat';
    else if (currentSchedule === 'Siang') state.telemetry.status_siang = 'Terlewat';
    else if (currentSchedule === 'Malam') state.telemetry.status_malam = 'Terlewat';

    // Add to history log (no weight reduction)
    addHistoryLog({
      jadwal: currentSchedule,
      beratAwal: state.telemetry.berat_obat,
      beratAkhir: state.telemetry.berat_obat,
      pengurangan: 0,
      status: 'Terlewat'
    });

    state.telemetry.jadwal_aktif = '-';
    saveSimState(state);
    this.recalculateCompliance();
  },

  /**
   * Reset medication container weight (e.g. reload or fill up the box)
   */
  refillMedication(weight = 250) {
    const state = getSimState();
    if (!state.isSimulated) return;

    state.telemetry.berat_obat = parseFloat(weight);
    state.telemetry.pengurangan_berat = 0;
    state.telemetry.status_obat = 'Normal';
    state.telemetry.led_merah = 0;
    state.telemetry.led_hijau = 1;
    state.telemetry.buzzer = 0;

    saveSimState(state);
  },

  recalculateCompliance() {
    const state = getSimState();
    const logs = getHistoryLogs();
    if (logs.length === 0) {
      state.telemetry.kepatuhan_persen = 100;
      saveSimState(state);
      return;
    }
    
    // Filter actual scheduled logs (ignore adhoc if needed, or count everything)
    const scheduledLogs = logs.filter(l => ['Pagi', 'Siang', 'Malam'].includes(l.jadwal));
    if (scheduledLogs.length === 0) return;

    const taken = scheduledLogs.filter(l => l.status === 'Diambil').length;
    const compliance = Math.round((taken / scheduledLogs.length) * 100);
    
    state.telemetry.kepatuhan_persen = compliance;
    saveSimState(state);
  },

  /**
   * Send RPC Command to ESP32 (Live Cloud) or modify local state (Simulator)
   */
  async sendRpcCommand(method, params) {
    const state = getSimState();
    
    if (state.isSimulated) {
      // Modify local simulator actuator state
      if (method === 'setLedMerah') state.telemetry.led_merah = params ? 1 : 0;
      else if (method === 'setLedHijau') state.telemetry.led_hijau = params ? 1 : 0;
      else if (method === 'setBuzzer') state.telemetry.buzzer = params ? 1 : 0;
      
      saveSimState(state);
      return { success: true, mode: 'simulated' };
    }

    // Real ThingsBoard RPC Call
    const { host, deviceToken, deviceId, jwtToken, useDeviceTokenApi } = this.config;

    let apiHost = host.replace(/\/$/, '');
    if (apiHost.startsWith('https://thingsboard.cloud')) {
      apiHost = '/tb-cloud';
    } else if (apiHost.startsWith('https://demo.thingsboard.io')) {
      apiHost = '/tb-demo';
    }

    if (useDeviceTokenApi) {
      // Option A: Device Access Token RPC (blocks, so we set a longer timeout to match ESP32 loop)
      if (!deviceToken) {
        throw new Error('Device Token tidak diset untuk perintah RPC!');
      }
      const url = `${apiHost}/api/v1/${deviceToken}/rpc`;
      const response = await axios.post(url, {
        method,
        params
      }, { timeout: 8000 }); // Increased to 8 seconds to match ESP32 3s sleep + network lag

      return { success: true, data: response.data };
    } else {
      // Option B: REST API One-Way RPC (non-blocking, returns success instantly!)
      if (!deviceId) {
        throw new Error('Device ID (UUID) tidak diset!');
      }
      
      let token = jwtToken;
      if (!token) {
        token = await this.loginAndGetJwt();
      }

      const url = `${apiHost}/api/plugins/rpc/oneway/${deviceId}`;
      
      let response;
      try {
        response = await axios.post(url, { method, params }, {
          headers: { 'X-Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        if (err.response && err.response.status === 401) {
          token = await this.loginAndGetJwt();
          response = await axios.post(url, { method, params }, {
            headers: { 'X-Authorization': `Bearer ${token}` }
          });
        } else {
          throw err;
        }
      }
      return { success: true, data: response.data };
    }
  }
};

// Auto initialize config
thingsboardService.init();
