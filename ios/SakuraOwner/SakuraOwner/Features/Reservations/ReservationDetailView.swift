import SwiftUI

struct ReservationDetailView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @Environment(\.openURL) private var openURL
    let reservation: Reservation

    private let detailColumns = [GridItem(.adaptive(minimum: 235), spacing: 16)]

    var body: some View {
        ZStack {
            SakuraAtmosphere(petalCount: 12)

            ScrollView {
                VStack(alignment: .leading, spacing: 25) {
                    hero
                    serviceCard
                    contactActions
                    if reservation.status == .pending { pendingActions }
                    customerDetails
                    statusMenu
                }
                .padding(30)
                .frame(maxWidth: 940, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
        }
        .navigationTitle(reservation.customerName)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var hero: some View {
        ZStack(alignment: .topTrailing) {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    StatusBadge(status: reservation.status)
                    Text(reservation.reservationReference)
                        .font(.caption.monospaced().weight(.semibold))
                        .foregroundStyle(theme.secondaryText)
                    Spacer()
                }

                VStack(alignment: .leading, spacing: 7) {
                    Text("GUEST RESERVATION")
                        .font(.system(size: 10, weight: .black))
                        .tracking(2.4)
                        .foregroundStyle(theme.gold)
                    Text(reservation.customerName)
                        .font(.system(size: 50, weight: .medium, design: .serif))
                        .tracking(-1.1)
                        .minimumScaleFactor(0.72)
                        .lineLimit(1)
                    HStack(spacing: 8) {
                        Image(systemName: "fork.knife.circle.fill")
                        Text(reservation.courseName)
                    }
                    .font(.title3.weight(.medium))
                    .foregroundStyle(theme.paleGold)
                }
                .padding(.trailing, 155)
            }

            VStack(alignment: .trailing, spacing: 2) {
                Text(reservation.displayTime)
                    .font(.system(size: 53, weight: .medium, design: .serif))
                    .monospacedDigit()
                    .foregroundStyle(theme.paleGold)
                Text("\(reservation.guestCount) GUEST\(reservation.guestCount == 1 ? "" : "S")")
                    .font(.system(size: 9, weight: .black))
                    .tracking(1.8)
                    .foregroundStyle(theme.gold)
            }
            .padding(17)
            .background(theme.burgundy.opacity(0.3), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(theme.gold.opacity(0.2))
            }
        }
        .padding(24)
        .sakuraGlass(cornerRadius: 26, tint: theme.wine.opacity(0.24))
        .overlay(alignment: .bottom) {
            LinearGradient(colors: [.clear, theme.gold.opacity(0.66), .clear], startPoint: .leading, endPoint: .trailing)
                .frame(height: 1)
                .padding(.horizontal, 34)
        }
    }

    private var serviceCard: some View {
        SakuraGlassGroup(spacing: 12) {
            HStack(spacing: 12) {
                Metric(icon: "calendar", title: "Service date", value: prettyDate)
                Metric(icon: "clock.fill", title: "Arrival", value: reservation.displayTime)
                Metric(icon: "person.2.fill", title: "Party size", value: "\(reservation.guestCount) guests")
            }
        }
    }

    private var contactActions: some View {
        VStack(alignment: .leading, spacing: 11) {
            sectionLabel("CONNECT WITH THE GUEST")
            SakuraGlassGroup(spacing: 12) {
                HStack(spacing: 12) {
                    ActionButton(title: "Call", subtitle: reservation.customerPhone, icon: "phone.fill") {
                        if let url = URL(string: "tel:\(reservation.customerPhone.filter { $0.isNumber || $0 == "+" })") { openURL(url) }
                    }
                    ActionButton(title: "Email", subtitle: "Send a message", icon: "envelope.fill") {
                        if let url = URL(string: "mailto:\(reservation.customerEmail)") { openURL(url) }
                    }
                    ShareLink(item: summaryText) {
                        HStack(spacing: 12) {
                            Image(systemName: "square.and.arrow.up.fill")
                                .font(.title3)
                                .foregroundStyle(theme.paleGold)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Share")
                                    .font(.subheadline.weight(.bold))
                                Text("Reservation summary")
                                    .font(.caption2)
                                    .foregroundStyle(theme.secondaryText)
                            }
                            Spacer()
                        }
                        .padding(15)
                        .frame(maxWidth: .infinity)
                        .sakuraGlass(cornerRadius: 17, tint: theme.wine.opacity(0.12), interactive: true)
                    }
                    .buttonStyle(SakuraPressButtonStyle())
                }
            }
        }
    }

    private var pendingActions: some View {
        VStack(alignment: .leading, spacing: 13) {
            HStack {
                sectionLabel("DECISION REQUIRED")
                Spacer()
                Text("The guest is waiting")
                    .font(.caption.italic())
                    .foregroundStyle(theme.secondaryText)
            }

            ViewThatFits(in: .horizontal) {
                HStack(spacing: 13) { decisionButtons }
                VStack(spacing: 13) { decisionButtons }
            }
        }
        .padding(20)
        .background(
            LinearGradient(colors: [theme.burgundy.opacity(0.31), theme.wine.opacity(0.17)], startPoint: .topLeading, endPoint: .bottomTrailing),
            in: RoundedRectangle(cornerRadius: 24, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(theme.gold.opacity(0.26))
        }
    }

    @ViewBuilder
    private var decisionButtons: some View {
        StatusActionButton(
            title: "Confirm reservation",
            subtitle: "Accept and notify the dashboard",
            icon: "checkmark.seal.fill",
            colors: [theme.paleGold, theme.gold],
            foreground: theme.ink
        ) {
            await appState.updateStatus(.confirmed, for: reservation)
        }

        StatusActionButton(
            title: "Reject request",
            subtitle: "Mark this request as rejected",
            icon: "xmark.circle.fill",
            colors: [Color.red.opacity(0.78), theme.burgundy],
            foreground: .white
        ) {
            await appState.updateStatus(.rejected, for: reservation)
        }
    }

    private var customerDetails: some View {
        VStack(alignment: .leading, spacing: 13) {
            sectionLabel("GUEST & SERVICE DETAILS")
            LazyVGrid(columns: detailColumns, alignment: .leading, spacing: 16) {
                DetailCard(title: "Phone", value: reservation.customerPhone, icon: "phone.fill")
                DetailCard(title: "Email", value: reservation.customerEmail, icon: "envelope.fill")
                DetailCard(title: "Seating", value: reservation.seatingPreference.replacingOccurrences(of: "_", with: " ").capitalized, icon: "chair.lounge.fill")
                DetailCard(title: "Occasion", value: reservation.occasion.capitalized, icon: "sparkles")
                DetailCard(title: "Allergies / dietary", value: reservation.allergies?.nilIfBlank ?? "None provided", icon: "cross.case.fill")
                DetailCard(title: "Special requests", value: reservation.specialRequests?.nilIfBlank ?? "None provided", icon: "text.bubble.fill")
            }
        }
    }

    private var statusMenu: some View {
        HStack(spacing: 15) {
            Image(systemName: "arrow.triangle.2.circlepath.circle.fill")
                .font(.title2)
                .foregroundStyle(theme.paleGold)
            VStack(alignment: .leading, spacing: 3) {
                Text("Reservation lifecycle")
                    .font(.headline)
                Text("Move this booking to another service status.")
                    .font(.caption)
                    .foregroundStyle(theme.secondaryText)
            }
            Spacer()
            if appState.updatingReservationIDs.contains(reservation.id) {
                ProgressView().tint(theme.gold)
            } else {
                Menu {
                    ForEach(ReservationStatus.allCases.filter { $0 != reservation.status }) { status in
                        Button(status.title) { Task { await appState.updateStatus(status, for: reservation) } }
                    }
                } label: {
                    HStack(spacing: 9) {
                        StatusBadge(status: reservation.status)
                        Image(systemName: "chevron.up.chevron.down")
                            .font(.caption.weight(.bold))
                    }
                    .padding(11)
                    .sakuraGlass(cornerRadius: 15, tint: theme.wine.opacity(0.12), interactive: true)
                }
            }
        }
        .padding(19)
        .sakuraGlass(cornerRadius: 21, tint: theme.wine.opacity(0.1))
    }

    private func sectionLabel(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 10, weight: .black))
            .tracking(2)
            .foregroundStyle(theme.gold)
    }

    private var prettyDate: String {
        let input = DateFormatter()
        input.calendar = Calendar(identifier: .gregorian)
        input.locale = Locale(identifier: "en_US_POSIX")
        input.timeZone = TimeZone(identifier: "Asia/Tokyo")
        input.dateFormat = "yyyy-MM-dd"
        guard let date = input.date(from: reservation.reservationDate) else { return reservation.reservationDate }
        return date.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day())
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
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(theme.paleGold)
                Spacer()
                Circle()
                    .fill(theme.gold.opacity(0.55))
                    .frame(width: 5, height: 5)
            }
            Text(title.uppercased())
                .font(.system(size: 9, weight: .black))
                .tracking(1.4)
                .foregroundStyle(theme.secondaryText)
            Text(value)
                .font(.system(.title3, design: .serif, weight: .semibold))
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .padding(18)
        .frame(maxWidth: .infinity, minHeight: 126, alignment: .leading)
        .sakuraGlass(cornerRadius: 20, tint: theme.burgundy.opacity(0.13))
    }
}

private struct ActionButton: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(theme.paleGold)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.bold))
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundStyle(theme.secondaryText)
                        .lineLimit(1)
                }
                Spacer()
            }
            .padding(15)
            .frame(maxWidth: .infinity)
            .sakuraGlass(cornerRadius: 17, tint: theme.wine.opacity(0.12), interactive: true)
        }
        .buttonStyle(SakuraPressButtonStyle())
    }
}

private struct StatusActionButton: View {
    let title: String
    let subtitle: String
    let icon: String
    let colors: [Color]
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
            HStack(spacing: 14) {
                if isWorking {
                    ProgressView().tint(foreground)
                } else {
                    Image(systemName: icon)
                        .font(.title2)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                    Text(subtitle)
                        .font(.caption2)
                        .opacity(0.72)
                }
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.subheadline.weight(.bold))
            }
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity)
            .padding(17)
            .background(
                LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing),
                in: RoundedRectangle(cornerRadius: 17, style: .continuous)
            )
            .overlay {
                RoundedRectangle(cornerRadius: 17, style: .continuous)
                    .stroke(Color.white.opacity(0.28))
            }
            .shadow(color: colors.last?.opacity(0.2) ?? .clear, radius: 16, y: 8)
        }
        .buttonStyle(SakuraPressButtonStyle())
        .disabled(isWorking)
    }
}

private struct DetailCard: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(theme.paleGold)
                    .frame(width: 34, height: 34)
                    .background(theme.burgundy.opacity(0.32), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                Spacer()
                Text(title.uppercased())
                    .font(.system(size: 9, weight: .black))
                    .tracking(1.2)
                    .foregroundStyle(theme.gold)
            }
            Text(value)
                .font(.body)
                .foregroundStyle(.white.opacity(0.9))
                .textSelection(.enabled)
        }
        .padding(17)
        .frame(maxWidth: .infinity, minHeight: 120, alignment: .topLeading)
        .background(
            LinearGradient(colors: [Color.white.opacity(0.07), theme.wine.opacity(0.12)], startPoint: .topLeading, endPoint: .bottomTrailing),
            in: RoundedRectangle(cornerRadius: 19, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 19, style: .continuous)
                .stroke(Color.white.opacity(0.075))
        }
    }
}

struct ReservationEmptyDetail: View {
    @Environment(SakuraTheme.self) private var theme

    var body: some View {
        ZStack {
            SakuraAtmosphere(petalCount: 18)
            VStack(spacing: 22) {
                ZStack {
                    Circle()
                        .stroke(theme.gold.opacity(0.18), lineWidth: 1)
                        .frame(width: 132, height: 132)
                    Image(systemName: "calendar.badge.clock")
                        .font(.system(size: 42, weight: .light))
                        .foregroundStyle(theme.paleGold)
                        .frame(width: 94, height: 94)
                        .sakuraGlass(cornerRadius: 29, tint: theme.burgundy.opacity(0.2))
                }
                VStack(spacing: 8) {
                    Text("Choose a reservation")
                        .font(.system(size: 34, weight: .medium, design: .serif))
                    Text("Select a guest request to open the full service story.")
                        .font(.subheadline)
                        .foregroundStyle(theme.secondaryText)
                }
            }
            .multilineTextAlignment(.center)
            .padding(42)
        }
    }
}

private extension String {
    var nilIfBlank: String? { trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : self }
}
