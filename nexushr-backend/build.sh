#!/bin/bash

# Build the backend application for Render
echo "Building NexusHR Backend..."
./mvnw clean package -DskipTests
echo "Build complete!"
