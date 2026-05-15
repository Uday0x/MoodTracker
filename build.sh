#!/bin/bash
set -e

echo "Building PollPulse..."

# Install and build frontend
echo "Installing frontend dependencies..."
cd frontend
npm install
echo "Building frontend..."
npm run build

# Install backend dependencies
echo "Installing backend dependencies..."
cd ../backend
npm install --production

echo "Build complete!"
