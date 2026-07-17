import SwiftUI

struct ReservationListView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme

    var body: some View {
        @Bindable var state = appState
        Group {
            if appState.isLoading && appState.reservations.isEmpty {
                ProgressView("Loading reservations…")
                    .tint(theme.gold)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if appState.filteredReservations.isEmpty {
                ContentUnavailableView(
                    "No matching reservations",
                    systemImage: "calendar.badge.checkmark",
                    description: Text("Change the queue filter or search text.")
                )
            } else {
                List(selection: $state.selectedReservationID) {
                    ForEach(appState.filteredReservations) { reservation in
                        ReservationRow(reservation: reservation)
                            .tag(reservation.id)
                            .listRowInsets(.init(top: 6, leading: 12, bottom: 6, trailing: 12))
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .refreshable { await appState.refreshReservations() }
            }
        }
        .background(theme.deepBurgundy.opacity(0.74))
        .navigationTitle(appState.filter.title)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if let lastUpdated = appState.lastUpdated {
                    Text(lastUpdated, style: .time)
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(theme.secondaryText)
                        .accessibilityLabel("Last updated \(lastUpdated.formatted(date: .omitted, time: .shortened))")
                }
            }
        }
    }
}

private struct ReservationRow: View {
    @Environment(SakuraTheme.self) private var theme
    let reservation: Reservation

    var body: some View {
        HStack(spacing: 15) {
            VStack(spacing: 3) {
                Text(reservation.displayTime)
                    .font(.headline.monospacedDigit())
                Text("\(reservation.guestCount) pax")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(theme.gold)
            }
            .frame(width: 62)

            Rectangle()
                .fill(statusColor.opacity(0.8))
                .frame(width: 3, height: 62)
                .clipShape(Capsule())

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(reservation.customerName)
                        .font(.headline)
                        .lineLimit(1)
                    Spacer()
                    StatusBadge(status: reservation.status)
                }
                Text(reservation.reservationReference)
                    .font(.caption.monospaced())
                    .foregroundStyle(theme.secondaryText)
                HStack(spacing: 7) {
                    Text(reservation.reservationDate)
                    Text("·")
                    Text(reservation.courseName)
                        .lineLimit(1)
                }
                .font(.caption)
                .foregroundStyle(theme.secondaryText)
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.055), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Color.white.opacity(0.06)) }
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(reservation.customerName), \(reservation.status.title), \(reservation.reservationDate) at \(reservation.displayTime), \(reservation.guestCount) guests")
    }

    private var statusColor: Color {
        switch reservation.status {
        case .pending: theme.gold
        case .confirmed: .green
        case .rejected, .cancelled: .red
        case .completed: .blue
        case .noShow: .gray
        }
    }
}

struct StatusBadge: View {
    @Environment(SakuraTheme.self) private var theme
    let status: ReservationStatus

    var body: some View {
        Text(status.title.uppercased())
            .font(.system(size: 9, weight: .black))
            .tracking(0.9)
            .foregroundStyle(status == .pending ? theme.ink : .white)
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(badgeColor, in: Capsule())
    }

    private var badgeColor: Color {
        switch status {
        case .pending: theme.gold
        case .confirmed: .green.opacity(0.72)
        case .rejected, .cancelled: .red.opacity(0.72)
        case .completed: .blue.opacity(0.65)
        case .noShow: .gray.opacity(0.55)
        }
    }
}
