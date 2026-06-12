#!/bin/bash
set -e

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "=== 1. Updating package lists ==="
sudo apt-get update

echo "=== 2. Installing OpenJDK 17 and Maven ==="
sudo apt-get install -y openjdk-17-jdk maven

echo "=== 3. Downloading and Extracting Node.js v22 ==="
NODE_VERSION="v22.12.0"
NODE_DIR="$BASE_DIR/node-v22"

if [ -d "$NODE_DIR" ]; then
    echo "   Node.js is already installed in $NODE_DIR."
else
    echo "   Downloading Node.js $NODE_VERSION (Linux x64)..."
    TEMP_TAR="/tmp/node.tar.xz"
    curl -L "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz" -o "$TEMP_TAR"
    
    echo "   Extracting to $NODE_DIR..."
    mkdir -p "$NODE_DIR"
    tar -xf "$TEMP_TAR" -C "$NODE_DIR" --strip-components=1
    rm "$TEMP_TAR"
    echo "   Node.js successfully installed in $NODE_DIR!"
fi

echo "=== Environment Setup Completed Successfully! ==="
echo "You can now run './run_local.sh' to start your application."
