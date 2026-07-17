#if DEBUG
import Foundation

extension Reservation {
    static let previewPending = Reservation(
        id: UUID(uuidString: "123e4567-e89b-42d3-a456-426614174000")!,
        reservationReference: "SKR-20260718-A1B2C3",
        courseID: "welcome-party-course",
        customerName: "Aiko Tanaka",
        customerEmail: "aiko@example.com",
        customerPhone: "+81 90-1234-5678",
        reservationDate: "2026-07-18",
        reservationTime: "19:00:00",
        guestCount: 4,
        seatingPreference: "table",
        occasion: "birthday",
        allergies: "No peanuts",
        specialRequests: "A quiet table if available",
        preferredLanguage: "ja",
        status: .pending,
        ownerNotes: nil,
        createdAt: Date(),
        updatedAt: Date()
    )

    static let previewConfirmed = Reservation(
        id: UUID(uuidString: "123e4567-e89b-42d3-a456-426614174001")!,
        reservationReference: "SKR-20260718-D4E5F6",
        courseID: nil,
        customerName: "Pratik Adhikari",
        customerEmail: "owner@example.com",
        customerPhone: "+81 80-6962-8683",
        reservationDate: "2026-07-18",
        reservationTime: "20:30:00",
        guestCount: 2,
        seatingPreference: "no_preference",
        occasion: "none",
        allergies: nil,
        specialRequests: nil,
        preferredLanguage: "en",
        status: .confirmed,
        ownerNotes: nil,
        createdAt: Date().addingTimeInterval(-3600),
        updatedAt: Date()
    )
}
#endif
