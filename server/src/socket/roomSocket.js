const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// In-memory room state for real-time video sync and active seats
// roomId -> { movieId, isPlaying, currentTime, updatedAt, playbackRate, hostId, members: Map(userId -> { socketId, user, seatIndex, isReady }) }
const roomsState = new Map();

// Map userId -> socketId for direct notification pushes (like room invites)
const userSockets = new Map();

function initRoomSocket(io) {
  // Clear any stale room members from previous server runs
  try {
    db.prepare('DELETE FROM room_members').run();
  } catch (err) {
    console.warn('Could not clear stale room_members:', err.message);
  }

  io.on('connection', (socket) => {
    let currentRoomId = null;
    let currentUser = null;

    // Register user for direct events (notifications, invites)
    socket.on('register_user', (user) => {
      if (user && user.id) {
        currentUser = user;
        userSockets.set(user.id, socket.id);
        socket.join(`user_${user.id}`);
      }
    });

    // Join virtual cinema room
    socket.on('join_room', ({ roomId, user }) => {
      try {
        if (!roomId) {
          return socket.emit('room_error', { message: 'Xona kodi ko‘rsatilmadi.' });
        }

        if (!user || !user.id) {
          const guestNum = Math.floor(100 + Math.random() * 900);
          user = {
            id: 'usr_guest_' + socket.id.slice(0, 8),
            name: 'Mehmon ' + guestNum,
            username: 'mehmon_' + guestNum,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
            role: 'user'
          };
        }

        currentRoomId = roomId;
        currentUser = user;
        userSockets.set(user.id, socket.id);

        let room = roomsState.get(roomId);
        if (!room) {
          // Fetch room from DB
          const dbRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
          if (!dbRoom) {
            return socket.emit('room_error', { message: 'Kino xonasi topilmadi.' });
          }

          room = {
            id: roomId,
            movieId: dbRoom.movieId,
            hostId: dbRoom.hostId,
            isPlaying: dbRoom.isPlaying === 1,
            currentTime: dbRoom.currentTime || 0,
            playbackRate: dbRoom.playbackRate || 1,
            updatedAt: Date.now(),
            members: new Map()
          };
          roomsState.set(roomId, room);
        }

        // 1. Clean up disconnected sockets in this room
        for (const [uid, m] of room.members.entries()) {
          const clientSocket = io.sockets.sockets.get(m.socketId);
          if ((!clientSocket || !clientSocket.connected) && uid !== user.id && m.socketId !== socket.id) {
            room.members.delete(uid);
            try {
              db.prepare('DELETE FROM room_members WHERE roomId = ? AND userId = ?').run(roomId, uid);
            } catch (e) {}
          }
        }

        // 2. Clean up previous entry for the same socket under different ID
        for (const [uid, m] of room.members.entries()) {
          if (m.socketId === socket.id && uid !== user.id) {
            room.members.delete(uid);
            try {
              db.prepare('DELETE FROM room_members WHERE roomId = ? AND userId = ?').run(roomId, uid);
            } catch (e) {}
          }
        }

        // 3. Assign or retrieve seat for current user
        let memberInfo = room.members.get(user.id);
        let seatIndex = -1;

        if (memberInfo) {
          seatIndex = memberInfo.seatIndex;
          memberInfo.socketId = socket.id;
          memberInfo.user = user;
        } else {
          // Find first available seat 0, 1, 2, 3
          const occupiedSeats = new Set();
          for (const m of room.members.values()) {
            occupiedSeats.add(m.seatIndex);
          }

          for (let i = 0; i < 4; i++) {
            if (!occupiedSeats.has(i)) {
              seatIndex = i;
              break;
            }
          }

          if (seatIndex === -1) {
            seatIndex = room.members.size % 4;
          }

          // Ensure user exists in users table to satisfy foreign key constraint
          const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(user.id);
          if (!existingUser) {
            db.prepare(`
              INSERT OR IGNORE INTO users (id, email, username, name, avatar, role)
              VALUES (?, ?, ?, ?, ?, 'user')
            `).run(
              user.id,
              `${user.id}@kinoverse.uz`,
              user.username || user.id,
              user.name || 'Mehmon',
              user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
            );
          }

          // Clear any conflicting seat in DB for this room
          try {
            db.prepare('DELETE FROM room_members WHERE roomId = ? AND (seatIndex = ? OR userId = ?)').run(roomId, seatIndex, user.id);
          } catch (e) {}

          // Save seat to DB
          const memberId = 'rm_' + uuidv4().slice(0, 8);
          try {
            db.prepare(`
              INSERT OR REPLACE INTO room_members (id, roomId, userId, seatIndex)
              VALUES (?, ?, ?, ?)
            `).run(memberId, roomId, user.id, seatIndex);
          } catch (e) {}

          room.members.set(user.id, {
            socketId: socket.id,
            user,
            seatIndex,
            isReady: false,
            enteredAt: Date.now()
          });
        }

        socket.join(roomId);

        // Calculate current accurate movie time if currently playing
        let currentCalculatedTime = room.currentTime;
        if (room.isPlaying) {
          const elapsed = (Date.now() - room.updatedAt) / 1000;
          currentCalculatedTime += elapsed * room.playbackRate;
        }

        // Prepare room member list for the new participant
        const membersList = Array.from(room.members.values()).map(m => ({
          userId: m.user.id,
          name: m.user.name,
          username: m.user.username,
          avatar: m.user.avatar,
          role: m.user.role,
          seatIndex: m.seatIndex,
          isHost: m.user.id === room.hostId
        }));

        // Send current state to joining user
        socket.emit('room_state', {
          roomId,
          movieId: room.movieId,
          hostId: room.hostId,
          isPlaying: room.isPlaying,
          currentTime: currentCalculatedTime,
          playbackRate: room.playbackRate,
          mySeatIndex: seatIndex,
          members: membersList
        });

        // Broadcast to everyone else that a new member has entered the doorway
        socket.to(roomId).emit('member_entered', {
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          seatIndex,
          isHost: user.id === room.hostId
        });

        console.log(`[Virtual Room ${roomId}] ${user.name} kirdi (O‘rindiq: ${seatIndex + 1})`);
      } catch (err) {
        console.error('Join room socket error:', err);
        socket.emit('room_error', { message: 'Xonaga ulanishda kutilmagan xatolik yuz berdi.' });
      }
    });

    // Avatar seated event (after walking across room animation)
    socket.on('avatar_seated', ({ roomId, seatIndex }) => {
      socket.to(roomId).emit('member_seated', {
        userId: currentUser ? currentUser.id : null,
        seatIndex
      });
    });

    // Synchronized Video Actions
    socket.on('video_play', ({ roomId, currentTime }) => {
      const room = roomsState.get(roomId);
      if (room) {
        room.isPlaying = true;
        room.currentTime = currentTime || 0;
        room.updatedAt = Date.now();
        db.prepare('UPDATE rooms SET isPlaying = 1, currentTime = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
          .run(room.currentTime, roomId);

        io.in(roomId).emit('sync_video_play', {
          currentTime: room.currentTime,
          fromUserId: currentUser ? currentUser.id : null,
          fromUserName: currentUser ? currentUser.name : 'Tomoshabin'
        });
      }
    });

    socket.on('video_pause', ({ roomId, currentTime }) => {
      const room = roomsState.get(roomId);
      if (room) {
        room.isPlaying = false;
        room.currentTime = currentTime || 0;
        room.updatedAt = Date.now();
        db.prepare('UPDATE rooms SET isPlaying = 0, currentTime = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
          .run(room.currentTime, roomId);

        io.in(roomId).emit('sync_video_pause', {
          currentTime: room.currentTime,
          fromUserId: currentUser ? currentUser.id : null,
          fromUserName: currentUser ? currentUser.name : 'Tomoshabin'
        });
      }
    });

    socket.on('video_seek', ({ roomId, currentTime }) => {
      const room = roomsState.get(roomId);
      if (room) {
        room.currentTime = currentTime || 0;
        room.updatedAt = Date.now();
        db.prepare('UPDATE rooms SET currentTime = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
          .run(room.currentTime, roomId);

        io.in(roomId).emit('sync_video_seek', {
          currentTime: room.currentTime,
          fromUserId: currentUser ? currentUser.id : null,
          fromUserName: currentUser ? currentUser.name : 'Tomoshabin'
        });
      }
    });

    socket.on('video_rate_change', ({ roomId, playbackRate }) => {
      const room = roomsState.get(roomId);
      if (room) {
        room.playbackRate = playbackRate || 1;
        io.in(roomId).emit('sync_video_rate', { playbackRate });
      }
    });

    // Change video dynamically from PC / Phone
    socket.on('change_video', ({ roomId, videoUrl, title }) => {
      const room = roomsState.get(roomId);
      if (room && videoUrl) {
        room.videoUrl = videoUrl;
        room.currentTime = 0;
        room.isPlaying = true;
        room.updatedAt = Date.now();
        try {
          db.prepare('UPDATE rooms SET currentTime = 0, isPlaying = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(roomId);
        } catch (e) {}

        io.in(roomId).emit('sync_video_changed', {
          videoUrl,
          title: title || 'Yuklangan video',
          fromUserId: currentUser ? currentUser.id : null,
          fromUserName: currentUser ? currentUser.name : 'Boshlovchi'
        });
      }
    });

    // Room Chat message
    socket.on('room_chat_message', ({ roomId, text }) => {
      if (!roomId || !text || !text.trim() || !currentUser) return;
      const messageObj = {
        id: 'msg_' + uuidv4().slice(0, 8),
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        text: text.trim(),
        createdAt: new Date().toISOString()
      };
      io.in(roomId).emit('new_room_chat', messageObj);
    });

    // Live Emoji Reaction (popcorn, applause, fire, heart, laugh)
    socket.on('room_reaction', ({ roomId, emoji, seatIndex }) => {
      if (!roomId || !emoji || !currentUser) return;
      io.in(roomId).emit('new_reaction', {
        userId: currentUser.id,
        userName: currentUser.name,
        emoji,
        seatIndex
      });
    });

    // Direct Room Invite to a friend
    socket.on('invite_friend_to_room', ({ friendId, roomId, movieTitle }) => {
      if (!friendId || !roomId || !currentUser) return;

      // Save notification to DB
      const notifId = 'notif_' + uuidv4().slice(0, 8);
      const title = 'Kino xonasiga taklifnoma! 🍿';
      const message = `"${currentUser.name}" sizni "${movieTitle || 'Kino'}"ni birga tomosha qilish uchun virtual xonaga taklif qildi.`;
      const link = `/room/${roomId}`;

      db.prepare(`
        INSERT INTO notifications (id, userId, title, message, type, link)
        VALUES (?, ?, ?, ?, 'room_invite', ?)
      `).run(notifId, friendId, title, message, link);

      // Emit direct socket event if friend is online
      io.to(`user_${friendId}`).emit('received_room_invite', {
        notificationId: notifId,
        fromUser: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        roomId,
        movieTitle,
        link
      });
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      if (currentUser && currentRoomId) {
        const room = roomsState.get(currentRoomId);
        if (room && room.members.has(currentUser.id)) {
          const member = room.members.get(currentUser.id);
          room.members.delete(currentUser.id);

          // Clean up DB room member
          try {
            db.prepare('DELETE FROM room_members WHERE roomId = ? AND userId = ?')
              .run(currentRoomId, currentUser.id);
          } catch (e) {
            console.error('Error clearing room member on disconnect:', e);
          }

          io.in(currentRoomId).emit('member_left', {
            userId: currentUser.id,
            userName: currentUser.name,
            seatIndex: member.seatIndex
          });

          // If room is empty, optionally keep or clean
          if (room.members.size === 0) {
            // Keep room in DB for history, but free memory
            roomsState.delete(currentRoomId);
          }
        }
      }

      if (currentUser) {
        userSockets.delete(currentUser.id);
      }
    });
  });
}

module.exports = { initRoomSocket, roomsState };
