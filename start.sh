#!/bin/bash
# Start script for Render - runs from root directory

cd backend
uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
