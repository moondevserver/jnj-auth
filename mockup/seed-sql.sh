#!/bin/bash

# .env 파일이 존재하는지 확인
ENV_FILE="/app/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo ".env 파일이 존재하지 않습니다. $ENV_FILE"
    exit 1
fi

# .env 파일에서 데이터베이스 연결 정보 가져오기
POSTGRES_USER=$(grep "POSTGRES_USER" $ENV_FILE | cut -d= -f2)
POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD" $ENV_FILE | cut -d= -f2 | tr -d '"')
POSTGRES_DB=$(grep "POSTGRES_DB" $ENV_FILE | cut -d= -f2)
POSTGRES_PORT=$(grep "POSTGRES_PORT" $ENV_FILE | cut -d= -f2)
BASE_IP=$(grep "BASE_IP" $ENV_FILE | cut -d= -f2)

# SQL 스크립트 실행
echo "목업 데이터 생성을 시작합니다..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $BASE_IP -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -f /app/mockup/seed.sql

# 실행 결과 확인
if [ $? -eq 0 ]; then
    echo "목업 데이터가 성공적으로 생성되었습니다."
else
    echo "목업 데이터 생성 중 오류가 발생했습니다."
    exit 1
fi 