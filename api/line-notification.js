const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

// 如果 webhook 還沒建立過，先補一個空物件
if (!global.bookingUsers) {
  global.bookingUsers = {};
}

module.exports = async (req, res) => {
  // 允許 Canva 呼叫
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    console.log('收到 Canva 預約資料:', {
      customer_name,
      customer_phone,
      booking_date,
      booking_time,
      service_items
    });

    const bookingMessage =
`🚗 新預約通知
────────────
客戶：${customer_name || '未填寫'}
電話：${customer_phone || '未填寫'}
日期：${booking_date || '未填寫'}
時間：${booking_time || '未填寫'}
服務：${service_items || '未填寫'}`;

    // 1. 先傳給你自己 / 群組
    await client.pushMessage({
      to: process.env.LINE_TARGET_ID,
      messages: [
        {
          type: 'text',
          text: bookingMessage
        }
      ]
    });

    // 2. 再嘗試傳給剛剛有按「我要預約」的客人
    // 目前先抓最近一次按預約的 userId
    let matchedUserId = null;
    let latestTime = 0;

    for (const key in global.bookingUsers) {
      const item = global.bookingUsers[key];
      if (item && item.requestedAt > latestTime) {
        latestTime = item.requestedAt;
        matchedUserId = item.userId;
      }
    }

    console.log('找到可回傳的客戶 userId:', matchedUserId);

    if (matchedUserId) {
      const customerMessage =
`✅ 您的預約已送出，我們已收到以下資訊：
────────────
客戶：${customer_name || '未填寫'}
電話：${customer_phone || '未填寫'}
日期：${booking_date || '未填寫'}
時間：${booking_time || '未填寫'}
服務：${service_items || '未填寫'}

我們會盡快與您確認，謝謝您！`;

      await client.pushMessage({
        to: matchedUserId,
        messages: [
          {
            type: 'text',
            text: customerMessage
          }
        ]
      });

      console.log('已成功傳送給客戶:', matchedUserId);

      // 傳完後把這個 userId 刪掉，避免下一單誤送
      delete global.bookingUsers[matchedUserId];
    } else {
      console.log('沒有找到可對應的客戶 userId，因此只傳給管理方');
    }

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