#!/bin/bash
# CodeCollab - Linux/Mac Startup Script
# This script starts both backend and frontend servers

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        CodeCollab - Automated Startup (Mac/Linux)         ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ This script will start:                                   ║"
echo "║ 1. Backend Server (http://localhost:5000)                 ║"
echo "║ 2. Frontend (http://localhost:3000)                       ║"
echo "║                                                            ║"
echo "║ Keep both running while using the application             ║"
echo "║ Press Ctrl+C to stop all servers                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "✗ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found:"
node -v

# Check if MongoDB is available
echo ""
echo "Checking MongoDB connection..."
if timeout 1 bash -c '</dev/tcp/127.0.0.1/27017' 2>/dev/null; then
    echo "✓ MongoDB is running locally"
else
    echo "⚠ MongoDB not detected. Using MongoDB Atlas? Ensure MONGODB_URI in server/.env is correct."
fi

# Install dependencies if needed
if [ ! -d "server/node_modules" ]; then
    echo ""
    echo "Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo ""
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

# Start servers
echo ""
echo "Starting servers..."
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "Stopping all servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd server
echo "► Starting Backend at http://localhost:5000"
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
cd client
echo "► Starting Frontend at http://localhost:3000"
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Both servers running!"
echo "  Backend: http://localhost:5000"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
