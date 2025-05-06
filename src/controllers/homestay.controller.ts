import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { HomestayCreateInput, HomestayUpdateInput } from '../types/homestay.types';
import { AppError } from '../middleware/error.middleware';

export const getAllHomestays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: homestays } = await pool.query(
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
    const { rows: homestays } = await pool.query(
      'SELECT h.*, u.name as owner_name FROM homestays h JOIN users u ON h.owner_id = u.id WHERE h.id = $1',
      [id]
    );

    if (homestays.length === 0) {
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

    const { rows: [newHomestay] } = await pool.query(
      `INSERT INTO homestays (name, description, price, location, facilities, images, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, price, location, facilities, images, owner_id]
    );

    res.status(201).json({
      status: 'success',
      data: newHomestay
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
    const { rows: homestays } = await pool.query(
      'SELECT * FROM homestays WHERE id = $1 AND owner_id = $2',
      [id, owner_id]
    );

    if (homestays.length === 0) {
      return next(new AppError('Homestay not found or unauthorized', 404));
    }

    // Update homestay
    const { rows: [updatedHomestay] } = await pool.query(
      `UPDATE homestays 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           location = COALESCE($4, location),
           facilities = COALESCE($5, facilities),
           images = COALESCE($6, images)
       WHERE id = $7
       RETURNING *`,
      [name, description, price, location, 
       facilities ? facilities : null,
       images ? images : null,
       id]
    );

    res.json({
      status: 'success',
      data: updatedHomestay
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
    const { rows: homestays } = await pool.query(
      'SELECT * FROM homestays WHERE id = $1 AND owner_id = $2',
      [id, owner_id]
    );

    if (homestays.length === 0) {
      return next(new AppError('Homestay not found or unauthorized', 404));
    }

    await pool.query('DELETE FROM homestays WHERE id = $1', [id]);

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
}; 