import Foundation

enum SupabaseConfiguration {
    static let projectURL = URL(string: "https://hqvmcuzddwvtvzsobtur.supabase.co")!
    static let publishableKey = "sb_publishable_IokU2OqTcp9w8l5UXGRh0A__e__Q5UY"
    static let ownerStatusURL = URL(string: "https://sakuradining.co/api/admin/reservations/status")!
}

enum SupabaseError: LocalizedError {
    case invalidResponse
    case requestFailed(String)
    case notAuthenticated
    case ownerAccessRequired

    var errorDescription: String? {
        switch self {
        case .invalidResponse: "The reservation service returned an invalid response."
        case .requestFailed(let message): message
        case .notAuthenticated: "Your session expired. Please sign in again."
        case .ownerAccessRequired: "This account is not on Sakura's owner allowlist."
        }
    }
}

actor SupabaseClient {
    private let session: URLSession
    private let decoder: JSONDecoder
    private var authSession: AuthSession?

    init(session: URLSession = .shared) {
        self.session = session
        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
    }

    func restore(_ session: AuthSession) { authSession = session }
    func clearSession() { authSession = nil }
    func currentSession() -> AuthSession? { authSession }

    func signIn(email: String, password: String) async throws -> AuthSession {
        var components = URLComponents(url: SupabaseConfiguration.projectURL.appending(path: "auth/v1/token"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "grant_type", value: "password")]
        var request = baseRequest(url: components.url!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["email": email, "password": password])
        let response: SupabaseTokenResponse = try await send(request)
        let ownerSession = response.session(fallbackEmail: email)
        authSession = ownerSession
        guard try await isAllowlistedOwner(userID: ownerSession.userID) else {
            authSession = nil
            throw SupabaseError.ownerAccessRequired
        }
        return ownerSession
    }

    func fetchReservations() async throws -> [Reservation] {
        let token = try await validAccessToken()
        var components = URLComponents(url: SupabaseConfiguration.projectURL.appending(path: "rest/v1/reservations"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "select", value: "id,reservation_reference,course_id,customer_name,customer_email,customer_phone,reservation_date,reservation_time,guest_count,seating_preference,occasion,allergies,special_requests,preferred_language,status,owner_notes,created_at,updated_at"),
            URLQueryItem(name: "order", value: "created_at.desc"),
            URLQueryItem(name: "limit", value: "250"),
        ]
        var request = baseRequest(url: components.url!)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        return try await send(request)
    }

    func updateStatus(id: UUID, status: ReservationStatus) async throws -> CustomerEmailDelivery {
        let token = try await validAccessToken()
        var request = URLRequest(url: SupabaseConfiguration.ownerStatusURL)
        request.timeoutInterval = 30
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONEncoder().encode(["id": id.uuidString.lowercased(), "status": status.rawValue])
        let response: OwnerStatusUpdateResponse = try await send(request)
        return response.customerEmail
    }

    private func isAllowlistedOwner(userID: UUID) async throws -> Bool {
        guard let authSession else { throw SupabaseError.notAuthenticated }
        var components = URLComponents(url: SupabaseConfiguration.projectURL.appending(path: "rest/v1/admin_users"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "select", value: "user_id"),
            URLQueryItem(name: "user_id", value: "eq.\(userID.uuidString.lowercased())"),
        ]
        var request = baseRequest(url: components.url!)
        request.setValue("Bearer \(authSession.accessToken)", forHTTPHeaderField: "Authorization")
        let rows: [OwnerRecord] = try await send(request)
        return rows.contains { $0.userID == userID }
    }

    private func validAccessToken() async throws -> String {
        guard var current = authSession else { throw SupabaseError.notAuthenticated }
        if current.needsRefresh {
            current = try await refresh(current)
            authSession = current
        }
        return current.accessToken
    }

    private func refresh(_ current: AuthSession) async throws -> AuthSession {
        var components = URLComponents(url: SupabaseConfiguration.projectURL.appending(path: "auth/v1/token"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "grant_type", value: "refresh_token")]
        var request = baseRequest(url: components.url!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["refresh_token": current.refreshToken])
        let response: SupabaseTokenResponse = try await send(request)
        return response.session(fallbackEmail: current.email)
    }

    private func baseRequest(url: URL) -> URLRequest {
        var request = URLRequest(url: url)
        request.timeoutInterval = 20
        request.setValue(SupabaseConfiguration.publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        return request
    }

    private func send<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)
        do { return try decoder.decode(T.self, from: data) }
        catch { throw SupabaseError.invalidResponse }
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { throw SupabaseError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 { throw SupabaseError.notAuthenticated }
            let payload = try? JSONDecoder().decode(SupabaseErrorPayload.self, from: data)
            throw SupabaseError.requestFailed(payload?.message ?? "The reservation service failed (\(http.statusCode)).")
        }
    }
}

private struct OwnerRecord: Decodable {
    let userID: UUID
    enum CodingKeys: String, CodingKey { case userID = "user_id" }
}

enum CustomerEmailDelivery: String, Decodable {
    case sent
    case alreadySent = "already-sent"
    case failed
    case notConfigured = "not-configured"
    case notApplicable = "not-applicable"
}

private struct OwnerStatusUpdateResponse: Decodable {
    let customerEmail: CustomerEmailDelivery

    enum CodingKeys: String, CodingKey {
        case customerEmail
    }
}

private struct SupabaseErrorPayload: Decodable { let message: String? }
