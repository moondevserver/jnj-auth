-- seed.sql - 테스트용 목업 데이터 생성 SQL 스크립트

-- 트랜잭션 시작
BEGIN;

-- 변수 선언
DO $$
DECLARE
  admin_id UUID;
  user1_id UUID;
  user2_id UUID;
  editor_id UUID;
  viewer_id UUID;
  
  admin_role_id INTEGER;
  user_role_id INTEGER;
  editor_role_id INTEGER;
  viewer_role_id INTEGER;
  
  google_provider_id INTEGER;
  naver_provider_id INTEGER;
  kakao_provider_id INTEGER;
  
  video_site_id UUID;
  auth_site_id UUID;
  admin_site_id UUID;
BEGIN
  -- 기존 데이터 삭제
  TRUNCATE "user_social_connections" CASCADE;
  TRUNCATE "sessions" CASCADE;
  TRUNCATE "audit_logs" CASCADE;
  TRUNCATE "user_roles" CASCADE;
  TRUNCATE "role_permissions" CASCADE;
  TRUNCATE "permissions" CASCADE;
  TRUNCATE "roles" CASCADE;
  TRUNCATE "pages" CASCADE;
  TRUNCATE "sites" CASCADE;
  TRUNCATE "social_providers" CASCADE;
  TRUNCATE "users" CASCADE;
  
  -- 시퀀스 초기화
  ALTER SEQUENCE "permissions_id_seq" RESTART WITH 1;
  ALTER SEQUENCE "roles_id_seq" RESTART WITH 1;
  ALTER SEQUENCE "social_providers_id_seq" RESTART WITH 1;
  
  -- SocialProvider 데이터 생성
  INSERT INTO "social_providers" ("name", "description", "is_active") VALUES
    ('google', 'Google 로그인', true),
    ('naver', '네이버 로그인', true),
    ('kakao', '카카오 로그인', true),
    ('apple', 'Apple 로그인', true),
    ('github', 'GitHub 로그인', false);
  
  -- Provider ID 저장
  SELECT id INTO google_provider_id FROM "social_providers" WHERE "name" = 'google';
  SELECT id INTO naver_provider_id FROM "social_providers" WHERE "name" = 'naver';
  SELECT id INTO kakao_provider_id FROM "social_providers" WHERE "name" = 'kakao';
  
  -- Permission 데이터 생성
  INSERT INTO "permissions" ("code", "name", "description") VALUES
    ('USER_VIEW', '사용자 조회', '사용자 정보 조회 권한'),
    ('USER_CREATE', '사용자 생성', '사용자 생성 권한'),
    ('USER_UPDATE', '사용자 수정', '사용자 정보 수정 권한'),
    ('USER_DELETE', '사용자 삭제', '사용자 삭제 권한'),
    ('ROLE_VIEW', '역할 조회', '역할 조회 권한'),
    ('ROLE_CREATE', '역할 생성', '역할 생성 권한'),
    ('ROLE_UPDATE', '역할 수정', '역할 수정 권한'),
    ('ROLE_DELETE', '역할 삭제', '역할 삭제 권한'),
    ('PERMISSION_VIEW', '권한 조회', '권한 조회 권한'),
    ('PERMISSION_MANAGE', '권한 관리', '권한 관리 권한'),
    ('SITE_VIEW', '사이트 조회', '사이트 조회 권한'),
    ('SITE_MANAGE', '사이트 관리', '사이트 관리 권한'),
    ('PAGE_VIEW', '페이지 조회', '페이지 조회 권한'),
    ('PAGE_MANAGE', '페이지 관리', '페이지 관리 권한'),
    ('AUDIT_VIEW', '감사 로그 조회', '감사 로그 조회 권한');
  
  -- Role 데이터 생성
  INSERT INTO "roles" ("name", "description") VALUES
    ('admin', '시스템 관리자'),
    ('user', '일반 사용자'),
    ('editor', '콘텐츠 편집자'),
    ('viewer', '콘텐츠 조회자');
  
  SELECT id INTO admin_role_id FROM "roles" WHERE "name" = 'admin';
  SELECT id INTO user_role_id FROM "roles" WHERE "name" = 'user';
  SELECT id INTO editor_role_id FROM "roles" WHERE "name" = 'editor';
  SELECT id INTO viewer_role_id FROM "roles" WHERE "name" = 'viewer';
  
  -- RolePermission 연결 - 관리자 역할에 모든 권한 부여
  INSERT INTO "role_permissions" ("role_id", "permission_id")
  SELECT admin_role_id, id FROM "permissions";
  
  -- RolePermission 연결 - 일반 사용자 역할에 조회 권한 부여
  INSERT INTO "role_permissions" ("role_id", "permission_id")
  SELECT user_role_id, id FROM "permissions" 
  WHERE "code" IN ('USER_VIEW', 'SITE_VIEW', 'PAGE_VIEW');
  
  -- RolePermission 연결 - 에디터 역할에 조회 및 콘텐츠 관리 권한 부여
  INSERT INTO "role_permissions" ("role_id", "permission_id")
  SELECT editor_role_id, id FROM "permissions" 
  WHERE "code" IN ('USER_VIEW', 'SITE_VIEW', 'PAGE_VIEW', 'PAGE_MANAGE');
  
  -- RolePermission 연결 - 뷰어 역할에 조회 권한만 부여
  INSERT INTO "role_permissions" ("role_id", "permission_id")
  SELECT viewer_role_id, id FROM "permissions" 
  WHERE "code" LIKE '%\_VIEW';
  
  -- Site 데이터 생성
  INSERT INTO "sites" ("domain", "name", "description", "is_active", "settings") VALUES
    ('video.vastwhite.com', '비디오 포털', '비디오 스트리밍 서비스', true, '{"theme": "dark", "features": ["comments", "recommendations"]}'),
    ('auth.vastwhite.com', '인증 포털', '사용자 인증 및 권한 관리 서비스', true, '{"theme": "light", "features": ["profile", "security"]}'),
    ('admin.vastwhite.com', '관리자 포털', '시스템 관리 서비스', true, '{"theme": "system", "features": ["dashboard", "logs", "users"]}');
  
  SELECT id INTO video_site_id FROM "sites" WHERE "domain" = 'video.vastwhite.com';
  SELECT id INTO auth_site_id FROM "sites" WHERE "domain" = 'auth.vastwhite.com';
  SELECT id INTO admin_site_id FROM "sites" WHERE "domain" = 'admin.vastwhite.com';
  
  -- Page 데이터 생성 - 비디오 포털
  INSERT INTO "pages" ("site_id", "path", "name", "description", "metadata") VALUES
    (video_site_id, '/', '메인 페이지', '비디오 포털 메인 페이지', '{"accessLevel": "public"}'),
    (video_site_id, '/videos', '비디오 목록', '모든 비디오 목록', '{"accessLevel": "public"}'),
    (video_site_id, '/videos/:id', '비디오 상세', '비디오 상세 페이지', '{"accessLevel": "public"}'),
    (video_site_id, '/categories', '카테고리', '비디오 카테고리 목록', '{"accessLevel": "public"}'),
    (video_site_id, '/profile', '프로필', '사용자 프로필 페이지', '{"accessLevel": "user"}');
  
  -- Page 데이터 생성 - 인증 포털
  INSERT INTO "pages" ("site_id", "path", "name", "description", "metadata") VALUES
    (auth_site_id, '/', '메인 페이지', '인증 포털 메인 페이지', '{"accessLevel": "public"}'),
    (auth_site_id, '/login', '로그인', '로그인 페이지', '{"accessLevel": "public"}'),
    (auth_site_id, '/register', '회원가입', '회원가입 페이지', '{"accessLevel": "public"}'),
    (auth_site_id, '/profile', '프로필', '사용자 프로필 페이지', '{"accessLevel": "user"}'),
    (auth_site_id, '/security', '보안 설정', '보안 설정 페이지', '{"accessLevel": "user"}');
  
  -- Page 데이터 생성 - 관리자 포털
  INSERT INTO "pages" ("site_id", "path", "name", "description", "metadata") VALUES
    (admin_site_id, '/', '대시보드', '관리자 대시보드', '{"accessLevel": "admin"}'),
    (admin_site_id, '/users', '사용자 관리', '사용자 관리 페이지', '{"accessLevel": "admin"}'),
    (admin_site_id, '/roles', '역할 관리', '역할 관리 페이지', '{"accessLevel": "admin"}'),
    (admin_site_id, '/permissions', '권한 관리', '권한 관리 페이지', '{"accessLevel": "admin"}'),
    (admin_site_id, '/sites', '사이트 관리', '사이트 관리 페이지', '{"accessLevel": "admin"}'),
    (admin_site_id, '/logs', '로그 관리', '로그 관리 페이지', '{"accessLevel": "admin"}');
  
  -- User 데이터 생성
  INSERT INTO "users" ("email", "password_hash", "first_name", "last_name", "is_active", "profile_image", "metadata") VALUES
    ('admin@example.com', '$2a$10$JklYBKh.eoLlvp3Vf5ylh.rOkiPNdZ/YziWB16vqKZOt0wQ7u/ME2', '관리자', '김', true, 'https://randomuser.me/api/portraits/men/1.jpg', '{"role": "admin", "department": "시스템관리팀"}'),
    ('user1@example.com', '$2a$10$JklYBKh.eoLlvp3Vf5ylh.rOkiPNdZ/YziWB16vqKZOt0wQ7u/ME2', '사용자1', '이', true, 'https://randomuser.me/api/portraits/women/1.jpg', '{"role": "user", "department": "마케팅팀"}'),
    ('user2@example.com', '$2a$10$JklYBKh.eoLlvp3Vf5ylh.rOkiPNdZ/YziWB16vqKZOt0wQ7u/ME2', '사용자2', '박', true, 'https://randomuser.me/api/portraits/men/2.jpg', '{"role": "user", "department": "개발팀"}'),
    ('editor@example.com', '$2a$10$JklYBKh.eoLlvp3Vf5ylh.rOkiPNdZ/YziWB16vqKZOt0wQ7u/ME2', '에디터', '최', true, 'https://randomuser.me/api/portraits/women/2.jpg', '{"role": "editor", "department": "콘텐츠팀"}'),
    ('viewer@example.com', '$2a$10$JklYBKh.eoLlvp3Vf5ylh.rOkiPNdZ/YziWB16vqKZOt0wQ7u/ME2', '뷰어', '정', true, 'https://randomuser.me/api/portraits/men/3.jpg', '{"role": "viewer", "department": "인사팀"}');
  
  -- User ID 저장
  SELECT id INTO admin_id FROM "users" WHERE "email" = 'admin@example.com';
  SELECT id INTO user1_id FROM "users" WHERE "email" = 'user1@example.com';
  SELECT id INTO user2_id FROM "users" WHERE "email" = 'user2@example.com';
  SELECT id INTO editor_id FROM "users" WHERE "email" = 'editor@example.com';
  SELECT id INTO viewer_id FROM "users" WHERE "email" = 'viewer@example.com';
  
  -- UserRole 연결
  INSERT INTO "user_roles" ("user_id", "role_id") VALUES
    (admin_id, admin_role_id),
    (user1_id, user_role_id),
    (user2_id, user_role_id),
    (editor_id, editor_role_id),
    (viewer_id, viewer_role_id);
  
  -- UserSocialConnection 데이터 생성
  INSERT INTO "user_social_connections" ("user_id", "provider_id", "provider_user_id", "auth_data") VALUES
    (user1_id, google_provider_id, 'google_12345', '{"token": "mock_google_token"}'),
    (user1_id, naver_provider_id, 'naver_12345', '{"token": "mock_naver_token"}');
  
  -- AuditLog 데이터 생성
  INSERT INTO "audit_logs" ("user_id", "action", "timestamp", "ip_address", "details") VALUES
    (admin_id, 'USER_CREATE', NOW() - INTERVAL '3 days', '192.168.1.1', '{"targetUserId": "' || user1_id || '"}'),
    (admin_id, 'ROLE_ASSIGN', NOW() - INTERVAL '3 days', '192.168.1.1', '{"userId": "' || user1_id || '", "role": "user"}'),
    (admin_id, 'SITE_CREATE', NOW() - INTERVAL '2 days', '192.168.1.1', '{"domain": "video.vastwhite.com"}'),
    (user1_id, 'LOGIN', NOW() - INTERVAL '1 day', '192.168.1.2', '{"method": "password"}'),
    (user1_id, 'PROFILE_UPDATE', NOW() - INTERVAL '1 day', '192.168.1.2', '{"fields": ["first_name", "last_name"]}'),
    (user1_id, 'SOCIAL_CONNECT', NOW(), '192.168.1.2', '{"provider": "google"}');
  
END $$;

-- 트랜잭션 종료
COMMIT; 