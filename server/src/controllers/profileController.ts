import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { getProfile, saveProfile, ProfileError } from '../services/profileService.js';

function handler(action: 'read' | 'create' | 'edit') {
    return async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        if (!req.userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        try {
            const profile = action === 'read'
                ? await getProfile(req.userId)
                : await saveProfile(req.userId, req.body, action === 'create');
            res.status(action === 'create' ? 201 : 200).json({ profile });
        } catch (error) {
            if (error instanceof ProfileError) {
                res.status(error.statusCode).json({ message: error.message });
                return;
            }
            console.error('Academic profile error:', error);
            res.status(500).json({ message: 'Unable to access your academic profile right now.' });
        }
    };
}

export const getProfileController = handler('read');
export const createProfileController = handler('create');
export const editProfileController = handler('edit');
