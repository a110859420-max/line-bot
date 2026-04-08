const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    if (error) {
      console.error('get bookings error:', error);
      return res.status(500).json({
        message: '讀取失敗',
        error: error.message
      });
    }

    return res.status(200).json({
      bookings: data || []
    });
  } catch (err) {
    console.error('api error:', err);
    return res.status(500).json({
      message: '伺服器錯誤',
      error: err.message
    });
  }
};