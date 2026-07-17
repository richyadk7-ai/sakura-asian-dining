import SwiftUI

struct SignInView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @State private var email = ""
    @State private var password = ""
    @FocusState private var focusedField: Field?

    private enum Field { case email, password }

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                SakuraAtmosphere(petalCount: 30)

                ScrollView {
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 72) {
                            brandStory
                                .frame(maxWidth: 530, alignment: .leading)
                            signInPanel
                        }

                        VStack(alignment: .leading, spacing: 46) {
                            brandStory
                            signInPanel
                                .frame(maxWidth: 560)
                        }
                    }
                    .frame(maxWidth: 1120, minHeight: max(proxy.size.height - 80, 680))
                    .padding(.horizontal, 48)
                    .padding(.vertical, 40)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
        }
    }

    private var brandStory: some View {
        VStack(alignment: .leading, spacing: 30) {
            HStack(spacing: 20) {
                SakuraMark(size: 108)
                VStack(alignment: .leading, spacing: 7) {
                    Text("SAKURA")
                        .font(.system(size: 22, weight: .black, design: .serif))
                        .tracking(5)
                    Text("ASIAN DINING & BAR")
                        .font(.caption.weight(.bold))
                        .tracking(2.3)
                        .foregroundStyle(theme.gold)
                }
            }

            VStack(alignment: .leading, spacing: 15) {
                SakuraLiveIndicator()
                Text("Every guest.\nEvery detail.\nOne beautiful flow.")
                    .font(.system(size: 58, weight: .medium, design: .serif))
                    .tracking(-1.8)
                    .minimumScaleFactor(0.76)
                    .lineSpacing(-3)
                Text("Sakura’s private reservation command center—designed for fast decisions during a busy service.")
                    .font(.title3)
                    .foregroundStyle(theme.secondaryText)
                    .frame(maxWidth: 500, alignment: .leading)
                    .lineSpacing(4)
            }

            SakuraGlassGroup(spacing: 12) {
                HStack(spacing: 12) {
                    SignInFeature(icon: "bell.and.waves.left.and.right.fill", title: "Instant alerts")
                    SignInFeature(icon: "checkmark.seal.fill", title: "Live decisions")
                    SignInFeature(icon: "lock.shield.fill", title: "Owner only")
                }
            }
        }
    }

    private var signInPanel: some View {
        VStack(alignment: .leading, spacing: 26) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("OWNER ACCESS")
                        .font(.caption2.weight(.black))
                        .tracking(2.5)
                        .foregroundStyle(theme.gold)
                    Text("Step into service.")
                        .font(.system(size: 37, weight: .semibold, design: .serif))
                    Text("Sign in with your protected Sakura owner account.")
                        .font(.subheadline)
                        .foregroundStyle(theme.secondaryText)
                }
                Spacer()
                Image(systemName: "key.viewfinder")
                    .font(.system(size: 28, weight: .light))
                    .foregroundStyle(theme.paleGold)
                    .frame(width: 56, height: 56)
                    .sakuraGlass(cornerRadius: 18, tint: theme.burgundy.opacity(0.35))
            }

            SakuraGlassGroup(spacing: 12) {
                VStack(spacing: 14) {
                    LabelledField(title: "Email", systemImage: "envelope.fill", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .textContentType(.username)
                        .focused($focusedField, equals: .email)
                        .submitLabel(.next)
                        .onSubmit { focusedField = .password }

                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .padding(18)
                        .padding(.leading, 34)
                        .overlay(alignment: .leading) {
                            Image(systemName: "lock.fill")
                                .foregroundStyle(theme.gold)
                                .padding(.leading, 18)
                                .allowsHitTesting(false)
                        }
                        .sakuraGlass(cornerRadius: 17, tint: theme.wine.opacity(0.16), interactive: true)
                        .focused($focusedField, equals: .password)
                        .submitLabel(.go)
                        .onSubmit(signIn)
                }
            }

            if let error = appState.errorMessage {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color(red: 1, green: 0.67, blue: 0.71))
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.red.opacity(0.11), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .accessibilityIdentifier("signInError")
            }

            Button(action: signIn) {
                HStack(spacing: 12) {
                    if appState.isLoading {
                        ProgressView().tint(theme.ink)
                    } else {
                        Image(systemName: "sparkles")
                    }
                    Text(appState.isLoading ? "Opening dashboard…" : "Open reservation command center")
                    Spacer()
                    Image(systemName: "arrow.up.right")
                }
                .font(.headline)
                .foregroundStyle(theme.ink)
                .padding(18)
                .background(
                    LinearGradient(colors: [theme.paleGold, theme.gold], startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: RoundedRectangle(cornerRadius: 17, style: .continuous)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: 17, style: .continuous)
                        .stroke(Color.white.opacity(0.46), lineWidth: 1)
                }
                .shadow(color: theme.gold.opacity(0.25), radius: 20, y: 10)
            }
            .buttonStyle(SakuraPressButtonStyle())
            .disabled(appState.isLoading || email.isEmpty || password.isEmpty)
            .opacity(email.isEmpty || password.isEmpty ? 0.52 : 1)
            .accessibilityIdentifier("signInButton")

            HStack(spacing: 10) {
                Image(systemName: "checkmark.shield.fill")
                    .foregroundStyle(theme.gold)
                Text("Encrypted session · owner allowlist · row-level security")
            }
            .font(.caption)
            .foregroundStyle(theme.secondaryText)
        }
        .padding(34)
        .frame(width: 470)
        .sakuraPanel()
    }

    private func signIn() {
        focusedField = nil
        Task { await appState.signIn(email: email, password: password) }
    }
}

private struct SignInFeature: View {
    @Environment(SakuraTheme.self) private var theme
    let icon: String
    let title: String

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(theme.paleGold)
            Text(title)
                .font(.caption.weight(.bold))
                .foregroundStyle(.white.opacity(0.86))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .sakuraGlass(cornerRadius: 17, tint: theme.burgundy.opacity(0.18))
    }
}

private struct LabelledField: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let systemImage: String
    @Binding var text: String

    var body: some View {
        TextField(title, text: $text)
            .padding(18)
            .padding(.leading, 34)
            .overlay(alignment: .leading) {
                Image(systemName: systemImage)
                    .foregroundStyle(theme.gold)
                    .padding(.leading, 18)
                    .allowsHitTesting(false)
            }
            .sakuraGlass(cornerRadius: 17, tint: theme.wine.opacity(0.16), interactive: true)
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
