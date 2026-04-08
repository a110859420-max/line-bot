const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const id = body.id;
    const actual_time = body.actual_time || '';
    const pickup_location = body.pickup_location || '';

    if (!id) {
      return res.status(400).json({ message: '缺少預約 id' });
    }

    const { error } = await supabase
      .from('bookings')
      .update({
        actual_time,
        pickup_location
      })
      .eq('id', id);

    if (error) {
      console.error('update booking detail error:', error);
      return res.status(500).json({
        message: '更新失敗',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: '更新成功'
    });
  } catch (err) {
    console.error('api error:', err);
    return res.status(500).json({
      message: '伺服器錯誤',
      error: err.message
    });
  }
};