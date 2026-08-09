// sieve-ocr.swift — deterministic text extraction using Apple's Vision framework.
//
//   swiftc -O sieve-ocr.swift -o sieve-ocr        (once)
//   ./sieve-ocr <image.png> [--min-confidence 0.3]
//
// WHY THIS EXISTS
// The VLM product-lock rubric asks "is every text element present with the SAME SPELLING?
// Read it letter by letter" — and then passed a can label reading "COONITION ELIXIR" instead of
// "COGNITION ELIXIR". It could not resolve the small type and answered confidently anyway.
// That is the same failure mode that made the audio judge worthless: a model asked a question it
// cannot actually see the answer to will invent one rather than abstain.
//
// Vision's VNRecognizeTextRequest reads the pixels. It either finds the string or it does not,
// and it reports a real per-observation confidence. That makes on-product spelling a DETERMINISTIC
// check: OCR the candidate, OCR the canonical, diff the strings.
//
// Output is JSON: every recognised string with confidence and normalised bounding box.
import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
guard args.count > 1 else {
    FileHandle.standardError.write("usage: sieve-ocr <image> [--min-confidence 0.3]\n".data(using: .utf8)!)
    exit(2)
}
let path = args[1]
var minConf: Float = 0.3
if let i = args.firstIndex(of: "--min-confidence"), i + 1 < args.count {
    minConf = Float(args[i + 1]) ?? 0.3
}

guard let image = NSImage(contentsOfFile: path),
      let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    FileHandle.standardError.write("sieve-ocr: cannot read image: \(path)\n".data(using: .utf8)!)
    exit(2)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate          // slower, far better on small/stylised type
request.usesLanguageCorrection = false        // CRITICAL: correction would silently "fix"
                                              // COONITION -> COGNITION and hide the exact defect
                                              // this tool exists to catch.
request.recognitionLanguages = ["en-US"]

let handler = VNImageRequestHandler(cgImage: cg, options: [:])
do { try handler.perform([request]) } catch {
    FileHandle.standardError.write("sieve-ocr: \(error)\n".data(using: .utf8)!)
    exit(1)
}

var out: [[String: Any]] = []
for obs in (request.results ?? []) {
    guard let top = obs.topCandidates(1).first, top.confidence >= minConf else { continue }
    let b = obs.boundingBox
    out.append([
        "text": top.string,
        "confidence": Double(round(1000 * top.confidence) / 1000),
        "box": ["x": round(1000 * b.origin.x) / 1000, "y": round(1000 * b.origin.y) / 1000,
                "w": round(1000 * b.size.width) / 1000, "h": round(1000 * b.size.height) / 1000],
    ])
}

let payload: [String: Any] = ["file": path, "count": out.count, "strings": out]
let data = try! JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys])
print(String(data: data, encoding: .utf8)!)
