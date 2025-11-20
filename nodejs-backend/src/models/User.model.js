const { getDB } = require('../config/db');

class User {
  /**
   * Create a new user
   */
  static async create(userData = {}) {
    const db = getDB();
    const id = userData.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO users (id, theme_preference, ai_provider, ai_api_key, ai_model, ai_base_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userData.themePreference || null,
        userData.aiProvider || null,
        userData.aiApiKey || null,
        userData.aiModel || null,
        userData.aiBaseUrl || null,
        now,
        now
      ]
    );

    return User.findById(id);
  }

  /**
   * Ensure a user exists (creates if missing)
   */
  static async ensure(userId = 'local-user') {
    const existing = await User.findById(userId);
    if (existing) {
      return existing;
    }

    const db = getDB();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO users (id, theme_preference, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      [userId, null, now, now]
    );

    return User.findById(userId);
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const db = getDB();
    const row = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    return row ? User._mapRowToUser(row) : null;
  }

  /**
   * Update user
   */
  async save() {
    const db = getDB();
    const now = new Date().toISOString();

    await db.run(
      `UPDATE users 
       SET theme_preference = ?, ai_provider = ?, ai_api_key = ?, ai_model = ?, ai_base_url = ?, updated_at = ?
       WHERE id = ?`,
      [
        this.themePreference,
        this.aiProvider,
        this.aiApiKey,
        this.aiModel,
        this.aiBaseUrl,
        now,
        this.id
      ]
    );

    return User.findById(this.id);
  }

  /**
   * Convert to JSON (exclude sensitive data like apiKey in some contexts)
   */
  toJSON(includeSensitive = false) {
    const obj = {
      id: this.id,
      themePreference: this.themePreference,
      aiProvider: this.aiProvider,
      aiModel: this.aiModel,
      aiBaseUrl: this.aiBaseUrl,
      hasApiKey: !!this.aiApiKey, // Boolean flag instead of actual key
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    
    // Only include API key if explicitly requested (for user settings page)
    if (includeSensitive) {
      obj.aiApiKey = this.aiApiKey;
    }
    
    return obj;
  }

  /**
   * Map database row to User object
   */
  static _mapRowToUser(row) {
    const user = new User();
    user.id = row.id;
    user.themePreference = row.theme_preference;
    user.aiProvider = row.ai_provider;
    user.aiApiKey = row.ai_api_key;
    user.aiModel = row.ai_model;
    user.aiBaseUrl = row.ai_base_url;
    user.createdAt = row.created_at;
    user.updatedAt = row.updated_at;
    return user;
  }
}

module.exports = User;
