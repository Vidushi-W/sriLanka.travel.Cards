import mysql from 'mysql2/promise';
import { seedPage, seedExperiencePages } from '../shared/content.js';
export const createPool = () =>
  mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'bliss',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bliss_trails',
    connectionLimit: 10,
    timezone: 'Z',
  });
export class MysqlStore {
  constructor(pool) {
    this.pool = pool;
    this.ready = true;
  }
  async listPages() {
    const [rows] = await this.pool.query(
      'SELECT id, title, slug, published_title, published_slug, published_at, updated_at FROM website_pages ORDER BY id',
    );
    return rows;
  }
  async getPage(value, published = false) {
    const [rows] = await this.pool.execute(
      `SELECT * FROM website_pages WHERE ${published ? 'published_slug' : 'id'} = ?`,
      [value],
    );
    const row = rows[0];
    if (!row || (published && !row.published_at)) return null;
    const [sections] = await this.pool.execute(
      'SELECT section_key, kind, content FROM website_sections WHERE page_id=? AND revision=? ORDER BY position',
      [row.id, published ? 'published' : 'draft'],
    );
    return {
      id: row.id,
      title: published ? row.published_title : row.title,
      slug: published ? row.published_slug : row.slug,
      published_at: row.published_at,
      sections: sections.map((s) => ({
        id: s.section_key,
        type: s.kind,
        ...(typeof s.content === 'string' ? JSON.parse(s.content) : s.content),
      })),
    };
  }
  async savePage(id, page, publish = false) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      if (id) {
        const [existing] = await connection.execute(
          'SELECT id, slug FROM website_pages WHERE id=? FOR UPDATE',
          [id],
        );
        if (!existing.length) throw Object.assign(new Error('Page not found.'), { status: 404 });
        if (existing[0].slug === 'home' && page.slug !== 'home')
          throw Object.assign(new Error('The homepage URL cannot be changed.'), { status: 400 });
        await connection.execute(
          'UPDATE website_pages SET title=?, slug=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
          [page.title, page.slug, id],
        );
      } else {
        const [result] = await connection.execute(
          'INSERT INTO website_pages (title, slug) VALUES (?,?)',
          [page.title, page.slug],
        );
        id = result.insertId;
      }
      for (const revision of publish ? ['draft', 'published'] : ['draft']) {
        await connection.execute('DELETE FROM website_sections WHERE page_id=? AND revision=?', [
          id,
          revision,
        ]);
        for (const [position, section] of page.sections.entries()) {
          const { id: key, type, ...content } = section;
          await connection.execute(
            'INSERT INTO website_sections (page_id,revision,section_key,kind,position,content) VALUES (?,?,?,?,?,?)',
            [id, revision, key, type, position, JSON.stringify(content)],
          );
        }
      }
      if (publish)
        await connection.execute(
          'UPDATE website_pages SET published_slug=slug, published_title=title, published_at=UTC_TIMESTAMP() WHERE id=?',
          [id],
        );
      await connection.commit();
      return await this.getPage(id);
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  }
  async unpublish(id) {
    await this.pool.execute(
      'UPDATE website_pages SET published_at=NULL,published_slug=NULL,published_title=NULL WHERE id=?',
      [id],
    );
  }
  async deletePage(id) {
    await this.pool.execute('DELETE FROM website_pages WHERE id=?', [id]);
  }
  async findAdmin(email) {
    const [r] = await this.pool.execute('SELECT * FROM administrators WHERE email=?', [email]);
    return r[0];
  }
  async createSession(hash, adminId, expires) {
    await this.pool.execute('DELETE FROM admin_sessions WHERE expires_at < UTC_TIMESTAMP()');
    await this.pool.execute('INSERT INTO admin_sessions VALUES (?,?,?)', [hash, adminId, expires]);
  }
  async getSession(hash) {
    const [r] = await this.pool.execute(
      'SELECT a.id,a.email FROM admin_sessions s JOIN administrators a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP()',
      [hash],
    );
    return r[0];
  }
  async deleteSession(hash) {
    await this.pool.execute('DELETE FROM admin_sessions WHERE token_hash=?', [hash]);
  }
  async changePassword(id, hash) {
    await this.pool.execute('UPDATE administrators SET password_hash=? WHERE id=?', [hash, id]);
    await this.pool.execute('DELETE FROM admin_sessions WHERE admin_id=?', [id]);
  }
  async listMedia() {
    const [r] = await this.pool.query('SELECT * FROM media_assets ORDER BY id DESC');
    return r;
  }
  async addMedia(asset) {
    const [r] = await this.pool.execute(
      'INSERT INTO media_assets (path,original_name,mime_type,size_bytes,uploaded_by) VALUES (?,?,?,?,?)',
      [asset.path, asset.original_name, asset.mime_type, asset.size_bytes, asset.uploaded_by],
    );
    return { ...asset, id: r.insertId };
  }
  async mediaInUse(path) {
    const [r] = await this.pool.execute(
      "SELECT id FROM website_sections WHERE JSON_SEARCH(content, 'one', ?) IS NOT NULL LIMIT 1",
      [path],
    );
    return !!r.length;
  }
  async deleteMedia(id) {
    await this.pool.execute('DELETE FROM media_assets WHERE id=?', [id]);
  }
}
export class PreviewStore {
  ready = false;
  async getPage(slug, published) {
    return published
      ? structuredClone([seedPage, ...seedExperiencePages].find((p) => p.slug === slug) || null)
      : null;
  }
}
