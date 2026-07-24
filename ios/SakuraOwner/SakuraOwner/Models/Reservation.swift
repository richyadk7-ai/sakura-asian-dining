import Foundation

enum ReservationStatus: String, Codable, CaseIterable, Identifiable, Sendable {
    case pending, confirmed, rejected, cancelled, completed
    case noShow = "no_show"

    var id: String { rawValue }
    var title: String { title(in: .english) }

    func title(in language: SakuraLanguage) -> String {
        switch self {
        case .pending: language == .english ? "Pending" : "प्रतीक्षारत"
        case .confirmed: language == .english ? "Confirmed" : "पुष्टि"
        case .rejected: language == .english ? "Rejected" : "अस्वीकृत"
        case .cancelled: language == .english ? "Cancelled" : "रद्द"
        case .completed: language == .english ? "Completed" : "पूरा"
        case .noShow: language == .english ? "No-show" : "अनुपस्थित"
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

    var courseName: String { courseName(in: .english) }

    func courseName(in language: SakuraLanguage) -> String {
        switch courseID {
        case "welcome-party-course": language == .english ? "Welcome Party Course" : "स्वागत पार्टी कोर्स"
        case "sakura-150-minute-course": language == .english ? "Sakura 150-Minute Course" : "साकुरा १५०-मिनेट कोर्स"
        case "tandoori-bbq-course": language == .english ? "Tandoori BBQ Course" : "तन्दुरी BBQ कोर्स"
        case "sakura-special-drink-course": language == .english ? "Sakura Special Drink Course" : "साकुरा विशेष पेय कोर्स"
        case "grilled-chicken-drink-course": language == .english ? "Grilled Chicken Drink Course" : "ग्रिल्ड चिकेन पेय कोर्स"
        case .none: language == .english ? "No course selected" : "कोर्स चयन गरिएको छैन"
        default: courseID ?? (language == .english ? "No course selected" : "कोर्स चयन गरिएको छैन")
        }
    }
}

enum ReservationFilter: String, CaseIterable, Identifiable {
    case all, pending, today, upcoming, confirmed, archived

    var id: String { rawValue }
    var title: String { title(in: .english) }

    func title(in language: SakuraLanguage) -> String {
        switch self {
        case .all: language == .english ? "All" : "सबै"
        case .pending: language == .english ? "Pending" : "प्रतीक्षारत"
        case .today: language == .english ? "Today" : "आज"
        case .upcoming: language == .english ? "Upcoming" : "आगामी"
        case .confirmed: language == .english ? "Confirmed" : "पुष्टि"
        case .archived: language == .english ? "Removed" : "हटाइएका"
        }
    }
    var icon: String {
        switch self {
        case .all: "tray.full"
        case .pending: "bell.badge"
        case .today: "sun.max"
        case .upcoming: "calendar"
        case .confirmed: "checkmark.seal"
        case .archived: "archivebox"
        }
    }
}
