import XCTest
@testable import SakuraOwner

final class ReservationModelTests: XCTestCase {
    func testDecodesSupabaseReservationPayload() throws {
        let json = #"""
        {
          "id":"123e4567-e89b-42d3-a456-426614174000",
          "reservation_reference":"SKR-20260718-A1B2C3",
          "course_id":"welcome-party-course",
          "customer_name":"Aiko Tanaka",
          "customer_email":"aiko@example.com",
          "customer_phone":"+81 90-1234-5678",
          "reservation_date":"2026-07-18",
          "reservation_time":"19:00:00",
          "guest_count":4,
          "seating_preference":"no_preference",
          "occasion":"birthday",
          "allergies":"",
          "special_requests":"Window seat",
          "preferred_language":"ja",
          "status":"pending",
          "owner_notes":null,
          "created_at":"2026-07-17T10:00:00Z",
          "updated_at":"2026-07-17T10:00:00Z"
        }
        """#.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let reservation = try decoder.decode(Reservation.self, from: json)
        XCTAssertEqual(reservation.reservationReference, "SKR-20260718-A1B2C3")
        XCTAssertEqual(reservation.displayTime, "19:00")
        XCTAssertEqual(reservation.guestCount, 4)
        XCTAssertEqual(reservation.status, .pending)
        XCTAssertEqual(reservation.courseName, "Welcome Party Course")
        XCTAssertEqual(reservation.courseName(in: .nepali), "स्वागत पार्टी कोर्स")
        XCTAssertEqual(reservation.status.title(in: .nepali), "प्रतीक्षारत")
    }

    func testSessionRefreshThreshold() {
        let userID = UUID()
        let active = AuthSession(accessToken: "token", refreshToken: "refresh", expiresAt: Date().addingTimeInterval(600), userID: userID, email: "owner@example.com")
        let expiring = AuthSession(accessToken: "token", refreshToken: "refresh", expiresAt: Date().addingTimeInterval(30), userID: userID, email: "owner@example.com")
        XCTAssertFalse(active.needsRefresh)
        XCTAssertTrue(expiring.needsRefresh)
    }

    func testReservationFiltersHaveEnglishAndNepaliLabels() {
        XCTAssertEqual(ReservationFilter.today.title(in: .english), "Today")
        XCTAssertEqual(ReservationFilter.today.title(in: .nepali), "आज")
        XCTAssertEqual(ReservationFilter.confirmed.title(in: .nepali), "पुष्टि")
        XCTAssertEqual(ReservationFilter.archived.title(in: .english), "Removed")
        XCTAssertEqual(ReservationFilter.archived.title(in: .nepali), "हटाइएका")
    }
}
