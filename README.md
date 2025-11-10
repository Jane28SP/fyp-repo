# JomEvent! - FYP Event Booking System

A full-stack event booking system with **Web** and **Mobile** support.

## 🏗️ Project Structure

```
fyp-repo/
├── apps/
│   ├── web/          # React web application (Create React App)
│   └── mobile/       # React Native mobile app (Expo)
└── package.json      # Root scripts to run both apps
```

## 🚀 Technology Stack

- **Web**: React + TypeScript + Create React App + Tailwind CSS
- **Mobile**: React Native + Expo + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Common**: Shared Supabase client and data types

## 📋 Prerequisites

Before testing, make sure you have installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

2. **Git**
   - Download from: https://git-scm.com/

3. **For Mobile Testing**:
   - **Expo Go App** on your phone (iOS/Android)
     - iOS: https://apps.apple.com/app/expo-go/id982107779
     - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

## 🔧 Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/fyp-repo.git
cd fyp-repo
```

### Step 2: Install Dependencies

```bash
# Install dependencies for both web and mobile apps
npm run install:all
```

This command installs:
- Root workspace dependencies (pnpm)
- Web app dependencies (npm for CRA)
- Mobile app dependencies (via pnpm workspaces)

### Step 3: Set Up Environment Variables

1. Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

2. Open `.env` and fill in your Supabase credentials:

```env
# Web App
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Mobile App
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note**: The developer will provide the actual Supabase credentials separately for security.

## 🌐 Running the Web Application

Open a terminal and run:

```bash
npm run dev:web
```

The web app will open automatically at `http://localhost:3000`

### Web Features:
- Browse events with filters and search
- User authentication (login/signup)
- Event booking system
- Shopping cart
- User dashboard with bookings
- QR code for tickets
- Organizer dashboard (admin features)
- Analytics and reporting

## 📱 Running the Mobile Application

### Option 1: Using Your Phone (Recommended)

1. Install **Expo Go** app on your phone

2. Open a terminal and run:

```bash
npm run dev:mobile
```

3. A QR code will appear in the terminal

4. Scan the QR code:
   - **iOS**: Use Camera app
   - **Android**: Use Expo Go app

5. The app will load on your phone!

### Option 2: Using Android Emulator

```bash
npm run dev:mobile
# Press 'a' to open in Android emulator
```

### Option 3: Using iOS Simulator (Mac only)

```bash
npm run dev:mobile
# Press 'i' to open in iOS simulator
```

### Mobile Features:
- Browse events
- User authentication (login/signup)
- Event details
- Booking system
- User dashboard with bookings
- QR code tickets
- Bottom tab navigation

## 🧪 Testing Both Versions

To test both web and mobile simultaneously:

1. **Terminal 1** (Web):
```bash
npm run dev:web
```

2. **Terminal 2** (Mobile):
```bash
npm run dev:mobile
```

Both apps share the same Supabase backend, so:
- Create an account on web → Login with same account on mobile
- Book an event on mobile → See it in web dashboard
- All data syncs in real-time!

## 👤 Test User Accounts

For testing purposes, you can:

1. **Create a new account**: Use the Sign Up feature
2. **Use demo account** (if provided by developer)

## 🗄️ Database Schema

The Supabase database includes these tables:
- `users` - User profiles
- `events` - Event listings
- `bookings` - Event bookings
- `promo_codes` - Discount codes
- `attendance` - Check-in records
- `activity_logs` - Activity tracking

## 📸 Screenshots

### Web Application
- Homepage with event listings
- Event details and booking
- User dashboard
- Organizer dashboard with analytics

### Mobile Application
- Event list with pull-to-refresh
- Event details
- Booking screen
- Dashboard with QR codes

## 🐛 Troubleshooting

### Web App Issues

**Issue**: "Module not found" errors
```bash
cd apps/web
npm install
```

**Issue**: Build fails
```bash
cd apps/web
rm -rf node_modules package-lock.json
npm install
```

### Mobile App Issues

**Issue**: "Metro bundler" errors
```bash
pnpm --filter mobile start --clear
```

**Issue**: Can't connect to Expo
- Make sure your phone and computer are on the same WiFi
- Try using tunnel mode: `pnpm --filter mobile start --tunnel`

**Issue**: Environment variables not loading
- Make sure `.env` file is in the root directory
- Restart the dev server after changing `.env`

## 📦 Building for Production

### Web App
```bash
npm run build:web
# Output will be in apps/web/build/
```

### Mobile App
```bash
cd apps/mobile
npx expo build:android  # For Android
npx expo build:ios      # For iOS (Mac only)
```

## 🔐 Security Notes

- `.env` file is NOT committed to Git (contains secrets)
- Supabase Row Level Security (RLS) is enabled
- User authentication required for bookings
- Admin features require special permissions

## 📝 Project Features

### Core Features
✅ User authentication (signup/login)
✅ Event browsing and filtering
✅ Event booking system
✅ Shopping cart
✅ Payment integration (ready)
✅ QR code tickets
✅ User dashboard
✅ Organizer dashboard
✅ Real-time updates
✅ Responsive design (web)
✅ Native mobile experience

### Web-Only Features
- Advanced analytics dashboard
- Event creation and management
- Promo code management
- Attendance tracking
- Activity logs

### Mobile-Only Features
- Native navigation (bottom tabs)
- Pull-to-refresh
- Optimized for touch
- Camera QR scanning (future)

## 🎯 Future Enhancements

- Push notifications for bookings
- In-app messaging
- Social sharing
- Calendar integration
- Offline mode
- Payment gateway integration

## 👨‍🏫 For Teachers/Reviewers

This project demonstrates:
- ✅ Full-stack development (Frontend + Backend)
- ✅ Cross-platform support (Web + Mobile)
- ✅ Modern React practices
- ✅ TypeScript type safety
- ✅ Real-time data synchronization
- ✅ Authentication and authorization
- ✅ Database design and management
- ✅ Responsive and mobile-first design
- ✅ Code organization and structure
- ✅ Environment configuration
- ✅ Version control (Git)

## 📧 Support

For issues or questions, contact:
- Developer: Jane
- Email: jingyi_1128@hotmail.com
- GitHub: https://github.com/Jane28SP

## 📄 License

This is a Final Year Project (FYP) for academic purposes.

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Status**: Ready for Testing ✅
