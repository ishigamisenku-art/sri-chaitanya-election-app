from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import hashlib

app = FastAPI(title="Sri Chaitanya Techno School - Election System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "election.db"

POSITIONS_GENERAL = [
    "Head Boy", "Head Girl", "Deputy Head Boy", "Deputy Head Girl",
    "Sports Secretary", "Eco-Science Secretary", "Heritage Secretary",
    "Lit Secretary", "Cultural Secretary"
]
POSITIONS_HOUSE = ["House Captain", "Vice Captain"]
HOUSES = ["Vikings", "Samurais", "Spartans", "Knights"]

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS voters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        voter_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        house TEXT,
        role TEXT NOT NULL,
        has_voted INTEGER DEFAULT 0
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        scs_number TEXT NOT NULL,
        house TEXT,
        position TEXT NOT NULL,
        class_name TEXT,
        bio TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        voter_id TEXT NOT NULL,
        voter_name TEXT NOT NULL,
        candidate_id INTEGER NOT NULL,
        position TEXT NOT NULL,
        house TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    c.execute("SELECT * FROM voters WHERE voter_id = 'ADMIN001'")
    if not c.fetchone():
        c.execute("INSERT INTO voters (voter_id, name, password, house, role) VALUES (?,?,?,?,?)",
                  ("ADMIN001", "Admin", hash_password("admin123"), None, "admin"))
    conn.commit()
    conn.close()

init_db()

class LoginRequest(BaseModel):
    voter_id: str
    password: str

class VoteItem(BaseModel):
    candidate_id: int
    position: str
    house: Optional[str] = None

class CastVotesRequest(BaseModel):
    voter_id: str
    votes: List[VoteItem]

class AddVoterRequest(BaseModel):
    voter_id: str
    name: str
    password: str
    house: Optional[str] = None
    role: str

class AddCandidateRequest(BaseModel):
    name: str
    scs_number: str
    house: Optional[str] = None
    position: str
    class_name: Optional[str] = None
    bio: Optional[str] = None

@app.post("/login")
def login(req: LoginRequest):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM voters WHERE voter_id = ?", (req.voter_id,))
    voter = c.fetchone()
    conn.close()
    if not voter:
        raise HTTPException(status_code=404, detail="Voter ID not found")
    if voter["password"] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {
        "voter_id": voter["voter_id"],
        "name": voter["name"],
        "house": voter["house"],
        "role": voter["role"],
        "has_voted": bool(voter["has_voted"])
    }

@app.get("/candidates/ballot")
def get_ballot(voter_id: str):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM voters WHERE voter_id = ?", (voter_id,))
    voter = c.fetchone()
    if not voter:
        conn.close()
        raise HTTPException(status_code=404, detail="Voter not found")
    role = voter["role"]
    house = voter["house"]
    ballot = {}
    for pos in POSITIONS_GENERAL:
        c.execute("SELECT * FROM candidates WHERE position = ? AND house IS NULL", (pos,))
        candidates = [dict(r) for r in c.fetchall()]
        if candidates:
            ballot[pos] = {"type": "general", "house": None, "candidates": candidates}
    if role == "student":
        if house:
            for pos in POSITIONS_HOUSE:
                c.execute("SELECT * FROM candidates WHERE position = ? AND house = ?", (pos, house))
                candidates = [dict(r) for r in c.fetchall()]
                if candidates:
                    ballot[f"{pos} ({house})"] = {"type": "house", "house": house, "candidates": candidates}
    elif role == "teacher":
        for h in HOUSES:
            for pos in POSITIONS_HOUSE:
                c.execute("SELECT * FROM candidates WHERE position = ? AND house = ?", (pos, h))
                candidates = [dict(r) for r in c.fetchall()]
                if candidates:
                    ballot[f"{pos} ({h})"] = {"type": "house", "house": h, "candidates": candidates}
    conn.close()
    return {"voter": dict(voter), "ballot": ballot}

@app.post("/vote")
def cast_votes(req: CastVotesRequest):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM voters WHERE voter_id = ?", (req.voter_id,))
    voter = c.fetchone()
    if not voter:
        conn.close()
        raise HTTPException(status_code=404, detail="Voter not found")
    if voter["has_voted"]:
        conn.close()
        raise HTTPException(status_code=400, detail="You have already voted")
    for vote in req.votes:
        c.execute("INSERT INTO votes (voter_id, voter_name, candidate_id, position, house) VALUES (?,?,?,?,?)",
                  (req.voter_id, voter["name"], vote.candidate_id, vote.position, vote.house))
    c.execute("UPDATE voters SET has_voted = 1 WHERE voter_id = ?", (req.voter_id,))
    conn.commit()
    conn.close()
    return {"message": "Votes cast successfully!"}

@app.get("/candidates")
def get_candidates():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM candidates ORDER BY position, house, name")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/admin/results")
def get_results():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT v.position, v.house, c.name as candidate_name, c.scs_number, COUNT(*) as vote_count
        FROM votes v JOIN candidates c ON v.candidate_id = c.id
        GROUP BY v.position, v.house, v.candidate_id
        ORDER BY v.position, v.house, vote_count DESC
    """)
    rows = c.fetchall()
    conn.close()
    results = {}
    for r in rows:
        key = f"{r['position']}{' (' + r['house'] + ')' if r['house'] else ''}"
        if key not in results:
            results[key] = []
        results[key].append({
            "candidate": r["candidate_name"],
            "scs_number": r["scs_number"],
            "votes": r["vote_count"]
        })
    return results

@app.get("/admin/audit")
def get_audit():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT v.voter_id, v.voter_name, c.name as candidate_name, v.position, v.house, v.timestamp
        FROM votes v JOIN candidates c ON v.candidate_id = c.id
        ORDER BY v.timestamp DESC
    """)
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/admin/voters")
def get_voters():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT voter_id, name, house, role, has_voted FROM voters WHERE role != 'admin' ORDER BY role, house, name")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/admin/add-voter")
def add_voter(req: AddVoterRequest):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO voters (voter_id, name, password, house, role) VALUES (?,?,?,?,?)",
                  (req.voter_id, req.name, hash_password(req.password), req.house, req.role))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Voter ID already exists")
    conn.close()
    return {"message": "Voter added successfully"}

@app.delete("/admin/delete-voter/{voter_id}")
def delete_voter(voter_id: str):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM voters WHERE voter_id = ? AND role != 'admin'", (voter_id,))
    conn.commit()
    conn.close()
    return {"message": "Voter deleted"}

@app.post("/admin/add-candidate")
def add_candidate(req: AddCandidateRequest):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO candidates (name, scs_number, house, position, class_name, bio) VALUES (?,?,?,?,?,?)",
              (req.name, req.scs_number, req.house, req.position, req.class_name, req.bio))
    conn.commit()
    conn.close()
    return {"message": "Candidate added successfully"}

@app.delete("/admin/delete-candidate/{candidate_id}")
def delete_candidate(candidate_id: int):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM candidates WHERE id = ?", (candidate_id,))
    conn.commit()
    conn.close()
    return {"message": "Candidate deleted"}

@app.post("/admin/reset-votes")
def reset_all_votes():
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM votes")
    c.execute("UPDATE voters SET has_voted = 0")
    conn.commit()
    conn.close()
    return {"message": "All votes reset"}

@app.get("/")
def root():
    return {"message": "Sri Chaitanya Techno School Election API is running!"}