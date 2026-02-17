#!/bin/bash
# Build script for Render - runs from root directory

echo "=== Installing Backend Dependencies ==="
cd backend
pip install -r requirements.txt

echo "=== Installing Frontend Dependencies ==="
cd ../frontend
yarn install

echo "=== Building Frontend ==="
yarn build

echo "=== Copying Frontend Build to Backend ==="
cp -r build ../backend/static

echo "=== Build Complete ==="
