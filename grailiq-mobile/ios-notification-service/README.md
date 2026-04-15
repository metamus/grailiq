# NotificationService Extension

This directory contains the iOS Notification Service Extension (NSE) for GrailIQ, which enables rich push notifications with product images and action buttons.

## What it does

When a restock alert push arrives:
1. Downloads the product image from the URL in the payload
2. Attaches the image to the notification (display in iOS lock screen + notification center)
3. Registers action buttons ("Buy at Target" / "View in GrailIQ") that deep-link correctly

## Setup in Xcode

**When you run `npx expo prebuild --clean` on your Mac:**

1. Open `ios/GrailIQ.xcworkspace` in Xcode
2. In the Xcode Project Navigator, right-click the project and select "Add Files to..."
3. Navigate to `ios-notification-service/` and select the folder
4. In the "Add Files" dialog:
   - Check "Copy items if needed"
   - Select your target (the main app target, not the test target)
   - Click "Add"
5. A new target called `NotificationService` will be created in your project

## Configuration

The plugin (in `plugins/withNotificationServiceExtension.js`) automates most of this during `expo prebuild`. However, in Xcode you must:

1. Select the `NotificationService` target
2. Go to **Build Settings** → Search for "Code Signing"
3. Ensure the code signing identity matches your main app target

## Capabilities

- **Push Image Download**: If your backend includes `imageUrl` in the push payload, the NSE downloads it
- **Action Buttons**: Registered via `registerNotificationCategories()` in the JS layer
- **Mutable Content**: The NSE modifies incoming notifications to attach images
- **Deep Linking**: Action buttons trigger deep links (e.g., `grailiq://product/123` or direct retail URL)

## Payload Format

Your backend should send Expo push with:

```json
{
  "to": "ExponentPushToken[...]",
  "title": "🔔 Back in stock at Target",
  "body": "Prismatic Evolutions ETB — $84.99",
  "sound": "default",
  "categoryId": "restock_alert",
  "mutableContent": true,
  "data": {
    "type": "restock",
    "productId": "abc123",
    "retailer": "target",
    "retailerUrl": "https://target.com/...",
    "productName": "Prismatic Evolutions ETB",
    "imageUrl": "https://images.grailiq.com/...png"
  }
}
```

## Troubleshooting

- **Images not showing**: Check that `imageUrl` is a valid HTTPS URL and that the NSE has time to download it (typically 30 seconds) before the user dismisses the notification.
- **Action buttons not appearing**: Ensure the JS layer calls `registerNotificationCategories()` at app boot and that the push payload includes `categoryId: "restock_alert"`.
- **Build failures**: Verify that the NSE target has the same Team ID and Code Signing Identity as the main app.

## Files

- `NotificationService.swift` — Main extension handler (downloads images, attaches to notification)
- `Info.plist` — Extension manifest (required by iOS)
- `README.md` — This file
