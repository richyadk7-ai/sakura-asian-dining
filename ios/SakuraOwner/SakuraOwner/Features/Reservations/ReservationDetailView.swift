import SwiftUI

struct ReservationDetailView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @Environment(\.openURL) private var openURL
    let reservation: Reservation

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                header
                serviceCard
                contactActions
                if reservation.status == .pending { pendingActions }
                detailsGrid
                statusMenu
            }
            .padding(32)
            .frame(maxWidth: 920, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .background(theme.appBackground)
        .navigationTitle(reservation.customerName)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                StatusBadge(status: reservation.status)
                Spacer()
                Text(reservation.reservationReference)
                    .font(.caption.monospaced().weight(.semibold))
                    .foregroundStyle(theme.secondaryText)
            }
            Text(reservation.customerName)
                .font(.system(size: 48, weight: .medium, design: .serif))
                .tracking(-0.8)
            Text(reservation.courseName)
                .font(.title3)
                .foregroundStyle(theme.paleGold)
        }
    }

    private var serviceCard: some View {
        HStack(spacing: 0) {
            Metric(icon: "calendar", title: "Date", value: reservation.reservationDate)
            Divider().overlay(Color.white.opacity(0.12))
            Metric(icon: "clock", title: "Time", value: reservation.displayTime)
            Divider().overlay(Color.white.opacity(0.12))
            Metric(icon: "person.2", title: "Party", value: "\(reservation.guestCount) guests")
        }
        .padding(.vertical, 24)
        .sakuraPanel()
    }

    private var contactActions: some View {
        HStack(spacing: 12) {
            ActionButton(title: "Call", icon: "phone.fill") {
                if let url = URL(string: "tel:\(reservation.customerPhone.filter { $0.isNumber || $0 == "+" })") { openURL(url) }
            }
            ActionButton(title: "Email", icon: "envelope.fill") {
                if let url = URL(string: "mailto:\(reservation.customerEmail)") { openURL(url) }
            }
            ShareLink(item: summaryText) {
                Label("Share", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity)
                    .padding(15)
                    .background(Color.white.opacity(0.075), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(.plain)
        }
    }

    private var pendingActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("DECISION")
                .font(.caption.weight(.black))
                .tracking(2)
                .foregroundStyle(theme.gold)
            HStack(spacing: 12) {
                StatusActionButton(title: "Confirm reservation", icon: "checkmark.seal.fill", color: theme.gold, foreground: theme.ink) {
                    await appState.updateStatus(.confirmed, for: reservation)
                }
                StatusActionButton(title: "Reject request", icon: "xmark.circle", color: .red.opacity(0.72), foreground: .white) {
                    await appState.updateStatus(.rejected, for: reservation)
                }
            }
        }
    }

    private var detailsGrid: some View {
        Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 16) {
            GridRow {
                DetailCard(title: "Phone", value: reservation.customerPhone, icon: "phone")
                DetailCard(title: "Email", value: reservation.customerEmail, icon: "envelope")
            }
            GridRow {
                DetailCard(title: "Seating", value: reservation.seatingPreference.replacingOccurrences(of: "_", with: " ").capitalized, icon: "chair.lounge")
                DetailCard(title: "Occasion", value: reservation.occasion.capitalized, icon: "sparkles")
            }
            GridRow {
                DetailCard(title: "Allergies / dietary", value: reservation.allergies?.nilIfBlank ?? "None provided", icon: "cross.case")
                DetailCard(title: "Special requests", value: reservation.specialRequests?.nilIfBlank ?? "None provided", icon: "text.bubble")
            }
        }
    }

    private var statusMenu: some View {
        HStack {
            Text("Change status")
                .font(.headline)
            Spacer()
            if appState.updatingReservationIDs.contains(reservation.id) {
                ProgressView().tint(theme.gold)
            } else {
                Menu {
                    ForEach(ReservationStatus.allCases.filter { $0 != reservation.status }) { status in
                        Button(status.title) { Task { await appState.updateStatus(status, for: reservation) } }
                    }
                } label: {
                    Label(reservation.status.title, systemImage: "chevron.up.chevron.down")
                        .padding(.horizontal, 15)
                        .padding(.vertical, 11)
                        .background(Color.white.opacity(0.08), in: Capsule())
                }
            }
        }
        .padding(18)
        .background(Color.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var summaryText: String {
        "\(reservation.reservationReference) — \(reservation.customerName), \(reservation.reservationDate) at \(reservation.displayTime), \(reservation.guestCount) guests, \(reservation.courseName)"
    }
}

private struct Metric: View {
    @Environment(SakuraTheme.self) private var theme
    let icon: String
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 9) {
            Image(systemName: icon).foregroundStyle(theme.gold)
            Text(title.uppercased()).font(.caption2.weight(.black)).tracking(1.4).foregroundStyle(theme.secondaryText)
            Text(value).font(.title3.weight(.semibold)).monospacedDigit()
        }
        .frame(maxWidth: .infinity)
    }
}

private struct ActionButton: View {
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .frame(maxWidth: .infinity)
                .padding(15)
                .background(Color.white.opacity(0.075), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct StatusActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let foreground: Color
    let action: () async -> Void
    @State private var isWorking = false

    var body: some View {
        Button {
            isWorking = true
            Task {
                await action()
                isWorking = false
            }
        } label: {
            HStack {
                if isWorking { ProgressView().tint(foreground) }
                else { Image(systemName: icon) }
                Text(title)
            }
            .font(.headline)
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity)
            .padding(17)
            .background(color, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(isWorking)
    }
}

private struct DetailCard: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(title.uppercased(), systemImage: icon)
                .font(.caption2.weight(.black))
                .tracking(1.2)
                .foregroundStyle(theme.gold)
            Text(value)
                .font(.body)
                .foregroundStyle(.white.opacity(0.88))
                .textSelection(.enabled)
        }
        .padding(18)
        .frame(maxWidth: .infinity, minHeight: 112, alignment: .topLeading)
        .background(Color.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Color.white.opacity(0.055)) }
    }
}

struct ReservationEmptyDetail: View {
    @Environment(SakuraTheme.self) private var theme

    var body: some View {
        ZStack {
            theme.appBackground.ignoresSafeArea()
            ContentUnavailableView("Choose a reservation", systemImage: "calendar.badge.clock", description: Text("Select a customer request from the queue."))
        }
    }
}

private extension String {
    var nilIfBlank: String? { trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : self }
}
