import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { date } = req.query;

    let query = supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })
      .order("id", { ascending: false });

    if (date) {
      query = query.eq("booking_date", date);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        message: "讀取預約失敗",
        error: error.message
      });
    }

    return res.status(200).json({
      bookings: data || []
    });
  } catch (error) {
    return res.status(500).json({
      message: "伺服器錯誤",
      error: error.message
    });
  }
}