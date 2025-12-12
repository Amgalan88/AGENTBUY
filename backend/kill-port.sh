#!/bin/bash
# Script to kill all processes using port 5000

echo "Killing all processes on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 1

if lsof -ti:5000 > /dev/null 2>&1; then
    echo "⚠️  Port 5000 is still in use. Please stop nodemon first (Ctrl+C in the terminal running npm run dev)"
else
    echo "✓ Port 5000 is now free!"
fi

