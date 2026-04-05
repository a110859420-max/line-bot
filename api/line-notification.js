const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 處理 Canva / 瀏覽器的預檢請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 可選：如果有人直接開網址測試
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      message: 'line-notification API is running'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      customer_name,
      customer_phone,
      booking_date,
      booking_time,
      service_items
    } = req.body || {};

    const message =
`🚗 新預約通知
────────────
客戶：${customer_name || '未填寫'}
電話：${customer_phone || '未填寫'}
日期：${booking_date || '未填寫'}
時間：${booking_time || '未填寫'}
服務：${service_items || '未填寫'}`;

    await client.pushMessage({
      to: process.env.LINE_TARGET_ID,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: '已送出 LINE 通知'
    });
  } catch (error) {
    console.error('line-notification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
};