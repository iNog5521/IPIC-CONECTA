# IPIC CONECTA

Church management web application built with Next.js, Firebase, and PWA support.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage + Cloudinary
- **UI**: Custom CSS Modules + Lucide React icons

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd IPIC-CONECTA
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com):

1. **Create a Firebase project**
2. **Enable Firestore Database** - Start in production mode
3. **Enable Authentication** - Enable Email/Password and Google providers
4. **Enable Storage**

#### Copy environment template:

```bash
copy .env.example .env.local
```

#### Edit `.env.local` with your Firebase config:

```env
# Firebase Client Config (get from Project Settings > Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (for user deletion API)
# 1. Go to Project Settings > Service Accounts
# 2. Generate new private key
# 3. Copy the JSON content (single line)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore
```

Or copy the rules from `firestore.rules` to Firebase Console.

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard & management
│   ├── api/                # API routes (upload, delete-user)
│   ├── perfil/             # User profile page
│   ├── login/              # Login page
│   ├── cadastro/           # Registration page
│   ├── cultos/             # Services page
│   ├── avisos/             # Notices page
│   ├── oracoes/           # Prayers page
│   └── ...
├── components/             # Reusable React components
├── context/                # React contexts (Auth)
└── lib/                    # Firebase config & utilities

public/
├── ipic-conecta-logo.png   # App logo
└── manifest.json           # PWA manifest
```

## Features

- User authentication (email/password + Google)
- Member management (admin)
- Church services (cultos) with schedule
- Prayer requests
- Notices/messages system
- User profile with avatar upload
- PWA support (installable)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Firebase Hosting

```bash
firebase init hosting
npm run build
firebase deploy
```

## License

MIT