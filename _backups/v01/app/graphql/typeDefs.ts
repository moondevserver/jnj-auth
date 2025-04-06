export const typeDefs = `#graphql
  # 스칼라 타입
  scalar DateTime
  scalar JSON

  # 인증 관련 타입
  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  # 사용자 관련 타입
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    profileImage: String
    createdAt: DateTime!
    updatedAt: DateTime!
    isActive: Boolean!
    metadata: JSON
    socialConnections: [UserSocialConnection!]
    userRoles: [UserRole!]
  }

  type UserSocialConnection {
    id: ID!
    provider: SocialProvider!
    providerUserId: String!
    createdAt: DateTime!
    lastUsedAt: DateTime
  }

  type SocialProvider {
    id: ID!
    name: String!
    description: String
    isActive: Boolean!
  }

  # 권한 관련 타입
  type Role {
    id: ID!
    name: String!
    description: String
    site: Site
    permissions: [Permission!]
  }

  type Permission {
    id: ID!
    code: String!
    name: String!
    description: String
  }

  type UserRole {
    user: User!
    role: Role!
    site: Site
    createdAt: DateTime!
  }

  # 사이트 및 페이지 관련 타입
  type Site {
    id: ID!
    domain: String!
    name: String!
    description: String
    isActive: Boolean!
    settings: JSON
    createdAt: DateTime!
    pages: [Page!]
  }

  type Page {
    id: ID!
    site: Site!
    path: String!
    name: String!
    description: String
    metadata: JSON
  }

  type RolePermission {
    role: Role!
    permission: Permission!
    site: Site
    page: Page
  }

  # 세션 및 감사 로그 타입
  type Session {
    id: ID!
    user: User!
    token: String!
    expiresAt: DateTime!
    ipAddress: String
    userAgent: String
    createdAt: DateTime!
    lastActiveAt: DateTime!
  }

  type AuditLog {
    id: ID!
    user: User
    action: String!
    timestamp: DateTime!
    ipAddress: String
    details: JSON
  }

  # 입력 타입
  input LoginInput {
    email: String!
    password: String!
    siteDomain: String
    pagePath: String
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String
    lastName: String
    siteDomain: String
    pagePath: String
  }

  input CreateUserInput {
    email: String!
    password: String
    firstName: String
    lastName: String
    isActive: Boolean
    metadata: JSON
  }

  input SocialAuthInput {
    provider: String!
    authCode: String!
    siteDomain: String
    pagePath: String
  }

  input UserUpdateInput {
    firstName: String
    lastName: String
    profileImage: String
    metadata: JSON
  }

  input UserPasswordUpdateInput {
    currentPassword: String!
    newPassword: String!
  }

  input RoleInput {
    name: String!
    description: String
    site_id: ID
  }

  input PermissionInput {
    code: String!
    name: String!
    description: String
  }

  input RolePermissionInput {
    roleId: ID!
    permissionId: ID!
    site_id: ID
    pageId: ID
  }

  input UserRoleInput {
    userId: ID!
    roleId: ID!
    site_id: ID
  }

  input SiteInput {
    domain: String!
    name: String!
    description: String
    isActive: Boolean
    settings: JSON
  }

  input PageInput {
    site_id: ID!
    path: String!
    name: String!
    description: String
    metadata: JSON
  }

  # 쿼리 타입
  type Query {
    # 인증 관련 쿼리
    me: User
    
    # 사용자 관련 쿼리
    user(id: ID!): User
    users(skip: Int, take: Int): [User!]!
    userCount: Int!
    
    # 소셜 인증 관련 쿼리
    socialProviders: [SocialProvider!]!
    
    # 권한 관련 쿼리
    role(id: ID!): Role
    roles(site_id: ID): [Role!]!
    permission(id: ID!): Permission
    permissions: [Permission!]!
    rolePermissions(roleId: ID, site_id: ID, pageId: ID): [RolePermission!]!
    userRoles(userId: ID, site_id: ID): [UserRole!]!
    
    # 사이트 및 페이지 관련 쿼리
    site(id: ID, domain: String): Site
    sites(skip: Int, take: Int): [Site!]!
    page(id: ID!): Page
    pages(site_id: ID!): [Page!]!
    
    # 권한 확인 쿼리
    checkPermission(permissionCode: String!, siteDomain: String, pagePath: String): Boolean!
    
    # 세션 및 감사 로그 관련 쿼리
    sessions(userId: ID!): [Session!]!
    auditLogs(userId: ID, action: String, skip: Int, take: Int): [AuditLog!]!
  }

  # 뮤테이션 타입
  type Mutation {
    # 인증 관련 뮤테이션
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    socialAuth(input: SocialAuthInput!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!
    logout: Boolean!
    
    # 사용자 관련 뮤테이션
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UserUpdateInput!): User!
    updatePassword(input: UserPasswordUpdateInput!): Boolean!
    deleteUser(id: ID!): Boolean!
    
    # 소셜 인증 관련 뮤테이션
    connectSocialAccount(provider: String!, authCode: String!): UserSocialConnection!
    disconnectSocialAccount(id: ID!): Boolean!
    
    # 권한 관련 뮤테이션
    createRole(input: RoleInput!): Role!
    updateRole(id: ID!, input: RoleInput!): Role!
    deleteRole(id: ID!): Boolean!
    createPermission(input: PermissionInput!): Permission!
    updatePermission(id: ID!, input: PermissionInput!): Permission!
    deletePermission(id: ID!): Boolean!
    addRolePermission(input: RolePermissionInput!): RolePermission!
    removeRolePermission(roleId: ID!, permissionId: ID!, site_id: ID, pageId: ID): Boolean!
    assignUserRole(input: UserRoleInput!): UserRole!
    removeUserRole(userId: ID!, roleId: ID!, site_id: ID): Boolean!
    
    # 사이트 및 페이지 관련 뮤테이션
    createSite(input: SiteInput!): Site!
    updateSite(id: ID!, input: SiteInput!): Site!
    deleteSite(id: ID!): Boolean!
    createPage(input: PageInput!): Page!
    updatePage(id: ID!, input: PageInput!): Page!
    deletePage(id: ID!): Boolean!
  }
`; 