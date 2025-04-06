// 직접 SQL 쿼리 테스트 스크립트
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRawQuery() {
  try {
    const email = 'admin@example.com';
    
    // Raw SQL 쿼리로 사용자 조회
    const users = await prisma.$queryRaw`
      SELECT id, email, password_hash, first_name, last_name, profile_image, is_active
      FROM users WHERE email = ${email} LIMIT 1
    `;
    
    const user = users[0];
    console.log('Raw SQL 쿼리 결과:');
    console.log(user);
    
    // GraphQL 리졸버 수정을 위한 참고 정보
    console.log('\n필드 매핑:');
    console.log('id:', user.id);
    console.log('email:', user.email);
    console.log('password_hash:', user.password_hash);
    console.log('first_name:', user.first_name);
    console.log('last_name:', user.last_name);
    console.log('profile_image:', user.profile_image);
    console.log('is_active:', user.is_active);
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
testRawQuery(); 