import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendLinePushMessage(messageText) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  const targetId =
    process.env.LINE_GROUP_ID ||
    process.env.LINE_TARGET_ID ||
    process.env.ADMIN_GROUP_ID;

  if (!channelAccessToken || !targetId) {
    console.warn("LINE 通知略過：缺少 LINE_CHANNEL_ACCESS_TOKEN 或群組 ID");
    return { skipped: true };
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      to: targetId,
      messages: [
        {
          type: "text",
          text: messageText
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LINE push 失敗: ${errorText}`);
  }

  return { success: true };
}

function normalizeTime(input) {
  if (!input) return "";
  const value = String(input).trim();

  if (value === "上午") return "10:00";
  if (value === "下午") return "14:00";
  if (value === "傍晚") return "18:00";

  return value;
}

function normalizeDate(input) {
  if (!input) return "";
  return String(input).trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};

    const booking_token = body.booking_token || "";
    const customer_name = body.customer_name || "";
    const customer_phone = body.customer_phone || "";

    const customer_line = body.customer_line || body.line_id || body.lineId || "";
    const vehicle_type = body.vehicle_type || "";
    const car_color = body.car_color || "";
    const vehicle_number = body.vehicle_number || "";
    const service_name =
      body.service_name ||
      body.service_items ||
      body.service ||
      "";
    const booking_date = normalizeDate(
      body.booking_date || body.selectedDate || body.date || ""
    );
    const booking_time = normalizeTime(
      body.booking_time || body.selectedTime || body.time || ""
    );
    const note = body.note || "";

    if (!booking_token) {
      return res.status(400).json({ message: "缺少 booking_token" });
    }

    if (!customer_name) {
      return res.status(400).json({ message: "缺少姓名" });
    }

    if (!customer_phone) {
      return res.status(400).json({ message: "缺少電話" });
    }

    if (!booking_date) {
      return res.status(400).json({ message: "缺少 booking_date" });
    }

    if (!booking_time) {
      return res.status(400).json({ message: "缺少 booking_time" });
    }

    const insertPayload = {
      booking_token,
      customer_name,
      customer_phone,
      booking_date,
      booking_time,
      status: "pending"
    };

    if (customer_line) insertPayload.customer_line = customer_line;
    if (vehicle_type) insertPayload.vehicle_type = vehicle_type;
    if (car_color) insertPayload.car_color = car_color;
    if (vehicle_number) insertPayload.vehicle_number = vehicle_number;
    if (service_name) insertPayload.service_name = service_name;
    if (note) insertPayload.note = note;

    const { data, error } = await supabase
      .from("bookings")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const errorText = `${error.message || ""} ${error.details || ""}`;

        if (errorText.includes("unique_booking_token")) {
          return res.status(400).json({
            message: "此預約連結已使用過"
          });
        }

        if (errorText.includes("unique_booking_slot")) {
          return res.status(400).json({
            message: "這個時段已經被預約，請選擇其他時段"
          });
        }

        return res.status(400).json({
          message: "資料重複，請重新確認"
        });
      }

      console.error("Supabase insert error:", error);
      return res.status(500).json({
        message: "寫入預約失敗",
        error: error.message
      });
    }

    const lineMessage = [
      "🔥 新預約通知",
      "",
      `姓名：${customer_name}`,
      `電話：${customer_phone}`,
      `LINE：${customer_line || "未填寫"}`,
      `服務：${service_name || "未填寫"}`,
      `日期：${booking_date || "未填寫"}`,
      `時間：${booking_time || "未填寫"}`,
      `車型：${vehicle_type || "未填寫"}`,
      `車色：${car_color || "未填寫"}`,
      `車牌：${vehicle_number || "未填寫"}`,
      `備註：${note || "無"}`
    ].join("\\n");

    try {
      await sendLinePushMessage(lineMessage);
    } catch (lineError) {
      console.error("LINE notify error:", lineError);
    }

    return res.status(200).json({
      message: "預約成功",
      booking: data
    });
  } catch (error) {
    console.error("create-booking error:", error);
    return res.status(500).json({
      message: "伺服器錯誤",
      error: error.message
    });
  }
}