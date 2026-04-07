const line = require('@line/bot-sdk');
const { supabase } = require('./lib/supabase');

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const data = req.body || {};

    const bookingToken = (data.booking_token || '').trim();
    const customerName = (data.name || '').trim();
    const customerPhone = (data.phone || '').trim();
    const bookingDate = (data.date || '').trim();
    const bookingTime = (data.time || '').trim();
    const serviceType = (data.service || '').trim();
    const note = (data.note || '').trim();
    const canvaBookingCode = (data.booking_code || '').trim();

    if (!bookingToken) {
      console.error('缺少 booking_token');
      return res.status(400).json({
        success: false,
        error: 'Missing booking_token'
      });
    }

    const { data: session, error: findError } = await supabase
      .from('booking_sessions')
      .select('*')
      .eq('booking_token', bookingToken)
      .single();

    if (findError || !session) {
      console.error('找不到對應 session:', bookingToken, findError);
      return res.status(404).json({
        success: false,
        error: 'Booking session not found'
      });
    }

    const userId = session.line_user_id;

    const adminText =
      `📩 新預約通知\n` +
      `姓名：${customerName || '未填寫'}\n` +
      `電話：${customerPhone || '未填寫'}\n` +
      `日期：${bookingDate || '未填寫'}\n` +
      `時間：${bookingTime || '未填寫'}\n` +
      `服務：${serviceType || '未填寫'}\n` +
      `備註：${note || '無'}\n` +
      `Canva預約編號：${canvaBookingCode || '無'}`;

    const customerText =
      `✅ 已收到您的預約資料\n` +
      `姓名：${customerName || '未填寫'}\n` +
      `日期：${bookingDate || '未填寫'}\n` +
      `時間：${bookingTime || '未填寫'}\n` +
      `服務：${serviceType || '未填寫'}\n` +
      `${canvaBookingCode ? `預約編號：${canvaBookingCode}\n` : ''}` +
      `\n我們會再與您確認，謝謝您。`;

    await client.pushMessage({
      to: process.env.LINE_GROUP_ID,
      messages: [{ type: 'text', text: adminText }]
    });

    await client.pushMessage({
      to: userId,
      messages: [{ type: 'text', text: customerText }]
    });

    const { error: updateError } = await supabase
      .from('booking_sessions')
      .update({
        status: 'submitted',
        customer_name: customerName,
        customer_phone: customerPhone,
        booking_date: bookingDate,
        booking_time: bookingTime,
        service_type: serviceType,
        note,
        canva_booking_code: canvaBookingCode,
        submitted_at: new Date().toISOString()
      })
      .eq('booking_token', bookingToken);

    if (updateError) {
      console.error('更新 booking_sessions 失敗:', updateError);
    }

    console.log('已成功推播給管理群組與客戶本人:', {
      bookingToken,
      userId
    });

    return res.status(200).json({
      success: true,
      matchedUserId: userId,
      bookingToken
    });
  } catch (error) {
    console.error('line-notification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
};