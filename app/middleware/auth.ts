import { Request, Response, NextFunction } from 'express';
import { validateSession } from '../utils/auth';

// 인증 미들웨어
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      
      if (type === 'Bearer' && token) {
        // 토큰으로 세션 검증
        const user = await validateSession(token);
        
        if (user) {
          // context에 사용자 정보와 토큰 추가
          (req as any).user = {
            id: user.id,
            email: user.email,
          };
          (req as any).token = token;
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}; 