import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCollectionDocs, getDocById, setDocument, updateDocument } from '../dbHelper';

export const diagnosticsRouter = Router();

// GET /api/diagnostics
diagnosticsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const diagnostics = await getCollectionDocs('diagnostics');
    res.json({ success: true, count: diagnostics.length, data: diagnostics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/diagnostics
diagnosticsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const newId = `diag-${Date.now()}`;
    const order = {
      ...data,
      id: newId,
      status: data.status || 'sample_collected',
      requestedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      createdBy: req.user?.name || 'Doctor'
    };

    const saved = await setDocument('diagnostics', newId, order);

    // Timeline event
    const evtId = `evt-${Date.now()}`;
    await setDocument('healthRecords', evtId, {
      id: evtId,
      patientId: order.patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: order.facilityId,
      facilityName: order.facilityName,
      providerName: req.user?.name || 'Lab Technician',
      providerRole: 'Diagnostic Service',
      eventType: 'diagnostic_request',
      title: `Diagnostic Test Ordered: ${order.testType}`,
      notes: `Requested by ${order.requestingDoctor} at ${order.facilityName}. Sample collection initiated.`,
      badgeType: 'default'
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/diagnostics/:id
diagnosticsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, resultSummary, findings, isAbnormal } = req.body;
    const order = await getDocById('diagnostics', req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Diagnostic order not found' });
    }

    const updates: any = {
      status,
      updatedBy: req.user?.name || 'Lab Staff',
      ...(resultSummary ? { resultSummary } : {}),
      ...(findings ? { findings } : {}),
      ...(isAbnormal !== undefined ? { isAbnormal } : {}),
      ...(status === 'result_available' ? { completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) } : {})
    };

    const updated = await updateDocument('diagnostics', req.params.id, updates);

    // Timeline event
    const evtId = `evt-${Date.now()}`;
    await setDocument('healthRecords', evtId, {
      id: evtId,
      patientId: order.patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: order.facilityId,
      facilityName: order.facilityName,
      providerName: req.user?.name || 'Lab Specialist',
      providerRole: 'Diagnostic Unit',
      eventType: 'diagnostic_result',
      title: `Diagnostic Result: ${order.testType} (${status.replace('_', ' ').toUpperCase()})`,
      notes: resultSummary || `Status updated to ${status}.`,
      badgeType: isAbnormal ? 'urgent' : 'success'
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
