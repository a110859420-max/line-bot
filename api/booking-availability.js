import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TIME_SLOTS = ["10:00", "14:00", "18:00"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "缺少 date" });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", date);

    if (error) {
      return res.status(500).json({
        message: "讀取時段失敗",
        error: error.message
      });
    }

    const bookedTimes = new Set((data || []).map(item => item.booking_time));

    const slots = TIME_SLOTS.map(time => ({
      time,
      available: !bookedTimes.has(time)
    }));

    const allBooked = slots.every(slot => !slot.available);

    return res.status(200).json({
      date,
      slots,
      allBooked
    });
  } catch (error) {
    return res.status(500).json({
      message: "伺服器錯誤",
      error: error.message
    });
  }
}