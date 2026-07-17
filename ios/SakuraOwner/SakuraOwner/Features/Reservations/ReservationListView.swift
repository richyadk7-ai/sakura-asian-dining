import SwiftUI

struct ReservationListView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language

    var body: some View {
        @Bindable var state = appState
        VStack(spacing: 0) {
            QueueHeader(
                title: appState.filter.title(in: language.current),
                total: appState.filteredReservations.count,
                pending: appState.filteredReservations.filter { $0.status == .pending }.count
            )

            Group {
                if appState.isLoading && appState.reservations.isEmpty {
                    VStack(spacing: 14) {
                        ProgressView().tint(theme.gold).controlSize(.large)
                        Text(language.text("Loading reservations…", "आरक्षण लोड हुँदैछ…"))
                            .font(.subheadline)
                            .foregroundStyle(theme.secondaryText)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if appState.filteredReservations.isEmpty {
                    ContentUnavailableView(
                        language.text("No reservations", "आरक्षण छैन"),
                        systemImage: "calendar.badge.checkmark",
                        description: Text(language.text("Try another filter or search.", "अर्को फिल्टर वा खोज प्रयोग गर्नुहोस्।"))
                    )
                } else {
                    List(selection: $state.selectedReservationID) {
                        ForEach(appState.filteredReservations) { reservation in
                            ReservationRow(
                                reservation: reservation,
                                isSelected: appState.selectedReservationID == reservation.id
                            )
                            .tag(reservation.id)
                            .listRowInsets(.init(top: 6, leading: 12, bottom: 6, trailing: 12))
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .environment(\.defaultMinListRowHeight, 1)
                    .refreshable { await appState.refreshReservations() }
                }
            }
        }
        .background(
            LinearGradient(
                colors: [theme.deepBurgundy.opacity(0.96), theme.ink],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .navigationTitle(appState.filter.title(in: language.current))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if let lastUpdated = appState.lastUpdated {
                    Text(lastUpdated, style: .time)
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(theme.secondaryText)
                        .accessibilityLabel(language.text("Last updated", "अन्तिम अपडेट"))
                }
            }
        }
    }
}

private struct QueueHeader: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language
    let title: String
    let total: Int
    let pending: Int

    var body: some View {
        HStack(spacing: 12) {
            Text(title)
                .font(.title2.weight(.semibold))
                .lineLimit(1)
            Spacer(minLength: 8)
            CountPill(value: total, label: language.text("total", "जम्मा"), color: theme.secondaryText)
            if pending > 0 {
                CountPill(value: pending, label: language.text("waiting", "बाँकी"), color: theme.gold)
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(theme.ink.opacity(0.48))
        .overlay(alignment: .bottom) { Rectangle().fill(theme.gold.opacity(0.18)).frame(height: 1) }
    }
}

private struct CountPill: View {
    let value: Int
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 5) {
            Text("\(value)").font(.caption.monospacedDigit().weight(.bold))
            Text(label).font(.caption2).lineLimit(1)
        }
        .foregroundStyle(color)
        .padding(.horizontal, 9)
        .padding(.vertical, 6)
        .background(Color.white.opacity(0.05), in: Capsule())
    }
}

private struct ReservationRow: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language
    let reservation: Reservation
    let isSelected: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 13) {
            dateTile

            VStack(alignment: .leading, spacing: 7) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(reservation.customerName)
                        .font(.headline)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    Spacer(minLength: 4)
                    Text(reservation.displayTime)
                        .font(.headline.monospacedDigit())
                        .foregroundStyle(theme.paleGold)
                }

                Text(reservation.courseName(in: language.current))
                    .font(.subheadline)
                    .foregroundStyle(theme.secondaryText)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 8) {
                        guestAndReference
                        Spacer(minLength: 0)
                        StatusBadge(status: reservation.status)
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        guestAndReference
                        StatusBadge(status: reservation.status)
                    }
                }
            }
        }
        .padding(13)
        .background(
            isSelected ? theme.burgundy.opacity(0.5) : Color.white.opacity(0.045),
            in: RoundedRectangle(cornerRadius: 17, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 17, style: .continuous)
                .stroke(isSelected ? theme.gold.opacity(0.56) : Color.white.opacity(0.07))
        }
        .contentShape(RoundedRectangle(cornerRadius: 17, style: .continuous))
        .animation(.snappy(duration: 0.25), value: isSelected)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "\(reservation.customerName), \(reservation.status.title(in: language.current)), \(reservation.displayTime), \(reservation.guestCount) \(language.text("guests", "पाहुना"))"
        )
    }

    private var guestAndReference: some View {
        HStack(spacing: 8) {
            Label("\(reservation.guestCount)", systemImage: "person.2.fill")
                .font(.caption)
                .foregroundStyle(theme.secondaryText)
            Text(reservation.reservationReference)
                .font(.caption2.monospaced())
                .foregroundStyle(theme.secondaryText)
                .lineLimit(1)
        }
    }

    private var dateTile: some View {
        VStack(spacing: 1) {
            Text(monthLabel)
                .font(.caption2.weight(.bold))
                .foregroundStyle(isSelected ? theme.ink.opacity(0.7) : theme.gold)
                .lineLimit(1)
            Text(dayLabel)
                .font(.title2.weight(.semibold))
                .foregroundStyle(isSelected ? theme.ink : theme.paleGold)
        }
        .frame(width: 50, height: 58)
        .background(isSelected ? theme.paleGold : theme.burgundy.opacity(0.3), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
    }

    private var parsedDate: Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "Asia/Tokyo")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: reservation.reservationDate)
    }

    private var monthLabel: String {
        guard let parsedDate else { return "—" }
        let formatter = DateFormatter()
        formatter.locale = language.current.locale
        formatter.timeZone = TimeZone(identifier: "Asia/Tokyo")
        formatter.dateFormat = "MMM"
        return formatter.string(from: parsedDate)
    }

    private var dayLabel: String {
        guard let parsedDate else { return "—" }
        let formatter = DateFormatter()
        formatter.locale = language.current.locale
        formatter.timeZone = TimeZone(identifier: "Asia/Tokyo")
        formatter.dateFormat = "d"
        return formatter.string(from: parsedDate)
    }
}

struct StatusBadge: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language
    let status: ReservationStatus

    var body: some View {
        Text(status.title(in: language.current))
            .font(.caption2.weight(.bold))
            .foregroundStyle(status == .pending ? theme.ink : .white)
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(badgeColor, in: Capsule())
            .fixedSize(horizontal: true, vertical: false)
    }

    private var badgeColor: Color {
        switch status {
        case .pending: theme.gold
        case .confirmed: .green.opacity(0.68)
        case .rejected, .cancelled: .red.opacity(0.68)
        case .completed: .blue.opacity(0.6)
        case .noShow: .gray.opacity(0.5)
        }
    }
}
