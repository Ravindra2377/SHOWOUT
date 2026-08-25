# SHOWOUT Expo app

This Expo SDK 54 app is the native SHOWOUT pilot client. It authenticates with the Next API, reads PostgreSQL-backed challenges and Proof, selects or records a video, uploads directly through a signed storage intent, submits hidden work, and locks anonymous Reveal votes on the server. `WebCompanion.tsx` remains only as a PWA fallback.

## Physical phone

1. Connect the phone and development computer to the same Wi-Fi.
2. Start PostgreSQL, migrations, seed, and Next from the repository root (see the root README).
3. Find the computer LAN address with `hostname -I` (Linux), `ipconfig getifaddr en0` (macOS), or `ipconfig` (Windows).
4. Configure and start Expo:

   ```bash
   cd apps/expo
   cp .env.example .env
   # Edit EXPO_PUBLIC_SHOWOUT_URL to http://YOUR_LAN_IP:3001
   npm install
   npm start -- --lan --clear --port 8081
   ```

5. Open the current App Store version of Expo Go and scan the QR code.

If an older Metro process produced an SDK mismatch, close it and scan only `exp://YOUR_LAN_IP:8081`. The manifest must report `exposdk:54.0.0`.

## Simulators and web

- Android emulator API: `http://10.0.2.2:3001`
- iOS simulator API: `http://localhost:3001`
- Expo web uses development CORS headers from the Next server. Production requires an exact `EXPO_WEB_ORIGIN`.

Camera and photo-library permissions are requested only when the user chooses to record or select an Entry. A store build requires HTTPS and final platform permission review.
