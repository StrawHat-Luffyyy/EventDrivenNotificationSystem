# 🔔 Event-Driven Notification System

A robust, scalable real-time notification system built with Node.js, Express, MongoDB, Redis, BullMQ, and Socket.io. This system provides event-driven notifications across multiple channels (In-App, Email, Push) with user preferences, delivery tracking, and retry mechanisms.

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green)
![Redis](https://img.shields.io/badge/Redis-7.x-red)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-blue)
![License](https://img.shields.io/badge/license-ISC-blue)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Features
- 🔄 **Event-Driven Architecture** - Asynchronous event processing with queue management
- 📱 **Multi-Channel Notifications** - Support for In-App, Email, and Push notifications
- ⚡ **Real-Time Updates** - WebSocket-based real-time notifications using Socket.io
- 🔁 **Automatic Retries** - Exponential backoff retry mechanism for failed notifications
- 📊 **Delivery Tracking** - Comprehensive logging of notification delivery status
- ⚙️ **User Preferences** - Customizable notification settings per user
- 🔒 **Idempotency** - Prevent duplicate event processing
- 🛡️ **Rate Limiting** - Protection against spam and abuse
- 🔐 **JWT Authentication** - Secure API authentication
- 📈 **Scalable** - Horizontal scaling support with Redis and BullMQ

### Advanced Features
- ✅ Spam prevention with time-based throttling
- 🎯 Event type filtering per user
- 📝 Delivery logs with attempt tracking
- 🔄 Graceful shutdown handling
- 💾 TTL-based auto-cleanup of old data
- 🚦 Queue management with concurrency control

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │ ───► │  Express API │ ───► │   MongoDB   │
│ (React/Web) │      │   (REST API) │      │  (Database) │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │                      
       │                     ▼                      
       │              ┌──────────────┐              
       │              │  Event Queue │              
       │              │   (BullMQ)   │              
       │              └──────────────┘              
       │                     │                      
       │                     ▼                      
       │              ┌──────────────┐      ┌─────────────┐
       └────────────► │  Socket.io   │      │    Redis    │
         Real-time    │   (WebSocket)│ ───► │   (Cache)   │
                      └──────────────┘      └─────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │Event Worker  │
                      │(Background)  │
                      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │Notifications │
                      │ IN_APP/EMAIL │
                      │     /PUSH    │
                      └──────────────┘
```

### Flow Diagram

```
1. Client creates event ──► API validates and saves to DB
                           │
2. Event added to queue ──► BullMQ enqueues job
                           │
3. Worker picks job ──────► Processes event
                           │
4. Check user prefs ──────► Determine channels
                           │
5. Create notifications ──► Save to DB + Log delivery
                           │
6. Send real-time ────────► Socket.io emit (IN_APP)
                           │
7. Mark event processed ──► Update status in DB
```

## 📦 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6.x or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Redis** (v7.x or higher) - [Download](https://redis.io/download) or use [Redis Cloud](https://redis.com/try-free/)
- **npm** or **yarn** - Package manager (comes with Node.js)

### Optional
- **Docker** - For containerized deployment
- **PM2** - For production process management

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/StrawHat-Luffyyy/EventDrivenNotificationSystem.git
cd EventDrivenNotificationSystem
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Secrets

Generate strong cryptographic secrets for your environment:

```bash
# Method 1: Using Node.js (fastest)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('INTERNAL_SERVICE_TOKEN=' + require('crypto').randomBytes(64).toString('hex'))"

# Method 2: Using provided script
node generate-secrets.js

# Method 3: Using OpenSSL (Linux/Mac)
echo "JWT_SECRET=$(openssl rand -hex 64)"
echo "INTERNAL_SERVICE_TOKEN=$(openssl rand -hex 64)"
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server Configuration
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/notification-system
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Authentication (REPLACE WITH YOUR GENERATED SECRETS)
JWT_SECRET=your_generated_jwt_secret_here
INTERNAL_SERVICE_TOKEN=your_generated_internal_token_here

# Client
CLIENT_URL=http://localhost:3000
```

## ⚙️ Configuration

### MongoDB Setup

#### Option 1: Local MongoDB
```bash
# Install MongoDB
# Ubuntu/Debian
sudo apt-get install mongodb

# Mac
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongodb
# or
brew services start mongodb-community
```

#### Option 2: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Add to `.env` file

### Redis Setup

#### Option 1: Local Redis
```bash
# Install Redis
# Ubuntu/Debian
sudo apt-get install redis-server

# Mac
brew install redis

# Start Redis
redis-server
```

#### Option 2: Redis Cloud
1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create database
3. Get connection URL
4. Add to `.env` file

## 🏃 Running the Application

### Development Mode

Run both the API server and worker together:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start worker
npm run worker
```

### Production Mode

```bash
# Start server
npm start

# Start worker (in separate process)
node src/workers/event.worker.js
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs

# Stop all
pm2 stop all
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

### 🔐 Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "john_doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "john_doe"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "john_doe"
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "john_doe",
    "isActive": true,
    "createdAt": "2025-01-27T10:00:00.000Z"
  }
}
```

---

### 📨 Event Endpoints

#### Create Event
```http
POST /events
Content-Type: application/json
x-internal-token: <internal_service_token>

{
  "eventType": "ORDER_PLACED",
  "userId": "507f1f77bcf86cd799439011",
  "payload": {
    "orderId": "ORD-12345",
    "total": "$99.99"
  },
  "idempotencyKey": "unique-key-12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event accepted for processing.",
  "eventId": "507f191e810c19729de860ea"
}
```

#### Get Event Status
```http
GET /events/:eventId
x-internal-token: <internal_service_token>
```

**Response:**
```json
{
  "success": true,
  "event": {
    "eventType": "ORDER_PLACED",
    "status": "PROCESSED",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:05.000Z"
  }
}
```

**Supported Event Types:**
- `USER_REGISTERED`
- `USER_LOGIN`
- `ORDER_PLACED`
- `ORDER_SHIPPED`
- `ORDER_DELIVERED`
- `PAYMENT_RECEIVED`
- `PAYMENT_FAILED`
- `PASSWORD_RESET`
- `ACCOUNT_VERIFIED`
- `SUBSCRIPTION_RENEWED`
- `SUBSCRIPTION_CANCELLED`

---

### 🔔 Notification Endpoints

#### Get Notifications
```http
GET /notifications?page=1&limit=10&isRead=false&channel=IN_APP
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `isRead` (optional): Filter by read status (true/false)
- `channel` (optional): Filter by channel (IN_APP/EMAIL/PUSH)

**Response:**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 45,
  "totalPages": 5,
  "notifications": [
    {
      "_id": "507f191e810c19729de860ea",
      "userId": "507f1f77bcf86cd799439011",
      "title": "Order Placed Successfully",
      "message": "Your order #ORD-12345 has been placed successfully.",
      "channel": "IN_APP",
      "isRead": false,
      "priority": "MEDIUM",
      "createdAt": "2025-01-27T10:00:00.000Z"
    }
  ]
}
```

#### Mark Notifications as Read
```http
PATCH /notifications/read
Authorization: Bearer <token>
Content-Type: application/json

{
  "notificationIds": [
    "507f191e810c19729de860ea",
    "507f191e810c19729de860eb"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications marked as read",
  "modifiedCount": 2
}
```

#### Mark All Notifications as Read
```http
PATCH /notifications/read-all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "modifiedCount": 15
}
```

#### Delete Notifications
```http
DELETE /notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "notificationIds": [
    "507f191e810c19729de860ea"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications deleted",
  "deletedCount": 1
}
```

---

### 🔌 WebSocket Events

Connect to Socket.io server:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Join user's personal room
socket.emit('join', userId);

// Listen for new notifications
socket.on('new_notification', (notification) => {
  console.log('New notification:', notification);
  // {
  //   notificationId: "507f191e810c19729de860ea",
  //   title: "Order Placed Successfully",
  //   message: "Your order #ORD-12345 has been placed.",
  //   channel: "IN_APP",
  //   createdAt: "2025-01-27T10:00:00.000Z"
  // }
});
```

---

### ❤️ Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Event Notification Service is running",
  "timestamp": "2025-01-27T10:00:00.000Z"
}
```

---

## 🧪 Testing

### Manual Testing with cURL

#### 1. Register a User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "username": "testuser"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

Save the token from response:
```bash
export TOKEN="your_jwt_token_here"
export USER_ID="your_user_id_here"
```

#### 3. Create an Event
```bash
curl -X POST http://localhost:5000/events \
  -H "Content-Type: application/json" \
  -H "x-internal-token: your_internal_service_token" \
  -d '{
    "eventType": "ORDER_PLACED",
    "userId": "'$USER_ID'",
    "payload": {
      "orderId": "ORD-12345",
      "total": "$99.99"
    },
    "idempotencyKey": "test-key-1"
  }'
```

#### 4. Get Notifications
```bash
curl -X GET "http://localhost:5000/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 5. Mark as Read
```bash
curl -X PATCH http://localhost:5000/notifications/read \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationIds": ["notification_id_here"]
  }'
```

### Testing with Postman

1. Import the API collection (create one from the API documentation above)
2. Set environment variables:
   - `BASE_URL`: `http://localhost:5000`
   - `TOKEN`: Your JWT token
   - `INTERNAL_TOKEN`: Your internal service token
3. Run the collection

### Testing WebSocket Connection

Create a simple HTML file to test Socket.io:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.io Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Real-time Notification Test</h1>
  <div id="notifications"></div>

  <script>
    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      console.log('Connected to server');
      // Replace with your actual userId
      socket.emit('join', 'YOUR_USER_ID');
    });

    socket.on('new_notification', (notification) => {
      console.log('New notification:', notification);
      const div = document.getElementById('notifications');
      div.innerHTML += `<p>${notification.title}: ${notification.message}</p>`;
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  </script>
</body>
</html>
```

### Automated Testing (Coming Soon)

```bash
# Install testing dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

## 📁 Project Structure

```
EventDrivenNotificationSystem/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── db.js              # MongoDB connection
│   │   └── redis.js           # Redis connection
│   │
│   ├── middlewares/           # Express middlewares
│   │   ├── auth.middleware.js          # JWT authentication
│   │   ├── internalAuth.middleware.js  # Internal service auth
│   │   └── rateLimit.middleware.js     # Rate limiting
│   │
│   ├── modules/               # Feature modules
│   │   ├── users/
│   │   │   ├── user.model.js
│   │   │   ├── user.controller.js
│   │   │   └── user.routes.js
│   │   │
│   │   ├── events/
│   │   │   ├── events.model.js
│   │   │   ├── event.controller.js
│   │   │   ├── event.routes.js
│   │   │   └── event.validator.js
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification.model.js
│   │   │   ├── notification.controller.js
│   │   │   └── notification.routes.js
│   │   │
│   │   ├── preferences/
│   │   │   └── preference.model.js
│   │   │
│   │   └── deliveryLogs/
│   │       └── deliveryLog.model.js
│   │
│   ├── queues/                # Queue management
│   │   └── event.queue.js
│   │
│   ├── workers/               # Background workers
│   │   └── event.worker.js
│   │
│   ├── utils/                 # Utility functions
│   │   └── notificationTemplates.js
│   │
│   ├── socket.js              # Socket.io setup
│   └── app.js                 # Main application file
│
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
├── README.md                  # This file
├── generate-secrets.js        # Secret generation script
└── generate-secrets.sh        # Bash secret generator
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Redis** - In-memory data store
- **BullMQ** - Queue management
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### DevOps
- **Docker** - Containerization (optional)
- **PM2** - Process manager
- **nodemon** - Development auto-reload

### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting

## 🚢 Deployment

### Using Docker

```bash
# Build image
docker build -t notification-system .

# Run container
docker run -p 5000:5000 --env-file .env notification-system
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save process list
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

### Deploy to Cloud

#### Heroku
```bash
heroku create your-app-name
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

#### AWS/DigitalOcean/Azure
1. Set up a server
2. Install Node.js, MongoDB, Redis
3. Clone repository
4. Set environment variables
5. Run with PM2

## 🔧 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Check connection string
echo $MONGO_URI
```

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Worker Not Processing Jobs
```bash
# Check Redis connection
redis-cli
> PING

# Check if queue exists
> KEYS *

# Monitor queue
npm run worker
```

## 📈 Performance Tips

1. **Horizontal Scaling**: Deploy multiple worker instances
2. **Database Indexing**: Already configured in models
3. **Redis Persistence**: Configure Redis AOF/RDB
4. **Connection Pooling**: MongoDB connection pooling enabled
5. **Rate Limiting**: Adjust limits based on load
6. **Monitoring**: Use PM2 or external monitoring tools

## 🔐 Security Best Practices

- ✅ Environment variables for sensitive data
- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on all endpoints
- ✅ Input validation
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Idempotency keys for events

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `REDIS_URL` | Redis connection URL | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `INTERNAL_SERVICE_TOKEN` | Internal API token | Yes | - |
| `CLIENT_URL` | Frontend URL for CORS | No | http://localhost:3000 |
| `NODE_ENV` | Environment (development/production) | No | development |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use ESLint and Prettier
- Follow existing code patterns
- Write meaningful commit messages
- Add comments for complex logic

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**StrawHat-Luffyyy**
- GitHub: [@StrawHat-Luffyyy](https://github.com/StrawHat-Luffyyy)

## 🙏 Acknowledgments

- Express.js team
- Socket.io team
- BullMQ team
- MongoDB team
- Redis team
- All open-source contributors

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

## 🗺️ Roadmap

- [ ] Email notification integration (SendGrid/Mailgun)
- [ ] Push notification integration (Firebase/OneSignal)
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Notification templates management
- [ ] Webhook support
- [ ] GraphQL API
- [ ] Automated testing suite
- [ ] Docker Compose setup
- [ ] Kubernetes deployment configs

---

**⭐ If you find this project useful, please give it a star!**
