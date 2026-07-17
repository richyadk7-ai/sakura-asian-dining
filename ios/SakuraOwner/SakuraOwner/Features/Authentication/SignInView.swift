import SwiftUI

struct SignInView: View {
    @Environment(AppState.self) private var appState
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language
    @State private var email = ""
    @State private var password = ""
    @FocusState private var focusedField: Field?

    private enum Field { case email, password }

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                SakuraAtmosphere(petalCount: 10, showsMonogram: false)

                ScrollView {
                    VStack(spacing: 0) {
                        signInPanel
                    }
                    .frame(maxWidth: .infinity, minHeight: max(proxy.size.height, 620))
                    .padding(.horizontal, 28)
                    .padding(.vertical, 36)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
        }
    }

    private var signInPanel: some View {
        VStack(alignment: .leading, spacing: 26) {
            HStack(spacing: 16) {
                SakuraMark(size: 64)
                VStack(alignment: .leading, spacing: 4) {
                    Text("SAKURA")
                        .font(.headline.weight(.black))
                        .tracking(2.2)
                    Text(language.text("Owner reservations", "सञ्चालक आरक्षण"))
                        .font(.caption)
                        .foregroundStyle(theme.secondaryText)
                }
                Spacer(minLength: 12)
                SakuraLanguagePicker()
            }

            Divider().overlay(Color.white.opacity(0.1))

            VStack(alignment: .leading, spacing: 8) {
                Text(language.text("Owner sign in", "सञ्चालक साइन इन"))
                    .font(.largeTitle.weight(.semibold))
                    .fixedSize(horizontal: false, vertical: true)
                Text(language.text(
                    "Use your secure Sakura account.",
                    "आफ्नो सुरक्षित साकुरा खाता प्रयोग गर्नुहोस्।"
                ))
                .font(.subheadline)
                .foregroundStyle(theme.secondaryText)
            }

            SakuraGlassGroup(spacing: 12) {
                VStack(spacing: 14) {
                    LabelledField(
                        title: language.text("Email", "इमेल"),
                        systemImage: "envelope.fill",
                        text: $email
                    )
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .textContentType(.username)
                    .focused($focusedField, equals: .email)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .password }

                    SecureField(language.text("Password", "पासवर्ड"), text: $password)
                        .textContentType(.password)
                        .padding(17)
                        .padding(.leading, 32)
                        .overlay(alignment: .leading) {
                            Image(systemName: "lock.fill")
                                .foregroundStyle(theme.gold)
                                .padding(.leading, 17)
                                .allowsHitTesting(false)
                        }
                        .sakuraGlass(cornerRadius: 16, tint: theme.wine.opacity(0.12), interactive: true)
                        .focused($focusedField, equals: .password)
                        .submitLabel(.go)
                        .onSubmit(signIn)
                }
            }

            if let error = appState.errorMessage {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color(red: 1, green: 0.67, blue: 0.71))
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(13)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    .accessibilityIdentifier("signInError")
            }

            Button(action: signIn) {
                HStack(spacing: 10) {
                    if appState.isLoading {
                        ProgressView().tint(theme.ink)
                    }
                    Text(appState.isLoading
                        ? language.text("Signing in…", "साइन इन हुँदैछ…")
                        : language.text("Sign in", "साइन इन"))
                    Spacer()
                    Image(systemName: "arrow.right")
                }
                .font(.headline)
                .foregroundStyle(theme.ink)
                .padding(17)
                .background(
                    LinearGradient(colors: [theme.paleGold, theme.gold], startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                )
            }
            .buttonStyle(SakuraPressButtonStyle())
            .disabled(appState.isLoading || email.isEmpty || password.isEmpty)
            .opacity(email.isEmpty || password.isEmpty ? 0.52 : 1)
            .accessibilityIdentifier("signInButton")

            Label(
                language.text("Secure owner access", "सुरक्षित सञ्चालक पहुँच"),
                systemImage: "checkmark.shield.fill"
            )
            .font(.caption)
            .foregroundStyle(theme.secondaryText)
        }
        .padding(30)
        .frame(maxWidth: 520)
        .sakuraPanel()
    }

    private func signIn() {
        focusedField = nil
        Task { await appState.signIn(email: email, password: password) }
    }
}

private struct LabelledField: View {
    @Environment(SakuraTheme.self) private var theme
    let title: String
    let systemImage: String
    @Binding var text: String

    var body: some View {
        TextField(title, text: $text)
            .padding(17)
            .padding(.leading, 32)
            .overlay(alignment: .leading) {
                Image(systemName: systemImage)
                    .foregroundStyle(theme.gold)
                    .padding(.leading, 17)
                    .allowsHitTesting(false)
            }
            .sakuraGlass(cornerRadius: 16, tint: theme.wine.opacity(0.12), interactive: true)
    }
}

#if DEBUG
#Preview("Owner sign in") {
    SignInView()
        .environment(AppState())
        .environment(SakuraTheme())
        .environment(SakuraLanguageStore())
        .preferredColorScheme(.dark)
}
#endif
