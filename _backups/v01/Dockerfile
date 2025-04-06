FROM node:22-alpine

WORKDIR /app

# OpenSSL 및 필요한 종속성 설치
RUN apk add --no-cache openssl

# npm 설정 - 더 안정적인 설치를 위한 설정
ARG NPM_REGISTRY=https://registry.npmjs.org/
RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 10 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# 애플리케이션 복사 (node_modules는 제외)
COPY . .

# 의존성 설치
RUN npm install

# Prisma 클라이언트 생성
RUN npx prisma generate

# 포트 열기
EXPOSE ${PORT}

# 개발 모드에서는 dev 스크립트를 사용
CMD ["npm", "run", "dev"] 