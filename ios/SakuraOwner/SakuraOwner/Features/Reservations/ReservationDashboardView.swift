import SwiftUI

struct ReservationDashboardView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    var body: some View {
        @Bindable var state = appState
        ZStack(alignment: .top) {
            NavigationSplitView(columnVisibility: $columnVisibility) {
                ReservationSidebar()
                    .navigationSplitViewColumnWidth(min: 210, ideal: 250, max: 290)
            } content: {
                ReservationListView()
                    .navigationSplitViewColumnWidth(min: 360, ideal: 430, max: 520)
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
            .toolbarBackground(theme.ink.opacity(0.94), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)

            if let newest = appState.newestReservation {
                NewReservationBanner(reservation: newest)
                    .padding(.top, 16)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .zIndex(20)
            }
        }
        .background(theme.appBackground.ignoresSafeArea())
        .task { await appState.monitorReservations() }
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
        List {
            Section {
                HStack(spacing: 14) {
                    SakuraMark(size: 46)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("SAKURA")
                            .font(.headline.weight(.bold))
                            .tracking(1.6)
                        Text("Owner reservations")
                            .font(.caption)
                            .foregroundStyle(theme.secondaryText)
                    }
                }
                .listRowBackground(Color.clear)
                .padding(.vertical, 8)
            }

            Section("Queue") {
                ForEach(ReservationFilter.allCases) { filter in
                    Button {
                        state.filter = filter
                    } label: {
                        Label {
                            HStack {
                                Text(filter.title)
                                Spacer()
                                if let count = count(for: filter) {
                                    Text("\(count)")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(filter == .pending && count > 0 ? theme.ink : theme.secondaryText)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(filter == .pending && count > 0 ? theme.gold : Color.white.opacity(0.08), in: Capsule())
                                }
                            }
                        } icon: {
                            Image(systemName: filter.icon).foregroundStyle(theme.gold)
                        }
                    }
                    .buttonStyle(.plain)
                    .listRowBackground(state.filter == filter ? theme.burgundy.opacity(0.5) : Color.clear)
                }
            }

            Section("Service") {
                Button { appState.testAlert() } label: {
                    Label(appState.soundIsArmed ? "Test alert chime" : "Enable alert chime", systemImage: "speaker.wave.3.fill")
                }
                Button { Task { await appState.refreshReservations() } } label: {
                    Label("Refresh now", systemImage: "arrow.clockwise")
                }
                .disabled(appState.isLoading)
            }

            Section {
                Button(role: .destructive) { appState.signOut() } label: {
                    Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(theme.ink)
        .navigationTitle("Reservations")
    }

    private func count(for filter: ReservationFilter) -> Int? {
        switch filter {
        case .all: appState.reservations.count
        case .pending: appState.reservations.filter { $0.status == .pending }.count
        case .confirmed: appState.reservations.filter { $0.status == .confirmed }.count
        case .today: appState.reservations.filter { $0.reservationDate == tokyoToday }.count
        case .upcoming: nil
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

private struct NewReservationBanner: View {
    @Environment(SakuraTheme.self) private var theme
    let reservation: Reservation

    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: "bell.and.waves.left.and.right.fill")
                .font(.title2)
                .foregroundStyle(theme.ink)
                .frame(width: 48, height: 48)
                .background(theme.paleGold, in: Circle())
            VStack(alignment: .leading, spacing: 3) {
                Text("NEW RESERVATION REQUEST")
                    .font(.caption2.weight(.black))
                    .tracking(1.6)
                    .foregroundStyle(theme.gold)
                Text(reservation.customerName)
                    .font(.title3.weight(.semibold))
                Text("\(reservation.reservationDate) · \(reservation.displayTime) · \(reservation.guestCount) guests")
                    .font(.subheadline)
                    .foregroundStyle(theme.secondaryText)
            }
        }
        .padding(16)
        .frame(maxWidth: 520, alignment: .leading)
        .background(theme.deepBurgundy.opacity(0.96), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(theme.gold.opacity(0.46)) }
        .shadow(color: .black.opacity(0.38), radius: 26, y: 14)
        .accessibilityElement(children: .combine)
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
