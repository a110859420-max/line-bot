import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      booking_token,
      customer_name,
      customer_phone
    } = req.body;

    if (!booking_token) {
      return res.status(400).json({ message: "缺少 booking_token" });
    }

    if (!customer_name) {
      return res.status(400).json({ message: "缺少姓名" });
    }

    if (!customer_phone) {
      return res.status(400).json({ message: "缺少電話" });
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          booking_token,
          customer_name,
          customer_phone,
          status: "pending"
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ message: "寫入預約失敗" });
    }

    return res.status(200).json({
      message: "預約成功",
      booking: data
    });
  } catch (error) {
    console.error("create-booking error:", error);
    return res.status(500).json({
      message: "伺服器錯誤"
    });
  }
}