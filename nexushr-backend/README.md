# SyncWork - Java Backend Engine

The robust, secure, and production-ready backend core powering the SyncWork collaboration platform. Handles multi-user multi-tenant workspaces, enterprise-grade authentication, relational data persistence, and real-time messaging.

## Core Architecture Features
- Robust REST APIs: Structured MVC (Model-View-Controller) architecture using Java/Spring infrastructure.
- Secure Authentication: Production-grade security layer using JSON Web Tokens (JWT) and secure password encryption.
- Real-Time WebSockets: Bi-directional event-driven architecture using Spring WebSockets (STOMP) for instant task synchronizations.
- Relational/NoSQL Database Layer: Optimized entity structures and data indexing for scalable workspaces and team tasks.

## Tech Stack & Dependencies
- Language & Runtime: Java (JDK 17 or higher)
- Core Framework: Spring Boot (Spring Security, Spring Web, Spring Data)
- Authentication: JWT (Jsonwebtoken library)
- Build Automation: Maven (or Gradle)
- Databases: Compatible with MongoDB (via Spring Data MongoDB) or SQL Databases

## Local Setup & Installation

1. Clone the repository:
   git clone https://github.com/Sahil1205-jat/syncwork-backend
   cd syncwork-backend

2. Configure Environment Variables / application.properties:
   Open src/main/resources/application.properties (or application.yml) and update your database credentials and secret tokens:
   
   server.port=8080
   spring.data.mongodb.uri=your_mongodb_atlas_connection_string
   jwt.secret=your_secure_jwt_random_secret_key
   cors.allowed-origins=http://localhost:5173

3. Build and Run the Application:
   Using Maven wrapper:
   ./mvnw clean install
   ./mvnw spring-boot:run

The Java API gateway will start spinning on http://localhost:8080.

## Production Deployment Guide (Render / AWS)
This application is cloud-ready and containerized:
1. Create a Dockerfile in the root directory (or use standard buildpack deployment).
2. Deploy to Render as a Web Service or AWS Elastic Beanstalk.
3. Configure the environment variables in your cloud hosting provider dashboard (DB URI, JWT Secret, Allowed Origins).
4. Start the service.
