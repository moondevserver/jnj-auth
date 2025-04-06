// seed.js - 테스트용 목업 데이터 생성 스크립트
const { PrismaClient } = require('@prisma/client');
const { hashSync } = require('bcryptjs');

// Prisma 클라이언트 초기화
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

/**
 * 테스트용 목업 데이터 생성 함수
 */
async function seedData() {
  try {
    console.log('목업 데이터 생성을 시작합니다...');

    // 1. SocialProvider 데이터 생성
    console.log('소셜 로그인 제공자 생성 중...');
    const socialProviders = await createSocialProviders();
    
    // 2. Permission 데이터 생성
    console.log('권한 데이터 생성 중...');
    const permissions = await createPermissions();
    
    // 3. Role 데이터 생성
    console.log('역할 데이터 생성 중...');
    const roles = await createRoles();
    
    // 4. RolePermission 연결
    console.log('역할-권한 연결 중...');
    await connectRolePermissions(roles, permissions);
    
    // 5. Site 데이터 생성
    console.log('사이트 데이터 생성 중...');
    const sites = await createSites();
    
    // 6. Page 데이터 생성
    console.log('페이지 데이터 생성 중...');
    const pages = await createPages(sites);
    
    // 7. User 데이터 생성 (관리자 및 일반 사용자)
    console.log('사용자 데이터 생성 중...');
    const users = await createUsers();
    
    // 8. UserRole 연결
    console.log('사용자-역할 연결 중...');
    await connectUserRoles(users, roles, sites);
    
    // 9. UserSocialConnection 데이터 생성
    console.log('사용자-소셜 연결 생성 중...');
    await createUserSocialConnections(users, socialProviders);
    
    // 10. AuditLog 데이터 생성
    console.log('감사 로그 데이터 생성 중...');
    await createAuditLogs(users);
    
    console.log('목업 데이터 생성이 완료되었습니다!');
  } catch (error) {
    console.error('목업 데이터 생성 중 오류가 발생했습니다:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * SocialProvider 데이터 생성
 */
async function createSocialProviders() {
  try {
    // 기존 데이터 삭제
    await prisma.$executeRaw`TRUNCATE "social_providers" CASCADE`;
    
    // 소셜 제공자 데이터 생성 - SQL 직접 실행
    await prisma.$executeRaw`
      INSERT INTO "social_providers" ("name", "description") VALUES
      ('google', 'Google 로그인'),
      ('naver', '네이버 로그인'),
      ('kakao', '카카오 로그인'),
      ('apple', 'Apple 로그인'),
      ('github', 'GitHub 로그인')
    `;
    
    // findMany 대신 raw 쿼리 사용
    const socialProviders = await prisma.$queryRaw`
      SELECT id, name, description FROM "social_providers"
    `;
    
    return socialProviders;
  } catch (error) {
    console.error('소셜 제공자 생성 중 오류:', error);
    throw error;
  }
}

/**
 * Permission 데이터 생성
 */
async function createPermissions() {
  try {
    // 기존 데이터 삭제
    await prisma.$executeRaw`TRUNCATE "permissions" CASCADE`;
    
    // 권한 데이터 생성 - 개별 생성
    const permissionData = [
      { code: 'USER_VIEW', name: '사용자 조회', description: '사용자 정보 조회 권한' },
      { code: 'USER_CREATE', name: '사용자 생성', description: '사용자 생성 권한' },
      { code: 'USER_UPDATE', name: '사용자 수정', description: '사용자 정보 수정 권한' },
      { code: 'USER_DELETE', name: '사용자 삭제', description: '사용자 삭제 권한' },
      { code: 'ROLE_VIEW', name: '역할 조회', description: '역할 조회 권한' },
      { code: 'ROLE_CREATE', name: '역할 생성', description: '역할 생성 권한' },
      { code: 'ROLE_UPDATE', name: '역할 수정', description: '역할 수정 권한' },
      { code: 'ROLE_DELETE', name: '역할 삭제', description: '역할 삭제 권한' },
      { code: 'PERMISSION_VIEW', name: '권한 조회', description: '권한 조회 권한' },
      { code: 'PERMISSION_MANAGE', name: '권한 관리', description: '권한 관리 권한' },
      { code: 'SITE_VIEW', name: '사이트 조회', description: '사이트 조회 권한' },
      { code: 'SITE_MANAGE', name: '사이트 관리', description: '사이트 관리 권한' },
      { code: 'PAGE_VIEW', name: '페이지 조회', description: '페이지 조회 권한' },
      { code: 'PAGE_MANAGE', name: '페이지 관리', description: '페이지 관리 권한' },
      { code: 'AUDIT_VIEW', name: '감사 로그 조회', description: '감사 로그 조회 권한' },
    ];
    
    for (const perm of permissionData) {
      await prisma.$executeRaw`
        INSERT INTO "permissions" ("code", "name", "description") 
        VALUES (${perm.code}, ${perm.name}, ${perm.description})
      `;
    }
    
    // findMany 대신 raw 쿼리 사용
    const permissions = await prisma.$queryRaw`
      SELECT id, code, name, description FROM "permissions"
    `;
    
    return permissions;
  } catch (error) {
    console.error('권한 생성 중 오류:', error);
    throw error;
  }
}

/**
 * Role 데이터 생성
 */
async function createRoles() {
  try {
    // 기존 데이터 삭제
    await prisma.$executeRaw`TRUNCATE "user_roles" CASCADE`;
    await prisma.$executeRaw`TRUNCATE "role_permissions" CASCADE`;
    await prisma.$executeRaw`TRUNCATE "roles" CASCADE`;
    
    // 역할 데이터 생성 - SQL 직접 실행
    await prisma.$executeRaw`
      INSERT INTO "roles" ("name", "description", "site_id") VALUES
      ('admin', '시스템 관리자', NULL),
      ('user', '일반 사용자', NULL),
      ('editor', '콘텐츠 편집자', NULL),
      ('viewer', '콘텐츠 조회자', NULL)
    `;
    
    // findMany 대신 raw 쿼리 사용
    const roles = await prisma.$queryRaw`
      SELECT id, name, description, site_id FROM "roles"
    `;
    
    return roles;
  } catch (error) {
    console.error('역할 생성 중 오류:', error);
    throw error;
  }
}

/**
 * RolePermission 연결
 */
async function connectRolePermissions(roles, permissions) {
  try {
    const adminRole = roles.find(role => role.name === 'admin');
    const userRole = roles.find(role => role.name === 'user');
    const editorRole = roles.find(role => role.name === 'editor');
    const viewerRole = roles.find(role => role.name === 'viewer');
    
    // 관리자 역할에 모든 권한 부여
    for (const permission of permissions) {
      await prisma.$executeRaw`
        INSERT INTO "role_permissions" ("role_id", "permission_id", "site_id") 
        VALUES (${adminRole.id}, ${permission.id}, NULL)
      `;
    }
    
    // 일반 사용자 역할에 기본 권한 부여
    const userPermissions = permissions.filter(p => 
      ['USER_VIEW', 'SITE_VIEW', 'PAGE_VIEW'].includes(p.code)
    );
    
    for (const permission of userPermissions) {
      await prisma.$executeRaw`
        INSERT INTO "role_permissions" ("role_id", "permission_id", "site_id") 
        VALUES (${userRole.id}, ${permission.id}, NULL)
      `;
    }
    
    // 에디터 역할에 권한 부여
    const editorPermissions = permissions.filter(p => 
      ['USER_VIEW', 'SITE_VIEW', 'PAGE_VIEW', 'PAGE_MANAGE'].includes(p.code)
    );
    
    for (const permission of editorPermissions) {
      await prisma.$executeRaw`
        INSERT INTO "role_permissions" ("role_id", "permission_id", "site_id") 
        VALUES (${editorRole.id}, ${permission.id}, NULL)
      `;
    }
    
    // 뷰어 역할에 조회 권한만 부여
    const viewerPermissions = permissions.filter(p => 
      p.code.endsWith('_VIEW')
    );
    
    for (const permission of viewerPermissions) {
      await prisma.$executeRaw`
        INSERT INTO "role_permissions" ("role_id", "permission_id", "site_id") 
        VALUES (${viewerRole.id}, ${permission.id}, NULL)
      `;
    }
  } catch (error) {
    console.error('역할-권한 연결 중 오류:', error);
    throw error;
  }
}

/**
 * Site 데이터 생성
 */
async function createSites() {
  try {
    // 기존 데이터 삭제
    await prisma.$executeRaw`TRUNCATE "pages" CASCADE`;
    await prisma.$executeRaw`TRUNCATE "sites" CASCADE`;
    
    // 사이트 데이터 생성 - SQL 직접 실행
    await prisma.$executeRaw`
      INSERT INTO "sites" ("domain", "name", "description", "is_active", "settings") VALUES
      ('video.vastwhite.com', '비디오 포털', '비디오 스트리밍 서비스', TRUE, '{"theme": "dark", "features": ["comments", "recommendations"]}'),
      ('auth.vastwhite.com', '인증 포털', '사용자 인증 및 권한 관리 서비스', TRUE, '{"theme": "light", "features": ["profile", "security"]}'),
      ('admin.vastwhite.com', '관리자 포털', '시스템 관리 서비스', TRUE, '{"theme": "system", "features": ["dashboard", "logs", "users"]}')
    `;
    
    // findMany 대신 raw 쿼리 사용
    const sites = await prisma.$queryRaw`
      SELECT id, domain, name, description, is_active, settings FROM "sites"
    `;
    
    return sites;
  } catch (error) {
    console.error('사이트 생성 중 오류:', error);
    throw error;
  }
}

/**
 * Page 데이터 생성
 */
async function createPages(sites) {
  try {
    const videoSite = sites.find(site => site.domain === 'video.vastwhite.com');
    const authSite = sites.find(site => site.domain === 'auth.vastwhite.com');
    const adminSite = sites.find(site => site.domain === 'admin.vastwhite.com');
    
    // 비디오 포털 페이지
    const videoPages = [
      { path: '/', name: '메인 페이지', description: '비디오 포털 메인 페이지', metadata: { accessLevel: 'public' } },
      { path: '/videos', name: '비디오 목록', description: '모든 비디오 목록', metadata: { accessLevel: 'public' } },
      { path: '/videos/:id', name: '비디오 상세', description: '비디오 상세 페이지', metadata: { accessLevel: 'public' } },
      { path: '/categories', name: '카테고리', description: '비디오 카테고리 목록', metadata: { accessLevel: 'public' } },
      { path: '/profile', name: '프로필', description: '사용자 프로필 페이지', metadata: { accessLevel: 'private' } },
    ];
    
    // 인증 포털 페이지
    const authPages = [
      { path: '/', name: '메인 페이지', description: '인증 포털 메인 페이지', metadata: { accessLevel: 'public' } },
      { path: '/login', name: '로그인', description: '로그인 페이지', metadata: { accessLevel: 'public' } },
      { path: '/register', name: '회원가입', description: '회원가입 페이지', metadata: { accessLevel: 'public' } },
      { path: '/profile', name: '프로필', description: '사용자 프로필 페이지', metadata: { accessLevel: 'private' } },
      { path: '/security', name: '보안 설정', description: '보안 설정 페이지', metadata: { accessLevel: 'private' } },
    ];
    
    // 관리자 포털 페이지
    const adminPages = [
      { path: '/', name: '대시보드', description: '관리자 대시보드', metadata: { accessLevel: 'admin' } },
      { path: '/users', name: '사용자 관리', description: '사용자 관리 페이지', metadata: { accessLevel: 'admin' } },
      { path: '/roles', name: '역할 관리', description: '역할 관리 페이지', metadata: { accessLevel: 'admin' } },
      { path: '/permissions', name: '권한 관리', description: '권한 관리 페이지', metadata: { accessLevel: 'admin' } },
      { path: '/sites', name: '사이트 관리', description: '사이트 관리 페이지', metadata: { accessLevel: 'admin' } },
      { path: '/logs', name: '로그 관리', description: '로그 관리 페이지', metadata: { accessLevel: 'admin' } },
    ];
    
    // 페이지 데이터 생성 - 직접 SQL 사용
    if (videoSite) {
      for (const page of videoPages) {
        await prisma.$executeRaw`
          INSERT INTO "pages" ("site_id", "path", "name", "description", "metadata") 
          VALUES (${videoSite.id}::uuid, ${page.path}, ${page.name}, ${page.description}, ${page.metadata})
        `;
      }
    }
    
    if (authSite) {
      for (const page of authPages) {
        await prisma.$executeRaw`
          INSERT INTO "pages" ("site_id", "path", "name", "description", "metadata") 
          VALUES (${authSite.id}::uuid, ${page.path}, ${page.name}, ${page.description}, ${page.metadata})
        `;
      }
    }
    
    if (adminSite) {
      for (const page of adminPages) {
        await prisma.$executeRaw`
          INSERT INTO "pages" ("site_id", "path", "name", "description", "metadata") 
          VALUES (${adminSite.id}::uuid, ${page.path}, ${page.name}, ${page.description}, ${page.metadata})
        `;
      }
    }
    
    // findMany 대신 raw 쿼리 사용
    const pages = await prisma.$queryRaw`
      SELECT id, site_id, path, name, description, metadata FROM "pages"
    `;
    
    return pages;
  } catch (error) {
    console.error('페이지 생성 중 오류:', error);
    throw error;
  }
}

/**
 * User 데이터 생성
 */
async function createUsers() {
  try {
    // 기존 사용자 데이터 삭제
    await prisma.$executeRaw`TRUNCATE "user_social_connections" CASCADE`;
    await prisma.$executeRaw`TRUNCATE "sessions" CASCADE`;
    await prisma.$executeRaw`TRUNCATE "audit_logs" CASCADE`;
    await prisma.$executeRaw`TRUNCATE "users" CASCADE`;
    
    // 비밀번호 해싱
    const passwordHash = hashSync('Password123!', 10);
    
    // 사용자 데이터 생성 - SQL 직접 실행
    await prisma.$executeRaw`
      INSERT INTO "users" ("email", "password_hash", "first_name", "last_name", "is_active", "profile_image", "metadata") 
      VALUES 
      ('admin@example.com', ${passwordHash}, '관리자', '김', TRUE, 'https://randomuser.me/api/portraits/men/1.jpg', '{"role": "admin", "department": "시스템관리팀"}'),
      ('user1@example.com', ${passwordHash}, '사용자1', '이', TRUE, 'https://randomuser.me/api/portraits/women/1.jpg', '{"role": "user", "department": "마케팅팀"}'),
      ('user2@example.com', ${passwordHash}, '사용자2', '박', TRUE, 'https://randomuser.me/api/portraits/men/2.jpg', '{"role": "user", "department": "개발팀"}'),
      ('editor@example.com', ${passwordHash}, '에디터', '최', TRUE, 'https://randomuser.me/api/portraits/women/2.jpg', '{"role": "editor", "department": "콘텐츠팀"}'),
      ('viewer@example.com', ${passwordHash}, '뷰어', '정', TRUE, 'https://randomuser.me/api/portraits/men/3.jpg', '{"role": "viewer", "department": "인사팀"}')
    `;
    
    // findMany 대신 raw 쿼리 사용
    const users = await prisma.$queryRaw`
      SELECT id, email, first_name, last_name, is_active, profile_image, metadata FROM "users"
    `;
    
    return users;
  } catch (error) {
    console.error('사용자 생성 중 오류:', error);
    throw error;
  }
}

/**
 * UserRole 연결
 */
async function connectUserRoles(users, roles, sites) {
  try {
    const adminUser = users.find(user => user.email === 'admin@example.com');
    const regularUser1 = users.find(user => user.email === 'user1@example.com');
    const regularUser2 = users.find(user => user.email === 'user2@example.com');
    const editorUser = users.find(user => user.email === 'editor@example.com');
    const viewerUser = users.find(user => user.email === 'viewer@example.com');
    
    // 데이터베이스에서 역할 ID를 직접 조회
    const dbRoles = await prisma.$queryRaw`SELECT id, name FROM roles`;
    console.log('데이터베이스 역할:', dbRoles);
    
    // 역할이 없으면 다시 생성
    if (dbRoles.length === 0) {
      console.log('역할이 없어서 재생성합니다.');
      await prisma.$executeRaw`
        INSERT INTO "roles" ("name", "description", "site_id") VALUES
        ('admin', '시스템 관리자', NULL),
        ('user', '일반 사용자', NULL),
        ('editor', '콘텐츠 편집자', NULL),
        ('viewer', '콘텐츠 조회자', NULL)
      `;
      
      // 다시 조회
      const newRoles = await prisma.$queryRaw`SELECT id, name FROM roles`;
      console.log('새로 생성된 역할:', newRoles);
      
      const adminRoleDb = newRoles.find(role => role.name === 'admin');
      const userRoleDb = newRoles.find(role => role.name === 'user');
      const editorRoleDb = newRoles.find(role => role.name === 'editor');
      const viewerRoleDb = newRoles.find(role => role.name === 'viewer');
      
      if (!adminRoleDb || !userRoleDb || !editorRoleDb || !viewerRoleDb) {
        console.error('역할을 생성했지만 찾을 수 없습니다.');
        return;
      }
      
      // 관리자에게 admin 역할 부여
      if (adminUser && adminRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${adminUser.id}::uuid, ${adminRoleDb.id})
        `;
      }
      
      // 일반 사용자에게 user 역할 부여
      if (regularUser1 && userRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${regularUser1.id}::uuid, ${userRoleDb.id})
        `;
      }
      
      if (regularUser2 && userRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${regularUser2.id}::uuid, ${userRoleDb.id})
        `;
      }
      
      // 에디터에게 editor 역할 부여
      if (editorUser && editorRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${editorUser.id}::uuid, ${editorRoleDb.id})
        `;
      }
      
      // 뷰어에게 viewer 역할 부여
      if (viewerUser && viewerRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${viewerUser.id}::uuid, ${viewerRoleDb.id})
        `;
      }
    } else {
      const adminRoleDb = dbRoles.find(role => role.name === 'admin');
      const userRoleDb = dbRoles.find(role => role.name === 'user');
      const editorRoleDb = dbRoles.find(role => role.name === 'editor');
      const viewerRoleDb = dbRoles.find(role => role.name === 'viewer');
      
      if (!adminRoleDb || !userRoleDb || !editorRoleDb || !viewerRoleDb) {
        console.error('역할을 찾을 수 없습니다. 먼저 역할을 생성하세요.');
        return;
      }
      
      // 관리자에게 admin 역할 부여
      if (adminUser && adminRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${adminUser.id}::uuid, ${adminRoleDb.id})
        `;
      }
      
      // 일반 사용자에게 user 역할 부여
      if (regularUser1 && userRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${regularUser1.id}::uuid, ${userRoleDb.id})
        `;
      }
      
      if (regularUser2 && userRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${regularUser2.id}::uuid, ${userRoleDb.id})
        `;
      }
      
      // 에디터에게 editor 역할 부여
      if (editorUser && editorRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${editorUser.id}::uuid, ${editorRoleDb.id})
        `;
      }
      
      // 뷰어에게 viewer 역할 부여
      if (viewerUser && viewerRoleDb) {
        await prisma.$executeRaw`
          INSERT INTO "user_roles" ("user_id", "role_id") 
          VALUES (${viewerUser.id}::uuid, ${viewerRoleDb.id})
        `;
      }
    }
  } catch (error) {
    console.error('사용자-역할 연결 중 오류:', error);
    throw error;
  }
}

/**
 * UserSocialConnection 데이터 생성
 */
async function createUserSocialConnections(users, socialProviders) {
  try {
    const regularUser = users.find(user => user.email === 'user1@example.com');
    const googleProvider = socialProviders.find(provider => provider.name === 'google');
    const naverProvider = socialProviders.find(provider => provider.name === 'naver');
    
    if (regularUser && googleProvider) {
      // Google 연결 생성
      await prisma.$executeRaw`
        INSERT INTO "user_social_connections" ("user_id", "provider_id", "provider_user_id", "auth_data") 
        VALUES (${regularUser.id}::uuid, ${googleProvider.id}, 'google_12345', '{"token": "mock_google_token"}')
      `;
    }
    
    if (regularUser && naverProvider) {
      // Naver 연결 생성
      await prisma.$executeRaw`
        INSERT INTO "user_social_connections" ("user_id", "provider_id", "provider_user_id", "auth_data") 
        VALUES (${regularUser.id}::uuid, ${naverProvider.id}, 'naver_12345', '{"token": "mock_naver_token"}')
      `;
    }
  } catch (error) {
    console.error('사용자-소셜 연결 생성 중 오류:', error);
    throw error;
  }
}

/**
 * AuditLog 데이터 생성
 */
async function createAuditLogs(users) {
  try {
    const adminUser = users.find(user => user.email === 'admin@example.com');
    const regularUser = users.find(user => user.email === 'user1@example.com');
    
    if (!adminUser || !regularUser) {
      console.log('감사 로그 생성을 위한 사용자를 찾을 수 없습니다.');
      return;
    }
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // 관리자 활동 로그
    await prisma.$executeRaw`
      INSERT INTO "audit_logs" ("user_id", "action", "timestamp", "ip_address", "details") 
      VALUES (${adminUser.id}::uuid, 'USER_CREATE', ${threeDaysAgo}, '192.168.1.1', '{"targetUserId": "${regularUser.id}"}')
    `;
    
    await prisma.$executeRaw`
      INSERT INTO "audit_logs" ("user_id", "action", "timestamp", "ip_address", "details") 
      VALUES (${adminUser.id}::uuid, 'ROLE_ASSIGN', ${threeDaysAgo}, '192.168.1.1', '{"userId": "${regularUser.id}", "role": "user"}')
    `;
    
    await prisma.$executeRaw`
      INSERT INTO "audit_logs" ("user_id", "action", "timestamp", "ip_address", "details") 
      VALUES (${adminUser.id}::uuid, 'SITE_CREATE', ${twoDaysAgo}, '192.168.1.1', '{"domain": "video.vastwhite.com"}')
    `;
    
    // 일반 사용자 활동 로그
    await prisma.$executeRaw`
      INSERT INTO "audit_logs" ("user_id", "action", "timestamp", "ip_address", "details") 
      VALUES (${regularUser.id}::uuid, 'LOGIN', ${yesterday}, '192.168.1.2', '{"method": "password"}')
    `;
    
    await prisma.$executeRaw`
      INSERT INTO "audit_logs" ("user_id", "action", "timestamp", "ip_address", "details") 
      VALUES (${regularUser.id}::uuid, 'PROFILE_UPDATE', ${yesterday}, '192.168.1.2', '{"fields": ["first_name", "last_name"]}')
    `;
    
    await prisma.$executeRaw`
      INSERT INTO "audit_logs" ("user_id", "action", "timestamp", "ip_address", "details") 
      VALUES (${regularUser.id}::uuid, 'SOCIAL_CONNECT', ${now}, '192.168.1.2', '{"provider": "google"}')
    `;
  } catch (error) {
    console.error('감사 로그 생성 중 오류:', error);
    throw error;
  }
}

// 스크립트 실행
seedData().catch(e => {
  console.error(e);
  process.exit(1);
}); 