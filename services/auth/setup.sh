#!/bin/bash

# ============================================
# Auth Service - Quick Setup Script
# ============================================

set -e  # Exit on error

echo "🚀 Starting Auth Service Setup..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please update with your credentials!${NC}"
    echo ""
fi

# Check PostgreSQL connection
echo "🔍 Checking PostgreSQL connection..."
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw auth_db; then
    echo -e "${GREEN}✅ Database 'auth_db' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Database 'auth_db' not found. Creating...${NC}"
    psql -U postgres -c "CREATE DATABASE auth_db;" || {
        echo -e "${RED}❌ Failed to create database. Please create manually:${NC}"
        echo "   psql -U postgres -c \"CREATE DATABASE auth_db;\""
        exit 1
    }
    echo -e "${GREEN}✅ Database 'auth_db' created${NC}"
fi
echo ""

# Check RabbitMQ
echo "🔍 Checking RabbitMQ..."
if docker ps | grep -q rabbitmq; then
    echo -e "${GREEN}✅ RabbitMQ is running${NC}"
else
    echo -e "${YELLOW}⚠️  RabbitMQ not running. Please start it:${NC}"
    echo "   docker-compose up -d rabbitmq"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Build shared-common
echo "🏗️  Building shared-common..."
cd ../shared-common
npm run build
cd ../auth
echo -e "${GREEN}✅ Shared-common built${NC}"
echo ""

# Build auth service
echo "🏗️  Building auth service..."
npm run build
echo -e "${GREEN}✅ Auth service built${NC}"
echo ""

# Run seeds
echo "🌱 Seeding database with RBAC data..."
npm run seed:rbac
echo -e "${GREEN}✅ Database seeded${NC}"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Default Admin Account:"
echo "   Email:    admin@zentry.com"
echo "   Password: Admin@123"
echo ""
echo "🌐 Service URLs:"
echo "   API:     http://localhost:3001/api/v1/auth"
echo "   Health:  http://localhost:3001/api/v1/auth/health"
echo "   Swagger: http://localhost:3001/auth/swagger"
echo ""
echo "🚀 To start the service:"
echo "   npm run start:dev"
echo ""
echo "📚 For more details, see SETUP.md"
echo ""
