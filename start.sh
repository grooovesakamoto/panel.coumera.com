#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# デバッグ情報を追加
echo "Debug: Current user: $(whoami)"
echo "Debug: Current directory: $(pwd)"
echo "Debug: Directory listing:"
ls -la

# Set HOME to a writable directory
export HOME="/tmp"
echo "Setting HOME directory to: ${HOME}"
echo "Creating HOME directory if it doesn't exist"
mkdir -p "${HOME}" || true
chmod 777 "${HOME}" || true

# Ensure PORT is set - Cloud Run expects 8080
PORT=${PORT:-8080}
echo "Using PORT: ${PORT}"

# Ensure HOSTNAME is set
HOSTNAME=${HOSTNAME:-0.0.0.0}
echo "Using HOSTNAME: ${HOSTNAME}"

# Check NODE_ENV
NODE_ENV=${NODE_ENV:-production}
echo "Running in ${NODE_ENV} mode"

# Ensure DATABASE_URL is set
if [[ -z "${DATABASE_URL}" ]]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi
echo "Database connection: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/g')"

# If using Cloud SQL connection, check for /cloudsql directory
if [[ "${DATABASE_URL}" == *"cloudsql"* ]]; then
  echo "Cloud SQL connection detected"
  if [[ -d "/cloudsql" ]]; then
    echo "Cloud SQL directory exists: /cloudsql"
    echo "Cloud SQL directory contents:"
    ls -la /cloudsql || echo "Cannot list /cloudsql (permission denied)"
    
    # Check if database initialization is needed
    if [[ "${INITIALIZE_DB}" == "true" ]]; then
      echo "Database initialization requested..."
      
      # Create .npmrc with unsafe permissions to avoid permission errors
      echo "unsafe-perm=true" > "${HOME}/.npmrc"
      chmod 600 "${HOME}/.npmrc"
      
      # Push the schema to the database
      echo "Pushing schema to the database..."
      npx --no-install prisma db push --accept-data-loss || echo "Failed to push schema, but continuing..."
      
      # Run the seed script for data initialization
      echo "Running database seed..."
      node prisma/seed-script.js || echo "Failed to run seed script, but continuing..."
      
      echo "Database initialization completed (or attempted)."
    fi
  else
    echo "WARNING: Cloud SQL directory /cloudsql does not exist!"
    echo "This may cause connection issues if running in Cloud Run."
  fi
fi

# Ensure NEXTAUTH_SECRET is set
if [[ -z "${NEXTAUTH_SECRET}" ]]; then
  echo "WARNING: NEXTAUTH_SECRET is not set"
fi

# Ensure NEXTAUTH_URL is set
if [[ -z "${NEXTAUTH_URL}" ]]; then
  echo "WARNING: NEXTAUTH_URL is not set"
fi

# Test database connection using Prisma
echo "Testing database connection..."
npx --no-install prisma db pull --force 2>/dev/null || {
  echo "WARNING: Failed to connect to the database. Please check your DATABASE_URL and ensure the database is accessible."
  echo "Continuing application startup despite database connection issues..."
}

# Set NODE_OPTIONS if not already set to manage memory
if [[ -z "${NODE_OPTIONS}" ]]; then
  export NODE_OPTIONS="--max-old-space-size=2048"
fi
echo "NODE_OPTIONS: ${NODE_OPTIONS}"

# Start the application
echo "Starting application on ${HOSTNAME}:${PORT}..."
exec node server.js 