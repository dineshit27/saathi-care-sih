import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCollectionDocs, getDocById, setDocument, updateDocument } from '../dbHelper';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await getCollectionDocs('notifications');
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATIONS_FETCH_FAILED', message: error.message || 'Failed to retrieve notifications' }
    });
  }
});

// POST /api/notifications
notificationsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data || !data.title || !data.message) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Notification requires title and message.' }
      });
    }

    const newId = `notif-${Date.now()}`;
    const notification = {
      ...data,
      id: newId,
      read: false,
      timestamp: 'Just now',
      createdAt: new Date().toISOString()
    };

    const saved = await setDocument('notifications', newId, notification);
    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATION_CREATION_FAILED', message: error.message || 'Failed to dispatch notification' }
    });
  }
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notif = await getDocById('notifications', req.params.id);
    if (!notif) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' }
      });
    }

    const updated = await updateDocument('notifications', req.params.id, {
      read: true
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATION_UPDATE_FAILED', message: error.message || 'Failed to mark notification as read' }
    });
  }
});

