import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AppError } from '../middleware/error.middleware';

// Get room by ID with homestay information
export const getRoomById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const roomId = parseInt(id, 10);
    
    if (isNaN(roomId)) {
      return next(new AppError('Invalid room ID', 400));
    }

    // Get room with homestay details
    const { rows } = await pool.query(
      `SELECT 
        hr.*,
        hr.id as room_id,
        hr.title as name,
        json_build_object(
          'id', h.id,
          'title', h.title,
          'address', h.address,
          'location', h.location,
          'contact_number', h.contact_number
        ) as homestay
      FROM "homestayRoom" hr
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE hr.id = $1`,
      [roomId]
    );

    if (rows.length === 0) {
      return next(new AppError('Room not found', 404));
    }

    const room = rows[0];
    
    res.json({
      status: 'success',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// Get all rooms with homestay information
export const getAllRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        hr.*,
        hr.id as room_id,
        hr.title as name,
        json_build_object(
          'id', h.id,
          'title', h.title,
          'address', h.address,
          'location', h.location,
          'contact_number', h.contact_number
        ) as homestay
      FROM "homestayRoom" hr
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE h.status = 'active'
      ORDER BY h.created_at DESC, hr.created_at ASC`
    );
    
    res.json({
      status: 'success',
      results: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}; 