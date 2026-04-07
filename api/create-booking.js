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

    // 🔥 這裡先測試用（之後再接 supabase）
    console.log("新預約：", {
      booking_token,
      customer_name,
      customer_phone
    });

    return res.status(200).json({
      message: "預約成功（測試）"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "伺服器錯誤"
    });
  }
}