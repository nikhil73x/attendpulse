import { BackgroundVideoItem } from '../types/video';

/**
 * Curated collection of 10 dark, atmospheric, high-quality, copyright-free background videos.
 * Sources: Public Domain (NASA Earth Observatory / US Federal Government) and Creative Commons
 * Attribution (Wikimedia Commons high-resolution archival collections).
 * Predominantly black, charcoal, dark blue, deep purple, and neon accents.
 * Stored locally for instant zero-latency playback.
 */
export const backgroundVideos: BackgroundVideoItem[] = [
  {
    id: 'chicago-night',
    title: 'Chicago Metropolis Lights',
    theme: 'nocturnal city skyline',
    src: '/videos/chicago-night.webm',
    mimeType: 'video/webm',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%23060810"/><circle cx="960" cy="540" r="500" fill="%231e293b" filter="blur(120px)"/></svg>',
    accentColor: '#38bdf8',
    description: 'High-resolution aerial view of Chicago skyline with amber highways and skyscrapers at night.',
  },
  {
    id: 'earth-night-lights',
    title: 'Earth City Lights from Space',
    theme: 'space and orbit',
    src: '/videos/earth-night-lights.webm',
    mimeType: 'video/webm',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%23020408"/><circle cx="960" cy="540" r="450" fill="%230f172a" filter="blur(110px)"/></svg>',
    accentColor: '#60a5fa',
    description: 'NASA 4K imagery of planetary city lights and moon glint over ocean water from orbit.',
  },
  {
    id: 'san-francisco-night',
    title: 'San Francisco Night Aerial',
    theme: 'aerial city panorama',
    src: '/videos/san-francisco-night.webm',
    mimeType: 'video/webm',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%2307080f"/><circle cx="960" cy="540" r="480" fill="%231e1b4b" filter="blur(110px)"/></svg>',
    accentColor: '#818cf8',
    description: '1080p aerial nocturnal panorama of San Francisco street grid and bay reflections.',
  },
  {
    id: 'tokyo-skytree-night',
    title: 'Tokyo Skytree Skyline',
    theme: 'metropolis night illumination',
    src: '/videos/tokyo-skytree-night.webm',
    mimeType: 'video/webm',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%2305070d"/><circle cx="960" cy="540" r="450" fill="%23141f2e" filter="blur(100px)"/></svg>',
    accentColor: '#a78bfa',
    description: 'Tokyo urban skyline with illuminated Skytree and atmospheric city lights.',
  },
  {
    id: 'cyberpunk-night',
    title: 'Cyberpunk Grid',
    theme: 'cyberpunk environments',
    src: '/videos/cyberpunk-night.mp4',
    mimeType: 'video/mp4',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%23060814"/><circle cx="960" cy="540" r="500" fill="%23131738" filter="blur(120px)"/></svg>',
    accentColor: '#3b82f6',
    description: 'Aerial nocturnal flow of neon-lit arteries across a futuristic city.',
  },
  {
    id: 'neon-rain',
    title: 'Neon Rain Reflections',
    theme: 'rainy neon streets',
    src: '/videos/neon-rain.webm',
    mimeType: 'video/webm',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%2305070f"/><circle cx="960" cy="540" r="480" fill="%231b1c3d" filter="blur(110px)"/></svg>',
    accentColor: '#8b5cf6',
    description: 'Moody water droplets cascading over glass with distant neon hues.',
  },
  {
    id: 'dark-city',
    title: 'Metropolis Arteries',
    theme: 'dark futuristic city',
    src: '/videos/dark-city.webm',
    mimeType: 'video/webm',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%2308090d"/><circle cx="960" cy="540" r="450" fill="%231a2333" filter="blur(100px)"/></svg>',
    accentColor: '#6366f1',
    description: 'Streets illuminated by deep shadows and high-speed light ribbons.',
  },
  {
    id: 'dark-space',
    title: 'Deep Cosmic Abyss',
    theme: 'dark space',
    src: '/videos/dark-space.webm',
    mimeType: 'video/webm',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%23030307"/><circle cx="960" cy="540" r="400" fill="%23121526" filter="blur(90px)"/></svg>',
    accentColor: '#c084fc',
    description: 'Infinite expanse with celestial particles and distant starlight.',
  },
  {
    id: 'glowing-tech',
    title: 'Cyber Infrastructure',
    theme: 'subtle glowing technology',
    src: '/videos/glowing-tech.webm',
    mimeType: 'video/webm',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%2306070a"/><circle cx="960" cy="540" r="420" fill="%23141f2e" filter="blur(95px)"/></svg>',
    accentColor: '#0ea5e9',
    description: 'Cold industrial architecture with subtle luminous indicators and vapor.',
  },
  {
    id: 'night-architecture',
    title: 'Monolith Silhouette',
    theme: 'night-time architecture',
    src: '/videos/night-architecture.webm',
    mimeType: 'video/webm',
    poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%23040608"/><circle cx="960" cy="540" r="460" fill="%23161c28" filter="blur(100px)"/></svg>',
    accentColor: '#4f46e5',
    description: 'Majestic dark silhouette under shifting midnight atmospheric light.',
  },
];

/**
 * Returns a randomly selected video from the collection.
 * Ensures the video is not always the same.
 */
export function getRandomBackgroundVideo(excludeId?: string): BackgroundVideoItem {
  const eligibleVideos = excludeId
    ? backgroundVideos.filter((v) => v.id !== excludeId)
    : backgroundVideos;

  const list = eligibleVideos.length > 0 ? eligibleVideos : backgroundVideos;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

/**
 * Returns the next video in sequence for manual cycling.
 */
export function getNextBackgroundVideo(currentId: string): BackgroundVideoItem {
  const currentIndex = backgroundVideos.findIndex((v) => v.id === currentId);
  const nextIndex = (currentIndex + 1) % backgroundVideos.length;
  return backgroundVideos[nextIndex];
}

