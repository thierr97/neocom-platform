import jwt, { Secret } from 'jsonwebtoken';

export interface SupplierTokenPayload {
  supplierId: string;
  email: string;
  companyName: string;
  status: string; // PENDING, ACTIVE, etc.
}

export const generateSupplierAccessToken = (payload: SupplierTokenPayload): string => {
  const secret = (process.env.SUPPLIER_JWT_SECRET || process.env.JWT_SECRET) as Secret;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, secret, { expiresIn: process.env.SUPPLIER_JWT_EXPIRES_IN || '1d' });
};

export const generateSupplierRefreshToken = (payload: SupplierTokenPayload): string => {
  const secret = (process.env.SUPPLIER_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET) as Secret;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, secret, { expiresIn: process.env.SUPPLIER_JWT_REFRESH_EXPIRES_IN || '30d' });
};

export const verifySupplierAccessToken = (token: string): SupplierTokenPayload => {
  const secret = (process.env.SUPPLIER_JWT_SECRET || process.env.JWT_SECRET) as Secret;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.verify(token, secret) as SupplierTokenPayload;
};

export const verifySupplierRefreshToken = (token: string): SupplierTokenPayload => {
  const secret = (process.env.SUPPLIER_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET) as Secret;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  return jwt.verify(token, secret) as SupplierTokenPayload;
};

export const generateSupplierTokens = (payload: SupplierTokenPayload) => {
  return {
    accessToken: generateSupplierAccessToken(payload),
    refreshToken: generateSupplierRefreshToken(payload),
  };
};
