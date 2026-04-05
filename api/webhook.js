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

        // 只要同時包含這些欄位，就視為預約格式
       const isBookingMessage =
  text.includes('姓名：') &&
  text.includes('電話：') &&
  text.includes('日期：') &&
  text.includes('時間：') &&
  text.includes('服務項目：');

        let replyText = '';

        if (isBookingMessage) {
          replyText =
            '✅ 已收到您的預約資訊，我們會盡快為您確認。\n\n如需修改內容，也可以直接在此訊息告知我們。';
        } else {
          replyText =
            '您好～已收到您的訊息，我們會盡快回覆您。';
        }

        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: 'text',
              text: replyText
            }
          ]
        });
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