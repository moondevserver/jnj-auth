import { prisma } from '../../db';
import { hashPassword, comparePassword, createAuditLog } from '../../utils/auth';
import { UserUpdateInput, UserPasswordUpdateInput, Context } from '../../types';
import { isAdmin } from '../../utils/permissions';

// 사용자 목록 조회
const users = async (_: any, { skip = 0, take = 50 }: { skip?: number; take?: number }, context: Context) => {
  // 관리자만 모든 사용자 조회 가능
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  const isUserAdmin = await isAdmin(context.user.id);
  if (!isUserAdmin) {
    throw new Error('접근 권한이 없습니다.');
  }

  return prisma.user.findMany({
    skip,
    take,
    orderBy: { created_at: 'desc' },
  });
};

// 사용자 수 조회
const userCount = async (_: any, __: any, context: Context) => {
  // 관리자만 사용자 수 조회 가능
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  const isUserAdmin = await isAdmin(context.user.id);
  if (!isUserAdmin) {
    throw new Error('접근 권한이 없습니다.');
  }

  return prisma.user.count();
};

// 특정 사용자 조회
const user = async (_: any, { id }: { id: string }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  // 자기 자신 또는 관리자만 조회 가능
  if (context.user.id !== id) {
    const isUserAdmin = await isAdmin(context.user.id);
    if (!isUserAdmin) {
      throw new Error('접근 권한이 없습니다.');
    }
  }

  return prisma.user.findUnique({
    where: { id },
  });
};

// 사용자 정보 업데이트
const updateUser = async (
  _: any,
  { id, input }: { id: string; input: UserUpdateInput },
  context: Context
) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  // 자기 자신 또는 관리자만 업데이트 가능
  if (context.user.id !== id) {
    const isUserAdmin = await isAdmin(context.user.id);
    if (!isUserAdmin) {
      throw new Error('접근 권한이 없습니다.');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      first_name: input.first_name,
      last_name: input.last_name,
      profile_image: input.profile_image,
      metadata: input.metadata as any,
    },
  });

  await createAuditLog(
    'USER_UPDATE',
    context.user.id,
    context.req.ip,
    { targetUserId: id }
  );

  return updatedUser;
};

// 비밀번호 변경
const updatePassword = async (
  _: any,
  { input }: { input: UserPasswordUpdateInput },
  context: Context
) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
  });

  if (!user || !user.password_hash) {
    throw new Error('사용자를 찾을 수 없거나 소셜 로그인 사용자입니다.');
  }

  // 현재 비밀번호 확인
  const isCurrentPasswordValid = await comparePassword(input.current_password, user.password_hash);
  if (!isCurrentPasswordValid) {
    throw new Error('현재 비밀번호가 올바르지 않습니다.');
  }

  // 새 비밀번호 해싱
  const newPasswordHash = await hashPassword(input.new_password);

  // 비밀번호 업데이트
  await prisma.user.update({
    where: { id: context.user.id },
    data: { password_hash: newPasswordHash },
  });

  await createAuditLog(
    'PASSWORD_UPDATE',
    context.user.id,
    context.req.ip
  );

  return true;
};

// 사용자 삭제
const deleteUser = async (_: any, { id }: { id: string }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  // 자기 자신 또는 관리자만 삭제 가능
  if (context.user.id !== id) {
    const isUserAdmin = await isAdmin(context.user.id);
    if (!isUserAdmin) {
      throw new Error('접근 권한이 없습니다.');
    }
  }

  // 사용자와 관련된 모든 데이터 삭제 (Prisma의 cascade 기능 활용)
  await prisma.user.delete({
    where: { id },
  });

  await createAuditLog(
    'USER_DELETE',
    context.user.id,
    context.req.ip,
    { deletedUserId: id }
  );

  return true;
};

// 소셜 계정 연결
const connectSocialAccount = async (_: any, { provider, authCode }: { provider: string; authCode: string }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  // 소셜 제공자 확인
  const socialProvider = await prisma.socialProvider.findFirst({
    where: { name: provider.toLowerCase(), is_active: true },
  });

  if (!socialProvider) {
    throw new Error(`지원하지 않는 소셜 인증 제공자입니다: ${provider}`);
  }

  // 실제 구현 시 각 소셜 제공자의 API를 호출하여 토큰 검증 및 사용자 정보를 가져와야 함
  // 여기서는 간단하게 authCode를 사용자 ID로 가정
  const provider_user_id = `mock_${provider}_${authCode}`;

  // 이미 연결된 계정이 있는지 확인
  const existingConnection = await prisma.userSocialConnection.findFirst({
    where: {
      provider_id: socialProvider.id,
      provider_user_id,
    },
  });

  if (existingConnection) {
    throw new Error('이미 다른 계정에 연결된 소셜 계정입니다.');
  }

  // 소셜 연결 생성
  const userSocialConnection = await prisma.userSocialConnection.create({
    data: {
      user_id: context.user.id,
      provider_id: socialProvider.id,
      provider_user_id,
      auth_data: {},
      last_used_at: new Date(),
    },
  });

  await createAuditLog(
    'SOCIAL_ACCOUNT_CONNECT',
    context.user.id,
    context.req.ip,
    {
      provider,
      provider_user_id,
    }
  );

  return userSocialConnection;
};

// 소셜 계정 연결 해제
const disconnectSocialAccount = async (_: any, { id }: { id: string }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  // 사용자의 소셜 연결인지 확인
  const socialConnection = await prisma.userSocialConnection.findUnique({
    where: { id },
    include: { provider: true },
  });

  if (!socialConnection || socialConnection.userId !== context.user.id) {
    throw new Error('접근 권한이 없습니다.');
  }

  // 소셜 연결 삭제
  await prisma.userSocialConnection.delete({
    where: { id },
  });

  await createAuditLog(
    'SOCIAL_DISCONNECT',
    context.user.id,
    context.req.ip,
    { provider: socialConnection.provider.name }
  );

  return true;
};

// 관리자가 사용자 생성
const createUser = async (
  _: any,
  { input }: { input: { email: string; password?: string; firstName?: string; lastName?: string; isActive?: boolean; metadata?: any } },
  context: Context
) => {
  // 관리자만 사용자 생성 가능
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  const isUserAdmin = await isAdmin(context.user.id);
  if (!isUserAdmin) {
    throw new Error('접근 권한이 없습니다.');
  }

  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('이미 등록된 이메일입니다.');
  }

  // 데이터 준비
  const userData: any = {
    email: input.email,
    first_name: input.firstName,
    last_name: input.lastName,
    isActive: input.isActive !== undefined ? input.isActive : true,
    metadata: input.metadata,
  };

  // 비밀번호가 제공된 경우에만 해싱
  if (input.password) {
    userData.password_hash = await hashPassword(input.password);
  }

  // 사용자 생성
  const newUser = await prisma.user.create({
    data: userData,
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

  // 감사 로그 생성
  await createAuditLog(
    'USER_CREATE',
    context.user.id,
    context.req.ip,
    { createdUserId: newUser.id }
  );

  return newUser;
};

export {
  users,
  userCount,
  user,
  updateUser,
  updatePassword,
  deleteUser,
  connectSocialAccount,
  disconnectSocialAccount,
  createUser,
}; 