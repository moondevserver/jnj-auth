// 로그인 테스트 스크립트
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const email = 'admin@example.com';
    const password = 'Password123!';
    
    console.log('로그인 테스트 시작...');
    console.log(`이메일: ${email}, 비밀번호: ${password}`);
    
    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log('사용자를 찾을 수 없습니다.');
      return;
    }
    
    console.log('사용자 정보:');
    console.log('ID:', user.id);
    console.log('이메일:', user.email);
    console.log('비밀번호 해시:', user.password_hash);
    console.log('계정 활성화 여부:', user.is_active);
    
    // 필드명 확인
    console.log('\n필드명 확인:');
    console.log('password_hash 필드 존재?', 'password_hash' in user);
    console.log('passwordHash 필드 존재?', 'passwordHash' in user);
    console.log('is_active 필드 존재?', 'is_active' in user);
    console.log('isActive 필드 존재?', 'isActive' in user);
    
    // 비밀번호 검증
    console.log('\n비밀번호 검증:');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('비밀번호 일치 여부:', isPasswordValid);
    
    // 모의 로그인 로직
    if (!user.password_hash) {
      console.log('비밀번호가 설정되어 있지 않습니다.');
      return;
    }
    
    if (!isPasswordValid) {
      console.log('비밀번호가 올바르지 않습니다.');
      return;
    }
    
    if (!user.is_active) {
      console.log('비활성화된 계정입니다.');
      return;
    }
    
    console.log('\n로그인 성공!');
    console.log('토큰을 생성합니다...');
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
testLogin(); 