## Functions

### 회원 가입/로그인, sns 인증 처리
- frontend 사이트들에서 sns 또는 email 기반의 회원 가입/로그인을 요청하면 이에 대한 인증 처리를 해주는 backend server
- google, apple, github, naver, kakao 등에 대한 로그인
- frontend 사이트에서 회원가입/로그인을 할 때, 현재 사이트/페이지 및 계정 정보를 추가하여 요청하면, sns 인증처리와 해당 회원에 대한 회원 정보, 권한 정보, 요청 사이트/페이지 등을 응답

### 페이지별 접근 권한 설정
1. **계층적 권한 구조**: 사이트 > 섹션 > 페이지 등의 계층 구조 형태로 권한을 관리
2. **역할 기반 접근 제어(RBAC)**: 사용자에게 역할을 부여하고, 역할에 따라 접근 권한 설정
3. **세분화된 권한 제어**: 페이지별로 읽기, 쓰기, 수정, 삭제 등의 권한을 개별적으로 설정

---

## Tech
- Node.js + Prisma + Apollo Server(GraphQL)

- typescript
- prisma
- graphql apollo server
- passport.js

---

## Code Guidelines

### TypeScript Guidelines
- type에 `any` 사용 가능
- arrow function 사용
- 함수 개별적으로 export 하지 않고, 파일 하단에 모아서, `export { fun1, fun2, fun3, ... }`
- index.ts 가 있는 경우, 폴더 내의 다른 함수들은 모두 index.ts 에서 export
- type 파일은 모두 `src/types.ts` 파일에 일괄 저장

### Naming Conventions
  - Use camelCase for functions and variables
  - Use UPPER_CASE for constants
  - Use kebab-case for file names

### Documentation
- Add JSDoc comments for functions
- Add usage examples in comments