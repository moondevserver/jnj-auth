import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import * as auth from './auth';
import * as user from './user';
import * as site from './site';
import * as role from './role';
import { permissionResolvers } from './permission';
import * as socialProvider from './social-provider';

// 리졸버 맵 정의
export const resolvers = {
  // 스칼라 타입 리졸버
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  // 쿼리 리졸버
  Query: {
    // 인증 관련 쿼리
    me: auth.me,
    
    // 사용자 관련 쿼리
    user: user.user,
    users: user.users,
    userCount: user.userCount,
    
    // 사이트 및 페이지 관련 쿼리
    site: site.site,
    sites: site.sites,
    page: site.page,
    pages: site.pages,
    
    // 역할 관련 쿼리
    role: role.role,
    roles: role.roles,

    // 권한 관련 쿼리
    ...permissionResolvers.Query,

    // 소셜 프로바이더 관련 쿼리
    socialProvider: socialProvider.socialProvider,
    socialProviders: socialProvider.socialProviders,
  },

  // 뮤테이션 리졸버
  Mutation: {
    // 인증 관련 뮤테이션
    login: auth.login,
    register: auth.register,
    socialAuth: auth.socialAuth,
    refreshToken: auth.refreshToken,
    logout: auth.logout,
    
    // 사용자 관련 뮤테이션
    createUser: user.createUser,
    updateUser: user.updateUser,
    updatePassword: user.updatePassword,
    deleteUser: user.deleteUser,
    connectSocialAccount: user.connectSocialAccount,
    disconnectSocialAccount: user.disconnectSocialAccount,
    
    // 사이트 및 페이지 관련 뮤테이션
    createSite: site.createSite,
    updateSite: site.updateSite,
    deleteSite: site.deleteSite,
    createPage: site.createPage,
    updatePage: site.updatePage,
    deletePage: site.deletePage,
    
    // 역할 관련 뮤테이션
    createRole: role.createRole,
    updateRole: role.updateRole,
    deleteRole: role.deleteRole,

    // 권한 관련 뮤테이션
    ...permissionResolvers.Mutation,

    // 소셜 프로바이더 관련 뮤테이션
    createSocialProvider: socialProvider.createSocialProvider,
    updateSocialProvider: socialProvider.updateSocialProvider,
    deleteSocialProvider: socialProvider.deleteSocialProvider,
  },
}; 