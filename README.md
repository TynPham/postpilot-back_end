# Post-pilot (Back-end): Social Media Scheduling System 🚀

## 📝 Overview

Post-pilot Backend is a robust server-side application that powers the social media scheduling system. It provides a comprehensive API for managing social media accounts, scheduling posts, and handling recurring content across multiple platforms. Built with scalability and reliability in mind, it ensures smooth operation of the entire Post-pilot ecosystem.

## ✨ Features

- Social media account management and authentication
- Support for multiple platforms:
  - Facebook
  - Instagram
  - Threads
  - X (Twitter)
- Post scheduling and automation
- Recurring post management
- Media asset handling
- Queue-based post processing
- Real-time account status monitoring
- Secure credential management

## 🛠️ Tech Stack

- [Node.js](https://nodejs.org) - Runtime environment
- [Express.js](https://expressjs.com) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Prisma](https://www.prisma.io) - ORM
- [PostgreSQL](https://www.postgresql.org) - Database
- [Redis](https://redis.io) - Queue system
- [AWS S3](https://aws.amazon.com/s3) - Media storage

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js 18.x or later
- PostgreSQL 14.x or later
- Redis 6.x or later
- AWS Account (for S3)

### 💻 Installation

1. Clone the repository:

```bash
git clone https://github.com/TynPham/postpilot-back_end
cd post-pilot-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file following the `env.example` file in the root directory and add necessary environment variables

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

The server will start at [http://localhost:4000](http://localhost:4000)

## 👨‍💻 Development

### 📁 Project Structure

```
src/
├── controllers/     # Request/response handlers
├── services/       # Business logic
├── models/         # Database models and types
├── routes/         # API routes
├── middlewares/    # Express middlewares
├── helpers/        # Utility functions
└── constants/      # Constants and enums
```

### 📂 Key Directories

- `src/controllers`: Handles HTTP requests and responses
- `src/services`: Contains business logic and database operations
- `src/models`: Database models and TypeScript interfaces
- `src/routes`: API route definitions
- `src/middlewares`: Express middleware functions
- `src/helpers`: Utility functions and helpers
- `src/constants`: Application constants and enums

## 📄 License

This project is licensed under the MIT License
