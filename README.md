# JNJ Auth (회원/인증/권한 관리 백엔드 서버)

Node.js, TypeScript, Prisma, Apollo GraphQL 서버를 이용한 인증 및 권한 관리 시스템입니다.

## 기능

- 회원 가입/로그인/로그아웃
- 소셜 인증 (Google, Apple, GitHub, Naver, Kakao)
- 계층적 권한 구조 관리
- 역할 기반 접근 제어(RBAC)
- 사이트 및 페이지별 권한 관리
- 세션 관리 및 감사 로깅

## 기술 스택

- Node.js
- TypeScript
- Prisma (ORM)
- PostgreSQL (데이터베이스)
- Apollo Server (GraphQL)
- Express
- Passport.js (인증)
- JWT (토큰 기반 인증)
- Docker (컨테이너)

## 시작하기

### 필수 조건

- Node.js 22.x 이상
- Docker 및 Docker Compose
- PostgreSQL 데이터베이스

### 설치

1. 저장소 클론 후 디렉토리 이동
   ```bash
   git clone [repo-url]
   cd jnj-auth
   ```

2. 종속성 설치
   ```bash
   npm install
   ```

3. 환경 설정
   `.env` 파일을 수정하여 필요한 환경 변수 설정

4. 데이터베이스 마이그레이션
   ```bash
   npm run prisma:migrate
   ```

5. 개발 모드로 실행
   ```bash
   npm run dev
   ```

### Docker로 실행

```bash
docker-compose up -d
```

## 환경 변수

- `PORT`: 서버 포트 (기본값: 4001)
- `NODE_ENV`: 환경 (development, production)
- `POSTGRES_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`: JWT 서명 키
- `JWT_EXPIRES_IN`: JWT 토큰 만료 시간
- 소셜 인증 관련 설정 (`GOOGLE_CLIENT_ID` 등)

## API 문서

GraphQL 스키마는 서버 실행 후 GraphQL Playground에서 확인할 수 있습니다.
기본 엔드포인트: `http://localhost:4001/graphql`

## 디렉토리 구조

- `/app`: 소스 코드
  - `/graphql`: GraphQL 스키마 및 리졸버
  - `/middleware`: Express 미들웨어
  - `/utils`: 유틸리티 함수
- `/prisma`: Prisma 스키마 및 마이그레이션

## 개발 가이드라인

- TypeScript 사용
- Arrow 함수 사용
- 함수는 파일 하단에서 모아서 export
- 타입 정의는 `types.ts` 파일에 저장

## 라이센스

[라이센스 정보] 