export interface BackgroundVideoItem {
  id: string;
  title: string;
  theme: string;
  src: string;
  mimeType: 'video/mp4' | 'video/webm';
  poster: string;
  accentColor?: string; // Subtle atmospheric tint, e.g., deep indigo, obsidian blue, dark cyan
  description?: string;
}

