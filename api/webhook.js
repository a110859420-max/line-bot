const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

// 用來暫存「有按我要預約的客戶」
// 結構：global.bookingUsers[userId] = { userId, requestedAt }
if (!global.bookingUsers) {
  global.bookingUsers = {};
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const signature = req.headers['x-line-signature'];
    const body = req.body;
    const rawBody = JSON.stringify(body);

    const isValid = line.validateSignature(
      rawBody,
      config.channelSecret,
      signature
    );

    if (!isValid) {
      return res.status(401).send('Invalid signature');
    }

    const events = body.events || [];

    await Promise.all(
      events.map(async (event) => {
        if (event.type !== 'message' || event.message.type !== 'text') {
          return;
        }

        const text = event.message.text.trim();
        const userId = event.source?.userId;

        const isBookingMessage =
          text.includes('姓名：') &&
          text.includes('電話：') &&
          text.includes('日期：') &&
          text.includes('時間：') &&
          text.includes('服務項目：');

        // 1. 客戶按圖文選單「我要預約」
        if (text === '我要預約！' || text === '我要預約') {
          if (userId) {
            global.bookingUsers[userId] = {
              userId,
              requestedAt: Date.now()
            };
            console.log('已記錄預約用戶:', userId);
          } else {
            console.log('沒有抓到 userId');
          }

          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text:
                  '請點擊下方連結填寫預約表單👇\n' +
                  'https://fuxing-detailing.my.canva.site/\n\n' +
                  '⚠️ 請務必填寫您目前這個 LINE 對應的電話號碼，' +
                  '送出後我們才會自動回傳預約資訊給您。'
              }
            ]
          });
          return;
        }

        // 2. 客戶手動把預約格式貼進聊天室
        if (isBookingMessage) {
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text:
                  '✅ 已收到您的預約資訊，我們會盡快為您確認。\n\n' +
                  '如需修改內容，也可以直接在此訊息告知我們。'
              }
            ]
          });
          return;
        }

        // 3. 其他訊息不自動回
        return;
      })
    );

    return res.status(200).json({ message: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error'
    });
  }
};