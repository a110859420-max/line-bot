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
    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: "缺少 id" });
    }

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({
        message: "刪除失敗",
        error: error.message
      });
    }

    return res.status(200).json({
      message: "刪除成功"
    });
  } catch (error) {
    return res.status(500).json({
      message: "伺服器錯誤",
      error: error.message
    });
  }
}