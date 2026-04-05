const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const signature = req.headers['x-line-signature'];

    // 驗證 LINE Webhook 簽章
    const body = req.body;
    const rawBody = JSON.stringify(body);

    const isValid = line.validateSignature(rawBody, config.channelSecret, signature);
    if (!isValid) {
      return res.status(401).send('Invalid signature');
    }

    const events = body.events || [];

    await Promise.all(
      events.map(async (event) => {
        if (event.type === 'message' && event.message.type === 'text') {
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text:
                  `✅ 感謝您的訊息！\n\n` +
                  `我們已收到您的預約申請，客服將盡快與您確認。\n\n` +
                  `🕒 工作時間：09:00-18:00\n` +
                  `☎️ 官方LINE：@190omvem`
              }
            ]
          });

          console.log('客戶訊息已記錄:', {
            userId: event.source.userId,
            message: event.message.text,
            timestamp: new Date().toISOString()
          });
        }
      })
    );

    return res.status(200).json({ message: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
};