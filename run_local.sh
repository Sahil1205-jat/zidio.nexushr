#!/bin/bash
set -e

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "============================================"
echo "   NexusHR - Local Development Launcher     "
echo "============================================"

if lsof -t -i:8080 >/dev/null; then
    echo "-> Port 8080 is already in use. Terminating the blocking process..."
    kill -9 $(lsof -t -i:8080) || true
fi

if lsof -t -i:5173 >/dev/null; then
    echo "-> Port 5173 is already in use. Terminating the blocking process..."
    kill -9 $(lsof -t -i:5173) || true
fi

echo "-> Starting Backend Service..."
cd "$BASE_DIR/nexushr-backend"
nohup mvn spring-boot:run > "$BASE_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   Backend started in background (PID: $BACKEND_PID, Log: backend.log)"

echo "-> Starting Frontend Client..."
cd "$BASE_DIR/nexushr-frontend"

if [ -d "$BASE_DIR/node-v22/bin" ]; then
    echo "   Using local Node.js v22 binary..."
    export PATH="$BASE_DIR/node-v22/bin:$PATH"
fi

echo "   Vite development server launching..."
if [ ! -d "node_modules" ]; then
    echo "   node_modules folder not found. Installing frontend dependencies..."
    npm install
fi
npm run dev


cleanup() {
    echo ""
    echo "-> Shutting down Backend Service (PID: $BACKEND_PID)..."
    kill $BACKEND_PID || true
    echo "   Done!"
}
trap cleanup EXIT
