// ============================================
// SKYLOG — Audio Manager (Howler.js)
// Step 9 will implement full audio system
// ============================================

// Audio will be initialized in a later step
// Placeholder for the audio manager structure

export interface AudioTrack {
  id: string;
  src: string;
  volume: number;
  loop: boolean;
}

export const AUDIO_TRACKS: AudioTrack[] = [
  { id: "bgm-day", src: "/audio/bgm-day.mp3", volume: 0.5, loop: true },
  { id: "bgm-night", src: "/audio/bgm-night.mp3", volume: 0.4, loop: true },
  { id: "sfx-takeoff", src: "/audio/sfx-takeoff.mp3", volume: 0.7, loop: false },
  { id: "sfx-landing", src: "/audio/sfx-landing.mp3", volume: 0.6, loop: false },
  { id: "sfx-coin", src: "/audio/sfx-coin.mp3", volume: 0.5, loop: false },
  { id: "sfx-levelup", src: "/audio/sfx-levelup.mp3", volume: 0.8, loop: false },
];
