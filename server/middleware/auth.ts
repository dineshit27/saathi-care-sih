import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin, getAdminFirestore } from '../firebaseAdmin';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: 'patient' | 'asha' | 'doctor' | 'facility' | 'admin';
  roleTitle?: string;
  name?: string;
  facilityId?: string;
  facilityName?: string;
  isVerified: boolean;
  isDemo: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const VALID_ROLES = ['patient', 'asha', 'doctor', 'facility', 'admin'] as const;

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const isDemoHeader = req.headers['x-demo-mode'] === 'true';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const app = getFirebaseAdmin();
    if (app && token) {
      try {
        const decoded = await getAuth(app).verifyIdToken(token);
        let verifiedRole: AuthenticatedUser['role'] = 'patient';
        let verifiedName = decoded.name || 'Healthcare User';
        let verifiedFacilityId = (decoded.facilityId as string) || undefined;

        // Check if admin email
        if (decoded.email === 'm.dinesh.it27@gmail.com') {
          verifiedRole = 'admin';
        } else if (decoded.role && VALID_ROLES.includes(decoded.role as any)) {
          verifiedRole = decoded.role as any;
        } else {
          // Check user document in Firestore for verified role
          const db = getAdminFirestore();
          if (db) {
            try {
              const userSnap = await db.collection('users').doc(decoded.uid).get();
              if (userSnap.exists) {
                const data = userSnap.data();
                if (data?.role && VALID_ROLES.includes(data.role)) {
                  verifiedRole = data.role;
                }
                if (data?.name) verifiedName = data.name;
                if (data?.facilityId) verifiedFacilityId = data.facilityId;
              }
            } catch (dbErr) {
              console.warn('[Auth Middleware] User profile fetch failed:', dbErr);
            }
          }
        }

        req.user = {
          uid: decoded.uid,
          email: decoded.email,
          role: verifiedRole,
          name: verifiedName,
          facilityId: verifiedFacilityId,
          isVerified: true,
          isDemo: false
        };
        return next();
      } catch (err: any) {
        console.warn('[Auth Middleware] Token verification failed:', err?.message || err);
      }
    }
  }

  // Demo mode fallback: allowed for interactive evaluation
  if (isDemoHeader || !authHeader) {
    const requestedRole = (req.headers['x-user-role'] as string) || 'asha';
    const safeRole: AuthenticatedUser['role'] = VALID_ROLES.includes(requestedRole as any)
      ? (requestedRole as AuthenticatedUser['role'])
      : 'asha';

    req.user = {
      uid: (req.headers['x-user-id'] as string) || 'demo-user-001',
      role: safeRole,
      name: (req.headers['x-user-name'] as string) || 'Demo Clinician',
      facilityId: (req.headers['x-facility-id'] as string) || 'fac-phc-shirur',
      isVerified: false,
      isDemo: true
    };
    return next();
  }

  // If token was present but invalid and not demo mode
  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired authentication credentials.'
    }
  });
}

/**
 * Middleware ensuring user has one of the allowed roles
 */
export function requireRole(...allowedRoles: Array<AuthenticatedUser['role']>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required for this operation.'
        }
      });
    }

    // Admin role always has access
    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`
      }
    });
  };
}

