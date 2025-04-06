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
  const { email, password, site_domain, page_path } = input;

  try {
    // 사용자 찾기 (raw query로 직접 조회)
    const users = await prisma.$queryRaw<Array<{
      id: string;
      email: string;
      password_hash: string;
      first_name: string | null;
      last_name: string | null;
      profile_image: string | null;
      is_active: boolean;
    }>>`
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
    const refresh_token = generateRefreshToken(user.id);

    // 감사 로그 생성
    await createAuditLog(
      'LOGIN',
      user.id,
      context.req.ip,
      { site_domain, page_path }
    );

    return {
      token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_image: user.profile_image,
        is_active: user.is_active,
      },
    };
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    throw error;
  }
};

// 회원가입 처리
const register = async (_: any, { input }: { input: RegisterInput }, context: Context) => {
  const { email, password, first_name, last_name, site_domain, page_path } = input;

  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('이미 등록된 이메일입니다.');
  }

  // 비밀번호 해싱
  const password_hash = await hashPassword(password);

  // 사용자 생성
  const newUser = await prisma.user.create({
    data: {
      email,
      password_hash,
      first_name,
      last_name,
    },
  });

  // 기본 역할 할당 (일반 사용자)
  const userRole = await prisma.role.findFirst({
    where: { name: 'user', site_id: null },
  });

  if (userRole) {
    await prisma.userRole.create({
      data: {
        user_id: newUser.id,
        role_id: userRole.id,
      },
    });
  }

  // 토큰 생성
  const token = await createSession(
    newUser.id, 
    context.req.ip, 
    context.req.headers['user-agent']
  );
  const refresh_token = generateRefreshToken(newUser.id);

  // 감사 로그 생성
  await createAuditLog(
    'REGISTER',
    newUser.id,
    context.req.ip,
    { site_domain, page_path }
  );

  return {
    token,
    refresh_token,
    user: {
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      profile_image: newUser.profile_image,
    },
  };
};

// 소셜 인증 처리 (간소화된 버전)
const socialAuth = async (_: any, { input }: { input: SocialAuthInput }, context: Context) => {
  const { provider, auth_code, site_domain, page_path } = input;

  // 소셜 제공자 확인
  const socialProvider = await prisma.socialProvider.findFirst({
    where: { name: provider.toLowerCase(), is_active: true },
  });

  if (!socialProvider) {
    throw new Error(`지원하지 않는 소셜 인증 제공자입니다: ${provider}`);
  }

  // 이 부분은 실제 구현 시 각 소셜 제공자의 API를 호출하여 토큰 검증 및 사용자 정보를 가져와야 함
  // 여기서는 간단하게 auth_code를 사용자 ID로 가정
  const mockEmail = `${provider.toLowerCase()}_${auth_code}@example.com`;
  
  // 기존 사용자 확인
  let user = await prisma.user.findUnique({
    where: { email: mockEmail },
  });

  if (!user) {
    // 새 사용자 생성
    user = await prisma.user.create({
      data: {
        email: mockEmail,
        first_name: `${provider}User`,
        is_active: true,
      },
    });
    
    // 기본 역할 할당
    const userRole = await prisma.role.findFirst({
      where: { name: 'user', site_id: null },
    });

    if (userRole) {
      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: userRole.id,
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
  const refresh_token = generateRefreshToken(user.id);

  // 소셜 연결 생성 또는 업데이트
  await prisma.userSocialConnection.upsert({
    where: {
      provider_id_provider_user_id: {
        provider_id: socialProvider.id,
        provider_user_id: auth_code,
      },
    },
    create: {
      user_id: user.id,
      provider_id: socialProvider.id,
      provider_user_id: auth_code,
      auth_data: {},
      last_used_at: new Date(),
    },
    update: {
      last_used_at: new Date(),
    },
  });

  // 감사 로그 생성
  await createAuditLog(
    'SOCIAL_LOGIN',
    user.id,
    context.req.ip,
    { provider, site_domain, page_path }
  );

  return {
    token,
    refresh_token,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_image: user.profile_image,
    },
  };
};

// 토큰 갱신
const refreshToken = async (_: any, { refresh_token }: RefreshTokenInput, context: Context) => {
  // 리프레시 토큰 검증
  const payload = verifyToken(refresh_token, true);
  if (!payload || !payload.user_id) {
    throw new Error('유효하지 않은 리프레시 토큰입니다.');
  }

  // 사용자 확인
  const user = await prisma.user.findUnique({
    where: { id: payload.user_id },
  });

  if (!user || !user.is_active) {
    throw new Error('유효하지 않은 사용자입니다.');
  }

  // 새 토큰 생성
  const token = await createSession(
    user.id,
    context.req.ip,
    context.req.headers['user-agent']
  );
  const new_refresh_token = generateRefreshToken(user.id);

  // 감사 로그 생성
  await createAuditLog(
    'TOKEN_REFRESH',
    user.id,
    context.req.ip
  );

  return {
    token,
    refresh_token: new_refresh_token,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_image: user.profile_image,
    },
  };
};

// 로그아웃
const logout = async (_: any, __: any, context: Context) => {
  if (!context.user || !context.token) {
    return true;
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
    console.error('로그아웃 처리 중 오류:', error);
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