import Observation
import SwiftUI

@MainActor
@Observable
final class SakuraTheme {
    let burgundy = Color(red: 0.36, green: 0.06, blue: 0.12)
    let deepBurgundy = Color(red: 0.12, green: 0.025, blue: 0.04)
    let ink = Color(red: 0.035, green: 0.022, blue: 0.025)
    let gold = Color(red: 0.84, green: 0.66, blue: 0.34)
    let paleGold = Color(red: 0.96, green: 0.86, blue: 0.62)
    let paper = Color(red: 0.96, green: 0.92, blue: 0.84)
    let secondaryText = Color.white.opacity(0.64)

    var appBackground: LinearGradient {
        LinearGradient(colors: [deepBurgundy, ink, Color.black], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

struct SakuraMark: View {
    @Environment(SakuraTheme.self) private var theme
    let size: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
                .fill(theme.ink)
                .overlay {
                    RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
                        .stroke(theme.gold.opacity(0.72), lineWidth: 1)
                }
                .rotationEffect(.degrees(45))
            Text("桜")
                .font(.system(size: size * 0.42, weight: .light, design: .serif))
                .foregroundStyle(theme.paleGold)
        }
        .frame(width: size, height: size)
        .accessibilityLabel("Sakura Asian Dining and Bar")
    }
}

struct SakuraPanelModifier: ViewModifier {
    @Environment(SakuraTheme.self) private var theme

    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(theme.gold.opacity(0.2), lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.24), radius: 28, y: 18)
    }
}

extension View {
    func sakuraPanel() -> some View { modifier(SakuraPanelModifier()) }
}
