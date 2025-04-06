import { prisma } from '../../db';
import { Context } from '../../types';

// 소셜 프로바이더 단일 조회
const socialProvider = async (_: any, { id }: { id: number }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  return prisma.socialProvider.findUnique({
    where: { id },
    include: {
      user_social_connections: {
        include: {
          users: true,
        },
      },
    },
  });
};

// 소셜 프로바이더 목록 조회
const socialProviders = async (_: any, { search }: { search?: string }, context: Context) => {
  try {
    if (!context.user) {
      throw new Error('인증이 필요합니다.');
    }

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    const providers = await prisma.socialProvider.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        user_social_connections: {
          include: {
            users: true,
          },
        },
      },
    });

    return providers;
  } catch (error) {
    console.error('소셜 프로바이더 목록 조회 오류:', error);
    return [];
  }
};

// 소셜 프로바이더 생성
const createSocialProvider = async (_: any, { input }: { input: any }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  // settings가 유효한 JSON 객체인지 확인
  if (input.settings && typeof input.settings === 'string') {
    try {
      input.settings = JSON.parse(input.settings);
    } catch (error) {
      throw new Error('settings는 유효한 JSON 형식이어야 합니다.');
    }
  }

  return prisma.socialProvider.create({
    data: {
      name: input.name,
      description: input.description,
      is_active: input.is_active !== undefined ? input.is_active : true,
      settings: input.settings || null,
    },
    include: {
      user_social_connections: {
        include: {
          users: true,
        },
      },
    },
  });
};

// 소셜 프로바이더 수정
const updateSocialProvider = async (_: any, { id, input }: { id: number; input: any }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  // settings가 유효한 JSON 객체인지 확인
  if (input.settings && typeof input.settings === 'string') {
    try {
      input.settings = JSON.parse(input.settings);
    } catch (error) {
      throw new Error('settings는 유효한 JSON 형식이어야 합니다.');
    }
  }

  return prisma.socialProvider.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      is_active: input.is_active,
      settings: input.settings || null,
    },
    include: {
      user_social_connections: {
        include: {
          users: true,
        },
      },
    },
  });
};

// 소셜 프로바이더 삭제
const deleteSocialProvider = async (_: any, { id }: { id: number }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  await prisma.socialProvider.delete({
    where: { id },
  });

  return true;
};

export {
  socialProvider,
  socialProviders,
  createSocialProvider,
  updateSocialProvider,
  deleteSocialProvider,
}; 