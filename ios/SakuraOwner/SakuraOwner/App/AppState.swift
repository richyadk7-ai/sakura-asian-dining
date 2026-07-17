import Foundation
import Observation
import UIKit

@MainActor
@Observable
final class AppState {
    enum Phase: Equatable { case restoring, signedOut, signedIn }

    var phase: Phase = .restoring
    var reservations: [Reservation] = []
    var selectedReservationID: UUID?
    var filter: ReservationFilter = .all
    var searchText = ""
    var isLoading = false
    var errorMessage: String?
    var lastUpdated: Date?
    var newestReservation: Reservation?
    var updatingReservationIDs: Set<UUID> = []
    var soundIsArmed = true

    private let client = SupabaseClient()
    private let alertPlayer = ReservationAlertPlayer()
    private var hasLoadedReservations = false

    var selectedReservation: Reservation? {
        reservations.first { $0.id == selectedReservationID }
    }

    var filteredReservations: [Reservation] {
        let today = Self.tokyoDateString()
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).localizedLowercase
        return reservations.filter { reservation in
            let filterMatches: Bool = switch filter {
            case .all: true
            case .pending: reservation.status == .pending
            case .today: reservation.reservationDate == today
            case .upcoming: reservation.reservationDate > today
            case .confirmed: reservation.status == .confirmed
            }
            return filterMatches && (query.isEmpty || reservation.searchableText.contains(query))
        }
    }

    func restoreSession() async {
        do {
            guard let session = try KeychainStore.load() else {
                phase = .signedOut
                return
            }
            await client.restore(session)
            phase = .signedIn
            await refreshReservations(announceNew: false)
        } catch {
            KeychainStore.clear()
            await client.clearSession()
            phase = .signedOut
        }
    }

    func signIn(email: String, password: String) async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        do {
            let session = try await client.signIn(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
            try KeychainStore.save(session)
            hasLoadedReservations = false
            phase = .signedIn
            await refreshReservations(announceNew: false)
        } catch {
            errorMessage = error.localizedDescription
            phase = .signedOut
        }
        isLoading = false
    }

    func signOut() {
        KeychainStore.clear()
        Task { await client.clearSession() }
        reservations = []
        selectedReservationID = nil
        phase = .signedOut
    }

    func monitorReservations() async {
        while !Task.isCancelled && phase == .signedIn {
            await refreshReservations(announceNew: true)
            do { try await Task.sleep(for: .seconds(5)) }
            catch { return }
        }
    }

    func refreshReservations(announceNew: Bool = true) async {
        if !hasLoadedReservations { isLoading = true }
        defer { isLoading = false }
        do {
            let previousIDs = Set(reservations.map(\.id))
            let loaded = try await client.fetchReservations()
            if let refreshed = await client.currentSession() { try? KeychainStore.save(refreshed) }
            reservations = loaded
            lastUpdated = Date()
            errorMessage = nil
            if selectedReservationID == nil { selectedReservationID = loaded.first?.id }
            if announceNew && hasLoadedReservations, let newest = loaded.first(where: { !previousIDs.contains($0.id) }) {
                newestReservation = newest
                if soundIsArmed { try? alertPlayer.play() }
                let id = newest.id
                Task {
                    try? await Task.sleep(for: .seconds(7))
                    if newestReservation?.id == id { newestReservation = nil }
                }
            }
            hasLoadedReservations = true
        } catch {
            errorMessage = error.localizedDescription
            if case SupabaseError.notAuthenticated = error { signOut() }
        }
    }

    func testAlert() {
        do {
            try alertPlayer.play()
            soundIsArmed = true
            errorMessage = nil
        } catch {
            soundIsArmed = false
            errorMessage = "The alert sound could not start. Check the iPad volume and try again."
        }
    }

    func updateStatus(_ status: ReservationStatus, for reservation: Reservation) async {
        guard !updatingReservationIDs.contains(reservation.id) else { return }
        updatingReservationIDs.insert(reservation.id)
        defer { updatingReservationIDs.remove(reservation.id) }
        do {
            try await client.updateStatus(id: reservation.id, status: status)
            UINotificationFeedbackGenerator().notificationOccurred(status == .confirmed ? .success : .warning)
            await refreshReservations(announceNew: false)
        } catch {
            errorMessage = error.localizedDescription
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
    }

    private static func tokyoDateString() -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "Asia/Tokyo")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}
