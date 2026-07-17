import SwiftUI

struct ReservationDashboardView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language
    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    var body: some View {
        @Bindable var state = appState
        ZStack(alignment: .top) {
            theme.appBackground.ignoresSafeArea()

            NavigationSplitView(columnVisibility: $columnVisibility) {
                ReservationSidebar()
                    .navigationSplitViewColumnWidth(min: 210, ideal: 246, max: 280)
            } content: {
                ReservationListView()
                    .navigationSplitViewColumnWidth(min: 350, ideal: 410, max: 480)
            } detail: {
                if let reservation = appState.selectedReservation {
                    ReservationDetailView(reservation: reservation)
                        .id(reservation.id)
                } else {
                    ReservationEmptyDetail()
                }
            }
            .navigationSplitViewStyle(.balanced)
            .tint(theme.gold)
            .searchable(
                text: $state.searchText,
                placement: .sidebar,
                prompt: language.text("Name, phone or reference", "नाम, फोन वा सन्दर्भ")
            )
            .toolbarBackground(theme.ink.opacity(0.92), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)

            if let newest = appState.newestReservation {
                NewReservationBanner(reservation: newest) {
                    withAnimation(.snappy(duration: 0.35)) {
                        appState.selectedReservationID = newest.id
                        appState.newestReservation = nil
                    }
                }
                .padding(.top, 12)
                .padding(.horizontal, 20)
                .transition(.move(edge: .top).combined(with: .opacity))
                .zIndex(20)
            }
        }
        .task { await appState.monitorReservations() }
        .animation(.spring(response: 0.45, dampingFraction: 0.82), value: appState.newestReservation?.id)
        .alert(language.text("Reservations", "आरक्षण"), isPresented: Binding(
            get: { appState.errorMessage != nil },
            set: { if !$0 { appState.errorMessage = nil } }
        )) {
            Button(language.text("Close", "बन्द"), role: .cancel) { appState.errorMessage = nil }
        } message: {
            Text(appState.errorMessage ?? "")
        }
    }
}

private struct ReservationSidebar: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language

    var body: some View {
        @Bindable var state = appState
        ZStack {
            LinearGradient(
                colors: [theme.ink, theme.deepBurgundy, theme.ink],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    brandHeader
                    liveSummary

                    VStack(alignment: .leading, spacing: 8) {
                        sectionLabel(language.text("FILTER", "फिल्टर"))
                        ForEach(ReservationFilter.allCases) { filter in
                            SidebarFilterButton(
                                filter: filter,
                                count: count(for: filter),
                                isSelected: state.filter == filter
                            ) {
                                withAnimation(.snappy(duration: 0.28)) {
                                    state.filter = filter
                                }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        sectionLabel(language.text("TOOLS", "उपकरण"))
                        SidebarToolButton(
                            title: language.text("Test chime", "घण्टी परीक्षण"),
                            icon: "speaker.wave.3.fill"
                        ) { appState.testAlert() }

                        SidebarToolButton(
                            title: language.text("Refresh", "रिफ्रेस"),
                            icon: "arrow.clockwise"
                        ) {
                            Task { await appState.refreshReservations() }
                        }
                        .disabled(appState.isLoading)
                    }

                    Button(role: .destructive) { appState.signOut() } label: {
                        Label(language.text("Sign out", "साइन आउट"), systemImage: "rectangle.portrait.and.arrow.right")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.white.opacity(0.68))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(13)
                            .sakuraGlass(cornerRadius: 14, tint: Color.red.opacity(0.06), interactive: true)
                    }
                    .buttonStyle(SakuraPressButtonStyle())
                }
                .padding(.horizontal, 15)
                .padding(.vertical, 18)
            }
        }
        .navigationTitle(language.text("Reservations", "आरक्षण"))
    }

    private var brandHeader: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 13) {
                SakuraMark(size: 44)
                VStack(alignment: .leading, spacing: 2) {
                    Text("SAKURA")
                        .font(.headline.weight(.black))
                        .tracking(1.8)
                    Text(language.text("Owner", "सञ्चालक"))
                        .font(.caption)
                        .foregroundStyle(theme.secondaryText)
                }
            }
            SakuraLanguagePicker()
        }
    }

    private var liveSummary: some View {
        HStack(spacing: 12) {
            SakuraLiveIndicator()
            Spacer(minLength: 8)
            Text("\(pendingCount)")
                .font(.title2.monospacedDigit().weight(.semibold))
                .foregroundStyle(theme.paleGold)
            Text(language.text("waiting", "बाँकी"))
                .font(.caption)
                .foregroundStyle(theme.secondaryText)
        }
        .padding(14)
        .sakuraGlass(cornerRadius: 16, tint: theme.burgundy.opacity(0.16))
        .accessibilityElement(children: .combine)
    }

    private func sectionLabel(_ title: String) -> some View {
        Text(title)
            .font(.caption2.weight(.bold))
            .foregroundStyle(theme.gold)
            .padding(.leading, 4)
    }

    private var pendingCount: Int {
        appState.reservations.filter { $0.status == .pending }.count
    }

    private func count(for filter: ReservationFilter) -> Int {
        switch filter {
        case .all: appState.reservations.count
        case .pending: pendingCount
        case .confirmed: appState.reservations.filter { $0.status == .confirmed }.count
        case .today: appState.reservations.filter { $0.reservationDate == tokyoToday }.count
        case .upcoming: appState.reservations.filter { $0.reservationDate > tokyoToday }.count
        }
    }

    private var tokyoToday: String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "Asia/Tokyo")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}

private struct SidebarFilterButton: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language
    let filter: ReservationFilter
    let count: Int
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 11) {
                Image(systemName: filter.icon)
                    .font(.subheadline.weight(.semibold))
                    .frame(width: 26)
                Text(filter.title(in: language.current))
                    .font(.subheadline.weight(isSelected ? .semibold : .regular))
                    .lineLimit(1)
                Spacer(minLength: 6)
                Text("\(count)")
                    .font(.caption.monospacedDigit().weight(.semibold))
            }
            .foregroundStyle(isSelected ? theme.ink : .white.opacity(0.82))
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .background(isSelected ? theme.paleGold : Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
        }
        .buttonStyle(SakuraPressButtonStyle())
    }
}

private struct SidebarToolButton: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.white.opacity(0.82))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .padding(.vertical, 11)
                .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
        }
        .buttonStyle(SakuraPressButtonStyle())
    }
}

private struct NewReservationBanner: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language
    let reservation: Reservation
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: "bell.fill")
                    .font(.headline)
                    .foregroundStyle(theme.ink)
                    .frame(width: 42, height: 42)
                    .background(theme.paleGold, in: Circle())

                VStack(alignment: .leading, spacing: 3) {
                    Text(language.text("New reservation", "नयाँ आरक्षण"))
                        .font(.caption.weight(.bold))
                        .foregroundStyle(theme.gold)
                    Text(reservation.customerName)
                        .font(.headline)
                        .lineLimit(1)
                    Text("\(reservation.displayTime) · \(reservation.guestCount) \(language.text("guests", "पाहुना")) · \(reservation.courseName(in: language.current))")
                        .font(.caption)
                        .foregroundStyle(theme.secondaryText)
                        .lineLimit(2)
                }
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(theme.paleGold)
            }
            .padding(14)
            .frame(maxWidth: 540, alignment: .leading)
            .sakuraGlass(cornerRadius: 18, tint: theme.burgundy.opacity(0.34), interactive: true)
            .overlay { RoundedRectangle(cornerRadius: 18).stroke(theme.gold.opacity(0.3)) }
        }
        .buttonStyle(SakuraPressButtonStyle())
        .accessibilityElement(children: .combine)
        .accessibilityHint(language.text("Open reservation", "आरक्षण खोल्नुहोस्"))
    }
}

#if DEBUG
#Preview("iPad owner dashboard") {
    let state = AppState()
    state.phase = .signedIn
    state.reservations = [.previewPending, .previewConfirmed]
    state.selectedReservationID = state.reservations.first?.id
    return ReservationDashboardView()
        .environment(state)
        .environment(SakuraTheme())
        .environment(SakuraLanguageStore())
        .preferredColorScheme(.dark)
}
#endif
