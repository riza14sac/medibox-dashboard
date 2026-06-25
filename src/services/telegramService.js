import axios from 'axios';

const TELEGRAM_BOT_TOKEN = '8927065898:AAFszAgzZXENsm8N21g88ncON51yzbU1Y6U';
const TELEGRAM_CHAT_ID = '1092691796';

/**
 * Mengirimkan notifikasi pesan ke Telegram.
 * @param {string} message - Pesan teks yang akan dikirim.
 */
export const sendTelegramNotification = async (message) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });
    console.log('Notifikasi Telegram berhasil dikirim:', response.data);
    return response.data;
  } catch (error) {
    console.error('Gagal mengirim notifikasi Telegram:', error.response?.data || error.message);
    throw error;
  }
};
