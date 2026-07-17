import SwiftUI

@main
struct SakuraOwnerApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var appState = AppState()
    @State private var theme = SakuraTheme()
    @State private var language = SakuraLanguageStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
                .environment(theme)
                .environment(language)
                .preferredColorScheme(.dark)
                .task { await appState.restoreSession() }
        }
    }
}

private struct RootView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        Group {
            switch appState.phase {
            case .restoring:
                LaunchView()
            case .signedOut:
                SignInView()
            case .signedIn:
                ReservationDashboardView()
            }
        }
        .animation(.snappy(duration: 0.45), value: appState.phase)
    }
}

private struct LaunchView: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(SakuraLanguageStore.self) private var language
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isGlowing = false

    var body: some View {
        ZStack {
            SakuraAtmosphere(petalCount: 20)
            VStack(spacing: 26) {
                ZStack {
                    Circle()
                        .stroke(theme.gold.opacity(0.22), lineWidth: 1)
                        .frame(width: 142, height: 142)
                        .scaleEffect(isGlowing ? 1.16 : 0.88)
                        .opacity(isGlowing ? 0.04 : 0.7)
                    SakuraMark(size: 92)
                }
                VStack(spacing: 10) {
                    Text("SAKURA")
                        .font(.caption.weight(.black))
                        .tracking(3.6)
                        .foregroundStyle(theme.gold)
                    Text(language.text("Preparing reservations…", "आरक्षण तयार हुँदैछ…"))
                        .font(.system(.title3, design: .serif, weight: .medium))
                    ProgressView()
                        .tint(theme.paleGold)
                }
            }
            .padding(36)
            .sakuraGlass(cornerRadius: 28, tint: theme.wine.opacity(0.18))
        }
        .accessibilityElement(children: .combine)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeOut(duration: 1.5).repeatForever(autoreverses: false)) {
                isGlowing = true
            }
        }
    }
}
