export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const {
      customerName,
      customerPhone,
      customerLine,
      bookingDate,
      bookingTime,
      serviceItems,
      bookingToken,
      createdAt
    } = req.body;

    const groupId = process.env.LINE_GROUP_ID;

    // ✅ 管理員訊息（乾淨版）
    const adminText = [
      "📩 新預約通知",
      `姓名：${customerName || "未填寫"}`,
      `電話：${customerPhone || "未填寫"}`,
      `LINE ID：${customerLine || "未填寫"}`,
      `日期：${bookingDate || "未填寫"}`,
      `時段：${bookingTime || "未填寫"}`,
      `服務：${serviceItems || "未填寫"}`,
      `建立時間：${createdAt || "未填寫"}`,
      `booking_token：${bookingToken}`
    ].join("\n");

    // ✅ 客戶訊息（乾淨版）
    const customerText = [
      "✅ 已收到您的預約資料",
      `姓名：${customerName || "未填寫"}`,
      `日期：${bookingDate || "未填寫"}`,
      `時段：${bookingTime || "未填寫"}`,
      `服務：${serviceItems || "未填寫"}`,
      "",
      "我們會再與您確認，請稍候 🙏"
    ].join("\n");

    // 🔥 發送到群組（管理員）
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: groupId,
        messages: [
          {
            type: "text",
            text: adminText // ✅ 重點：沒有 JSON.stringify
          }
        ]
      })
    });

    // 🔥 發送給客戶（如果有LINE ID）
    if (customerLine) {
      await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: customerLine,
          messages: [
            {
              type: "text",
              text: customerText // ✅ 重點：沒有 JSON.stringify
            }
          ]
        })
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("LINE通知錯誤:", error);
    return res.status(500).json({ error: "LINE通知失敗" });
  }
}