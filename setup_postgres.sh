#!/bin/bash
set -e

echo "=== 1. Updating package lists ==="
sudo apt-get update

echo "=== 2. Installing PostgreSQL ==="
sudo apt-get install -y postgresql postgresql-contrib

echo "=== 3. Starting & Enabling PostgreSQL Service ==="
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "=== 4. Configuring Database and User ==="
echo "Setting password for user 'postgres' to 'postgres'..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

DATABASE_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='nexushr'")

if [ "$DATABASE_EXISTS" = "1" ]; then
    echo "Database 'nexushr' already exists."
else
    echo "Creating database 'nexushr'..."
    sudo -u postgres psql -c "CREATE DATABASE nexushr;"
fi

echo "=== PostgreSQL Setup Completed Successfully! ==="
echo "You can now run './run_local.sh' to start your application."
