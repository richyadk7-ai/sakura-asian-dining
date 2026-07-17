import Foundation

struct AuthSession: Codable, Equatable, Sendable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date
    let userID: UUID
    let email: String

    var needsRefresh: Bool { expiresAt.timeIntervalSinceNow < 90 }
}

struct SupabaseTokenResponse: Decodable, Sendable {
    struct User: Decodable, Sendable {
        let id: UUID
        let email: String?
    }

    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    let user: User

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case user
    }

    func session(fallbackEmail: String) -> AuthSession {
        AuthSession(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: Date().addingTimeInterval(TimeInterval(expiresIn)),
            userID: user.id,
            email: user.email ?? fallbackEmail
        )
    }
}
