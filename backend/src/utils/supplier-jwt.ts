import jwt from 'jsonwebtoken';

export interface SupplierTokenPayload {
  supplierId: string;
  email: string;
  companyName: string;
  status: string; // PENDING, ACTIVE, etc.
}

export const generateSupplierAccessToken = (payload: SupplierTokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.SUPPLIER_JWT_SECRET || process.env.JWT_SECRET!,
    { expiresIn: process.env.SUPPLIER_JWT_EXPIRES_IN || '1d' }
  );
};

export const generateSupplierRefreshToken = (payload: SupplierTokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.SUPPLIER_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.SUPPLIER_JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

export const verifySupplierAccessToken = (token: string): SupplierTokenPayload => {
  return jwt.verify(
    token,
    process.env.SUPPLIER_JWT_SECRET || process.env.JWT_SECRET!
  ) as SupplierTokenPayload;
};

export const verifySupplierRefreshToken = (token: string): SupplierTokenPayload => {
  return jwt.verify(
    token,
    process.env.SUPPLIER_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET!
  ) as SupplierTokenPayload;
};

export const generateSupplierTokens = (payload: SupplierTokenPayload) => {
  return {
    accessToken: generateSupplierAccessToken(payload),
    refreshToken: generateSupplierRefreshToken(payload),
  };
};
