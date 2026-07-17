import Observation
import SwiftUI

@MainActor
@Observable
final class SakuraTheme {
    let burgundy = Color(red: 0.43, green: 0.045, blue: 0.13)
    let deepBurgundy = Color(red: 0.12, green: 0.012, blue: 0.045)
    let wine = Color(red: 0.23, green: 0.02, blue: 0.075)
    let ink = Color(red: 0.025, green: 0.014, blue: 0.022)
    let gold = Color(red: 0.88, green: 0.69, blue: 0.34)
    let paleGold = Color(red: 0.98, green: 0.88, blue: 0.65)
    let paper = Color(red: 0.96, green: 0.92, blue: 0.84)
    let petal = Color(red: 1.0, green: 0.69, blue: 0.78)
    let petalLight = Color(red: 1.0, green: 0.89, blue: 0.92)
    let secondaryText = Color.white.opacity(0.64)

    var appBackground: LinearGradient {
        LinearGradient(
            colors: [deepBurgundy, ink, Color.black],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

struct SakuraAtmosphere: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var petalCount = 24
    var showsMonogram = true

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                theme.appBackground

                RadialGradient(
                    colors: [theme.burgundy.opacity(0.55), .clear],
                    center: .topTrailing,
                    startRadius: 10,
                    endRadius: max(proxy.size.width, proxy.size.height) * 0.72
                )

                RadialGradient(
                    colors: [theme.gold.opacity(0.13), .clear],
                    center: .bottomLeading,
                    startRadius: 0,
                    endRadius: max(proxy.size.width, proxy.size.height) * 0.55
                )

                if showsMonogram {
                    Text("桜")
                        .font(.system(size: min(proxy.size.width, proxy.size.height) * 0.72, weight: .ultraLight, design: .serif))
                        .foregroundStyle(theme.petalLight.opacity(0.028))
                        .rotationEffect(.degrees(-8))
                        .offset(x: proxy.size.width * 0.22, y: proxy.size.height * 0.1)
                        .accessibilityHidden(true)
                }

                SakuraPetalField(count: petalCount, isPaused: reduceMotion)
                    .opacity(0.82)
            }
        }
        .ignoresSafeArea()
        .accessibilityHidden(true)
    }
}

private struct SakuraPetalField: View {
    @Environment(SakuraTheme.self) private var theme
    let count: Int
    let isPaused: Bool

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: isPaused)) { timeline in
            Canvas { context, size in
                let time = isPaused ? 0 : timeline.date.timeIntervalSinceReferenceDate
                for index in 0..<count {
                    drawPetal(index: index, time: time, size: size, context: &context)
                }
            }
        }
        .allowsHitTesting(false)
    }

    private func drawPetal(index: Int, time: TimeInterval, size: CGSize, context: inout GraphicsContext) {
        let seed = Double(index) * 0.6180339887
        let duration = 11.0 + Double(index % 7) * 1.25
        let phase = positiveRemainder(time / duration + seed, divisor: 1)
        let lane = positiveRemainder(seed * 1.91, divisor: 1)
        let sway = sin((phase * .pi * 4) + seed * 8) * (22 + Double(index % 5) * 9)
        let x = lane * size.width + sway - 28
        let y = phase * (size.height + 100) - 50
        let width = CGFloat(7 + index % 5)
        let height = width * 1.58
        let opacity = 0.14 + Double(index % 5) * 0.055
        let angle = Angle.degrees(phase * 440 + seed * 90)

        context.drawLayer { layer in
            layer.translateBy(x: x, y: y)
            layer.rotate(by: angle)
            let petal = Path(ellipseIn: CGRect(x: -width / 2, y: -height / 2, width: width, height: height))
            layer.fill(petal, with: .color(index.isMultiple(of: 3) ? theme.petalLight.opacity(opacity) : theme.petal.opacity(opacity)))
        }
    }

    private func positiveRemainder(_ value: Double, divisor: Double) -> Double {
        let remainder = value.truncatingRemainder(dividingBy: divisor)
        return remainder < 0 ? remainder + divisor : remainder
    }
}

struct SakuraMark: View {
    @Environment(SakuraTheme.self) private var theme
    let size: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [theme.ink, theme.wine],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay {
                    RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
                        .stroke(
                            LinearGradient(colors: [theme.paleGold, theme.gold.opacity(0.25)], startPoint: .top, endPoint: .bottom),
                            lineWidth: 1
                        )
                }
                .rotationEffect(.degrees(45))
                .shadow(color: theme.gold.opacity(0.2), radius: size * 0.28)
            Text("桜")
                .font(.system(size: size * 0.42, weight: .light, design: .serif))
                .foregroundStyle(theme.paleGold)
        }
        .frame(width: size, height: size)
        .accessibilityLabel("Sakura Asian Dining and Bar")
    }
}

struct SakuraLiveIndicator: View {
    @Environment(SakuraTheme.self) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isPulsing = false

    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(theme.gold.opacity(0.22))
                    .frame(width: 18, height: 18)
                    .scaleEffect(isPulsing ? 1.45 : 0.75)
                    .opacity(isPulsing ? 0.08 : 0.85)
                Circle()
                    .fill(theme.paleGold)
                    .frame(width: 7, height: 7)
            }
            Text("LIVE")
                .font(.caption2.weight(.black))
                .tracking(1.8)
        }
        .foregroundStyle(theme.paleGold)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeOut(duration: 1.45).repeatForever(autoreverses: false)) {
                isPulsing = true
            }
        }
        .accessibilityLabel("Live reservation monitoring active")
    }
}

struct SakuraGlassGroup<Content: View>: View {
    private let spacing: CGFloat
    private let content: Content

    init(spacing: CGFloat = 18, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }

    @ViewBuilder
    var body: some View {
        if #available(iOS 26.0, *) {
            GlassEffectContainer(spacing: spacing) { content }
        } else {
            content
        }
    }
}

private struct SakuraGlassModifier: ViewModifier {
    @Environment(SakuraTheme.self) private var theme
    let cornerRadius: CGFloat
    let tint: Color?
    let interactive: Bool

    @ViewBuilder
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            if interactive {
                content
                    .glassEffect(.regular.tint(tint).interactive(), in: .rect(cornerRadius: cornerRadius))
            } else {
                content
                    .glassEffect(.regular.tint(tint), in: .rect(cornerRadius: cornerRadius))
            }
        } else {
            content
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [theme.paleGold.opacity(0.23), Color.white.opacity(0.035)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                }
        }
    }
}

private struct SakuraPanelModifier: ViewModifier {
    @Environment(SakuraTheme.self) private var theme

    func body(content: Content) -> some View {
        content
            .modifier(SakuraGlassModifier(cornerRadius: 24, tint: theme.wine.opacity(0.14), interactive: false))
            .shadow(color: .black.opacity(0.28), radius: 28, y: 18)
    }
}

extension View {
    func sakuraPanel() -> some View {
        modifier(SakuraPanelModifier())
    }

    func sakuraGlass(cornerRadius: CGFloat = 18, tint: Color? = nil, interactive: Bool = false) -> some View {
        modifier(SakuraGlassModifier(cornerRadius: cornerRadius, tint: tint, interactive: interactive))
    }
}

struct SakuraPressButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.975 : 1)
            .brightness(configuration.isPressed ? -0.07 : 0)
            .animation(.spring(response: 0.28, dampingFraction: 0.76), value: configuration.isPressed)
    }
}
