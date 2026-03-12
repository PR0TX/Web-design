// AuthModel.js
const USERS_STORAGE_KEY = 'chronotrack-users';
const PERSISTENT_SESSION_KEY = 'chronotrack-auth-session';
const TEMPORARY_SESSION_KEY = 'chronotrack-auth-session-temporary';

class AuthModel {
  constructor(
    usersStorageKey = USERS_STORAGE_KEY,
    persistentSessionKey = PERSISTENT_SESSION_KEY,
    temporarySessionKey = TEMPORARY_SESSION_KEY,
  ) {
    this.usersStorageKey = usersStorageKey;
    this.persistentSessionKey = persistentSessionKey;
    this.temporarySessionKey = temporarySessionKey;
  }

  async login(payload) {
    const email = String(payload?.email || '').trim().toLowerCase();
    const password = String(payload?.password || '');
    const rememberMe = Boolean(payload?.rememberMe);
    const users = this.loadUsers();
    const user = users.find((item) => item.email === email && item.password === password);

    if (!user) {
      throw new Error('Невірний email або пароль.');
    }

    this.setCurrentSession(user.id, rememberMe);
    return this.normalizeUser(user);
  }

  async register(payload) {
    const normalizedPayload = this.normalizeRegisterPayload(payload);
    const users = this.loadUsers();
    const userExists = users.some((user) => user.email === normalizedPayload.email);

    if (userExists) {
      throw new Error('Користувач з таким email вже існує.');
    }

    const nextUser = {
      id: this.createId(),
      fullName: normalizedPayload.fullName,
      email: normalizedPayload.email,
      gender: normalizedPayload.gender,
      birthDate: normalizedPayload.birthDate,
      registeredAt: Date.now(),
      plan: 'Локальний профіль',
      password: normalizedPayload.password,
    };

    users.push(nextUser);
    this.saveUsers(users);

    return this.normalizeUser(nextUser);
  }

  async logout() {
    window.localStorage.removeItem(this.persistentSessionKey);
    window.sessionStorage.removeItem(this.temporarySessionKey);
    return { message: 'Вихід виконано успішно.' };
  }

  async getCurrentUser() {
    const user = this.readCurrentUser();

    if (!user) {
      throw new Error('Сесію не знайдено або вона вже завершилась.');
    }

    return user;
  }

  hasAuthenticatedUser() {
    return Boolean(this.readCurrentUser());
  }

  normalizeRegisterPayload(payload) {
    return {
      fullName: String(payload?.fullName || payload?.full_name || '').trim(),
      email: String(payload?.email || '').trim().toLowerCase(),
      gender: String(payload?.gender || '').trim(),
      birthDate: String(payload?.birthDate || payload?.birth_date || '').trim(),
      password: String(payload?.password || ''),
    };
  }

  loadUsers() {
    const rawValue = window.localStorage.getItem(this.usersStorageKey);

    if (!rawValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(rawValue);
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch (error) {
      return [];
    }
  }

  saveUsers(users) {
    window.localStorage.setItem(this.usersStorageKey, JSON.stringify(users));
  }

  loadCurrentSession() {
    const temporarySession = this.parseStorageValue(window.sessionStorage.getItem(this.temporarySessionKey));

    if (temporarySession) {
      return temporarySession;
    }

    return this.parseStorageValue(window.localStorage.getItem(this.persistentSessionKey));
  }

  readCurrentUser() {
    const session = this.loadCurrentSession();

    if (!session?.userId) {
      return null;
    }

    const user = this.loadUsers().find((item) => item.id === session.userId);

    if (!user) {
      window.localStorage.removeItem(this.persistentSessionKey);
      window.sessionStorage.removeItem(this.temporarySessionKey);
      return null;
    }

    return this.normalizeUser(user);
  }

  setCurrentSession(userId, rememberMe) {
    const sessionPayload = JSON.stringify({
      userId,
      createdAt: Date.now(),
    });

    window.localStorage.removeItem(this.persistentSessionKey);
    window.sessionStorage.removeItem(this.temporarySessionKey);

    if (rememberMe) {
      window.localStorage.setItem(this.persistentSessionKey, sessionPayload);
      return;
    }

    window.sessionStorage.setItem(this.temporarySessionKey, sessionPayload);
  }

  parseStorageValue(rawValue) {
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue);
    } catch (error) {
      return null;
    }
  }

  createId() {
    return `user-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  normalizeUser(user) {
    return {
      id: user.id,
      fullName: user.fullName || '',
      email: user.email || '',
      gender: user.gender || '',
      birthDate: user.birthDate || '',
      registeredAt: user.registeredAt || null,
      plan: user.plan || 'Локальний профіль',
    };
  }
}

export default AuthModel;
