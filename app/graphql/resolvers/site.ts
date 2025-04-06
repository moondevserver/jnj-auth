import { prisma } from '../../db';
import { Context } from '../../types';

// 사이트 단일 조회
const site = async (_: any, { id, domain }: { id?: string; domain?: string }, context: Context) => {
  if (!id && !domain) {
    return null; // id 또는 domain이 제공되지 않으면 null 반환
  }

  const where: any = {};
  if (id) where.id = id;
  if (domain) where.domain = domain;

  console.log('사이트 조회 요청:', where);

  return prisma.site.findFirst({
    where,
    include: {
      pages: true, // pages 관계 포함
    },
  });
};

// 사이트 목록 조회
const sites = async (_: any, { skip = 0, take = 50 }: { skip?: number; take?: number }, context: Context) => {
  console.log('사이트 목록 조회 요청', { skip, take });
  
  return prisma.site.findMany({
    skip,
    take,
    orderBy: { created_at: 'desc' },
    include: {
      pages: true, // pages 관계 포함
    },
  });
};

// 페이지 단일 조회
const page = async (_: any, { id }: { id: string }, context: Context) => {
  return prisma.page.findUnique({
    where: { id },
    include: {
      site: true, // site 관계 포함
    },
  });
};

// 사이트에 속한 페이지 목록 조회
const pages = async (_: any, { site_id }: { site_id: string }, context: Context) => {
  return prisma.page.findMany({
    where: { site_id },
    include: {
      site: true, // site 관계 포함
    },
  });
};

// 사이트 생성
const createSite = async (_: any, { input }: { input: any }, context: Context) => {
  // 권한 체크 로직 필요 (관리자만 사이트를 생성할 수 있음)
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }
  
  const newSite = await prisma.site.create({
    data: {
      domain: input.domain,
      name: input.name,
      description: input.description,
      is_active: input.is_active !== undefined ? input.is_active : true,
      settings: input.settings || {},
    },
  });
  
  return newSite;
};

// 사이트 수정
const updateSite = async (_: any, { id, input }: { id: string; input: any }, context: Context) => {
  // 권한 체크 로직 필요 (관리자만 사이트를 수정할 수 있음)
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }
  
  return prisma.site.update({
    where: { id },
    data: {
      domain: input.domain,
      name: input.name,
      description: input.description,
      is_active: input.is_active,
      settings: input.settings,
    },
  });
};

// 사이트 삭제
const deleteSite = async (_: any, { id }: { id: string }, context: Context) => {
  // 권한 체크 로직 필요 (관리자만 사이트를 삭제할 수 있음)
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }
  
  await prisma.site.delete({
    where: { id },
  });
  
  return true;
};

// 페이지 생성
const createPage = async (_: any, { input }: { input: any }, context: Context) => {
  // 권한 체크 로직 필요 (관리자만 페이지를 생성할 수 있음)
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }
  
  return prisma.page.create({
    data: {
      site_id: input.site_id,
      path: input.path,
      name: input.name,
      description: input.description,
      metadata: input.metadata || {},
    },
    include: {
      site: true,
    },
  });
};

// 페이지 수정
const updatePage = async (_: any, { id, input }: { id: string; input: any }, context: Context) => {
  // 권한 체크 로직 필요 (관리자만 페이지를 수정할 수 있음)
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }
  
  return prisma.page.update({
    where: { id },
    data: {
      path: input.path,
      name: input.name,
      description: input.description,
      metadata: input.metadata,
    },
    include: {
      site: true,
    },
  });
};

// 페이지 삭제
const deletePage = async (_: any, { id }: { id: string }, context: Context) => {
  // 권한 체크 로직 필요 (관리자만 페이지를 삭제할 수 있음)
  if (!context.user) {
    throw new Error('인증이 필요합니다.');
  }
  
  await prisma.page.delete({
    where: { id },
  });
  
  return true;
};

export {
  site,
  sites,
  page,
  pages,
  createSite,
  updateSite,
  deleteSite,
  createPage,
  updatePage,
  deletePage,
}; 