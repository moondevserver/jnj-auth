import { prisma } from '../../db';
import { Context } from '../../types';

// 역할 단일 조회
const role = async (_: any, { id }: { id: string }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  const result = await prisma.role.findUnique({
    where: { id: parseInt(id) },
    include: {
      role_permissions: {
        include: {
          permissions: true,
        },
      },
      sites: true,
    },
  });

  if (!result) {
    throw new Error('역할을 찾을 수 없습니다.');
  }

  return {
    id: result.id,
    name: result.name,
    description: result.description,
    site: result.sites,
    permissions: result.role_permissions.map(rp => ({
      id: rp.permissions.id,
      code: rp.permissions.code,
      name: rp.permissions.name,
      description: rp.permissions.description,
    })),
  };
};

// 역할 목록 조회
const roles = async (_: any, { site_id, search }: { site_id?: string; search?: string }, context: Context) => {
  try {
    // 인증 체크
    if (!context.user) {
      console.log('Authentication required');
      return [];
    }

    // 쿼리 조건 구성
    const where = {
      ...(site_id ? { site_id } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      } : {}),
    };

    console.log('Fetching roles with where:', where);

    // 역할 조회
    const result = await prisma.role.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
        sites: true,
      },
    });

    console.log('Found roles:', result);

    // 결과가 없는 경우 빈 배열 반환
    if (!result || !Array.isArray(result)) {
      console.log('No roles found or invalid result');
      return [];
    }

    // 데이터 매핑
    const mappedRoles = result.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      site: role.sites,
      permissions: (role.role_permissions || []).map(rp => ({
        id: rp.permissions.id,
        code: rp.permissions.code,
        name: rp.permissions.name,
        description: rp.permissions.description,
      })),
    }));

    console.log('Mapped roles:', mappedRoles);
    return mappedRoles;

  } catch (error) {
    console.error('Error fetching roles:', error);
    // 에러가 발생해도 빈 배열 반환
    return [];
  }
};

// 역할 생성
const createRole = async (_: any, { input }: { input: any }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  const result = await prisma.role.create({
    data: {
      name: input.name,
      description: input.description,
      site_id: input.site_id,
      role_permissions: {
        create: input.permissionIds?.map((id: string) => ({
          permission_id: parseInt(id),
          site_id: input.site_id,
        })) || [],
      },
    },
    include: {
      role_permissions: {
        include: {
          permissions: true,
        },
      },
      sites: true,
    },
  });

  return {
    id: result.id,
    name: result.name,
    description: result.description,
    site: result.sites,
    permissions: result.role_permissions.map(rp => ({
      id: rp.permissions.id,
      code: rp.permissions.code,
      name: rp.permissions.name,
      description: rp.permissions.description,
    })),
  };
};

// 역할 수정
const updateRole = async (_: any, { id, input }: { id: string; input: any }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  // 기존 권한 연결 해제
  await prisma.rolePermission.deleteMany({
    where: { role_id: parseInt(id) },
  });

  // 새로운 정보로 업데이트
  const result = await prisma.role.update({
    where: { id: parseInt(id) },
    data: {
      name: input.name,
      description: input.description,
      site_id: input.site_id,
      role_permissions: {
        create: input.permissionIds?.map((id: string) => ({
          permission_id: parseInt(id),
          site_id: input.site_id,
        })) || [],
      },
    },
    include: {
      role_permissions: {
        include: {
          permissions: true,
        },
      },
      sites: true,
    },
  });

  return {
    id: result.id,
    name: result.name,
    description: result.description,
    site: result.sites,
    permissions: result.role_permissions.map(rp => ({
      id: rp.permissions.id,
      code: rp.permissions.code,
      name: rp.permissions.name,
      description: rp.permissions.description,
    })),
  };
};

// 역할 삭제
const deleteRole = async (_: any, { id }: { id: string }, context: Context) => {
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }

  // 역할과 관련된 모든 연결 삭제
  await prisma.userRole.deleteMany({
    where: { role_id: parseInt(id) },
  });

  await prisma.rolePermission.deleteMany({
    where: { role_id: parseInt(id) },
  });

  await prisma.role.delete({
    where: { id: parseInt(id) },
  });

  return {
    id,
  };
};

export {
  role,
  roles,
  createRole,
  updateRole,
  deleteRole,
}; 