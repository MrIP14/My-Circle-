import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'amarcircle_secret_key_12345';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Multer Setup
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API ROUTES ---

  // Auth
  app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashedPassword);
      const userId = result.lastInsertRowid;
      const user = { id: userId, name, email, profile_pic: null, cover_photo: null, bio: null };
      const token = jwt.sign({ id: userId, name, email }, JWT_SECRET);
      res.json({ token, user });
    } catch (err: any) {
      if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, profile_pic: user.profile_pic, cover_photo: user.cover_photo, bio: user.bio } });
  });

  // Users
  app.get('/api/users/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    if (!id || id === 'undefined') return res.status(400).json({ error: 'Invalid user ID' });
    
    const user = db.prepare('SELECT id, name, email, profile_pic, cover_photo, bio FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  app.get('/api/users/:id/stats', authenticateToken, (req, res) => {
    const followers = db.prepare('SELECT COUNT(*) as count FROM followers WHERE following_id = ?').get(req.params.id) as any;
    const following = db.prepare('SELECT COUNT(*) as count FROM followers WHERE follower_id = ?').get(req.params.id) as any;
    const posts = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(req.params.id) as any;
    res.json({ followers: followers.count, following: following.count, posts: posts.count });
  });

  app.post('/api/users/update-profile', authenticateToken, upload.single('image'), (req, res) => {
    const userId = (req as any).user.id;
    const { type, name, bio } = req.body;
    
    if ((req as any).file) {
      const imageUrl = `/uploads/${(req as any).file.filename}`;
      if (type === 'profile') {
        db.prepare('UPDATE users SET profile_pic = ? WHERE id = ?').run(imageUrl, userId);
      } else if (type === 'cover') {
        db.prepare('UPDATE users SET cover_photo = ? WHERE id = ?').run(imageUrl, userId);
      }
    }

    if (name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, userId);
    }
    
    if (bio !== undefined) {
      db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, userId);
    }

    const user = db.prepare('SELECT id, name, email, profile_pic, cover_photo, bio FROM users WHERE id = ?').get(userId);
    res.json({ user });
  });

  // Posts
  app.get('/api/posts', authenticateToken, (req, res) => {
    const posts = db.prepare(`
      SELECT posts.*, users.name, users.profile_pic,
      (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comments_count,
      (SELECT 1 FROM likes WHERE post_id = posts.id AND user_id = ?) as has_liked
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      ORDER BY posts.created_at DESC
    `).all((req as any).user.id);
    res.json(posts);
  });

  app.post('/api/posts', authenticateToken, (req, res) => {
    const { content, image, video } = req.body;
    const result = db.prepare('INSERT INTO posts (user_id, content, image, video) VALUES (?, ?, ?, ?)').run((req as any).user.id, content, image, video);
    res.json({ id: result.lastInsertRowid });
  });

  app.post('/api/posts/:id/like', authenticateToken, (req, res) => {
    try {
      db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run((req as any).user.id, req.params.id);
      res.json({ success: true });
    } catch {
      db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run((req as any).user.id, req.params.id);
      res.json({ success: true, removed: true });
    }
  });

  app.get('/api/posts/:id/comments', authenticateToken, (req, res) => {
    const comments = db.prepare('SELECT comments.*, users.name, users.profile_pic FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(comments);
  });

  app.post('/api/posts/:id/comments', authenticateToken, (req, res) => {
    const { comment } = req.body;
    db.prepare('INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)').run((req as any).user.id, req.params.id, comment);
    res.json({ success: true });
  });

  // Follow
  app.post('/api/users/:id/follow', authenticateToken, (req, res) => {
    try {
      db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)').run((req as any).user.id, req.params.id);
      res.json({ success: true });
    } catch {
      db.prepare('DELETE FROM followers WHERE follower_id = ? AND following_id = ?').run((req as any).user.id, req.params.id);
      res.json({ success: true, removed: true });
    }
  });

  app.get('/api/follow/check/:id', authenticateToken, (req, res) => {
    const follow = db.prepare('SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?').get((req as any).user.id, req.params.id);
    res.json({ following: !!follow });
  });

  // Messaging
  app.get('/api/messages/:otherId', authenticateToken, (req, res) => {
    const myId = (req as any).user.id;
    const otherId = req.params.otherId;
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) 
      OR (sender_id = ? AND receiver_id = ?) 
      ORDER BY timestamp ASC
    `).all(myId, otherId, otherId, myId);
    res.json(messages);
  });

  // --- SOCKET.IO ---
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('send_message', (data) => {
      const { senderId, receiverId, message } = data;
      try {
        db.prepare('INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)').run(senderId, receiverId, message);
        io.to(`user_${receiverId}`).emit('receive_message', data);
        io.to(`user_${senderId}`).emit('receive_message', data);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AmarCircle server running at http://localhost:${PORT}`);
  });
}

startServer();
