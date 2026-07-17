import SwiftUI

struct SignInView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @State private var email = ""
    @State private var password = ""
    @FocusState private var focusedField: Field?

    private enum Field { case email, password }

    var body: some View {
        ZStack {
            theme.appBackground.ignoresSafeArea()
            Circle()
                .fill(theme.burgundy.opacity(0.38))
                .frame(width: 760)
                .blur(radius: 110)
                .offset(x: 330, y: -290)
            Circle()
                .stroke(theme.gold.opacity(0.1), lineWidth: 1)
                .frame(width: 620)
                .offset(x: -360, y: 390)

            HStack(spacing: 72) {
                VStack(alignment: .leading, spacing: 28) {
                    SakuraMark(size: 108)
                    VStack(alignment: .leading, spacing: 12) {
                        Text("SAKURA OWNER")
                            .font(.caption.weight(.bold))
                            .tracking(4)
                            .foregroundStyle(theme.gold)
                        Text("Reservations,\nbeautifully handled.")
                            .font(.system(size: 58, weight: .medium, design: .serif))
                            .tracking(-1.5)
                        Text("A private native workspace for Sakura Asian Dining & Bar.")
                            .font(.title3)
                            .foregroundStyle(theme.secondaryText)
                            .frame(maxWidth: 470, alignment: .leading)
                    }
                }
                .frame(maxWidth: 520, alignment: .leading)

                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 7) {
                        Text("Owner sign in")
                            .font(.system(size: 34, weight: .semibold, design: .serif))
                        Text("Use the same secure Supabase owner account as the website dashboard.")
                            .font(.subheadline)
                            .foregroundStyle(theme.secondaryText)
                    }

                    VStack(spacing: 14) {
                        LabelledField(title: "Email", systemImage: "envelope", text: $email)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .textContentType(.username)
                            .focused($focusedField, equals: .email)
                            .submitLabel(.next)
                            .onSubmit { focusedField = .password }
                        SecureField("Password", text: $password)
                            .textContentType(.password)
                            .padding(18)
                            .padding(.leading, 32)
                            .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .overlay(alignment: .leading) {
                                Image(systemName: "lock")
                                    .foregroundStyle(theme.gold)
                                    .padding(.leading, 18)
                                    .allowsHitTesting(false)
                            }
                            .padding(.leading, 0)
                            .focused($focusedField, equals: .password)
                            .submitLabel(.go)
                            .onSubmit(signIn)
                    }

                    if let error = appState.errorMessage {
                        Label(error, systemImage: "exclamationmark.triangle.fill")
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(Color(red: 1, green: 0.66, blue: 0.69))
                            .accessibilityIdentifier("signInError")
                    }

                    Button(action: signIn) {
                        HStack {
                            if appState.isLoading { ProgressView().tint(theme.ink) }
                            Text(appState.isLoading ? "Signing in…" : "Open reservations")
                            Spacer()
                            Image(systemName: "arrow.right")
                        }
                        .font(.headline)
                        .foregroundStyle(theme.ink)
                        .padding(18)
                        .background(theme.paleGold, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                    .disabled(appState.isLoading || email.isEmpty || password.isEmpty)
                    .opacity(email.isEmpty || password.isEmpty ? 0.55 : 1)
                    .accessibilityIdentifier("signInButton")

                    Label("Protected by the owner allowlist and database row-level security", systemImage: "checkmark.shield")
                        .font(.caption)
                        .foregroundStyle(theme.secondaryText)
                }
                .padding(34)
                .frame(width: 460)
                .sakuraPanel()
            }
            .padding(70)
        }
    }

    private func signIn() {
        focusedField = nil
        Task { await appState.signIn(email: email, password: password) }
    }
}

#if DEBUG
#Preview("Owner sign in") {
    SignInView()
        .environment(AppState())
        .environment(SakuraTheme())
        .preferredColorScheme(.dark)
}
#endif

private struct LabelledField: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let systemImage: String
    @Binding var text: String

    var body: some View {
        TextField(title, text: $text)
            .padding(18)
            .padding(.leading, 32)
            .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(alignment: .leading) {
                Image(systemName: systemImage)
                    .foregroundStyle(theme.gold)
                    .padding(.leading, 18)
                    .allowsHitTesting(false)
            }
    }
}
