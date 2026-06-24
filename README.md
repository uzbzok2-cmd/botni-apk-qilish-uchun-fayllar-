# 📱 Ustoz AI — Android APK Build

  Bu repo Expo React Native mobil ilovasi kodlarini o'z ichiga oladi.

  ## ⚡ APK build qilish (2 qadam)

  ### 1. Expo tokenni o'rnating
  Expo.dev akkauntga kiring: [expo.dev](https://expo.dev)

  ### 2. Terminal da shu komandalarni bajaring:
  ```bash
  # Reponi yuklab oling
  git clone https://github.com/uzbzok2-cmd/botni-apk-qilish-uchun-fayllar-.git
  cd botni-apk-qilish-uchun-fayllar-

  # Dependencies o'rnating
  npm install

  # EAS CLI o'rnating
  npm install -g eas-cli

  # Login qiling
  eas login

  # APK build boshlang
  eas build --platform android --profile preview --non-interactive
  ```

  APK tayyor bo'lgach: [expo.dev/accounts/alibek2000/projects/ustoz-ai/builds](https://expo.dev/accounts/alibek2000/projects/ustoz-ai/builds)

  ## 📂 Fayl strukturasi
  ```
  ├── app/                  # Barcha ekranlar (expo-router)
  │   ├── _layout.tsx       # Root layout
  │   ├── index.tsx         # Splash/yo'naltirish
  │   ├── register.tsx      # Ro'yxatdan o'tish (4 qadam)
  │   ├── payment.tsx       # To'lov ekrani
  │   ├── admin.tsx         # Admin panel
  │   ├── chat/[lang].tsx   # AI tutor chat
  │   ├── exam/ielts.tsx    # IELTS imtihon
  │   ├── exam/cert.tsx     # Rus sertifikat imtihon
  │   └── (tabs)/           # Tab navigatsiya
  ├── lib/api.ts            # Backend API client
  ├── context/UserContext.tsx
  ├── constants/colors.ts   # Dark/Gold tema
  └── eas.json              # EAS build konfiguratsiya
  ```
  