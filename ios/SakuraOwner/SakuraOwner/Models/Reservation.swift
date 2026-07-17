import Foundation

enum ReservationStatus: String, Codable, CaseIterable, Identifiable, Sendable {
    case pending, confirmed, rejected, cancelled, completed
    case noShow = "no_show"

    var id: String { rawValue }
    var title: String {
        switch self {
        case .pending: "Pending"
        case .confirmed: "Confirmed"
        case .rejected: "Rejected"
        case .cancelled: "Cancelled"
        case .completed: "Completed"
        case .noShow: "No-show"
        }
    }
}

struct Reservation: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let reservationReference: String
    let courseID: String?
    let customerName: String
    let customerEmail: String
    let customerPhone: String
    let reservationDate: String
    let reservationTime: String
    let guestCount: Int
    let seatingPreference: String
    let occasion: String
    let allergies: String?
    let specialRequests: String?
    let preferredLanguage: String
    var status: ReservationStatus
    let ownerNotes: String?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case reservationReference = "reservation_reference"
        case courseID = "course_id"
        case customerName = "customer_name"
        case customerEmail = "customer_email"
        case customerPhone = "customer_phone"
        case reservationDate = "reservation_date"
        case reservationTime = "reservation_time"
        case guestCount = "guest_count"
        case seatingPreference = "seating_preference"
        case occasion, allergies
        case specialRequests = "special_requests"
        case preferredLanguage = "preferred_language"
        case status
        case ownerNotes = "owner_notes"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var displayTime: String { String(reservationTime.prefix(5)) }
    var searchableText: String {
        [reservationReference, customerName, customerEmail, customerPhone, courseID ?? ""]
            .joined(separator: " ")
            .localizedLowercase
    }

    var courseName: String {
        switch courseID {
        case "welcome-party-course": "Welcome Party Course"
        case "sakura-150-minute-course": "Sakura 150-Minute Course"
        case "tandoori-bbq-course": "Tandoori BBQ Course"
        case "sakura-special-drink-course": "Sakura Special Drink Course"
        case "grilled-chicken-drink-course": "Grilled Chicken Drink Course"
        case .none: "No course selected"
        default: courseID ?? "No course selected"
        }
    }
}

enum ReservationFilter: String, CaseIterable, Identifiable {
    case all, pending, today, upcoming, confirmed

    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var icon: String {
        switch self {
        case .all: "tray.full"
        case .pending: "bell.badge"
        case .today: "sun.max"
        case .upcoming: "calendar"
        case .confirmed: "checkmark.seal"
        }
    }
}
