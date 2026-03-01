#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a process is running
check_process() {
    if ps -p $1 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${GREEN}Starting backend...${NC}"
    cd backend
    npm run dev &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/timetrack_backend.pid
    cd ..
    echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
}

# Function to start frontend
start_frontend() {
    echo -e "${GREEN}Starting frontend...${NC}"
    cd frontend
    npm start &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/timetrack_frontend.pid
    cd ..
    echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"
}

# Function to restart a process
restart_backend() {
    echo -e "${YELLOW}Backend crashed, restarting...${NC}"
    start_backend
}

restart_frontend() {
    echo -e "${YELLOW}Frontend crashed, restarting...${NC}"
    start_frontend
}

# Kill existing processes
echo -e "${YELLOW}Stopping any existing processes...${NC}"
if [ -f /tmp/timetrack_backend.pid ]; then
    kill $(cat /tmp/timetrack_backend.pid) 2>/dev/null
    rm /tmp/timetrack_backend.pid
fi
if [ -f /tmp/timetrack_frontend.pid ]; then
    kill $(cat /tmp/timetrack_frontend.pid) 2>/dev/null
    rm /tmp/timetrack_frontend.pid
fi

# Start services
start_backend
sleep 2
start_frontend

# Wait a bit for services to start
sleep 5

echo ""
echo -e "${GREEN}========================================"
echo -e "TimeTrack is running!"
echo -e "Backend: http://localhost:3001"
echo -e "Frontend: http://localhost:3000"
echo -e "========================================${NC}"
echo ""

# Monitor processes
while true; do
    sleep 3
    
    # Check backend
    if [ -f /tmp/timetrack_backend.pid ]; then
        BACKEND_PID=$(cat /tmp/timetrack_backend.pid)
        if ! check_process $BACKEND_PID; then
            restart_backend
        fi
    fi
    
    # Check frontend
    if [ -f /tmp/timetrack_frontend.pid ]; then
        FRONTEND_PID=$(cat /tmp/timetrack_frontend.pid)
        if ! check_process $FRONTEND_PID; then
            restart_frontend
        fi
    fi
done
