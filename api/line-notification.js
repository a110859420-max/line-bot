const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

module.exports = async (req, res) => {
  // ⭐ CORS（讓 Canva 可以呼叫）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ⭐ 預檢請求（Canva會用）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ⭐ 測試用（直接開網址）
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      message: 'line-notification API is running'
    });
  }

  // ⭐ 只允許 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // ⭐ 取得 Canva 傳來的資料
    const {
      customer_name,
      customer_phone,
      booking_date,
      booking_time,
      service_items
    } = req.body || {};

    // ⭐ 組成 LINE 訊息
    const message =
`🚗 新預約通知
────────────
客戶：${customer_name || '未填寫'}
電話：${customer_phone || '未填寫'}
日期：${booking_date || '未填寫'}
時間：${booking_time || '未填寫'}
服務：${service_items || '未填寫'}`;

    // ⭐ 傳送給你（或群組）
    await client.pushMessage({
      to: process.env.LINE_TARGET_ID,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    });

    // ⭐ 回傳給 Canva（可顯示成功）
    return res.status(200).json({
      success: true,
      message: '預約已送出'
    });

  } catch (error) {
    console.error('line-notification error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
};