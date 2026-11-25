import { SignJWT, jwtVerify } from 'jose';

const DEV_SECRET = 'sanjibani-dev-secret-change-me';

function secretKey() {
  const secret = process.env.JWT_SECRET?.trim() || DEV_SECRET;
  if (secret === DEV_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return new TextEncoder().encode(secret);
}

export function signToken(user) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user._id))
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(secretKey());
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
  return payload;
}
