# Study Buddy

## Stack

- Web: React, TypeScript, Vite, Tailwind CSS (`apps/web`).
- Mobile: Flutter and Dart (`apps/mobile`), for Android.
- Backend: Node.js, Express, TypeScript (`server`).
- Database: MongoDB Atlas, accessed through Mongoose.

## Development

Use Node.js 24 or a compatible version supported by Vite.

```sh
npm install
npm run dev:web
```

In a separate terminal:

```sh
cp server/.env.example server/.env
npm run dev:server
```

The web app runs at http://localhost:5173; the backend listens on port 3000.
Set `MONGODB_URI` in `server/.env` to connect to your Atlas database. When it is
empty, the backend starts without a database connection. Atlas is hosted and
requires a separately configured cluster and credentials.

```sh
npm run typecheck
npm run build
```

## Mobile

Flutter and Dart are installed locally in the ignored `.tools/flutter` directory.
From the repository root:

```sh
export PATH="$PWD/.tools/flutter/bin:$PATH"
cd apps/mobile
flutter pub get
flutter run
```

Other contributors need their own Flutter SDK installation. Android builds require
Android Studio / Android SDK.

Server configuration belongs in `server/src/config/`. The `docs/` and empty server
source directories remain available for future work. Only the base technology
setup is included.
