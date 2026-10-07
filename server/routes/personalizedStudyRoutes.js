import express from 'express';
import {
  generatePersonalizedPlan,
  getPersonalizedPlans,
  getPersonalizedPlanById,
  deletePersonalizedPlan,
} from '../controllers/personalizedStudyController.js';

const router = express.Router();

router.post('/generate', generatePersonalizedPlan);
router.get('/', getPersonalizedPlans);
router.get('/:id', getPersonalizedPlanById);
router.delete('/:id', deletePersonalizedPlan);

export default router;
