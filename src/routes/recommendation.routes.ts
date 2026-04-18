import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendation.controller';

const router = Router();

router.post('/rekomendasi', getRecommendations);

export default router;