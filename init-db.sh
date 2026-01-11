#!/bin/bash

# 팝송 학습 앱 데이터베이스 초기화 스크립트
# 사용법: SSH 서버에서 이 스크립트를 실행하세요

echo "======================================"
echo "팝송 학습 앱 데이터베이스 초기화"
echo "======================================"
echo ""

# PostgreSQL 접속 정보
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-popsongs_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-posid00}"

echo "데이터베이스 정보:"
echo "  호스트: $DB_HOST"
echo "  포트: $DB_PORT"
echo "  데이터베이스: $DB_NAME"
echo "  사용자: $DB_USER"
echo ""

# 데이터베이스 생성 (이미 존재하면 무시)
echo "1. 데이터베이스 생성 중..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "  (데이터베이스가 이미 존재합니다)"

# 스키마 실행
echo ""
echo "2. 테이블 스키마 생성 중..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 데이터베이스 초기화 완료!"
    echo ""
    echo "다음 명령으로 서버를 실행할 수 있습니다:"
    echo "  npm start"
    echo ""
else
    echo ""
    echo "❌ 데이터베이스 초기화 실패"
    echo "   PostgreSQL 서버가 실행 중인지 확인하세요."
    echo ""
    exit 1
fi
