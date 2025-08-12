/**
 * Base Entity Class
 * Provides common functionality for all database entities
 */
class BaseEntity {
  constructor(data = {}) {
    this.id = data.id || null
    this.created_at = data.created_at || new Date()
    this.updated_at = data.updated_at || new Date()
  }

  /**
   * Convert entity to plain object
   */
  toJSON() {
    return Object.assign({}, this)
  }

  /**
   * Create entity from database row
   */
  static fromRow(row) {
    return new this(row)
  }

  /**
   * Create multiple entities from database rows
   */
  static fromRows(rows) {
    return rows.map(row => this.fromRow(row))
  }

  /**
   * Validate entity data
   */
  validate() {
    return true
  }
}

module.exports = BaseEntity
