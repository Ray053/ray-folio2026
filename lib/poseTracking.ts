// MediaPipe Hand tracking singleton — tracks up to 2 hands.
// The puppet figure is fixed; the user's hands drive the puppet's hands (IK).

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export type Landmark = { x: number; y: number; z: number; visibility?: number }

const WASM_CDN  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

let landmarker: HandLandmarker | null = null
let video: HTMLVideoElement | null = null
let stream: MediaStream | null = null
let running = false
let rafId = 0
let lastVideoTime = -1
let latest: Landmark[][] | null = null   // array of hands, each 21 landmarks

/** Latest detected hands (each 21 normalized landmarks), or null. */
export function getHandLandmarks(): Landmark[][] | null {
  return latest
}

export function isPoseRunning() {
  return running
}

export async function startPose(): Promise<void> {
  if (running) return

  const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
  landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands: 2,
  })

  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480, facingMode: 'user' },
    audio: false,
  })
  video = document.createElement('video')
  video.srcObject = stream
  video.playsInline = true
  video.muted = true
  await video.play()

  running = true
  loop()
}

function loop() {
  if (!running || !landmarker || !video) return
  if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
    lastVideoTime = video.currentTime
    try {
      const res = landmarker.detectForVideo(video, performance.now())
      latest = res.landmarks && res.landmarks.length ? res.landmarks : null
    } catch {
      // transient detection errors — keep last frame
    }
  }
  rafId = requestAnimationFrame(loop)
}

export function stopPose(): void {
  running = false
  cancelAnimationFrame(rafId)
  latest = null
  lastVideoTime = -1

  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
  if (video) {
    video.srcObject = null
    video = null
  }
  if (landmarker) {
    landmarker.close()
    landmarker = null
  }
}
