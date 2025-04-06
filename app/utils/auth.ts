import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { SignOptions } from 'jsonwebtoken';

// 비밀번호 해싱
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// 비밀번호 검증
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// 액세스 토큰 생성
const generateAccessToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
  // 기본값으로 7일(604800초)로 설정
  const expiresIn = process.env.JWT_EXPIRES_IN ? process.env.JWT_EXPIRES_IN : '7d';
  
  return jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn }
  );
};

// 리프레시 토큰 생성
const generateRefreshToken = (userId: string): string => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default-jwt-refresh-secret';
  // 기본값으로 30일(2592000초)로 설정
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ? process.env.JWT_REFRESH_EXPIRES_IN : '30d';
  
  return jwt.sign(
    { userId },
    jwtRefreshSecret,
    { expiresIn }
  );
};

// 토큰 검증
const verifyToken = (token: string, isRefreshToken = false): any => {
  try {
    const secret = isRefreshToken
      ? (process.env.JWT_REFRESH_SECRET || 'default-jwt-refresh-secret')
      : (process.env.JWT_SECRET || 'default-jwt-secret');
    
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// 세션 생성
const createSession = async (userId: string, ip?: string, userAgent?: string): Promise<string> => {
  const token = generateAccessToken(userId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료
  
  // Raw SQL 쿼리 사용
  await prisma.$executeRaw`
    INSERT INTO "sessions" (
      "id", "user_id", "token", "expires_at", "ip_address", "user_agent", "created_at", "last_active_at"
    ) VALUES (
      uuid_generate_v4(), ${userId}::uuid, ${token}, ${expiresAt}, ${ip}, ${userAgent}, NOW(), NOW()
    )
  `;
  
  return token;
};

// 세션 검증
const validateSession = async (token: string): Promise<any> => {
  // Raw SQL 쿼리 사용
  const sessions = await prisma.$queryRaw`
    SELECT s.*, u.* 
    FROM "sessions" s
    JOIN "users" u ON s.user_id = u.id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  
  if (!sessions.length) return null;
  
  const session = sessions[0];
  if (session.expires_at < new Date()) return null;
  
  // 세션 활성 시간 업데이트
  await prisma.$executeRaw`
    UPDATE "sessions" 
    SET "last_active_at" = NOW() 
    WHERE "id" = ${session.id}::uuid
  `;
  
  // 사용자 정보 반환
  return {
    id: session.id,
    email: session.email,
    firstName: session.first_name,
    lastName: session.last_name,
    profileImage: session.profile_image,
    isActive: session.is_active
  };
};

// 세션 삭제 (로그아웃)
const deleteSession = async (token: string): Promise<boolean> => {
  try {
    // Raw SQL 쿼리 사용
    await prisma.$executeRaw`
      DELETE FROM "sessions" 
      WHERE "token" = ${token}
    `;
    return true;
  } catch (error) {
    return false;
  }
};

// 감사 로그 생성
const createAuditLog = async (
  action: string,
  userId?: string,
  ipAddress?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    // IP 주소 정제 - IPv6 형식(::ffff:)에서 IPv4 형식으로 변환
    const cleanedIpAddress = ipAddress?.replace('::ffff:', '') || null;
    
    // details가 비어있거나 undefined인 경우 기본값 설정
    const jsonDetails = details && Object.keys(details).length > 0 
      ? JSON.stringify(details)
      : JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'API',
          type: action
        });
    
    if (userId) {
      await prisma.$executeRaw`
        INSERT INTO "audit_logs" (
          "id", "user_id", "action", "timestamp", "ip_address", "details"
        ) VALUES (
          uuid_generate_v4(), ${userId}::uuid, ${action}, NOW(), ${cleanedIpAddress}, ${jsonDetails}::json
        )
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "audit_logs" (
          "id", "action", "timestamp", "ip_address", "details"
        ) VALUES (
          uuid_generate_v4(), ${action}, NOW(), ${cleanedIpAddress}, ${jsonDetails}::json
        )
      `;
    }
    console.log(`감사 로그 생성 완료: action=${action}, userId=${userId || 'anonymous'}`);
  } catch (error) {
    console.error('감사 로그 생성 중 오류:', error);
  }
};

export {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  createSession,
  validateSession,
  deleteSession,
  createAuditLog,
}; 