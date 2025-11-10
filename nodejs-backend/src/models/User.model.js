const { getDB } = require('../config/db');

/**
 * Generate custom ID
 */
const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * User Model
 */
class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const db = getDB();
    const id = generateId('user');
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, theme_preference, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userData.email.toLowerCase(),
      userData.passwordHash,
      userData.themePreference || null,
      now,
      now
    );

    return User.findById(id);
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const db = getDB();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id);
    return row ? User._mapRowToUser(row) : null;
  }

  /**
   * Find user by email
   */
  static async findOne(query) {
    const db = getDB();
    if (query.email) {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const row = stmt.get(query.email.toLowerCase());
      return row ? User._mapRowToUser(row) : null;
    }
    return null;
  }

  /**
   * Update user
   */
  async save() {
    const db = getDB();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE users 
      SET email = ?, password_hash = ?, theme_preference = ?, last_login_at = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      this.email,
      this.passwordHash,
      this.themePreference,
      this.lastLoginAt,
      now,
      this.id
    );

    return User.findById(this.id);
  }

  /**
   * Convert to JSON (exclude passwordHash)
   */
  toJSON() {
    const obj = {
      id: this.id,
      email: this.email,
      themePreference: this.themePreference,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    return obj;
  }

  /**
   * Map database row to User object
   */
  static _mapRowToUser(row) {
    const user = new User();
    user.id = row.id;
    user.email = row.email;
    user.passwordHash = row.password_hash;
    user.themePreference = row.theme_preference;
    user.lastLoginAt = row.last_login_at;
    user.createdAt = row.created_at;
    user.updatedAt = row.updated_at;
    return user;
  }
}

module.exports = User;
