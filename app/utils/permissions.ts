import { prisma } from '../db';

// 사용자가 특정 사이트에 대한 권한을 가지고 있는지 확인
const hasPermissionForSite = async (
  userId: string,
  permissionCode: string,
  siteDomain: string
): Promise<boolean> => {
  // 1. 사이트 ID 찾기
  const site = await prisma.site.findUnique({
    where: { domain: siteDomain },
  });
  
  if (!site) return false;
  
  // 2. 사용자 역할 확인
  const userRoles = await prisma.userRole.findMany({
    where: {
      user_id: userId,
      OR: [
        { site_id: site.id },
        { site_id: null },  // 시스템 전체 역할도 확인
      ],
    },
    include: {
      roles: true,
    },
  });
  
  if (userRoles.length === 0) return false;
  
  // 3. 역할에 따른 권한 확인
  const roleIds = userRoles.map(ur => ur.role_id);
  
  // 권한 ID 가져오기
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode },
  });
  
  if (!permission) return false;
  
  // 역할-권한 관계 확인
  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      role_id: { in: roleIds },
      permission_id: permission.id,
      OR: [
        { site_id: site.id },
        { site_id: null },  // 사이트 전체 권한도 확인
      ],
    },
  });
  
  return !!rolePermission;
};

// 사용자가 특정 페이지에 대한 권한을 가지고 있는지 확인
const hasPermissionForPage = async (
  userId: string,
  permissionCode: string,
  siteDomain: string,
  pagePath: string
): Promise<boolean> => {
  // 1. 사이트 및 페이지 ID 찾기
  const site = await prisma.site.findUnique({
    where: { domain: siteDomain },
  });
  
  if (!site) return false;
  
  const page = await prisma.page.findFirst({
    where: {
      site_id: site.id,
      path: pagePath,
    },
  });
  
  if (!page) return false;
  
  // 2. 사용자 역할 확인
  const userRoles = await prisma.userRole.findMany({
    where: {
      user_id: userId,
      OR: [
        { site_id: site.id },
        { site_id: null },  // 시스템 전체 역할도 확인
      ],
    },
    include: {
      roles: true,
    },
  });
  
  if (userRoles.length === 0) return false;
  
  // 3. 역할에 따른 권한 확인
  const roleIds = userRoles.map(ur => ur.role_id);
  
  // 권한 ID 가져오기
  const permission = await prisma.permission.findUnique({
    where: { code: permissionCode },
  });
  
  if (!permission) return false;
  
  // 역할-권한 관계 확인 (페이지 수준)
  const pageRolePermission = await prisma.rolePermission.findFirst({
    where: {
      role_id: { in: roleIds },
      permission_id: permission.id,
      page_id: page.id,
    },
  });
  
  if (pageRolePermission) return true;
  
  // 사이트 수준 권한 확인
  const siteRolePermission = await prisma.rolePermission.findFirst({
    where: {
      role_id: { in: roleIds },
      permission_id: permission.id,
      site_id: site.id,
      page_id: null,
    },
  });
  
  if (siteRolePermission) return true;
  
  // 시스템 수준 권한 확인
  const systemRolePermission = await prisma.rolePermission.findFirst({
    where: {
      role_id: { in: roleIds },
      permission_id: permission.id,
      site_id: null,
      page_id: null,
    },
  });
  
  return !!systemRolePermission;
};

// 사용자가 관리자인지 확인
const isAdmin = async (userId: string): Promise<boolean> => {
  // 관리자 역할 찾기
  const adminRole = await prisma.role.findFirst({
    where: {
      name: 'admin',
      site_id: null,  // 시스템 전체 관리자
    },
  });
  
  if (!adminRole) return false;
  
  // 사용자가 관리자 역할을 가지고 있는지 확인
  const userAdminRole = await prisma.userRole.findFirst({
    where: {
      user_id: userId,
      role_id: adminRole.id,
    },
  });
  
  return !!userAdminRole;
};

// 사용자가 특정 사이트의 관리자인지 확인
const isSiteAdmin = async (userId: string, siteDomain: string): Promise<boolean> => {
  // 사이트 ID 찾기
  const site = await prisma.site.findUnique({
    where: { domain: siteDomain },
  });
  
  if (!site) return false;
  
  // 사이트 관리자 역할 찾기
  const adminRole = await prisma.role.findFirst({
    where: {
      name: 'admin',
      OR: [
        { site_id: site.id },
        { site_id: null },  // 시스템 전체 관리자도 사이트 관리자
      ],
    },
  });
  
  if (!adminRole) return false;
  
  // 사용자가 관리자 역할을 가지고 있는지 확인
  const userAdminRole = await prisma.userRole.findFirst({
    where: {
      user_id: userId,
      role_id: adminRole.id,
      OR: [
        { site_id: site.id },
        { site_id: null },  // 시스템 전체 관리자도 사이트 관리자
      ],
    },
  });
  
  return !!userAdminRole;
};

export {
  hasPermissionForSite,
  hasPermissionForPage,
  isAdmin,
  isSiteAdmin,
}; 