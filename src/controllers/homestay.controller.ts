import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { HomestayCreateInput, HomestayUpdateInput } from '../types/homestay.types';
import { AppError } from '../middleware/error.middleware';

export const getAllHomestays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [homestays] = await pool.query(
      'SELECT h.*, u.name as owner_name FROM homestays h JOIN users u ON h.owner_id = u.id'
    );

    res.json({
      status: 'success',
      data: homestays
    });
  } catch (error) {
    next(error);
  }
};

export const getHomestayById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const [homestays] = await pool.query(
      'SELECT h.*, u.name as owner_name FROM homestays h JOIN users u ON h.owner_id = u.id WHERE h.id = ?',
      [id]
    );

    if (!Array.isArray(homestays) || homestays.length === 0) {
      return next(new AppError('Homestay not found', 404));
    }

    res.json({
      status: 'success',
      data: homestays[0]
    });
  } catch (error) {
    next(error);
  }
};

export const createHomestay = async (
  req: Request<{}, {}, HomestayCreateInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, price, location, facilities, images } = req.body;
    const owner_id = req.user?.id;

    if (!owner_id) {
      return next(new AppError('User not authenticated', 401));
    }

    const [result] = await pool.query(
      `INSERT INTO homestays (id, name, description, price, location, facilities, images, owner_id)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, location, JSON.stringify(facilities), JSON.stringify(images), owner_id]
    );

    const [newHomestay] = await pool.query(
      'SELECT * FROM homestays WHERE id = ?',
      [(result as any).insertId]
    );

    res.status(201).json({
      status: 'success',
      data: newHomestay[0]
    });
  } catch (error) {
    next(error);
  }
};

export const updateHomestay = async (
  req: Request<{ id: string }, {}, HomestayUpdateInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, price, location, facilities, images } = req.body;
    const owner_id = req.user?.id;

    // Check if homestay exists and belongs to the user
    const [homestays] = await pool.query(
      'SELECT * FROM homestays WHERE id = ? AND owner_id = ?',
      [id, owner_id]
    );

    if (!Array.isArray(homestays) || homestays.length === 0) {
      return next(new AppError('Homestay not found or unauthorized', 404));
    }

    // Update homestay
    await pool.query(
      `UPDATE homestays 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           location = COALESCE(?, location),
           facilities = COALESCE(?, facilities),
           images = COALESCE(?, images)
       WHERE id = ?`,
      [name, description, price, location, 
       facilities ? JSON.stringify(facilities) : null,
       images ? JSON.stringify(images) : null,
       id]
    );

    // Get updated homestay
    const [updatedHomestay] = await pool.query(
      'SELECT * FROM homestays WHERE id = ?',
      [id]
    );

    res.json({
      status: 'success',
      data: updatedHomestay[0]
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHomestay = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const owner_id = req.user?.id;

    // Check if homestay exists and belongs to the user
    const [homestays] = await pool.query(
      'SELECT * FROM homestays WHERE id = ? AND owner_id = ?',
      [id, owner_id]
    );

    if (!Array.isArray(homestays) || homestays.length === 0) {
      return next(new AppError('Homestay not found or unauthorized', 404));
    }

    await pool.query('DELETE FROM homestays WHERE id = ?', [id]);

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
}; 