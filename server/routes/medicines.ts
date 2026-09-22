import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCollectionDocs, getDocById, setDocument, updateDocument } from '../dbHelper';

export const medicinesRouter = Router();

// GET /api/medicines
medicinesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medicines = await getCollectionDocs('medicines');
    res.json({ success: true, count: medicines.length, data: medicines });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/medicines/:id
medicinesRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { availableQuantity } = req.body;
    const med = await getDocById('medicines', req.params.id);
    if (!med) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }

    const qty = Number(availableQuantity);
    const status = qty === 0 ? 'out_of_stock' : qty < 30 ? 'low_stock' : 'available';

    const updated = await updateDocument('medicines', req.params.id, {
      availableQuantity: qty,
      status,
      lastUpdated: 'Just now',
      updatedBy: req.user?.name || 'Pharmacist'
    });

    // Audit log
    const logId = `log-${Date.now()}`;
    await setDocument('auditLogs', logId, {
      id: logId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      userName: req.user?.name || 'Pharmacist',
      userRole: req.user?.role || 'facility',
      action: 'Pharmacy Inventory Adjusted',
      entityType: 'Medicine',
      entityId: req.params.id,
      facilityName: med.facilityName || 'Public Dispensary',
      details: `Stock updated for ${med.medicineName} to ${qty} units (${status}).`
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
