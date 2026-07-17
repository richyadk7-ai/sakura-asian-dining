import SwiftUI

@main
struct SakuraOwnerApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var appState = AppState()
    @State private var theme = SakuraTheme()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
                .environment(theme)
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

    var body: some View {
        ZStack {
            theme.appBackground.ignoresSafeArea()
            VStack(spacing: 20) {
                SakuraMark(size: 92)
                ProgressView().tint(theme.gold)
                Text("Preparing the owner dashboard")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(theme.secondaryText)
            }
        }
        .accessibilityElement(children: .combine)
    }
}
