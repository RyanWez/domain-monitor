# Domain Monitor

A full-stack web application for monitoring domain and URL uptime with real-time notifications via Telegram.

## Features

- **Real-time Dashboard**: Monitor all domains with live status updates
- **CRUD Operations**: Add, edit, and delete domains to monitor
- **Automated Monitoring**: Configurable cron job checks domains every 5 minutes
- **Telegram Notifications**: Instant alerts when domains go down
- **Historical Reports**: View uptime percentages and detailed logs
- **User Authentication**: Secure login system
- **Manual Checks**: On-demand domain status verification

## Technology Stack

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- Axios for HTTP requests
- Node-cron for scheduled monitoring
- Telegram Bot API integration

### Frontend
- React.js with Material-UI
- React Router for navigation
- Axios for API communication
- Real-time status updates

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Telegram Bot (optional, for notifications)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd domain-monitor
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Default Admin Account**
   ```
   Username: Ryan
   Password: Domain25@#
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=domain_monitor
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_here

   # Server Configuration
   PORT=5000
   CHECK_INTERVAL_MINUTES=5

   # Telegram Configuration (Optional)
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   ```

4. **Set up PostgreSQL database**
   
   **Option A: Using Docker (Recommended)**
   ```bash
   docker-compose up -d postgres
   ```
   
   **Option B: Manual PostgreSQL Setup**
   ```sql
   CREATE DATABASE domain_monitor;
   ```
   
   The application will automatically create the required tables on first run.

5. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and React frontend (port 3000).

## Telegram Setup (Optional)

To receive notifications when domains go down:

1. **Create a Telegram Bot**
   - Message @BotFather on Telegram
   - Use `/newbot` command and follow instructions
   - Copy the bot token

2. **Get Chat ID**
   - Add your bot to a group or channel
   - Send a message to the group
   - Visit: `https://api.telegram.org/bot[BOT_TOKEN]/getUpdates`
   - Find the chat object and copy the ID

3. **Configure in App**
   - Go to Settings page in the application
   - Enter your Bot Token and Chat ID
   - Test the notification to verify setup

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Domains
- `GET /api/domains` - Get all domains
- `POST /api/domains` - Create new domain
- `PUT /api/domains/:id` - Update domain
- `DELETE /api/domains/:id` - Delete domain
- `POST /api/domains/:id/check` - Manual domain check
- `GET /api/domains/:id/logs` - Get domain check history

### Settings
- `GET /api/settings` - Get application settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/test-telegram` - Test Telegram notification

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - User email
- `password_hash` - Hashed password
- `created_at` - Registration timestamp

### Domains Table
- `id` - Primary key
- `name` - Domain display name
- `url` - URL to monitor
- `status` - Current status (up/down/unknown)
- `last_checked` - Last check timestamp
- `response_time` - Last response time in ms
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Status Logs Table
- `id` - Primary key
- `domain_id` - Foreign key to domains
- `status` - Check result (up/down)
- `response_time` - Response time in ms
- `error_message` - Error details if down
- `checked_at` - Check timestamp

### Settings Table
- `id` - Primary key
- `key` - Setting name
- `value` - Setting value
- `updated_at` - Last update timestamp

## Monitoring Logic

The application considers a domain:
- **UP**: HTTP status codes 2xx or 3xx
- **DOWN**: HTTP status codes 4xx, 5xx, or connection timeouts

Checks run automatically every 5 minutes (configurable via `CHECK_INTERVAL_MINUTES`).

## Development

### Backend Development
```bash
npm run server
```

### Frontend Development
```bash
npm run client
```

### Build for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.