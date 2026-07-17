import SwiftUI

struct ReservationDetailView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language
    @Environment(\.openURL) private var openURL
    let reservation: Reservation

    private let metricColumns = [GridItem(.adaptive(minimum: 145), spacing: 10)]
    private let detailColumns = [GridItem(.adaptive(minimum: 220), spacing: 12)]
    private let actionColumns = [GridItem(.adaptive(minimum: 120), spacing: 10)]

    var body: some View {
        ZStack {
            SakuraAtmosphere(petalCount: 6, showsMonogram: false)

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    hero
                    serviceSummary
                    contactActions
                    if reservation.status == .pending { pendingActions }
                    guestDetails
                    statusMenu
                }
                .padding(24)
                .frame(maxWidth: 900, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
        }
        .navigationTitle(reservation.customerName)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 10) {
                StatusBadge(status: reservation.status)
                Text(reservation.reservationReference)
                    .font(.caption2.monospaced())
                    .foregroundStyle(theme.secondaryText)
                    .lineLimit(1)
                Spacer()
            }

            ViewThatFits(in: .horizontal) {
                HStack(alignment: .bottom, spacing: 18) {
                    guestHeading
                    Spacer(minLength: 12)
                    timeHeading
                }
                VStack(alignment: .leading, spacing: 14) {
                    guestHeading
                    timeHeading
                }
            }
        }
        .padding(22)
        .sakuraGlass(cornerRadius: 22, tint: theme.wine.opacity(0.18))
    }

    private var guestHeading: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(language.text("RESERVATION", "आरक्षण"))
                .font(.caption2.weight(.bold))
                .foregroundStyle(theme.gold)
            Text(reservation.customerName)
                .font(.largeTitle.weight(.semibold))
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
            Label(reservation.courseName(in: language.current), systemImage: "fork.knife")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(theme.paleGold)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var timeHeading: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(reservation.displayTime)
                .font(.system(size: 38, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(theme.paleGold)
            Text("\(reservation.guestCount) \(language.text("guests", "पाहुना"))")
                .font(.caption.weight(.semibold))
                .foregroundStyle(theme.gold)
                .lineLimit(1)
        }
    }

    private var serviceSummary: some View {
        LazyVGrid(columns: metricColumns, alignment: .leading, spacing: 10) {
            Metric(icon: "calendar", title: language.text("Date", "मिति"), value: prettyDate)
            Metric(icon: "clock.fill", title: language.text("Time", "समय"), value: reservation.displayTime)
            Metric(icon: "person.2.fill", title: language.text("Guests", "पाहुना"), value: "\(reservation.guestCount)")
        }
    }

    private var contactActions: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel(language.text("CONTACT", "सम्पर्क"))
            LazyVGrid(columns: actionColumns, spacing: 10) {
                CompactActionButton(title: language.text("Call", "फोन"), icon: "phone.fill") {
                    if let url = URL(string: "tel:\(reservation.customerPhone.filter { $0.isNumber || $0 == "+" })") { openURL(url) }
                }
                CompactActionButton(title: language.text("Email", "इमेल"), icon: "envelope.fill") {
                    if let url = URL(string: "mailto:\(reservation.customerEmail)") { openURL(url) }
                }
                ShareLink(item: summaryText) {
                    Label(language.text("Share", "सेयर"), systemImage: "square.and.arrow.up.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .sakuraGlass(cornerRadius: 15, tint: theme.wine.opacity(0.1), interactive: true)
                }
                .buttonStyle(SakuraPressButtonStyle())
            }
        }
    }

    private var pendingActions: some View {
        VStack(alignment: .leading, spacing: 11) {
            sectionLabel(language.text("DECISION", "निर्णय"))
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 10) { decisionButtons }
                VStack(spacing: 10) { decisionButtons }
            }
        }
        .padding(17)
        .background(theme.burgundy.opacity(0.18), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: 18).stroke(theme.gold.opacity(0.2)) }
    }

    @ViewBuilder
    private var decisionButtons: some View {
        StatusActionButton(
            title: language.text("Confirm", "पुष्टि गर्नुहोस्"),
            icon: "checkmark.circle.fill",
            colors: [theme.paleGold, theme.gold],
            foreground: theme.ink
        ) {
            await appState.updateStatus(.confirmed, for: reservation)
        }

        StatusActionButton(
            title: language.text("Reject", "अस्वीकार गर्नुहोस्"),
            icon: "xmark.circle.fill",
            colors: [Color.red.opacity(0.78), theme.burgundy],
            foreground: .white
        ) {
            await appState.updateStatus(.rejected, for: reservation)
        }
    }

    private var guestDetails: some View {
        VStack(alignment: .leading, spacing: 11) {
            sectionLabel(language.text("DETAILS", "विवरण"))
            LazyVGrid(columns: detailColumns, alignment: .leading, spacing: 12) {
                DetailCard(title: language.text("Phone", "फोन"), value: reservation.customerPhone, icon: "phone.fill")
                DetailCard(title: language.text("Email", "इमेल"), value: reservation.customerEmail, icon: "envelope.fill")
                DetailCard(title: language.text("Seating", "बस्ने ठाउँ"), value: localizedSeating, icon: "chair.lounge.fill")
                DetailCard(title: language.text("Occasion", "अवसर"), value: localizedOccasion, icon: "sparkles")
                DetailCard(
                    title: language.text("Allergies / dietary", "एलर्जी / आहार"),
                    value: reservation.allergies?.nilIfBlank ?? language.text("None provided", "जानकारी दिइएको छैन"),
                    icon: "cross.case.fill"
                )
                DetailCard(
                    title: language.text("Special requests", "विशेष अनुरोध"),
                    value: reservation.specialRequests?.nilIfBlank ?? language.text("None provided", "जानकारी दिइएको छैन"),
                    icon: "text.bubble.fill"
                )
            }
        }
    }

    private var statusMenu: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 12) {
                statusMenuLabel
                Spacer(minLength: 12)
                statusControl
            }
            VStack(alignment: .leading, spacing: 12) {
                statusMenuLabel
                statusControl
            }
        }
        .padding(17)
        .sakuraGlass(cornerRadius: 18, tint: theme.wine.opacity(0.08))
    }

    private var statusMenuLabel: some View {
        Label(language.text("Status", "स्थिति"), systemImage: "arrow.triangle.2.circlepath")
            .font(.headline)
            .foregroundStyle(theme.paleGold)
    }

    @ViewBuilder
    private var statusControl: some View {
        if appState.updatingReservationIDs.contains(reservation.id) {
            ProgressView().tint(theme.gold)
        } else {
            Menu {
                ForEach(ReservationStatus.allCases.filter { $0 != reservation.status }) { status in
                    Button(status.title(in: language.current)) {
                        Task { await appState.updateStatus(status, for: reservation) }
                    }
                }
            } label: {
                HStack(spacing: 8) {
                    StatusBadge(status: reservation.status)
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.caption.weight(.bold))
                }
                .padding(8)
                .sakuraGlass(cornerRadius: 13, tint: theme.wine.opacity(0.08), interactive: true)
            }
        }
    }

    private func sectionLabel(_ title: String) -> some View {
        Text(title)
            .font(.caption2.weight(.bold))
            .foregroundStyle(theme.gold)
    }

    private var prettyDate: String {
        let input = DateFormatter()
        input.calendar = Calendar(identifier: .gregorian)
        input.locale = Locale(identifier: "en_US_POSIX")
        input.timeZone = TimeZone(identifier: "Asia/Tokyo")
        input.dateFormat = "yyyy-MM-dd"
        guard let date = input.date(from: reservation.reservationDate) else { return reservation.reservationDate }
        let output = DateFormatter()
        output.calendar = Calendar(identifier: .gregorian)
        output.locale = language.current.locale
        output.timeZone = TimeZone(identifier: "Asia/Tokyo")
        output.dateStyle = .medium
        return output.string(from: date)
    }

    private var localizedSeating: String {
        switch reservation.seatingPreference {
        case "no_preference": language.text("No preference", "कुनै प्राथमिकता छैन")
        case "table": language.text("Table", "टेबल")
        case "counter": language.text("Counter", "काउन्टर")
        default: reservation.seatingPreference.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    private var localizedOccasion: String {
        switch reservation.occasion {
        case "none", "": language.text("None", "छैन")
        case "birthday": language.text("Birthday", "जन्मदिन")
        case "anniversary": language.text("Anniversary", "वार्षिकोत्सव")
        case "business": language.text("Business", "व्यावसायिक")
        default: reservation.occasion.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    private var summaryText: String {
        "\(reservation.reservationReference) — \(reservation.customerName), \(prettyDate), \(reservation.displayTime), \(reservation.guestCount) \(language.text("guests", "पाहुना")), \(reservation.courseName(in: language.current))"
    }
}

private struct Metric: View {
    @Environment(SakuraTheme.self) private var theme
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(theme.paleGold)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(theme.secondaryText)
                    .lineLimit(1)
                Text(value)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 66, alignment: .leading)
        .sakuraGlass(cornerRadius: 15, tint: theme.burgundy.opacity(0.09))
    }
}

private struct CompactActionButton: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .lineLimit(1)
                .frame(maxWidth: .infinity)
                .padding(14)
                .sakuraGlass(cornerRadius: 15, tint: theme.wine.opacity(0.1), interactive: true)
        }
        .buttonStyle(SakuraPressButtonStyle())
    }
}

private struct StatusActionButton: View {
    let title: String
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
            HStack(spacing: 10) {
                if isWorking { ProgressView().tint(foreground) }
                else { Image(systemName: icon) }
                Text(title)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .font(.headline)
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity)
            .padding(15)
            .background(
                LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing),
                in: RoundedRectangle(cornerRadius: 15, style: .continuous)
            )
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
        VStack(alignment: .leading, spacing: 9) {
            Label(title, systemImage: icon)
                .font(.caption.weight(.semibold))
                .foregroundStyle(theme.gold)
                .lineLimit(2)
            Text(value)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.9))
                .fixedSize(horizontal: false, vertical: true)
                .textSelection(.enabled)
        }
        .padding(15)
        .frame(maxWidth: .infinity, minHeight: 96, alignment: .topLeading)
        .background(Color.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.07)) }
    }
}

struct ReservationEmptyDetail: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language

    var body: some View {
        ZStack {
            SakuraAtmosphere(petalCount: 6, showsMonogram: false)
            VStack(spacing: 16) {
                Image(systemName: "calendar.badge.clock")
                    .font(.system(size: 34, weight: .light))
                    .foregroundStyle(theme.paleGold)
                    .frame(width: 76, height: 76)
                    .sakuraGlass(cornerRadius: 22, tint: theme.burgundy.opacity(0.14))
                Text(language.text("Choose a reservation", "आरक्षण छान्नुहोस्"))
                    .font(.title2.weight(.semibold))
                Text(language.text("Select a request from the list.", "सूचीबाट अनुरोध छान्नुहोस्।"))
                    .font(.subheadline)
                    .foregroundStyle(theme.secondaryText)
            }
            .multilineTextAlignment(.center)
            .padding(30)
        }
    }
}

private extension String {
    var nilIfBlank: String? { trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : self }
}
