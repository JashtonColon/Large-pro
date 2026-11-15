import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
    getProfileController,
    createProfileController,
    editProfileController,
} from '../controllers/profileController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getProfileController);
router.post('/', createProfileController);
router.patch('/', editProfileController);
export default router;
