#!/bin/bash

# ft_transcendence Project Setup Script
# This script sets up the project for initial development or deployment

set -e

echo "================================"
echo " ft_transcendence Project Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if .env exists in backend
echo -e "${BLUE}[1/5]${NC} Checking backend .env configuration..."
if [ ! -f "app/backend/.env" ]; then
    if [ -f "app/backend/.env.example" ]; then
        echo -e "${YELLOW}⚠ .env not found. Creating from .env.example...${NC}"
        cp app/backend/.env.example app/backend/.env
        echo -e "${GREEN}✓ .env created${NC}"
    else
        echo -e "${YELLOW}⚠ Neither .env nor .env.example found${NC}"
    fi
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi
echo ""

# 2. Generate SSL certificates if they don't exist
echo -e "${BLUE}[2/5]${NC} Checking SSL/TLS certificates..."
if [ ! -f "app/certs/cert.pem" ] || [ ! -f "app/certs/key.pem" ]; then
    echo -e "${YELLOW}⚠ Certificates not found. Generating self-signed certificates...${NC}"
    mkdir -p app/certs
    openssl req -x509 -newkey rsa:2048 -keyout app/certs/key.pem -out app/certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
    echo -e "${GREEN}✓ SSL certificates generated${NC}"
else
    echo -e "${GREEN}✓ SSL certificates already exist${NC}"
fi
echo ""

# 3. Install backend dependencies
echo -e "${BLUE}[3/5]${NC} Installing backend dependencies..."
cd app/backend
npm install
cd ../..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# 4. Install frontend dependencies
echo -e "${BLUE}[4/5]${NC} Installing frontend dependencies..."
cd app/frontend
npm install
cd ../..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# 5. Build frontend
echo -e "${BLUE}[5/5]${NC} Building frontend..."
cd app/frontend
npm run build
cd ../..
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

echo "================================"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Review app/backend/.env and adjust if needed"
echo "2. Run: make"
echo "3. Navigate to: https://127.0.0.1:8443/"
echo ""
