//server.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;
const rootDir = __dirname;
const siteDir = path.join(rootDir, 'Site');
const dataDir = path.join(rootDir, 'data');
const dbPath = path.join(dataDir, 'chronotrack.sqlite');
const SESSION_COOKIE = 'chronotrack_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const REMEMBER_ME_TTL_MS = 7 * 24 * 60 * 60 * 1000;

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    gender TEXT NOT NULL,
    birthDate INTEGER NOT NULL,
    registeredAt INTEGER NOT NULL,
    lastSeenAt INTEGER NOT NULL,
    plan TEXT NOT NULL,
    passwordSalt TEXT NOT NULL,
    passwordHash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    rememberMe INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    expiresAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS work_sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    taskName TEXT NOT NULL,
    startedAt INTEGER NOT NULL,
    endedAt INTEGER NOT NULL,
    elapsedMs INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS active_sessions (
    userId TEXT PRIMARY KEY,
    id TEXT NOT NULL,
    taskName TEXT NOT NULL,
    startedAt INTEGER NOT NULL,
    status TEXT NOT NULL,
    elapsedMsBeforePause INTEGER NOT NULL,
    lastResumedAt INTEGER,
    pausedAt INTEGER,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
  );
`);

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createPasswordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

function toNoonTimestamp(value) {
  const date = new Date(`${value}T12:00:00`);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    throw new Error('Невірний формат дати.');
  }

  return timestamp;
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((accumulator, chunk) => {
    const trimmed = chunk.trim();

    if (!trimmed) {
      return accumulator;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
    const value = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : '';
    accumulator[decodeURIComponent(key)] = decodeURIComponent(value);
    return accumulator;
  }, {});
}

function buildCookie(token, rememberMe = false) {
  const cookieParts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (rememberMe) {
    cookieParts.push(`Max-Age=${Math.floor(REMEMBER_ME_TTL_MS / 1000)}`);
  } else {
    cookieParts.push(`Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
  }

  return cookieParts.join('; ');
}

function clearAuthCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    gender: user.gender,
    birthDate: Number(user.birthDate),
    registeredAt: Number(user.registeredAt),
    lastSeenAt: Number(user.lastSeenAt),
    plan: user.plan,
  };
}

function getAuthenticatedContext(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];

  if (!token) {
    return null;
  }

  const session = db.prepare(`
    SELECT token, userId, rememberMe, createdAt, expiresAt
    FROM auth_sessions
    WHERE token = ? AND expiresAt > ?
  `).get(token, Date.now());

  if (!session) {
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
    return null;
  }

  const user = db.prepare(`
    SELECT id, fullName, email, gender, birthDate, registeredAt, lastSeenAt, plan
    FROM users
    WHERE id = ?
  `).get(session.userId);

  if (!user) {
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
    return null;
  }

  return {
    session,
    user: sanitizeUser(user),
  };
}

function requireAuth(req, res) {
  const context = getAuthenticatedContext(req);

  if (!context) {
    res.status(401).json({ message: 'Потрібно увійти в систему.' });
    return null;
  }

  return context;
}

function touchUser(userId) {
  const now = Date.now();
  db.prepare('UPDATE users SET lastSeenAt = ? WHERE id = ?').run(now, userId);
  return now;
}

function loadActiveSession(userId) {
  return db.prepare(`
    SELECT userId, id, taskName, startedAt, status, elapsedMsBeforePause, lastResumedAt, pausedAt, updatedAt
    FROM active_sessions
    WHERE userId = ?
  `).get(userId) || null;
}

function loadCompletedSessions(userId) {
  return db.prepare(`
    SELECT id, taskName, startedAt, endedAt, elapsedMs
    FROM work_sessions
    WHERE userId = ?
    ORDER BY startedAt DESC
  `).all(userId).map((session) => ({
    id: session.id,
    taskName: session.taskName,
    startedAt: Number(session.startedAt),
    endedAt: Number(session.endedAt),
    elapsedMs: Number(session.elapsedMs),
  }));
}

function getElapsedMs(session, now = Date.now()) {
  if (!session) {
    return 0;
  }

  if (session.status === 'running' && session.lastResumedAt) {
    return Number(session.elapsedMsBeforePause || 0) + Math.max(0, now - Number(session.lastResumedAt));
  }

  return Number(session.elapsedMsBeforePause || 0);
}

function buildWorkspacePayload(userId) {
  const activeSession = loadActiveSession(userId);
  const sessions = loadCompletedSessions(userId);

  return {
    activeSession: activeSession
      ? {
        id: activeSession.id,
        taskName: activeSession.taskName,
        startedAt: Number(activeSession.startedAt),
        status: activeSession.status,
        elapsedMsBeforePause: Number(activeSession.elapsedMsBeforePause),
        lastResumedAt: activeSession.lastResumedAt === null ? null : Number(activeSession.lastResumedAt),
        pausedAt: activeSession.pausedAt === null ? null : Number(activeSession.pausedAt),
      }
      : null,
    sessions,
  };
}

function buildProfilePayload(userId) {
  const user = db.prepare(`
    SELECT id, fullName, email, gender, birthDate, registeredAt, lastSeenAt, plan
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user) {
    return null;
  }

  const sessions = loadCompletedSessions(userId);
  const totalDurationMs = sessions.reduce((total, session) => total + Number(session.elapsedMs), 0);
  const averageDurationMs = sessions.length > 0 ? totalDurationMs / sessions.length : 0;
  const activeSession = loadActiveSession(userId);

  return {
    user: sanitizeUser(user),
    totalDurationMs,
    averageDurationMs,
    sessionCount: sessions.length,
    lastActivityAt: activeSession
      ? Date.now()
      : Number(user.lastSeenAt || user.registeredAt),
    activeSession: activeSession
      ? {
        id: activeSession.id,
        taskName: activeSession.taskName,
        startedAt: Number(activeSession.startedAt),
        status: activeSession.status,
      }
      : null,
    sessions,
  };
}

function createSession(userId, rememberMe = false) {
  const now = Date.now();
  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = now + (rememberMe ? REMEMBER_ME_TTL_MS : SESSION_TTL_MS);

  db.prepare(`
    INSERT INTO auth_sessions (token, userId, rememberMe, createdAt, expiresAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(token, userId, rememberMe ? 1 : 0, now, expiresAt);

  return {
    token,
    rememberMe,
    expiresAt,
  };
}

function upsertDemoData() {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;

  if (userCount > 0) {
    return;
  }

  const now = Date.now();
  const demoUserId = 'user-demo';
  const demoPassword = 'Demo12345!';
  const password = createPasswordHash(demoPassword);
  const birthDate = toNoonTimestamp('2006-06-16');
  const registeredAt = toNoonTimestamp('2026-02-04');
  const lastSeenAt = toNoonTimestamp('2026-03-09');

  db.prepare(`
    INSERT INTO users (
      id, fullName, email, gender, birthDate, registeredAt, lastSeenAt, plan, passwordSalt, passwordHash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    demoUserId,
    'Павло Протченко',
    'demo@chronotrack.local',
    'Чоловіча',
    birthDate,
    registeredAt,
    lastSeenAt,
    'Premium',
    password.salt,
    password.hash,
  );

  const insertSession = db.prepare(`
    INSERT INTO work_sessions (id, userId, taskName, startedAt, endedAt, elapsedMs)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  [
    {
      id: 'session-demo-1',
      taskName: 'Аналіз вимог проєкту',
      startedAt: toNoonTimestamp('2026-03-09') + 9 * 60 * 60 * 1000,
      endedAt: toNoonTimestamp('2026-03-09') + 10 * 60 * 60 * 1000 + 30 * 60 * 1000,
      elapsedMs: 90 * 60 * 1000,
    },
    {
      id: 'session-demo-2',
      taskName: 'Дизайн інтерфейсу',
      startedAt: toNoonTimestamp('2026-03-09') + 11 * 60 * 60 * 1000,
      endedAt: toNoonTimestamp('2026-03-09') + 13 * 60 * 60 * 1000 + 45 * 60 * 1000,
      elapsedMs: 165 * 60 * 1000,
    },
    {
      id: 'session-demo-3',
      taskName: 'Нарада з командою',
      startedAt: toNoonTimestamp('2026-03-09') + 15 * 60 * 60 * 1000,
      endedAt: toNoonTimestamp('2026-03-09') + 15 * 60 * 60 * 1000 + 30 * 60 * 1000,
      elapsedMs: 30 * 60 * 1000,
    },
  ].forEach((session) => {
    insertSession.run(session.id, demoUserId, session.taskName, session.startedAt, session.endedAt, session.elapsedMs);
  });

  db.prepare('UPDATE users SET lastSeenAt = ? WHERE id = ?').run(now, demoUserId);
}

upsertDemoData();

app.use(express.json());
app.use('/vendor/vue', express.static(path.join(rootDir, 'node_modules', 'vue', 'dist')));
app.use('/vendor/motion-v', express.static(path.join(rootDir, 'node_modules', 'motion-v', 'dist', 'es')));
app.use('/vendor/motion-dom', express.static(path.join(rootDir, 'node_modules', 'motion-dom', 'dist', 'es')));
app.use('/vendor/motion-utils', express.static(path.join(rootDir, 'node_modules', 'motion-utils', 'dist', 'es')));
app.use('/vendor/framer-motion', express.static(path.join(rootDir, 'node_modules', 'framer-motion', 'dist', 'es')));
app.use('/vendor/@vueuse/core', express.static(path.join(rootDir, 'node_modules', '@vueuse', 'core', 'dist')));
app.use('/vendor/@vueuse/shared', express.static(path.join(rootDir, 'node_modules', '@vueuse', 'shared', 'dist')));
app.use('/vendor/hey-listen', express.static(path.join(rootDir, 'node_modules', 'hey-listen', 'dist')));
app.use(express.static(siteDir));

app.get('/api/session', (req, res) => {
  const context = getAuthenticatedContext(req);

  if (!context) {
    res.json({ user: null });
    return;
  }

  res.json({ user: context.user });
});

app.post('/api/register', (req, res) => {
  const fullName = String(req.body?.fullName || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const gender = String(req.body?.gender || '').trim();
  const birthDate = String(req.body?.birthDate || '').trim();
  const password = String(req.body?.password || '');

  if (!fullName || !email || !gender || !birthDate || !password) {
    res.status(400).json({ message: 'Заповніть усі обов’язкові поля.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: 'Пароль має містити щонайменше 8 символів.' });
    return;
  }

  if (!/[A-ZА-ЯІЇЄҐ]/u.test(password) || !/[a-zа-яіїєґ]/u.test(password) || !/\d/.test(password)) {
    res.status(400).json({ message: 'Пароль має містити великі, малі літери та цифри.' });
    return;
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

  if (existingUser) {
    res.status(409).json({ message: 'Користувач з таким email вже існує.' });
    return;
  }

  const now = Date.now();
  const userId = createId('user');
  const passwordData = createPasswordHash(password);

  try {
    db.prepare(`
      INSERT INTO users (
        id, fullName, email, gender, birthDate, registeredAt, lastSeenAt, plan, passwordSalt, passwordHash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      fullName,
      email,
      gender,
      toNoonTimestamp(birthDate),
      now,
      now,
      'Локальний профіль',
      passwordData.salt,
      passwordData.hash,
    );

    const session = createSession(userId, false);
    res.setHeader('Set-Cookie', buildCookie(session.token, session.rememberMe));
    res.status(201).json({
      user: sanitizeUser(db.prepare(`
        SELECT id, fullName, email, gender, birthDate, registeredAt, lastSeenAt, plan
        FROM users
        WHERE id = ?
      `).get(userId)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Не вдалося створити профіль.' });
  }
});

app.post('/api/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const rememberMe = Boolean(req.body?.rememberMe);

  if (!email || !password) {
    res.status(400).json({ message: 'Введіть email і пароль.' });
    return;
  }

  const user = db.prepare(`
    SELECT id, fullName, email, gender, birthDate, registeredAt, lastSeenAt, plan, passwordSalt, passwordHash
    FROM users
    WHERE email = ?
  `).get(email);

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    res.status(401).json({ message: 'Невірний email або пароль.' });
    return;
  }

  const session = createSession(user.id, rememberMe);
  const now = touchUser(user.id);

  res.setHeader('Set-Cookie', buildCookie(session.token, session.rememberMe));
  res.json({
    user: sanitizeUser({
      ...user,
      lastSeenAt: now,
    }),
  });
});

app.post('/api/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];

  if (token) {
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
  }

  res.setHeader('Set-Cookie', clearAuthCookie());
  res.json({ message: 'Вихід виконано успішно.' });
});

app.get('/api/workspace', (req, res) => {
  const context = requireAuth(req, res);

  if (!context) {
    return;
  }

  const now = touchUser(context.user.id);
  const payload = buildWorkspacePayload(context.user.id);

  res.json({
    user: {
      ...context.user,
      lastSeenAt: now,
    },
    ...payload,
  });
});

app.post('/api/workspace/start', (req, res) => {
  const context = requireAuth(req, res);

  if (!context) {
    return;
  }

  const taskName = String(req.body?.taskName || '').trim();

  if (!taskName) {
    res.status(400).json({ message: 'Вкажіть назву задачі перед запуском таймера.' });
    return;
  }

  const existingSession = loadActiveSession(context.user.id);

  if (existingSession) {
    res.status(409).json({ message: 'Перед запуском нової сесії потрібно завершити поточну.' });
    return;
  }

  const now = Date.now();
  const session = {
    id: createId('active'),
    taskName,
    startedAt: now,
    status: 'running',
    elapsedMsBeforePause: 0,
    lastResumedAt: now,
    pausedAt: null,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO active_sessions (
      userId, id, taskName, startedAt, status, elapsedMsBeforePause, lastResumedAt, pausedAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    context.user.id,
    session.id,
    session.taskName,
    session.startedAt,
    session.status,
    session.elapsedMsBeforePause,
    session.lastResumedAt,
    session.pausedAt,
    session.updatedAt,
  );

  touchUser(context.user.id);

  res.status(201).json({
    activeSession: session,
    ...buildWorkspacePayload(context.user.id),
  });
});

app.post('/api/workspace/toggle', (req, res) => {
  const context = requireAuth(req, res);

  if (!context) {
    return;
  }

  const activeSession = loadActiveSession(context.user.id);

  if (!activeSession) {
    res.status(400).json({ message: 'Немає активної сесії для зміни стану.' });
    return;
  }

  const now = Date.now();

  let nextSession;

  if (activeSession.status === 'running') {
    nextSession = {
      ...activeSession,
      status: 'paused',
      elapsedMsBeforePause: getElapsedMs(activeSession, now),
      lastResumedAt: null,
      pausedAt: now,
      updatedAt: now,
    };
  } else {
    nextSession = {
      ...activeSession,
      status: 'running',
      lastResumedAt: now,
      pausedAt: null,
      updatedAt: now,
    };
  }

  db.prepare(`
    UPDATE active_sessions
    SET taskName = ?, startedAt = ?, status = ?, elapsedMsBeforePause = ?, lastResumedAt = ?, pausedAt = ?, updatedAt = ?
    WHERE userId = ?
  `).run(
    nextSession.taskName,
    nextSession.startedAt,
    nextSession.status,
    nextSession.elapsedMsBeforePause,
    nextSession.lastResumedAt,
    nextSession.pausedAt,
    nextSession.updatedAt,
    context.user.id,
  );

  touchUser(context.user.id);

  res.json({
    activeSession: {
      id: nextSession.id,
      taskName: nextSession.taskName,
      startedAt: nextSession.startedAt,
      status: nextSession.status,
      elapsedMsBeforePause: nextSession.elapsedMsBeforePause,
      lastResumedAt: nextSession.lastResumedAt,
      pausedAt: nextSession.pausedAt,
    },
    ...buildWorkspacePayload(context.user.id),
  });
});

app.post('/api/workspace/stop', (req, res) => {
  const context = requireAuth(req, res);

  if (!context) {
    return;
  }

  const activeSession = loadActiveSession(context.user.id);

  if (!activeSession) {
    res.status(400).json({ message: 'Немає активної сесії для завершення.' });
    return;
  }

  const now = Date.now();
  const elapsedMs = getElapsedMs(activeSession, now);
  const completedSession = {
    id: createId('session'),
    taskName: activeSession.taskName,
    startedAt: Number(activeSession.startedAt),
    endedAt: now,
    elapsedMs,
  };

  const insertSession = db.prepare(`
    INSERT INTO work_sessions (id, userId, taskName, startedAt, endedAt, elapsedMs)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const deleteActive = db.prepare('DELETE FROM active_sessions WHERE userId = ?');

  const transaction = db.transaction(() => {
    insertSession.run(
      completedSession.id,
      context.user.id,
      completedSession.taskName,
      completedSession.startedAt,
      completedSession.endedAt,
      completedSession.elapsedMs,
    );
    deleteActive.run(context.user.id);
  });

  transaction();
  touchUser(context.user.id);

  res.json({
    completedSession,
    ...buildWorkspacePayload(context.user.id),
  });
});

app.delete('/api/workspace/sessions/:id', (req, res) => {
  const context = requireAuth(req, res);

  if (!context) {
    return;
  }

  const sessionId = String(req.params.id || '').trim();

  const existingSession = db.prepare(`
    SELECT id, taskName
    FROM work_sessions
    WHERE id = ? AND userId = ?
  `).get(sessionId, context.user.id);

  if (!existingSession) {
    res.status(404).json({ message: 'Не вдалося знайти сесію для видалення.' });
    return;
  }

  db.prepare('DELETE FROM work_sessions WHERE id = ? AND userId = ?').run(sessionId, context.user.id);
  touchUser(context.user.id);

  res.json({ message: `Сесію "${existingSession.taskName}" видалено з історії.` });
});

app.get('/api/profile', (req, res) => {
  const context = requireAuth(req, res);

  if (!context) {
    return;
  }

  const now = touchUser(context.user.id);
  const payload = buildProfilePayload(context.user.id);

  if (!payload) {
    res.status(404).json({ message: 'Профіль не знайдено.' });
    return;
  }

  res.json({
    user: {
      ...payload.user,
      lastSeenAt: now,
    },
    totalDurationMs: payload.totalDurationMs,
    averageDurationMs: payload.averageDurationMs,
    sessionCount: payload.sessionCount,
    lastActivityAt: now,
    activeSession: payload.activeSession,
    sessions: payload.sessions,
  });
});

app.listen(port, () => {
  console.log(`ChronoTrack server is running on http://localhost:${port}`);
});
