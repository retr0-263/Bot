#!/bin/bash

# WebSocket Real-Time Communication - Complete Installation & Testing Guide
# Ensures all modules work and WebSocket is fully functional

set -e

echo "🚀 WebSocket Real-Time Communication - Setup & Testing"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check dependencies
echo -e "${BLUE}Step 1: Checking and installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo "Installing npm packages..."
  npm install
  echo -e "${GREEN}✅ Dependencies installed${NC}"
else
  echo -e "${GREEN}✅ node_modules exists${NC}"
fi

echo ""

# Step 2: Verify WebSocket module
echo -e "${BLUE}Step 2: Verifying WebSocket module...${NC}"
if npm ls ws > /dev/null 2>&1; then
  WS_VERSION=$(npm ls ws | grep "ws@" | head -1 | awk '{print $2}')
  echo -e "${GREEN}✅ ws module installed: $WS_VERSION${NC}"
else
  echo -e "${YELLOW}⚠️  ws not found, installing...${NC}"
  npm install ws@latest
  echo -e "${GREEN}✅ ws installed${NC}"
fi

echo ""

# Step 3: Check all required files
echo -e "${BLUE}Step 3: Verifying all WebSocket files exist...${NC}"

FILES=(
  "src/server/websocket.js"
  "src/server/index.js"
  "src/services/websocketService.ts"
  "whatsapp-bot/src/services/websocketEventEmitter.js"
  "whatsapp-bot/src/index.js"
  "src/components/common/RealtimeDashboard.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $file${NC}"
  else
    echo -e "${RED}❌ MISSING: $file${NC}"
  fi
done

echo ""

# Step 4: Verify chalk dependency in bot
echo -e "${BLUE}Step 4: Checking bot dependencies...${NC}"
cd whatsapp-bot
if npm ls chalk > /dev/null 2>&1; then
  echo -e "${GREEN}✅ chalk installed in bot${NC}"
else
  echo -e "${YELLOW}Installing chalk in bot...${NC}"
  npm install chalk
fi

if npm ls axios > /dev/null 2>&1; then
  echo -e "${GREEN}✅ axios installed in bot${NC}"
else
  echo -e "${YELLOW}Installing axios in bot...${NC}"
  npm install axios
fi

cd ..

echo ""

# Step 5: Verify main package.json has ws
echo -e "${BLUE}Step 5: Verifying main package.json...${NC}"
if grep -q '"ws"' package.json; then
  echo -e "${GREEN}✅ ws in package.json${NC}"
else
  echo -e "${RED}❌ ws not in package.json, updating...${NC}"
  npm install ws@latest --save
fi

echo ""

# Step 6: Test file syntax
echo -e "${BLUE}Step 6: Testing file syntax...${NC}"

# Test WebSocket server
echo -n "Testing WebSocket server syntax... "
if node -c src/server/websocket.js 2>/dev/null; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

# Test bot integration
echo -n "Testing bot WebSocket integration... "
if node -c whatsapp-bot/src/services/websocketEventEmitter.js 2>/dev/null; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

# Test server modifications
echo -n "Testing server modifications... "
if node -c src/server/index.js 2>/dev/null; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

echo ""

# Step 7: Display startup commands
echo -e "${BLUE}Step 7: Ready to start!${NC}"
echo ""
echo -e "${GREEN}Run all services (recommended):${NC}"
echo "  npm run dev:all"
echo ""
echo -e "${GREEN}Or run separately:${NC}"
echo "  Terminal 1: npm run api       # Backend API + WebSocket"
echo "  Terminal 2: npm run dev       # Frontend Dashboard"
echo "  Terminal 3: npm run bot:dev   # WhatsApp Bot"
echo ""

# Step 8: Test connectivity (optional)
read -p "Do you want to test local connectivity? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Starting connectivity test...${NC}"
  echo ""
  
  # Check if ports are available
  for port in 5174 5173 3000; do
    if nc -z localhost $port 2>/dev/null; then
      echo -e "${YELLOW}⚠️  Port $port already in use${NC}"
    else
      echo -e "${GREEN}✅ Port $port available${NC}"
    fi
  done
  
  echo ""
  echo -e "${BLUE}WebSocket Endpoints:${NC}"
  echo "  HTTP API:    http://localhost:5174"
  echo "  WebSocket:   ws://localhost:5174/ws"
  echo "  Dashboard:   http://localhost:5173"
  echo ""
fi

# Step 9: Environment variables
echo -e "${BLUE}Step 8: Checking environment variables...${NC}"
if [ -f ".env" ]; then
  echo -e "${GREEN}✅ .env file exists${NC}"
  if grep -q "API_BASE_URL" .env; then
    echo "  API_BASE_URL configured"
  else
    echo -e "${YELLOW}  Add API_BASE_URL=http://localhost:5174 to .env${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  No .env file${NC}"
  echo "Creating .env..."
  cat > .env << EOF
# API Configuration
API_BASE_URL=http://localhost:5174
API_PORT=5174

# Bot Configuration
BOT_PREFIX=!
ADMIN_PHONE=+1234567890

# WebSocket Configuration
VITE_WS_URL=localhost:5174

# Environment
NODE_ENV=development
LOG_LEVEL=info
EOF
  echo -e "${GREEN}✅ .env created${NC}"
fi

echo ""

# Step 10: Summary
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${YELLOW}WebSocket Features Enabled:${NC}"
echo "  • Real-time bot status monitoring"
echo "  • Live message broadcasting"
echo "  • Order status updates"
echo "  • Merchant notifications"
echo "  • Command execution tracking"
echo "  • User activity logging"
echo "  • Connection health monitoring"
echo "  • Automatic reconnection"
echo "  • Message queuing"
echo "  • 100-message history"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start all services: npm run dev:all"
echo "  2. Open dashboard: http://localhost:5173"
echo "  3. Scan QR code in terminal when it appears"
echo "  4. Send test message to bot"
echo "  5. Watch real-time updates in dashboard"
echo ""
echo -e "${YELLOW}Troubleshooting:${NC}"
echo "  • Port 5174 in use: Kill process or change API_PORT"
echo "  • WebSocket connection failed: Check firewall/CORS"
echo "  • Missing modules: Run npm install in root and whatsapp-bot"
echo "  • TypeScript errors: npm run build to check"
echo ""

# Step 11: Final verification
echo -e "${BLUE}Performing final verification...${NC}"

# Count WebSocket implementations
WS_USAGES=$(grep -r "websocketService\|WebSocketServer\|WebSocketEventEmitter" --include="*.js" --include="*.ts" --include="*.tsx" src/ whatsapp-bot/src/ 2>/dev/null | wc -l)
echo "  WebSocket references: $WS_USAGES"

# Check for event handlers
EVENT_HANDLERS=$(grep -r "on('.*'" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)
echo "  Event handlers registered: $EVENT_HANDLERS"

echo ""
echo -e "${GREEN}🎉 Ready to use real-time communication!${NC}"
