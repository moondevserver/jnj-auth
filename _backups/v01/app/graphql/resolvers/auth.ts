import { prisma } from '../../db';
import { 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyToken,
  createSession,
  deleteSession,
  createAuditLog
} from '../../utils/auth';
import { 
  LoginInput, 
  RegisterInput, 
  RefreshTokenInput, 
  SocialAuthInput,
  Context 
} from '../../types';

// 로그인 처리
const login = async (_: any, { input }: { input: LoginInput }, context: Context) => {
  const { email, password, siteDomain, pagePath } = input;

  try {
    // 사용자 찾기 (raw query로 직접 조회)
    const users = await prisma.$queryRaw`
      SELECT id, email, password_hash, first_name, last_name, profile_image, is_active
      FROM users WHERE email = ${email} LIMIT 1
    `;
    
    const user = users[0];
    
    if (!user || !user.password_hash) {
      throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 비밀번호 검증
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 계정 활성화 확인
    if (!user.is_active) {
      throw new Error('비활성화된 계정입니다.');
    }

    // 토큰 생성
    const token = await createSession(
      user.id, 
      context.req.ip, 
      context.req.headers['user-agent']
    );
    const refreshToken = generateRefreshToken(user.id);

    // 감사 로그 생성 (임시로 비활성화)
    /*
    await createAuditLog(
      'LOGIN',
      user.id,
      context.req.ip,
      { siteDomain, pagePath }
    );
    */

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImage: user.profile_image,
      },
    };
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    throw error;
  }
};

// 회원가입 처리
const register = async (_: any, { input }: { input: RegisterInput }, context: Context) => {
  const { email, password, firstName, lastName, siteDomain, pagePath } = input;

  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('이미 등록된 이메일입니다.');
  }

  // 비밀번호 해싱
  const passwordHash = await hashPassword(password);

  // 사용자 생성
  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
    },
  });

  // 기본 역할 할당 (일반 사용자)
  const userRole = await prisma.role.findFirst({
    where: { name: 'user', site_id: null },
  });

  if (userRole) {
    await prisma.userRole.create({
      data: {
        userId: newUser.id,
        roleId: userRole.id,
      },
    });
  }

  // 토큰 생성
  const token = await createSession(
    newUser.id, 
    context.req.ip, 
    context.req.headers['user-agent']
  );
  const refreshToken = generateRefreshToken(newUser.id);

  // 감사 로그 생성
  await createAuditLog(
    'REGISTER',
    newUser.id,
    context.req.ip,
    { siteDomain, pagePath }
  );

  return {
    token,
    refreshToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      profileImage: newUser.profileImage,
    },
  };
};

// 소셜 인증 처리 (간소화된 버전)
const socialAuth = async (_: any, { input }: { input: SocialAuthInput }, context: Context) => {
  const { provider, authCode, siteDomain, pagePath } = input;

  // 소셜 제공자 확인
  const socialProvider = await prisma.socialProvider.findFirst({
    where: { name: provider.toLowerCase(), isActive: true },
  });

  if (!socialProvider) {
    throw new Error(`지원하지 않는 소셜 인증 제공자입니다: ${provider}`);
  }

  // 이 부분은 실제 구현 시 각 소셜 제공자의 API를 호출하여 토큰 검증 및 사용자 정보를 가져와야 함
  // 여기서는 간단하게 authCode를 사용자 ID로 가정
  const mockEmail = `${provider.toLowerCase()}_${authCode}@example.com`;
  
  // 기존 사용자 확인
  let user = await prisma.user.findUnique({
    where: { email: mockEmail },
  });

  if (!user) {
    // 새 사용자 생성
    user = await prisma.user.create({
      data: {
        email: mockEmail,
        firstName: `${provider}User`,
        isActive: true,
      },
    });
    
    // 기본 역할 할당
    const userRole = await prisma.role.findFirst({
      where: { name: 'user', site_id: null },
    });

    if (userRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: userRole.id,
        },
      });
    }
  }

  // 토큰 생성
  const token = await createSession(
    user.id, 
    context.req.ip, 
    context.req.headers['user-agent']
  );
  const refreshToken = generateRefreshToken(user.id);

  // 감사 로그 생성
  await createAuditLog(
    'SOCIAL_LOGIN',
    user.id,
    context.req.ip,
    { provider, siteDomain, pagePath }
  );

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
    },
  };
};

// 토큰 갱신
const refreshToken = async (_: any, { refreshToken }: RefreshTokenInput, context: Context) => {
  // 리프레시 토큰 검증
  const payload = verifyToken(refreshToken, true);
  if (!payload || !payload.userId) {
    throw new Error('유효하지 않은 리프레시 토큰입니다.');
  }

  // 사용자 확인
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) {
    throw new Error('사용자를 찾을 수 없거나 비활성화된 계정입니다.');
  }

  // 새 토큰 생성
  const token = await createSession(
    user.id, 
    context.req.ip, 
    context.req.headers['user-agent']
  );
  const newRefreshToken = generateRefreshToken(user.id);

  // 감사 로그 생성
  await createAuditLog(
    'TOKEN_REFRESH',
    user.id,
    context.req.ip
  );

  return {
    token,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
    },
  };
};

// 로그아웃
const logout = async (_: any, __: any, context: Context) => {
  if (!context.token || !context.user) {
    return false;
  }

  try {
    // 세션 삭제
    await deleteSession(context.token);

    // 감사 로그 생성
    await createAuditLog(
      'LOGOUT',
      context.user.id,
      context.req.ip
    );

    return true;
  } catch (error) {
    return false;
  }
};

// 현재 사용자 정보 조회
const me = async (_: any, __: any, context: Context) => {
  if (!context.user) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: context.user.id },
  });
};

export {
  login,
  register,
  socialAuth,
  refreshToken,
  logout,
  me,
}; 