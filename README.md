# Welcome to My Project 🚀

## Project Info

**Live Site**: https://yourwebsite.com  
*(Replace with your actual deployed domain or preview URL)*

## How to Edit This Project

There are several ways to work on the codebase:

### Local Development

If you’d like to run and edit the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate into the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev

```

# ADHD Focus Hub 🧠

A comprehensive productivity app designed specifically for people with ADHD, featuring task management, focus timers, progress tracking, and gamification elements.

## Features ✨

### 🎯 **Task Management**
- Quick task creation with smart time defaults
- Category-based organization (Focus, Energy, Creative, Rest)
- Priority levels and custom icons
- Mobile-responsive design

### ⏱️ **Focus Timer**
- Pomodoro-style focus sessions (25min focus / 5min break)
- Visual progress ring with smooth animations
- Auto-switching between focus and break modes
- Customizable session lengths

### 📊 **Progress Tracking**
- Daily completion statistics
- Streak tracking and point system
- Achievement badges and rewards
- Visual progress indicators

### 🔐 **User Authentication**
- Secure user registration and login
- JWT-based authentication
- User profiles and preferences
- Data persistence across devices

### 💾 **Data Storage**
- MongoDB backend for user data and tasks
- Real-time synchronization
- Offline mode with localStorage fallback
- Automatic data backup

## Tech Stack 🛠️

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Radix UI** components
- **Lucide React** icons
- **React Hook Form** for forms
- **Sonner** for notifications

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** authentication
- **bcryptjs** for password hashing
- **CORS** and security middleware

## Getting Started 🚀

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ADHD
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server
npm install
```

4. **Set up environment variables**
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

5. **Start MongoDB** (if using local installation)
```bash
mongod
```

6. **Start the backend server**
```bash
cd server
npm run dev
```

7. **Start the frontend development server**
```bash
cd ..
npm run dev
```

8. **Open your browser**
Navigate to `http://localhost:5173`

## Environment Variables 🔧

Create a `.env` file in the `server` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/adhd-focus-hub
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/adhd-focus-hub

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

## API Endpoints 📡

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Tasks
- `GET /api/tasks` - Get all user tasks
- `GET /api/tasks/today` - Get today's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/complete` - Mark task complete
- `PUT /api/tasks/:id/uncomplete` - Mark task incomplete
- `DELETE /api/tasks/:id` - Delete task

## Mobile Responsive Design 📱

The app is fully optimized for mobile devices with:
- Touch-friendly interfaces
- Responsive breakpoints (sm: 640px, md: 768px, lg: 1024px)
- Mobile-first CSS approach
- Optimized button sizes and spacing
- Smooth animations and transitions

## Development 💻

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd server
npm run dev          # Start with nodemon
npm start            # Start production server
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License 📄

This project is licensed under the MIT License.

## Support 💬

For support or questions, please open an issue on GitHub.

---

**Built with ❤️ for the ADHD community**
