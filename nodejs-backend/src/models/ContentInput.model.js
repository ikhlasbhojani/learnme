const { getDB } = require('../config/db');

/**
 * Generate custom ID
 */
const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * ContentInput Model
 */
class ContentInput {
  /**
   * Create a new content input
   */
  static async create(contentData) {
    const db = getDB();
    const id = generateId('content');
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO content_inputs (id, user_id, type, source, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        contentData.userId,
        contentData.type,
        contentData.source,
        contentData.content || null,
        now,
        now
      ]
    );

    return ContentInput.findById(id);
  }

  /**
   * Find content input by ID
   */
  static async findById(id) {
    const db = getDB();
    const row = await db.get('SELECT * FROM content_inputs WHERE id = ?', [id]);
    return row ? ContentInput._mapRowToContentInput(row) : null;
  }

  /**
   * Find content input by query
   */
  static async findOne(query) {
    const db = getDB();
    if (query.userId && query.type && query.source) {
      const row = await db.get(
        'SELECT * FROM content_inputs WHERE user_id = ? AND type = ? AND source = ? LIMIT 1',
        [query.userId, query.type, query.source]
      );
      return row ? ContentInput._mapRowToContentInput(row) : null;
    }
    if (query.userId) {
      const row = await db.get('SELECT * FROM content_inputs WHERE user_id = ? LIMIT 1', [query.userId]);
      return row ? ContentInput._mapRowToContentInput(row) : null;
    }
    return null;
  }

  /**
   * Find all content inputs by user ID
   */
  static async find(query) {
    const db = getDB();
    if (query.userId) {
      const rows = await db.all('SELECT * FROM content_inputs WHERE user_id = ? ORDER BY created_at DESC', [query.userId]);
      return rows.map(row => ContentInput._mapRowToContentInput(row));
    }
    return [];
  }

  /**
   * Update content input
   */
  async save() {
    const db = getDB();
    const now = new Date().toISOString();

    await db.run(
      `UPDATE content_inputs 
       SET type = ?, source = ?, content = ?, updated_at = ?
       WHERE id = ?`,
      [
        this.type,
        this.source,
        this.content,
        now,
        this.id
      ]
    );

    return ContentInput.findById(this.id);
  }

  /**
   * Delete content input
   */
  async delete() {
    const db = getDB();
    await db.run('DELETE FROM content_inputs WHERE id = ?', [this.id]);
    return true;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      source: this.source,
      content: this.content,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Map database row to ContentInput object
   */
  static _mapRowToContentInput(row) {
    const contentInput = new ContentInput();
    contentInput.id = row.id;
    contentInput.userId = row.user_id;
    contentInput.type = row.type;
    contentInput.source = row.source;
    contentInput.content = row.content;
    contentInput.createdAt = row.created_at;
    contentInput.updatedAt = row.updated_at;
    return contentInput;
  }
}

module.exports = ContentInput;
