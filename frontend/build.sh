#!/bin/bash
# Build script for Render deployment

echo "Installing dependencies..."
yarn install

echo "Building React app..."
yarn build

echo "Build complete!"
