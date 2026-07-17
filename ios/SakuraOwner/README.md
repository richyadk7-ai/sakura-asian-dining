# Sakura Owner for iPad

A native bilingual SwiftUI owner application for Sakura Asian Dining & Bar. It supports persistent English/Nepali switching, signs in through the existing Supabase owner allowlist, reads reservations under Row Level Security, polls every five seconds while active, plays a synthesized two-stage native alert, and allows owners to confirm, reject or update reservation status. Customer-facing status decisions pass through Sakura's protected production API so approval, rejection and cancellation emails are sent consistently with the web dashboard.

## Generate and build

```bash
cd ios/SakuraOwner
xcodegen generate
DEVELOPER_DIR=/Applications/Xcode-old.app/Contents/Developer \
  xcodebuild -project SakuraOwner.xcodeproj -scheme SakuraOwner \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Open `SakuraOwner.xcodeproj` in Xcode and run it on an iPad simulator or a provisioned iPad. Sign in with the same Supabase owner email/password used by `/admin/reservations`.

The app targets iPadOS 17 and later, including iPadOS 26. The checked-in Personal Team build can run on a connected iPad from Xcode. Public App Store or TestFlight distribution requires membership in the Apple Developer Program and completion of Apple's App Store Connect review and privacy information.

## Notifications

Foreground alerts are fully native and work without a paid notification vendor while the app is active. The checked-in free-build configuration intentionally omits the APNs entitlement so a Personal Team can sign the app. Lock-screen notifications require a paid Apple Developer team, a Push Notifications capability/provisioning profile, server-side APNs credentials, and a separate push-enabled build configuration. Those credentials must never be committed to this repository.
