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
    const { id, contact_status, service_status } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: "缺少 id" });
    }

    const updateData = {};
    if (contact_status) updateData.contact_status = contact_status;
    if (service_status) updateData.service_status = service_status;

    const { data, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        message: "更新狀態失敗",
        error: error.message
      });
    }

    return res.status(200).json({
      message: "狀態更新成功",
      booking: data
    });
  } catch (error) {
    return res.status(500).json({
      message: "伺服器錯誤",
      error: error.message
    });
  }
}