// GraphQL 요청 컨텍스트 타입
export type Context = {
  user?: {
    id: string;
    email: string;
  };
  token?: string;
  req: any;
  res: any;
};

// 인증 관련 타입
export type AuthPayload = {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    profileImage?: string | null;
  };
};

export type LoginInput = {
  email: string;
  password: string;
  siteDomain?: string;
  pagePath?: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  siteDomain?: string;
  pagePath?: string;
};

export type SocialAuthInput = {
  provider: string;
  authCode: string;
  siteDomain?: string;
  pagePath?: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

// 사용자 관련 타입
export type UserUpdateInput = {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  metadata?: Record<string, any>;
};

export type UserPasswordUpdateInput = {
  currentPassword: string;
  newPassword: string;
};

// 권한 관련 타입
export type RoleInput = {
  name: string;
  description?: string;
  site_id?: string;
};

export type PermissionInput = {
  code: string;
  name: string;
  description?: string;
};

export type RolePermissionInput = {
  roleId: number;
  permissionId: number;
  site_id?: string;
  pageId?: string;
};

export type UserRoleInput = {
  userId: string;
  roleId: number;
  site_id?: string;
};

// 사이트 및 페이지 관련 타입
export type SiteInput = {
  domain: string;
  name: string;
  description?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
};

export type PageInput = {
  site_id: string;
  path: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}; 