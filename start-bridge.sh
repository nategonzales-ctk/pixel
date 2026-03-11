#!/bin/bash
cd "$(dirname "$0")/bridge"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo
fi

node server.js
