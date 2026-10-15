import { apiFetch } from './api';
import { FALLBACK_MOVIES } from '../data/fallbackMovies';

const SAVED_ROOMS_KEY = 'kinoverse_saved_rooms';

export function getLocalRooms() {
  try {
    const data = localStorage.getItem(SAVED_ROOMS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

export function saveLocalRoom(room) {
  try {
    const rooms = getLocalRooms();
    rooms[room.id] = room;
    localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(rooms));
  } catch (e) {
    console.warn('Failed to save local room:', e);
  }
}

function resolveUser(user) {
  if (user && user.id) return user;
  try {
    const saved = localStorage.getItem('kinoverse_guest_user');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    id: 'usr_guest_' + Math.random().toString(36).slice(2, 8),
    name: 'Mehmon ' + Math.floor(100 + Math.random() * 900),
    username: 'mehmon',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    role: 'user'
  };
}

export function createLocalRoom(movie, user) {
  const roomId = 'KINO-' + Math.floor(1000 + Math.random() * 9000);
  const activeUser = resolveUser(user);

  const newRoom = {
    id: roomId,
    movieId: movie?.id || 'mov_jannat_01',
    movieTitle: movie?.title || 'Virtual Kino',
    movieDescription: movie?.description || 'Virtual zalda sinxron tomosha qilish',
    moviePoster: movie?.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    movieBackdrop: movie?.backdrop || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    videoUrl: movie?.videoUrl || '',
    duration: movie?.duration || '120 daqiqa',
    quality: movie?.quality || 'Full HD',
    language: movie?.language || 'O‘zbekcha',
    hostId: activeUser.id,
    hostName: activeUser.name,
    hostAvatar: activeUser.avatar,
    isPlaying: 0,
    currentTime: 0,
    members: [
      {
        userId: activeUser.id,
        name: activeUser.name,
        avatar: activeUser.avatar,
        seatIndex: 0,
        isHost: true,
        joinedAt: Date.now()
      }
    ]
  };

  saveLocalRoom(newRoom);
  return newRoom;
}

export function getFallbackOrLocalRoom(roomId, user) {
  const localRooms = getLocalRooms();
  if (roomId && localRooms[roomId]) {
    return localRooms[roomId];
  }

  // Find matching movie by id or pick first fallback movie
  const foundMovie = FALLBACK_MOVIES.find(m => m.id === roomId || (roomId && roomId.includes(m.id))) || FALLBACK_MOVIES[0];
  const activeUser = resolveUser(user);

  const fallbackRoom = {
    id: roomId || 'KINO-VIP',
    movieId: foundMovie.id,
    movieTitle: foundMovie.title,
    movieDescription: foundMovie.description,
    moviePoster: foundMovie.poster,
    movieBackdrop: foundMovie.backdrop,
    videoUrl: foundMovie.videoUrl || '',
    duration: foundMovie.duration,
    quality: foundMovie.quality,
    language: foundMovie.language,
    hostId: activeUser.id,
    hostName: activeUser.name,
    hostAvatar: activeUser.avatar,
    isPlaying: 0,
    currentTime: 0,
    members: [
      {
        userId: activeUser.id,
        name: activeUser.name,
        avatar: activeUser.avatar,
        seatIndex: 0,
        isHost: true,
        joinedAt: Date.now()
      }
    ]
  };

  saveLocalRoom(fallbackRoom);
  return fallbackRoom;
}

export const FALLBACK_ACTIVE_ROOMS = [
  {
    id: 'KINO-1001',
    movieId: 'mov_jannat_01',
    movieTitle: 'Jannat onalar oyogʻi ostida',
    moviePoster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    hostName: 'Alisher',
    currentMembersCount: 2
  },
  {
    id: 'KINO-1002',
    movieId: 'mov_abdulla_02',
    movieTitle: 'Abdullajon',
    moviePoster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    hostName: 'Jasur',
    currentMembersCount: 3
  }
];

export async function startOrJoinRoom(movie, user, navigate) {
  if (movie && movie.id) {
    try {
      const res = await apiFetch('/rooms/create', {
        method: 'POST',
        body: { movieId: movie.id }
      });
      if (res && res.roomId) {
        navigate(`/room/${res.roomId}`);
        return;
      }
    } catch (e) {
      console.warn('API room creation failed, falling back to local room:', e);
    }
  }

  const localRoom = createLocalRoom(movie, user);
  navigate(`/room/${localRoom.id}`);
}
