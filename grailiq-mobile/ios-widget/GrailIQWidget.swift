import SwiftUI
import WidgetKit

struct WidgetSnapshot: Codable {
  let portfolioTotal: Double
  let delta24h: Double
  let movers: [PortfolioMover]
  let watchlistCount: Int
  let updatedAt: Date
}

struct PortfolioMover: Codable {
  let name: String
  let delta: Double
  let score: Double
  let productId: String
}

// MARK: - Widget Timeline Provider

struct GrailIQWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> WidgetEntry {
    WidgetEntry(
      date: Date(),
      snapshot: WidgetSnapshot(
        portfolioTotal: 2500.00,
        delta24h: 125.50,
        movers: [
          PortfolioMover(
            name: "Prismatic Evolutions ETB",
            delta: 12.4,
            score: 8.2,
            productId: "abc123"
          ),
          PortfolioMover(
            name: "Surging Sparks BB",
            delta: 6.8,
            score: 7.9,
            productId: "def456"
          ),
          PortfolioMover(
            name: "Journey Together Bundle",
            delta: 3.1,
            score: 6.5,
            productId: "ghi789"
          ),
        ],
        watchlistCount: 14,
        updatedAt: Date()
      )
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (WidgetEntry) -> ()) {
    // Load from App Group shared storage for preview
    let entry = loadWidgetSnapshot()
    completion(entry)
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetEntry>) -> ()) {
    // Load current snapshot from shared storage
    let entry = loadWidgetSnapshot()

    // Request refresh every 15 minutes
    let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
    let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))

    completion(timeline)
  }

  private func loadWidgetSnapshot() -> WidgetEntry {
    let defaults = UserDefaults(suiteName: "group.com.grailiq.app") ?? UserDefaults.standard

    if let data = defaults.data(forKey: "widget_snapshot"),
       let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data) {
      return WidgetEntry(date: snapshot.updatedAt, snapshot: snapshot)
    }

    // Fallback if no data in shared storage
    return WidgetEntry(
      date: Date(),
      snapshot: WidgetSnapshot(
        portfolioTotal: 0,
        delta24h: 0,
        movers: [],
        watchlistCount: 0,
        updatedAt: Date()
      )
    )
  }
}

// MARK: - Widget Entry

struct WidgetEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot
}

// MARK: - Widget Views

struct SmallWidgetView: View {
  let entry: WidgetEntry
  let snapshot = WidgetSnapshot(
    portfolioTotal: 0,
    delta24h: 0,
    movers: [],
    watchlistCount: 0,
    updatedAt: Date()
  )

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        VStack(alignment: .leading, spacing: 2) {
          Text("Portfolio")
            .font(.caption)
            .foregroundColor(.gray)
          Text(String(format: "$%.0f", entry.snapshot.portfolioTotal))
            .font(.headline)
            .fontWeight(.bold)
        }
        Spacer()
        VStack(alignment: .trailing, spacing: 2) {
          Text("24h")
            .font(.caption)
            .foregroundColor(.gray)
          HStack(spacing: 2) {
            Image(systemName: entry.snapshot.delta24h >= 0 ? "arrow.up" : "arrow.down")
              .font(.caption)
            Text(String(format: "%+.1f%%", entry.snapshot.delta24h))
              .font(.caption)
              .fontWeight(.semibold)
          }
          .foregroundColor(entry.snapshot.delta24h >= 0 ? .green : .red)
        }
      }
    }
    .padding()
    .background(Color(red: 0.06, green: 0.06, blue: 0.08))
  }
}

struct MediumWidgetView: View {
  let entry: WidgetEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack {
        VStack(alignment: .leading, spacing: 2) {
          Text("Portfolio")
            .font(.caption)
            .foregroundColor(.gray)
          Text(String(format: "$%.0f", entry.snapshot.portfolioTotal))
            .font(.headline)
            .fontWeight(.bold)
        }
        Spacer()
        VStack(alignment: .trailing, spacing: 2) {
          Text("24h")
            .font(.caption)
            .foregroundColor(.gray)
          HStack(spacing: 2) {
            Image(systemName: entry.snapshot.delta24h >= 0 ? "arrow.up" : "arrow.down")
              .font(.caption)
            Text(String(format: "%+.1f%%", entry.snapshot.delta24h))
              .font(.caption)
              .fontWeight(.semibold)
          }
          .foregroundColor(entry.snapshot.delta24h >= 0 ? .green : .red)
        }
      }

      Divider()
        .background(Color.gray.opacity(0.3))

      // Top 3 movers
      VStack(spacing: 6) {
        ForEach(entry.snapshot.movers.prefix(3), id: \.productId) { mover in
          HStack {
            VStack(alignment: .leading, spacing: 2) {
              Text(mover.name)
                .font(.caption)
                .fontWeight(.semibold)
                .lineLimit(1)
              Text(String(format: "Score: %.1f", mover.score))
                .font(.caption2)
                .foregroundColor(.gray)
            }
            Spacer()
            HStack(spacing: 2) {
              Image(systemName: mover.delta >= 0 ? "arrow.up" : "arrow.down")
                .font(.caption2)
              Text(String(format: "%+.1f%%", mover.delta))
                .font(.caption2)
                .fontWeight(.semibold)
            }
            .foregroundColor(mover.delta >= 0 ? .green : .red)
          }
        }
      }
    }
    .padding()
    .background(Color(red: 0.06, green: 0.06, blue: 0.08))
  }
}

struct LargeWidgetView: View {
  let entry: WidgetEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      // Portfolio header
      HStack {
        VStack(alignment: .leading, spacing: 2) {
          Text("Portfolio")
            .font(.caption)
            .foregroundColor(.gray)
          Text(String(format: "$%.0f", entry.snapshot.portfolioTotal))
            .font(.system(size: 22))
            .fontWeight(.bold)
        }
        Spacer()
        VStack(alignment: .trailing, spacing: 2) {
          Text("24h Change")
            .font(.caption)
            .foregroundColor(.gray)
          HStack(spacing: 2) {
            Image(systemName: entry.snapshot.delta24h >= 0 ? "arrow.up" : "arrow.down")
            Text(String(format: "%+.1f%%", entry.snapshot.delta24h))
              .fontWeight(.semibold)
          }
          .foregroundColor(entry.snapshot.delta24h >= 0 ? .green : .red)
        }
      }

      Divider()
        .background(Color.gray.opacity(0.3))

      // Top 5 movers
      VStack(spacing: 8) {
        ForEach(entry.snapshot.movers.prefix(5), id: \.productId) { mover in
          HStack {
            VStack(alignment: .leading, spacing: 1) {
              Text(mover.name)
                .font(.caption)
                .fontWeight(.semibold)
                .lineLimit(1)
              Text(String(format: "Score: %.1f", mover.score))
                .font(.caption2)
                .foregroundColor(.gray)
            }
            Spacer()
            HStack(spacing: 4) {
              Image(systemName: mover.delta >= 0 ? "arrow.up" : "arrow.down")
                .font(.caption2)
              Text(String(format: "%+.1f%%", mover.delta))
                .font(.caption2)
                .fontWeight(.semibold)
            }
            .foregroundColor(mover.delta >= 0 ? .green : .red)
          }
        }
      }

      Spacer()

      HStack {
        Label("\(entry.snapshot.watchlistCount) on Watchlist", systemImage: "bookmark.fill")
          .font(.caption2)
          .foregroundColor(.gray)
        Spacer()
        Text("Updated: \(entry.date, style: .time)")
          .font(.caption2)
          .foregroundColor(.gray)
      }
    }
    .padding()
    .background(Color(red: 0.06, green: 0.06, blue: 0.08))
  }
}

// MARK: - Widget Bundle

@main
struct GrailIQWidgets: WidgetBundle {
  var body: some Widget {
    GrailIQSmallWidget()
    GrailIQMediumWidget()
    GrailIQLargeWidget()
  }
}

struct GrailIQSmallWidget: Widget {
  let kind: String = "com.grailiq.widget.small"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GrailIQWidgetProvider()) { entry in
      SmallWidgetView(entry: entry)
    }
    .configurationDisplayName("Portfolio")
    .description("Your portfolio total and 24h change.")
    .supportedFamilies([.systemSmall])
  }
}

struct GrailIQMediumWidget: Widget {
  let kind: String = "com.grailiq.widget.medium"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GrailIQWidgetProvider()) { entry in
      MediumWidgetView(entry: entry)
    }
    .configurationDisplayName("Top Movers")
    .description("Portfolio and top 3 movers.")
    .supportedFamilies([.systemMedium])
  }
}

struct GrailIQLargeWidget: Widget {
  let kind: String = "com.grailiq.widget.large"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GrailIQWidgetProvider()) { entry in
      LargeWidgetView(entry: entry)
    }
    .configurationDisplayName("Full Portfolio")
    .description("Portfolio, top 5 movers, and watchlist count.")
    .supportedFamilies([.systemLarge])
  }
}

// MARK: - Previews

#Preview(as: .systemSmall) {
  GrailIQSmallWidget()
} timeline: {
  WidgetEntry(
    date: Date(),
    snapshot: WidgetSnapshot(
      portfolioTotal: 2500.00,
      delta24h: 125.50,
      movers: [
        PortfolioMover(
          name: "Prismatic Evolutions ETB",
          delta: 12.4,
          score: 8.2,
          productId: "abc123"
        ),
      ],
      watchlistCount: 14,
      updatedAt: Date()
    )
  )
}

#Preview(as: .systemMedium) {
  GrailIQMediumWidget()
} timeline: {
  WidgetEntry(
    date: Date(),
    snapshot: WidgetSnapshot(
      portfolioTotal: 2500.00,
      delta24h: 125.50,
      movers: [
        PortfolioMover(
          name: "Prismatic Evolutions ETB",
          delta: 12.4,
          score: 8.2,
          productId: "abc123"
        ),
        PortfolioMover(
          name: "Surging Sparks BB",
          delta: 6.8,
          score: 7.9,
          productId: "def456"
        ),
        PortfolioMover(
          name: "Journey Together Bundle",
          delta: 3.1,
          score: 6.5,
          productId: "ghi789"
        ),
      ],
      watchlistCount: 14,
      updatedAt: Date()
    )
  )
}
