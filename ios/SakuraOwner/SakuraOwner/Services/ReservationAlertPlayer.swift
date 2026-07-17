import AVFoundation
import UIKit

@MainActor
final class ReservationAlertPlayer {
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let buffer: AVAudioPCMBuffer

    init() {
        buffer = Self.makeAlertBuffer()
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: buffer.format)
        engine.prepare()
    }

    func play() throws {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.playback, mode: .default, options: [.duckOthers])
        try audioSession.setActive(true)
        if !engine.isRunning { try engine.start() }
        player.stop()
        player.scheduleBuffer(buffer, at: nil, options: .interrupts)
        player.play()
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }

    private static func makeAlertBuffer() -> AVAudioPCMBuffer {
        let sampleRate = 44_100.0
        let duration = 3.15
        let format = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: sampleRate, channels: 1, interleaved: false)!
        let frameCount = AVAudioFrameCount(sampleRate * duration)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        let channel = buffer.floatChannelData![0]
        let notes: [(frequency: Double, start: Double, length: Double)] = [
            (523.25, 0.00, 0.66), (659.25, 0.16, 0.72), (783.99, 0.32, 0.78), (1046.50, 0.52, 0.96),
            (523.25, 1.55, 0.66), (659.25, 1.71, 0.72), (783.99, 1.87, 0.78), (1318.51, 2.08, 0.98),
        ]
        for frame in 0..<Int(frameCount) {
            let time = Double(frame) / sampleRate
            var sample = 0.0
            for note in notes where time >= note.start && time <= note.start + note.length {
                let local = time - note.start
                let attack = min(1, local / 0.012)
                let decay = exp(-3.8 * local / note.length)
                sample += sin(2 * .pi * note.frequency * local) * attack * decay * 0.34
                sample += sin(2 * .pi * note.frequency * 2 * local) * attack * decay * 0.10
            }
            channel[frame] = Float(tanh(sample * 1.7) * 0.82)
        }
        return buffer
    }
}
