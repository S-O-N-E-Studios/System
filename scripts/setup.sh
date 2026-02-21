#!/bin/bash
# Initial setup script - run from repo root
echo "Installing dependencies..."
npm run install:all
echo "Copying .env.example to .env (backend and frontend)..."
cp backend/.env.example backend/.env 2>/dev/null || true
cp frontend/.env.example frontend/.env 2>/dev/null || true
echo "Setup complete. Edit .env files and run: npm run dev"
