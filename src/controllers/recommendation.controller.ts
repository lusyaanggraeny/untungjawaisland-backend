import { Request, Response } from 'express';
import { pool } from '../config/database';
import { rankHomestays } from '../services/recommendation.service';

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { budget, guests, need_ac, need_wifi, beach_priority, need_breakfast, need_motor_rental } = req.body;

    if (!budget || !guests || !beach_priority) {
      return res.status(400).json({
        success: false,
        message: 'Budget, jumlah tamu, dan prioritas lokasi wajib diisi',
      });
    }

    const result = await pool.query(`
      SELECT id, title, base_price, max_guests, has_ac, has_wifi, 
             has_breakfast, has_motor_rental, distance_to_beach
      FROM homestay
      WHERE status = 'active'
    `);

    const answers = {
      budget,
      guests: Number(guests),
      need_ac: Boolean(need_ac),
      need_wifi: Boolean(need_wifi),
      beach_priority,
      need_breakfast: Boolean(need_breakfast),
      need_motor_rental: Boolean(need_motor_rental),
    };

    const ranked = rankHomestays(result.rows, answers);

    return res.status(200).json({
      success: true,
      data: ranked,
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
};