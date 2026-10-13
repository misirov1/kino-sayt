import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from '../movie/VideoPlayer';
import RoomChat from './RoomChat';
import RoomInviteModal from './RoomInviteModal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getSocket } from '../../utils/socket';
import confetti from 'canvas-confetti';
import { 
  Users, UserPlus, Share2, Maximize2, Minimize2, 
  Crown, Sparkles, AlertCircle, Volume2, Shield, FolderUp, Trash2
} from 'lucide-react';

// Coordinates for the 4 designated seats on the couch (percentages)
const SEAT_TARGETS = [
  { seatIndex: 0, x: 26, y: 70, label: '1-O‘rindiq' },
  { seatIndex: 1, x: 42, y: 70, label: '2-O‘rindiq' },
  { seatIndex: 2, x: 58, y: 70, label: '3-O‘rindiq' },
  { seatIndex: 3, x: 74, y: 70, label: '4-O‘rindiq' }
];

export default function VirtualCinemaRoom({ room, movie }) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const socket = getSocket();

  // Room state
  const [members, setMembers] = useState(room.members || []);
  const [mySeatIndex, setMySeatIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(room.isPlaying === 1);
  const [currentTime, setCurrentTime] = useState(room.currentTime || 0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [activeReactions, setActiveReactions] = useState([]);
  const [roomError, setRoomError] = useState(null);

  // Local device video override state
  const [currentVideoSrc, setCurrentVideoSrc] = useState(movie.videoUrl);
  const [currentVideoTitle, setCurrentVideoTitle] = useState(movie.title);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const localFileInputRef = useRef(null);

  // Avatar animation states map: userId -> { state: 'walking'|'seated', currentX, currentY, targetX, targetY }
  const [avatarAnimations, setAvatarAnimations] = useState({});

  const roomContainerRef = useRef(null);

  const activeUser = user;

  // Join Room & Socket Listeners
  useEffect(() => {
    if (!room) return;

    socket.emit('join_room', {
      roomId: room.id,
      user: {
        id: activeUser.id,
        name: activeUser.name,
        username: activeUser.username,
        avatar: activeUser.avatar,
        role: activeUser.role
      }
    });

    const handleRoomState = (data) => {
      setMembers(data.members || []);
      setMySeatIndex(data.mySeatIndex);
      setIsPlaying(data.isPlaying);
      setCurrentTime(data.currentTime);

      // Initialize avatar animations: existing members are seated, current user starts walking from door
      const newAnims = {};
      data.members.forEach(m => {
        const target = SEAT_TARGETS[m.seatIndex] || SEAT_TARGETS[0];
        if (m.userId === activeUser.id) {
          // Trigger entry walking animation for current user
          newAnims[m.userId] = {
            state: 'walking',
            x: 8, // Door X
            y: 64, // Floor Y
            targetX: target.x,
            targetY: target.y
          };
          // Start walking towards couch
          setTimeout(() => {
            setAvatarAnimations(prev => ({
              ...prev,
              [m.userId]: {
                ...prev[m.userId],
                state: 'walking_active',
                x: target.x,
                y: target.y
              }
            }));
          }, 300);

          // Seat down when reaching sofa
          setTimeout(() => {
            setAvatarAnimations(prev => ({
              ...prev,
              [m.userId]: {
                state: 'seated',
                x: target.x,
                y: target.y
              }
            }));
            socket.emit('avatar_seated', { roomId: room.id, seatIndex: m.seatIndex });
          }, 2400);
        } else {
          // Existing members are already seated
          newAnims[m.userId] = {
            state: 'seated',
            x: target.x,
            y: target.y
          };
        }
      });
      setAvatarAnimations(newAnims);
    };

    const handleMemberEntered = (newMember) => {
      setMembers(prev => {
        const exists = prev.some(m => m.userId === newMember.userId);
        if (exists) return prev;
        const updated = [...prev, newMember];
        if (updated.length === 4) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
        return updated;
      });

      const target = SEAT_TARGETS[newMember.seatIndex] || SEAT_TARGETS[0];
      setAvatarAnimations(prev => ({
        ...prev,
        [newMember.userId]: {
          state: 'walking',
          x: 8,
          y: 64,
          targetX: target.x,
          targetY: target.y
        }
      }));

      // Animate walking across the floor to the designated seat
      setTimeout(() => {
        setAvatarAnimations(prev => ({
          ...prev,
          [newMember.userId]: {
            ...prev[newMember.userId],
            state: 'walking_active',
            x: target.x,
            y: target.y
          }
        }));
      }, 300);

      setTimeout(() => {
        setAvatarAnimations(prev => ({
          ...prev,
          [newMember.userId]: {
            state: 'seated',
            x: target.x,
            y: target.y
          }
        }));
      }, 2400);

      showToast(`"${newMember.name}" xonaga kirdi va divanga o‘tirdi.`, 'info');
    };

    const handleMemberLeft = (data) => {
      setMembers(prev => prev.filter(m => m.userId !== data.userId));
      setAvatarAnimations(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
      showToast(`"${data.userName}" xonadan chiqdi.`, 'info');
    };

    const handleSyncPlay = (data) => {
      setIsPlaying(true);
      setCurrentTime(data.currentTime);
      showToast(`${data.fromUserName} videoni boshladi ▶️`, 'info');
    };

    const handleSyncPause = (data) => {
      setIsPlaying(false);
      setCurrentTime(data.currentTime);
      showToast(`${data.fromUserName} videoni to‘xtatdi ⏸️`, 'info');
    };

    const handleSyncSeek = (data) => {
      setCurrentTime(data.currentTime);
    };

    const handleNewReaction = (data) => {
      const id = Date.now() + Math.random();
      const targetSeat = SEAT_TARGETS[data.seatIndex] || SEAT_TARGETS[0];
      setActiveReactions(prev => [
        ...prev,
        { id, emoji: data.emoji, userName: data.userName, x: targetSeat.x }
      ]);
      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== id));
      }, 3000);
    };

    const handleRoomError = (data) => {
      setRoomError(data.message);
      showToast(data.message, 'error');
    };

    const handleSyncVideoChanged = (data) => {
      if (data.videoUrl) {
        setCurrentVideoSrc(data.videoUrl);
        if (data.title) setCurrentVideoTitle(data.title);
        showToast(`${data.fromUserName || 'Boshlovchi'} videoni almashtirdi: ${data.title || ''}`, 'info');
      }
    };

    socket.on('room_state', handleRoomState);
    socket.on('member_entered', handleMemberEntered);
    socket.on('member_left', handleMemberLeft);
    socket.on('sync_video_play', handleSyncPlay);
    socket.on('sync_video_pause', handleSyncPause);
    socket.on('sync_video_seek', handleSyncSeek);
    socket.on('new_reaction', handleNewReaction);
    socket.on('room_error', handleRoomError);
    socket.on('sync_video_changed', handleSyncVideoChanged);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('member_entered', handleMemberEntered);
      socket.off('member_left', handleMemberLeft);
      socket.off('sync_video_play', handleSyncPlay);
      socket.off('sync_video_pause', handleSyncPause);
      socket.off('sync_video_seek', handleSyncSeek);
      socket.off('new_reaction', handleNewReaction);
      socket.off('room_error', handleRoomError);
      socket.off('sync_video_changed', handleSyncVideoChanged);
    };
  }, [room?.id, user?.id]);

  // Video Sync Actions triggered locally
  const handleLocalPlay = (time) => {
    socket.emit('video_play', { roomId: room.id, currentTime: time });
  };

  const handleLocalPause = (time) => {
    socket.emit('video_pause', { roomId: room.id, currentTime: time });
  };

  const handleLocalSeek = (time) => {
    socket.emit('video_seek', { roomId: room.id, currentTime: time });
  };

  // Upload/select local video from PC or Phone
  const handleLocalVideoFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Instantly play locally from Blob URL without any delay
    const localBlobUrl = URL.createObjectURL(file);
    setCurrentVideoSrc(localBlobUrl);
    setCurrentVideoTitle(file.name);
    showToast(`"${file.name}" qurilmadan ochildi!`, 'success');

    // 2. Upload to server in background so everyone in the room syncs
    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const token = localStorage.getItem('kinoverse_token');
      const adminPin = localStorage.getItem('kinoverse_admin_pin');
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(adminPin ? { 'x-admin-pin': adminPin } : {})
      };

      const res = await fetch('/api/upload/file', {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();

      if (data.success && data.url) {
        showToast(`"${file.name}" butun zal uchun saqlandi!`, 'success');
        socket.emit('change_video', {
          roomId: room.id,
          videoUrl: data.url,
          title: file.name
        });
      }
    } catch (err) {
      console.warn('Background upload failed, playing locally:', err);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSendReaction = (emoji) => {
    socket.emit('room_reaction', {
      roomId: room.id,
      emoji,
      seatIndex: mySeatIndex
    });
  };

  // Auto-delete movie when playback completes
  const handleVideoEnded = async () => {
    try {
      showToast('🎬 Kino tomoshasi yakunlandi!', 'info');
      if (movie && (movie.isPrivate === 1 || movie.id?.startsWith('mov_user_') || movie.uploadedBy === activeUser?.id)) {
        const res = await fetch(`/api/movies/${movie.id}/finish-and-delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('kinoverse_token') ? { Authorization: `Bearer ${localStorage.getItem('kinoverse_token')}` } : {}),
            ...(localStorage.getItem('kinoverse_admin_pin') ? { 'x-admin-pin': localStorage.getItem('kinoverse_admin_pin') } : {})
          }
        });
        const data = await res.json();
        if (data.deleted) {
          showToast('🔒 Shaxsiy kino ko‘rib bo‘lingani sababli serverdan to‘liq o‘chirildi!', 'success');
        }
      }
    } catch (err) {
      console.warn('Auto delete error:', err);
    }
  };

  // Manual delete button ("Ko'rib bo'ldim - O'chirish")
  const handleManualFinishAndDelete = async () => {
    if (!window.confirm('Kinoni ko‘rib bo‘ldingizmi? Ushbu shaxsiy kino serverdan butunlay o‘chiriladi.')) return;
    try {
      const res = await fetch(`/api/movies/${movie.id}/finish-and-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('kinoverse_token') ? { Authorization: `Bearer ${localStorage.getItem('kinoverse_token')}` } : {}),
          ...(localStorage.getItem('kinoverse_admin_pin') ? { 'x-admin-pin': localStorage.getItem('kinoverse_admin_pin') } : {})
        }
      });
      const data = await res.json();
      showToast(data.message || 'Kino muvaffaqiyatli o‘chirildi!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err) {
      showToast('O‘chirishda xatolik', 'error');
    }
  };

  // Fullscreen toggle: hides the virtual room and expands video player to 100vw/100vh
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (roomContainerRef.current?.requestFullscreen) {
        roomContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={roomContainerRef}
      className={`relative w-full overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'rounded-3xl bg-zinc-950 border border-zinc-800/80 shadow-2xl'
      }`}
    >
      {/* Non-blocking room error alert banner */}
      {roomError && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200 flex items-center justify-between z-40">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{roomError}</span>
          </div>
          <button onClick={() => setRoomError(null)} className="text-amber-400 hover:text-white font-bold px-2 py-0.5">✕</button>
        </div>
      )}

      {/* VIRTUAL CINEMA ROOM VIEW (2.5D Lounge with TV, Sofa, Walkways and Avatars) */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 sm:p-6">
          
          {/* Main 2.5D Cinema Room Canvas */}
          <div className="relative flex-1 min-h-[520px] sm:min-h-[620px] rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-zinc-800/80 overflow-hidden shadow-inner flex flex-col justify-between">
            
            {/* Ambient Ceiling Lights & Wall Decors */}
            <div className="absolute top-0 left-0 right-0 h-8 flex justify-around items-center px-12 pointer-events-none opacity-60">
              <div className="w-8 h-2 rounded-full bg-amber-500/30 blur-sm" />
              <div className="w-12 h-2 rounded-full bg-red-500/30 blur-sm" />
              <div className="w-8 h-2 rounded-full bg-amber-500/30 blur-sm" />
            </div>

            {/* Room Header Controls */}
            <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white font-bold text-xs shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Jonli Zal ({members.length}/4)
                </span>
                <span className="text-xs font-semibold text-zinc-300 hidden sm:inline">
                  {currentVideoTitle || room.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Local Video File Picker from PC / Phone */}
                <input
                  type="file"
                  ref={localFileInputRef}
                  accept="video/mp4,video/webm,video/ogg,video/mkv,video/*"
                  onChange={handleLocalVideoFileSelect}
                  className="hidden"
                />

                <button
                  onClick={() => localFileInputRef.current?.click()}
                  disabled={isUploadingVideo}
                  title="Kompyuter yoki telefoningizdan video faylni tanlang"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-amber-300 hover:text-amber-200 text-xs font-bold py-1.5 px-3 rounded-xl border border-amber-500/30 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <FolderUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUploadingVideo ? 'Yuklanmoqda...' : 'Fayldan video qo‘yish'}</span>
                </button>

                {/* Ko'rib bo'ldim (O'chirish) button for private/uploaded movies */}
                {(movie.isPrivate === 1 || movie.id?.startsWith('mov_user_') || movie.uploadedBy === activeUser?.id) && (
                  <button
                    onClick={handleManualFinishAndDelete}
                    title="Kinoni ko‘rib bo‘ldim (Serverdan o‘chirish)"
                    className="flex items-center gap-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-red-700/60 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="hidden sm:inline">Ko‘rib bo‘ldim (O‘chirish)</span>
                  </button>
                )}

                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Do‘stni taklif qilish</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  title="Kattalashtirish (Fullscreen)"
                  className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ========================================= */}
            {/* 1. KATTA TELEVIZOR (WALL-MOUNTED BIG SCREEN) */}
            {/* ========================================= */}
            <div className="relative z-10 mx-auto w-[92%] sm:w-[84%] md:w-[78%] max-w-4xl mt-1 mb-2">
              
              {/* Screen Ambient Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-red-600/20 via-amber-500/20 to-red-600/20 rounded-2xl blur-xl tv-screen-glow pointer-events-none" />

              {/* TV Frame & Stand */}
              <div className="relative bg-zinc-950 p-2 sm:p-3 rounded-2xl border-4 border-zinc-800 shadow-2xl">
                {/* TV Brand Dot */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-[8px] font-black text-zinc-600 tracking-widest">KINOVERSE 4K OLED</span>
                </div>

                {/* Aspect Ratio Video Container */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                  <VideoPlayer
                    src={currentVideoSrc}
                    poster={movie.backdrop}
                    title={currentVideoTitle || movie.title}
                    isSynced={true}
                    externalIsPlaying={isPlaying}
                    externalTime={currentTime}
                    onPlay={handleLocalPlay}
                    onPause={handleLocalPause}
                    onSeek={handleLocalSeek}
                    onEnded={handleVideoEnded}
                    isFullscreen={false}
                    onToggleFullscreen={toggleFullscreen}
                  />
                </div>
              </div>
            </div>

            {/* ========================================= */}
            {/* 2. ENTRANCE DOOR & PARQUET FLOOR */}
            {/* ========================================= */}
            <div className="relative w-full h-44 sm:h-52 bg-gradient-to-t from-zinc-950 via-zinc-900 to-transparent border-t border-zinc-800/40">
              
              {/* Floor Perspective Pattern (Wood Parquet Lines) */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #333 1px, transparent 1px)',
                  backgroundSize: '40px 40px, 60px 100%'
                }}
              />

              {/* Entrance Door (Left Wall) */}
              <div className="absolute bottom-10 left-3 sm:left-6 w-12 sm:w-16 h-28 sm:h-36 bg-gradient-to-r from-amber-950/60 to-zinc-900 rounded-t-xl border-t-2 border-r-2 border-l-2 border-amber-600/40 shadow-xl flex flex-col justify-between p-1 z-0">
                <div className="w-full flex justify-between items-center text-[8px] text-amber-400 font-bold px-1 uppercase tracking-tighter">
                  <span>🚪 Kirish</span>
                </div>
                {/* Door Floor Light Spill */}
                <div className="absolute -bottom-2 -left-2 w-24 h-10 bg-amber-500/10 blur-md rounded-full pointer-events-none transform rotate-12" />
              </div>

              {/* ========================================= */}
              {/* 3. LUXURY 4-SEATER CINEMA COUCH (DIVAN) */}
              {/* ========================================= */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] sm:w-[80%] max-w-2xl z-10">
                
                {/* Couch Shadow */}
                <div className="absolute -bottom-2 left-4 right-4 h-6 bg-black/80 blur-md rounded-full pointer-events-none" />

                {/* Couch Main Body */}
                <div className="relative bg-gradient-to-b from-red-950/90 via-red-900/90 to-red-950 rounded-2xl border-2 border-red-700/60 p-2 sm:p-3 shadow-2xl flex items-center justify-around gap-2">
                  
                  {/* Couch Backrest Pillows */}
                  <div className="absolute -top-3 left-3 right-3 h-5 bg-red-900 rounded-t-xl border-t border-red-600/40 shadow-sm" />

                  {/* 4 Designated Seats on Couch */}
                  {[0, 1, 2, 3].map(seatIdx => {
                    const memberOnSeat = members.find(m => m.seatIndex === seatIdx);
                    const isMySeat = mySeatIndex === seatIdx;

                    return (
                      <div
                        key={seatIdx}
                        className={`relative flex-1 h-14 sm:h-16 rounded-xl flex flex-col items-center justify-center transition-all ${
                          memberOnSeat
                            ? 'bg-red-950/80 border border-red-600/50 shadow-inner'
                            : 'bg-zinc-900/60 border border-dashed border-zinc-700/60 hover:border-amber-500/60 hover:bg-zinc-800/60 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!memberOnSeat) {
                            setIsInviteOpen(true);
                          }
                        }}
                      >
                        {memberOnSeat ? (
                          <div className="text-[10px] font-bold text-red-300">
                            {memberOnSeat.userId === activeUser?.id ? 'Siz' : memberOnSeat.name.split(' ')[0]}
                          </div>
                        ) : (
                          <div className="text-center opacity-70 group-hover:opacity-100">
                            <span className="text-[10px] text-zinc-400 block font-medium">
                              +{seatIdx + 1}-joy
                            </span>
                            <span className="text-[8px] text-amber-400 font-semibold block">
                              Do‘st chaqirish
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ========================================= */}
              {/* 4. ANIMATED WALKING & SITTING AVATARS */}
              {/* ========================================= */}
              {members.map(member => {
                const anim = avatarAnimations[member.userId] || {
                  state: 'seated',
                  x: SEAT_TARGETS[member.seatIndex]?.x || 50,
                  y: 70
                };
                const isWalking = anim.state === 'walking' || anim.state === 'walking_active';
                const isSeated = anim.state === 'seated';

                return (
                  <div
                    key={member.userId}
                    className={`absolute z-30 flex flex-col items-center pointer-events-none transition-all duration-[2100ms] ease-out ${
                      isWalking ? 'avatar-walking' : isSeated ? 'avatar-sitting' : ''
                    }`}
                    style={{
                      left: `${anim.x}%`,
                      bottom: isSeated ? '32px' : '42px',
                      transform: 'translate(-50%, 0)'
                    }}
                  >
                    {/* Overhead Name & Role Badge */}
                    <div className="mb-1 flex flex-col items-center">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-zinc-700 text-[10px] font-bold text-white shadow-lg whitespace-nowrap">
                        {member.isHost && (
                          <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                        )}
                        <span>{member.name.split(' ')[0]}</span>
                        {member.userId === activeUser?.id && (
                          <span className="text-red-400 font-bold">(Siz)</span>
                        )}
                      </div>
                    </div>

                    {/* Avatar Character Sprite */}
                    <div className="relative">
                      {/* Avatar Head / Face with ring */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-red-500 shadow-xl ring-2 ring-black bg-zinc-800">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Popcorn bucket icon when seated */}
                      {isSeated && (
                        <div className="absolute -bottom-1 -right-1 text-xs bg-black/80 p-0.5 rounded-full border border-amber-500 shadow-sm animate-bounce">
                          🍿
                        </div>
                      )}

                      {/* Walking footsteps indicator */}
                      {isWalking && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-black/40 blur-xs avatar-shadow-walking" />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Floating Emojis / Live Reactions Above Avatars */}
              {activeReactions.map(r => (
                <div
                  key={r.id}
                  className="absolute bottom-24 z-40 animate-bounce pointer-events-none transform -translate-x-1/2 flex flex-col items-center transition-all duration-1000"
                  style={{ left: `${r.x}%` }}
                >
                  <span className="text-3xl sm:text-4xl filter drop-shadow-lg">
                    {r.emoji}
                  </span>
                  <span className="text-[9px] font-bold text-white bg-black/80 px-1.5 py-0.5 rounded-full border border-zinc-700 mt-1">
                    {r.userName}
                  </span>
                </div>
              ))}

            </div>
          </div>

          {/* Sidebar: Live Room Chat & Reactions (300px width on desktop) */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col">
            <RoomChat
              roomId={room.id}
              onSendReaction={handleSendReaction}
            />
          </div>

        </div>

      {/* Invite Modal */}
      <RoomInviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={room.id}
        movieTitle={movie.title}
      />
    </div>
  );
}
