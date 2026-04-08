import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { id, type } = req.body;

    if (!id || !type) {
      return res.status(400).json({ message: '缺少參數' });
    }

    // 先抓目前狀態
    const { data: current, error: fetchError } = await supabase
      .from('bookings')
      .select('is_contacted, is_completed')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(500).json({ message: '讀取失敗' });
    }

    let updateData = {};

    if (type === 'contacted') {
      updateData.is_contacted = !current.is_contacted;
    }

    if (type === 'completed') {
      updateData.is_completed = !current.is_completed;
    }

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: '更新失敗' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}