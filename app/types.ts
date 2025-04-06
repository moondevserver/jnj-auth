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
  refresh_token: string;
  user: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    profile_image?: string | null;
  };
};

export type LoginInput = {
  email: string;
  password: string;
  site_domain?: string;
  page_path?: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  site_domain?: string;
  page_path?: string;
};

export type SocialAuthInput = {
  provider: string;
  auth_code: string;
  site_domain?: string;
  page_path?: string;
};

export type RefreshTokenInput = {
  refresh_token: string;
};

// 사용자 관련 타입
export type UserUpdateInput = {
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  metadata?: Record<string, any>;
};

export type UserPasswordUpdateInput = {
  current_password: string;
  new_password: string;
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
  role_id: number;
  permission_id: number;
  site_id?: string;
  page_id?: string;
};

export type UserRoleInput = {
  user_id: string;
  role_id: number;
  site_id?: string;
};

// 사이트 및 페이지 관련 타입
export type SiteInput = {
  domain: string;
  name: string;
  description?: string;
  is_active?: boolean;
  settings?: Record<string, any>;
};

export type PageInput = {
  site_id: string;
  path: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}; 