import SwiftUI

struct ReservationListView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme

    var body: some View {
        @Bindable var state = appState
        VStack(spacing: 0) {
            QueueHeader(
                title: appState.filter.title,
                total: appState.filteredReservations.count,
                pending: appState.filteredReservations.filter { $0.status == .pending }.count
            )

            Group {
                if appState.isLoading && appState.reservations.isEmpty {
                    VStack(spacing: 18) {
                        ProgressView().tint(theme.gold).controlSize(.large)
                        Text("Opening today’s reservation flow…")
                            .font(.system(.headline, design: .serif))
                            .foregroundStyle(theme.secondaryText)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if appState.filteredReservations.isEmpty {
                    ContentUnavailableView(
                        "The queue is clear",
                        systemImage: "sparkles",
                        description: Text("Change the filter or search to find another reservation.")
                    )
                    .symbolEffect(.pulse, options: .repeating.speed(0.35))
                } else {
                    List(selection: $state.selectedReservationID) {
                        ForEach(appState.filteredReservations) { reservation in
                            ReservationRow(
                                reservation: reservation,
                                isSelected: appState.selectedReservationID == reservation.id
                            )
                            .tag(reservation.id)
                            .listRowInsets(.init(top: 7, leading: 13, bottom: 7, trailing: 13))
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .refreshable { await appState.refreshReservations() }
                }
            }
        }
        .background(
            LinearGradient(
                colors: [theme.deepBurgundy.opacity(0.95), theme.ink.opacity(0.97)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .navigationTitle(appState.filter.title)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if let lastUpdated = appState.lastUpdated {
                    HStack(spacing: 7) {
                        Circle().fill(theme.gold).frame(width: 5, height: 5)
                        Text(lastUpdated, style: .time)
                            .monospacedDigit()
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(theme.secondaryText)
                    .accessibilityLabel("Last updated \(lastUpdated.formatted(date: .omitted, time: .shortened))")
                }
            }
        }
    }
}

private struct QueueHeader: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let total: Int
    let pending: Int

    var body: some View {
        HStack(alignment: .bottom, spacing: 18) {
            VStack(alignment: .leading, spacing: 5) {
                Text("RESERVATION FLOW")
                    .font(.system(size: 9, weight: .black))
                    .tracking(2.2)
                    .foregroundStyle(theme.gold)
                Text(title)
                    .font(.system(size: 31, weight: .semibold, design: .serif))
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(total)")
                    .font(.system(size: 29, weight: .medium, design: .serif))
                    .foregroundStyle(theme.paleGold)
                    .contentTransition(.numericText())
                Text(total == 1 ? "REQUEST" : "REQUESTS")
                    .font(.system(size: 8, weight: .black))
                    .tracking(1.5)
                    .foregroundStyle(theme.secondaryText)
            }
            if pending > 0 {
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(pending)")
                        .font(.system(size: 29, weight: .medium, design: .serif))
                        .foregroundStyle(theme.petalLight)
                        .contentTransition(.numericText())
                    Text("NEEDS ACTION")
                        .font(.system(size: 8, weight: .black))
                        .tracking(1.3)
                        .foregroundStyle(theme.gold)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 17)
        .padding(.bottom, 15)
        .background(theme.ink.opacity(0.42))
        .overlay(alignment: .bottom) {
            LinearGradient(colors: [.clear, theme.gold.opacity(0.45), .clear], startPoint: .leading, endPoint: .trailing)
                .frame(height: 1)
        }
    }
}

private struct ReservationRow: View {
    @Environment(SakuraTheme.self) private var theme
    let reservation: Reservation
    let isSelected: Bool

    var body: some View {
        HStack(spacing: 15) {
            dateTile

            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .firstTextBaseline) {
                    Text(reservation.customerName)
                        .font(.system(.headline, design: .serif, weight: .semibold))
                        .lineLimit(1)
                    Spacer(minLength: 8)
                    StatusBadge(status: reservation.status)
                }

                HStack(spacing: 7) {
                    Image(systemName: "clock.fill")
                        .foregroundStyle(theme.gold)
                    Text(reservation.displayTime)
                        .font(.body.monospacedDigit().weight(.bold))
                    Text("·")
                        .foregroundStyle(theme.secondaryText)
                    Image(systemName: "person.2.fill")
                        .foregroundStyle(theme.gold)
                    Text("\(reservation.guestCount)")
                        .font(.subheadline.weight(.semibold))
                }

                HStack(spacing: 7) {
                    Image(systemName: "fork.knife")
                    Text(reservation.courseName)
                        .lineLimit(1)
                    Spacer(minLength: 4)
                    Text(reservation.reservationReference)
                        .font(.system(size: 9, weight: .semibold, design: .monospaced))
                }
                .font(.caption)
                .foregroundStyle(theme.secondaryText)
            }
        }
        .padding(14)
        .background(
            LinearGradient(
                colors: isSelected
                    ? [theme.burgundy.opacity(0.72), theme.wine.opacity(0.82)]
                    : [Color.white.opacity(0.07), Color.white.opacity(0.025)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 21, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 21, style: .continuous)
                .stroke(
                    LinearGradient(
                        colors: isSelected
                            ? [theme.paleGold.opacity(0.72), theme.gold.opacity(0.12)]
                            : [Color.white.opacity(0.11), Color.white.opacity(0.02)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: isSelected ? 1.25 : 1
                )
        }
        .shadow(color: isSelected ? theme.burgundy.opacity(0.34) : .clear, radius: 18, y: 8)
        .contentShape(RoundedRectangle(cornerRadius: 21, style: .continuous))
        .animation(.snappy(duration: 0.32), value: isSelected)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(reservation.customerName), \(reservation.status.title), \(reservation.reservationDate) at \(reservation.displayTime), \(reservation.guestCount) guests")
    }

    private var dateTile: some View {
        VStack(spacing: 2) {
            Text(monthLabel)
                .font(.system(size: 9, weight: .black))
                .tracking(1.3)
                .foregroundStyle(isSelected ? theme.ink.opacity(0.7) : theme.gold)
            Text(dayLabel)
                .font(.system(size: 28, weight: .semibold, design: .serif))
                .foregroundStyle(isSelected ? theme.ink : theme.paleGold)
        }
        .frame(width: 55, height: 66)
        .background(isSelected ? theme.paleGold : theme.burgundy.opacity(0.38), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(theme.gold.opacity(isSelected ? 0 : 0.24))
        }
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
        guard let parsedDate else { return "DATE" }
        return parsedDate.formatted(.dateTime.month(.abbreviated)).uppercased()
    }

    private var dayLabel: String {
        guard let parsedDate else { return "—" }
        return parsedDate.formatted(.dateTime.day())
    }
}

struct StatusBadge: View {
    @Environment(SakuraTheme.self) private var theme
    let status: ReservationStatus

    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(dotColor)
                .frame(width: 5, height: 5)
            Text(status.title.uppercased())
                .font(.system(size: 9, weight: .black))
                .tracking(0.9)
        }
        .foregroundStyle(status == .pending ? theme.ink : .white)
        .padding(.horizontal, 9)
        .padding(.vertical, 6)
        .background(badgeColor, in: Capsule())
        .overlay { Capsule().stroke(Color.white.opacity(status == .pending ? 0.3 : 0.14)) }
    }

    private var dotColor: Color {
        status == .pending ? theme.burgundy : .white.opacity(0.9)
    }

    private var badgeColor: Color {
        switch status {
        case .pending: theme.gold
        case .confirmed: .green.opacity(0.7)
        case .rejected, .cancelled: .red.opacity(0.7)
        case .completed: .blue.opacity(0.62)
        case .noShow: .gray.opacity(0.52)
        }
    }
}
