import SwiftUI

struct ReservationDashboardView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    var body: some View {
        @Bindable var state = appState
        ZStack(alignment: .top) {
            SakuraAtmosphere(petalCount: 18, showsMonogram: false)

            NavigationSplitView(columnVisibility: $columnVisibility) {
                ReservationSidebar()
                    .navigationSplitViewColumnWidth(min: 220, ideal: 264, max: 310)
            } content: {
                ReservationListView()
                    .navigationSplitViewColumnWidth(min: 370, ideal: 450, max: 540)
            } detail: {
                if let reservation = appState.selectedReservation {
                    ReservationDetailView(reservation: reservation)
                        .id(reservation.id)
                } else {
                    ReservationEmptyDetail()
                }
            }
            .tint(theme.gold)
            .searchable(text: $state.searchText, placement: .sidebar, prompt: "Name, phone or reference")
            .toolbarBackground(theme.ink.opacity(0.9), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)

            if let newest = appState.newestReservation {
                NewReservationBanner(reservation: newest) {
                    withAnimation(.snappy(duration: 0.4)) {
                        appState.selectedReservationID = newest.id
                        appState.newestReservation = nil
                    }
                }
                .padding(.top, 16)
                .transition(.move(edge: .top).combined(with: .opacity).combined(with: .scale(scale: 0.94, anchor: .top)))
                .zIndex(20)
            }
        }
        .background(theme.appBackground.ignoresSafeArea())
        .task { await appState.monitorReservations() }
        .animation(.spring(response: 0.52, dampingFraction: 0.78), value: appState.newestReservation?.id)
        .alert("Reservation dashboard", isPresented: Binding(
            get: { appState.errorMessage != nil },
            set: { if !$0 { appState.errorMessage = nil } }
        )) {
            Button("Dismiss", role: .cancel) { appState.errorMessage = nil }
        } message: {
            Text(appState.errorMessage ?? "")
        }
    }
}

private struct ReservationSidebar: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme

    var body: some View {
        @Bindable var state = appState
        ZStack {
            LinearGradient(
                colors: [theme.ink, theme.deepBurgundy.opacity(0.95), theme.ink],
                startPoint: .top,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    brandHeader
                    servicePulse

                    VStack(alignment: .leading, spacing: 11) {
                        sectionLabel("QUEUE")
                        SakuraGlassGroup(spacing: 8) {
                            VStack(spacing: 8) {
                                ForEach(ReservationFilter.allCases) { filter in
                                    SidebarFilterButton(
                                        filter: filter,
                                        count: count(for: filter),
                                        isSelected: state.filter == filter
                                    ) {
                                        withAnimation(.snappy(duration: 0.32)) {
                                            state.filter = filter
                                        }
                                    }
                                }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 11) {
                        sectionLabel("SERVICE TOOLS")
                        SakuraGlassGroup(spacing: 9) {
                            VStack(spacing: 9) {
                                SidebarToolButton(
                                    title: appState.soundIsArmed ? "Test alert chime" : "Enable alert chime",
                                    subtitle: appState.soundIsArmed ? "Sound is armed" : "Tap to reactivate",
                                    icon: "speaker.wave.3.fill"
                                ) { appState.testAlert() }

                                SidebarToolButton(
                                    title: "Refresh now",
                                    subtitle: appState.lastUpdated.map { "Updated \($0.formatted(date: .omitted, time: .shortened))" } ?? "Sync reservations",
                                    icon: "arrow.clockwise"
                                ) {
                                    Task { await appState.refreshReservations() }
                                }
                                .disabled(appState.isLoading)
                            }
                        }
                    }

                    Button(role: .destructive) { appState.signOut() } label: {
                        HStack {
                            Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption.weight(.bold))
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.64))
                        .padding(15)
                        .sakuraGlass(cornerRadius: 16, tint: Color.red.opacity(0.08), interactive: true)
                    }
                    .buttonStyle(SakuraPressButtonStyle())
                }
                .padding(.horizontal, 17)
                .padding(.vertical, 22)
            }
        }
        .navigationTitle("Reservations")
    }

    private var brandHeader: some View {
        HStack(spacing: 15) {
            SakuraMark(size: 52)
            VStack(alignment: .leading, spacing: 3) {
                Text("SAKURA")
                    .font(.headline.weight(.black))
                    .tracking(2.3)
                Text("OWNER COMMAND")
                    .font(.system(size: 9, weight: .black))
                    .tracking(1.7)
                    .foregroundStyle(theme.gold)
            }
        }
    }

    private var servicePulse: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SakuraLiveIndicator()
                Spacer()
                Image(systemName: "wave.3.right")
                    .foregroundStyle(theme.gold)
            }
            Text("Monitoring every new request")
                .font(.system(.headline, design: .serif, weight: .semibold))
            HStack(alignment: .firstTextBaseline) {
                Text("\(pendingCount)")
                    .font(.system(size: 38, weight: .medium, design: .serif))
                    .foregroundStyle(theme.paleGold)
                Text(pendingCount == 1 ? "decision waiting" : "decisions waiting")
                    .font(.caption)
                    .foregroundStyle(theme.secondaryText)
            }
        }
        .padding(17)
        .sakuraGlass(cornerRadius: 20, tint: theme.burgundy.opacity(0.24))
    }

    private func sectionLabel(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 10, weight: .black))
            .tracking(2)
            .foregroundStyle(theme.gold.opacity(0.84))
            .padding(.leading, 5)
    }

    private var pendingCount: Int {
        appState.reservations.filter { $0.status == .pending }.count
    }

    private func count(for filter: ReservationFilter) -> Int? {
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
    let filter: ReservationFilter
    let count: Int?
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: filter.icon)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(isSelected ? theme.ink : theme.gold)
                    .frame(width: 31, height: 31)
                    .background(isSelected ? theme.paleGold : Color.white.opacity(0.05), in: Circle())
                Text(filter.title)
                    .font(.subheadline.weight(isSelected ? .bold : .medium))
                Spacer()
                if let count {
                    Text("\(count)")
                        .font(.caption2.weight(.black))
                        .foregroundStyle(isSelected ? theme.ink.opacity(0.72) : theme.secondaryText)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(isSelected ? theme.gold.opacity(0.25) : Color.white.opacity(0.06), in: Capsule())
                }
            }
            .foregroundStyle(isSelected ? theme.ink : .white.opacity(0.82))
            .padding(11)
            .background(
                isSelected
                    ? AnyShapeStyle(LinearGradient(colors: [theme.paleGold, theme.gold], startPoint: .leading, endPoint: .trailing))
                    : AnyShapeStyle(Color.white.opacity(0.025)),
                in: RoundedRectangle(cornerRadius: 16, style: .continuous)
            )
            .sakuraGlass(cornerRadius: 16, tint: isSelected ? theme.gold.opacity(0.2) : theme.wine.opacity(0.08), interactive: true)
        }
        .buttonStyle(SakuraPressButtonStyle())
    }
}

private struct SidebarToolButton: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(theme.paleGold)
                    .frame(width: 36, height: 36)
                    .background(theme.burgundy.opacity(0.36), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundStyle(theme.secondaryText)
                }
                Spacer()
            }
            .padding(12)
            .sakuraGlass(cornerRadius: 16, tint: theme.wine.opacity(0.1), interactive: true)
        }
        .buttonStyle(SakuraPressButtonStyle())
    }
}

private struct NewReservationBanner: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isRinging = false
    let reservation: Reservation
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 18) {
                ZStack {
                    Circle()
                        .stroke(theme.gold.opacity(0.35), lineWidth: 1)
                        .frame(width: 62, height: 62)
                        .scaleEffect(isRinging ? 1.35 : 0.78)
                        .opacity(isRinging ? 0 : 0.9)
                    Image(systemName: "bell.and.waves.left.and.right.fill")
                        .font(.title2)
                        .foregroundStyle(theme.ink)
                        .frame(width: 52, height: 52)
                        .background(
                            LinearGradient(colors: [theme.paleGold, theme.gold], startPoint: .topLeading, endPoint: .bottomTrailing),
                            in: Circle()
                        )
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text("NEW RESERVATION")
                            .font(.caption2.weight(.black))
                            .tracking(1.8)
                            .foregroundStyle(theme.gold)
                        Text("ACTION NEEDED")
                            .font(.system(size: 9, weight: .black))
                            .foregroundStyle(theme.ink)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(theme.petalLight, in: Capsule())
                    }
                    Text(reservation.customerName)
                        .font(.system(.title3, design: .serif, weight: .semibold))
                    Text("\(reservation.reservationDate) · \(reservation.displayTime) · \(reservation.guestCount) guests · \(reservation.courseName)")
                        .font(.subheadline)
                        .foregroundStyle(theme.secondaryText)
                        .lineLimit(1)
                }
                Spacer(minLength: 10)
                VStack(alignment: .trailing, spacing: 4) {
                    Image(systemName: "arrow.up.right.circle.fill")
                        .font(.title2)
                        .foregroundStyle(theme.paleGold)
                    Text("OPEN")
                        .font(.system(size: 9, weight: .black))
                        .tracking(1.3)
                        .foregroundStyle(theme.gold)
                }
            }
            .padding(17)
            .frame(width: 660, alignment: .leading)
            .sakuraGlass(cornerRadius: 24, tint: theme.burgundy.opacity(0.42), interactive: true)
            .overlay {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(
                        LinearGradient(colors: [theme.paleGold.opacity(0.75), theme.gold.opacity(0.08)], startPoint: .topLeading, endPoint: .bottomTrailing),
                        lineWidth: 1
                    )
            }
            .shadow(color: theme.burgundy.opacity(0.48), radius: 34, y: 16)
        }
        .buttonStyle(SakuraPressButtonStyle())
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeOut(duration: 1.2).repeatForever(autoreverses: false)) {
                isRinging = true
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityHint("Opens this reservation request")
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
        .preferredColorScheme(.dark)
}
#endif
