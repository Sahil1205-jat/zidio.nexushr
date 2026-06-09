#!/bin/bash

# Exit on any error
set -e

# Base directory
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "============================================"
echo "   NexusHR - Local Development Launcher     "
echo "============================================"

# Free port 8080 if in use
if lsof -t -i:8080 >/dev/null; then
    echo "-> Port 8080 is already in use. Terminating the blocking process..."
    kill -9 $(lsof -t -i:8080) || true
fi

# Free port 5173 if in use
if lsof -t -i:5173 >/dev/null; then
    echo "-> Port 5173 is already in use. Terminating the blocking process..."
    kill -9 $(lsof -t -i:5173) || true
fi

# 1. Start Backend in background
echo "-> Starting Backend Service..."
cd "$BASE_DIR/nexushr-backend"
# Run Maven in background and redirect output to backend.log
nohup mvn spring-boot:run > "$BASE_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   Backend started in background (PID: $BACKEND_PID, Log: backend.log)"

# 2. Start Frontend
echo "-> Starting Frontend Client..."
cd "$BASE_DIR/nexushr-frontend"

# Use downloaded Node 22 binary to ensure compatibility
if [ -d "$BASE_DIR/node-v22/bin" ]; then
    echo "   Using local Node.js v22 binary..."
    export PATH="$BASE_DIR/node-v22/bin:$PATH"
fi

# Run Vite dev server
echo "   Vite development server launching..."
npm run dev

# Cleanup backend process on exit
cleanup() {
    echo ""
    echo "-> Shutting down Backend Service (PID: $BACKEND_PID)..."
    kill $BACKEND_PID || true
    echo "   Done!"
}
trap cleanup EXIT
