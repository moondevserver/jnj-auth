#!/bin/bash

# 스크립트가 있는 디렉토리로 이동
cd "$(dirname "$0")"

# Docker 컨테이너 내에서 seed.js 스크립트 실행
echo "Docker 컨테이너에서 목업 데이터 생성 스크립트를 실행합니다..."
docker exec -it jnj-auth-backend node /app/mockup/seed.js

# 실행 결과 확인
if [ $? -eq 0 ]; then
  echo "목업 데이터가 성공적으로 생성되었습니다!"
else
  echo "목업 데이터 생성 중 오류가 발생했습니다."
fi 