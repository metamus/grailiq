# GrailIQ Home Screen Widget

WidgetKit extension for iOS that displays your portfolio value, top movers, and watchlist count directly on the home screen.

## Features

- **Small Widget**: Portfolio total + 24h change (lock screen or home screen)
- **Medium Widget**: Portfolio + top 3 movers with scores
- **Large Widget**: Portfolio + top 5 movers + watchlist count + last update time

All widgets refresh every 15 minutes and read from shared App Group storage (`group.com.grailiq.app`).

## Setup in Xcode

**When you run `npx expo prebuild --clean` on your Mac:**

1. Open `ios/GrailIQ.xcworkspace` in Xcode
2. In the Project Navigator, right-click the project and select "Add Files to..."
3. Navigate to `ios-widget/` and select the folder
4. Check "Copy items if needed" and select your main app target
5. Click "Add"
6. A new target called `GrailIQWidget` (or similar) will be created

## Configuration

The plugin (in `plugins/withWidgetExtension.js`) automates target configuration during `expo prebuild`.

In Xcode, verify:
1. The widget target has the same Team ID as your main app
2. Go to **Build Settings** → Code Signing → Provisioning Profile (should match main app)
3. The widget target's bundle ID should be `com.grailiq.app.GrailIQWidget`
4. The widget target has the App Groups entitlement (`group.com.grailiq.app`)

## Data Flow

1. Your React Native app fetches portfolio + watchlist data
2. On Home screen or after data update, call `pushWidgetSnapshot()` from `src/lib/widgetStorage.ts`
3. The function writes JSON to `UserDefaults(suiteName: "group.com.grailiq.app")`
4. The widget's TimelineProvider reads this data and displays it
5. Widget refreshes every 15 minutes (WidgetKit's minimum)

## Implementation

In your React Native Home screen:

```typescript
import { pushWidgetSnapshot } from '../lib/widgetStorage';

// After fetching portfolio data
await pushWidgetSnapshot({
  portfolioTotal: 2500.00,
  delta24h: 125.50,
  movers: [
    { name: 'Prismatic Evolutions ETB', delta: 12.4, score: 8.2, productId: 'abc123' },
    { name: 'Surging Sparks BB', delta: 6.8, score: 7.9, productId: 'def456' },
    // ... more movers
  ],
});
```

## Files

- `GrailIQWidget.swift` — Main widget implementation (3 widget sizes)
- `Info.plist` — Extension manifest
- `README.md` — This file

## Troubleshooting

- **Widget shows no data**: Verify that `pushWidgetSnapshot()` is being called from your app
- **Widget doesn't refresh**: Ensure the widget target has the App Groups entitlement
- **Build fails**: Check that bundle IDs match between main app and widget target
- **Data not shared**: Verify `UserDefaults(suiteName: "group.com.grailiq.app")` is used in both app and widget
