from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["*"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "gallery.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "webm", "mov"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            url TEXT NOT NULL,
            file_path TEXT,
            category TEXT NOT NULL CHECK(category IN ('image','gif','video')),
            subcategory TEXT NOT NULL CHECK(subcategory IN ('anime','realistic','meme','other')),
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
            is_premium INTEGER NOT NULL DEFAULT 0,
            is_sponsored INTEGER NOT NULL DEFAULT 0,
            sponsored_label TEXT DEFAULT NULL,
            views INTEGER NOT NULL DEFAULT 0,
            likes INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            media_id INTEGER NOT NULL,
            tag TEXT NOT NULL,
            FOREIGN KEY(media_id) REFERENCES media(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS clicks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            media_id INTEGER,
            link_type TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
        CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
        CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
        CREATE INDEX IF NOT EXISTS idx_tags_media_id ON tags(media_id);
    """)
    conn.commit()
    conn.close()


def media_row_to_dict(row, tags):
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "url": row["url"],
        "category": row["category"],
        "subcategory": row["subcategory"],
        "status": row["status"],
        "is_premium": bool(row["is_premium"]),
        "is_sponsored": bool(row["is_sponsored"]),
        "sponsored_label": row["sponsored_label"],
        "views": row["views"],
        "likes": row["likes"],
        "tags": tags,
        "created_at": row["created_at"],
    }


# ─── MEDIA ENDPOINTS ────────────────────────────────────────────────────────

@app.route("/api/media", methods=["GET"])
def list_media():
    category = request.args.get("category")
    subcategory = request.args.get("subcategory")
    tag = request.args.get("tag")
    search = request.args.get("search")
    status = request.args.get("status", "approved")
    limit = min(int(request.args.get("limit", 50)), 200)
    offset = int(request.args.get("offset", 0))

    conn = get_db()
    query = "SELECT DISTINCT m.* FROM media m"
    conditions = []
    args = []

    if tag:
        query += " JOIN tags t ON m.id = t.media_id"
        conditions.append("t.tag = ?")
        args.append(tag)

    conditions.append("m.status = ?")
    args.append(status)

    if category:
        conditions.append("m.category = ?")
        args.append(category)

    if subcategory:
        conditions.append("m.subcategory = ?")
        args.append(subcategory)

    if search:
        conditions.append("(m.title LIKE ? OR m.description LIKE ?)")
        args += [f"%{search}%", f"%{search}%"]

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY m.is_sponsored DESC, m.created_at DESC LIMIT ? OFFSET ?"
    args += [limit, offset]

    rows = conn.execute(query, args).fetchall()
    result = []
    for row in rows:
        tags_rows = conn.execute("SELECT tag FROM tags WHERE media_id = ?", (row["id"],)).fetchall()
        tags_list = [t["tag"] for t in tags_rows]
        result.append(media_row_to_dict(row, tags_list))

    conn.close()
    return jsonify(result)


@app.route("/api/media/<int:media_id>", methods=["GET"])
def get_media(media_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM media WHERE id = ?", (media_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Not found"}), 404
    # increment views
    conn.execute("UPDATE media SET views = views + 1 WHERE id = ?", (media_id,))
    conn.commit()
    tags_rows = conn.execute("SELECT tag FROM tags WHERE media_id = ?", (media_id,)).fetchall()
    tags_list = [t["tag"] for t in tags_rows]
    result = media_row_to_dict(row, tags_list)
    conn.close()
    return jsonify(result)


@app.route("/api/media", methods=["POST"])
def create_media():
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    category = request.form.get("category", "").strip()
    subcategory = request.form.get("subcategory", "other").strip()
    tags_raw = request.form.get("tags", "")
    url = request.form.get("url", "").strip()
    is_premium = int(request.form.get("is_premium", 0))

    if not title or not category:
        return jsonify({"error": "title and category are required"}), 400
    if category not in ("image", "gif", "video"):
        return jsonify({"error": "invalid category"}), 400
    if subcategory not in ("anime", "realistic", "meme", "other"):
        subcategory = "other"

    file_path = None

    # Handle file upload
    if "file" in request.files:
        file = request.files["file"]
        if file and file.filename and allowed_file(file.filename):
            ext = file.filename.rsplit(".", 1)[1].lower()
            unique_name = f"{uuid.uuid4().hex}.{ext}"
            save_path = os.path.join(UPLOAD_FOLDER, unique_name)
            file.save(save_path)
            file_path = unique_name
            url = f"/uploads/{unique_name}"
        else:
            return jsonify({"error": "Invalid file type"}), 400
    elif not url:
        return jsonify({"error": "Either file or url is required"}), 400

    tags_list = [t.strip().lower() for t in tags_raw.split(",") if t.strip()]

    conn = get_db()
    cur = conn.execute(
        """INSERT INTO media (title, description, url, file_path, category, subcategory, status, is_premium)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)""",
        (title, description, url, file_path, category, subcategory, is_premium),
    )
    media_id = cur.lastrowid
    for tag in tags_list:
        conn.execute("INSERT INTO tags (media_id, tag) VALUES (?, ?)", (media_id, tag))
    conn.commit()

    row = conn.execute("SELECT * FROM media WHERE id = ?", (media_id,)).fetchone()
    conn.close()
    return jsonify(media_row_to_dict(row, tags_list)), 201


@app.route("/api/media/<int:media_id>", methods=["DELETE"])
def delete_media(media_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM media WHERE id = ?", (media_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Not found"}), 404
    if row["file_path"]:
        try:
            os.remove(os.path.join(UPLOAD_FOLDER, row["file_path"]))
        except Exception:
            pass
    conn.execute("DELETE FROM media WHERE id = ?", (media_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/media/<int:media_id>/like", methods=["POST"])
def like_media(media_id):
    conn = get_db()
    conn.execute("UPDATE media SET likes = likes + 1 WHERE id = ?", (media_id,))
    conn.commit()
    row = conn.execute("SELECT likes FROM media WHERE id = ?", (media_id,)).fetchone()
    conn.close()
    return jsonify({"likes": row["likes"] if row else 0})


# ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

@app.route("/api/admin/media", methods=["GET"])
def admin_list_media():
    conn = get_db()
    status = request.args.get("status", "pending")
    rows = conn.execute("SELECT * FROM media WHERE status = ? ORDER BY created_at DESC", (status,)).fetchall()
    result = []
    for row in rows:
        tags_rows = conn.execute("SELECT tag FROM tags WHERE media_id = ?", (row["id"],)).fetchall()
        result.append(media_row_to_dict(row, [t["tag"] for t in tags_rows]))
    conn.close()
    return jsonify(result)


@app.route("/api/admin/media/<int:media_id>/approve", methods=["POST"])
def approve_media(media_id):
    conn = get_db()
    conn.execute("UPDATE media SET status = 'approved' WHERE id = ?", (media_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/admin/media/<int:media_id>/reject", methods=["POST"])
def reject_media(media_id):
    conn = get_db()
    conn.execute("UPDATE media SET status = 'rejected' WHERE id = ?", (media_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/admin/media/<int:media_id>/sponsor", methods=["POST"])
def sponsor_media(media_id):
    data = request.get_json() or {}
    label = data.get("label", "Sponsored")
    conn = get_db()
    conn.execute(
        "UPDATE media SET is_sponsored = 1, sponsored_label = ? WHERE id = ?",
        (label, media_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ─── TAGS & STATS ────────────────────────────────────────────────────────────

@app.route("/api/tags", methods=["GET"])
def list_tags():
    conn = get_db()
    rows = conn.execute("""
        SELECT t.tag, COUNT(*) as count FROM tags t
        JOIN media m ON t.media_id = m.id
        WHERE m.status = 'approved'
        GROUP BY t.tag ORDER BY count DESC LIMIT 30
    """).fetchall()
    conn.close()
    return jsonify([{"tag": r["tag"], "count": r["count"]} for r in rows])


@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) as c FROM media WHERE status='approved'").fetchone()["c"]
    by_cat = {}
    for cat in ("image", "gif", "video"):
        row = conn.execute(
            "SELECT COUNT(*) as c FROM media WHERE status='approved' AND category=?", (cat,)
        ).fetchone()
        by_cat[cat] = row["c"]
    pending = conn.execute("SELECT COUNT(*) as c FROM media WHERE status='pending'").fetchone()["c"]
    conn.close()
    return jsonify({"total": total, "byCategory": by_cat, "pending": pending})


# ─── FILE SERVING ────────────────────────────────────────────────────────────

@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
