import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin } from '../firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    name?: string;
    facilityId?: string;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const roleHeader = (req.headers['x-user-role'] as string) || 'asha';
  const nameHeader = (req.headers['x-user-name'] as string) || 'Healthcare Provider';
  const facilityHeader = (req.headers['x-facility-id'] as string) || 'fac-phc-shirur';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const app = getFirebaseAdmin();
    if (app && token) {
      try {
        const decoded = await getAuth(app).verifyIdToken(token);
        req.user = {
          uid: decoded.uid,
          email: decoded.email,
          role: (decoded.role as string) || roleHeader,
          name: (decoded.name as string) || nameHeader,
          facilityId: (decoded.facilityId as string) || facilityHeader,
        };
        return next();
      } catch (err) {
        console.warn('[Auth Middleware] Token verification failed; falling back to session headers');
      }
    }
  }

  // Graceful fallback using session role headers
  req.user = {
    uid: (req.headers['x-user-id'] as string) || 'usr-default',
    role: roleHeader,
    name: nameHeader,
    facilityId: facilityHeader,
  };

  next();
}
