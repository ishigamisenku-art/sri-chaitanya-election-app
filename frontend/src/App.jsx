import { useState, useEffect } from 'react'

const API = 'http://127.0.0.1:8000'

const HOUSE_COLORS = {
  Vikings:  { bg: '#ede9fe', border: '#7c3aed', text: '#4c1d95', icon: '⚔️' },
  Samurais: { bg: '#d1fae5', border: '#059669', text: '#064e3b', icon: '🥷' },
  Spartans: { bg: '#fee2e2', border: '#dc2626', text: '#7f1d1d', icon: '🛡️' },
  Knights:  { bg: '#fce7f3', border: '#db2777', text: '#831843', icon: '🏰' },
}

const ROLE_BADGE = {
  student: { bg: '#dbeafe', text: '#1e40af', label: 'Student' },
  teacher: { bg: '#d1fae5', text: '#065f46', label: 'Teacher' },
  admin:   { bg: '#fee2e2', text: '#991b1b', label: 'Admin' },
}

function Badge({ role }) {
  const s = ROLE_BADGE[role] || ROLE_BADGE.student
  return <span style={{ background: s.bg, color: s.text, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
}

function HouseBadge({ house }) {
  if (!house) return null
  const h = HOUSE_COLORS[house] || {}
  return <span style={{ background: h.bg, color: h.text, border: `1px solid ${h.border}`, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{h.icon} {house}</span>
}

function Card({ children, style }) {
  return <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 20px rgba(0,0,0,0.08)', padding: 28, ...style }}>{children}</div>
}

function Button({ children, onClick, disabled, color = '#2563eb', style }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: disabled ? '#d1d5db' : color, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 600, fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>{children}</button>
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</div>}
      <input {...props} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', ...props.style }} />
    </div>
  )
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</div>}
      <select {...props} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}>{children}</select>
    </div>
  )
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</div>}
      <textarea {...props} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', minHeight: 70, ...props.style }} />
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [voterId, setVoterId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voter_id: voterId.trim(), password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      onLogin(data)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52 }}>🏫</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, marginTop: 8 }}>Sri Chaitanya Techno School</div>
          <div style={{ color: '#bfdbfe', fontSize: 15, marginTop: 4 }}>Student Council Elections 2025</div>
        </div>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#1e3a8a', marginBottom: 20, textAlign: 'center' }}>🗳️ Sign In to Vote</div>
          <Input label="Student / Teacher ID" placeholder="Enter your SCS number or ID" value={voterId} onChange={e => setVoterId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 14 }}>⚠️ {error}</div>}
          <Button onClick={handleLogin} disabled={loading || !voterId || !password} style={{ width: '100%' }}>{loading ? 'Signing in...' : 'Sign In'}</Button>
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 16 }}>Contact your class teacher if you forgot your ID</div>
        </Card>
      </div>
    </div>
  )
}

function VotingScreen({ voter, onLogout }) {
  const [ballot, setBallot] = useState(null)
  const [selections, setSelections] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/candidates/ballot?voter_id=${voter.voter_id}`)
      .then(r => r.json())
      .then(data => { setBallot(data.ballot); setLoading(false) })
      .catch(() => { setError('Could not load ballot'); setLoading(false) })
  }, [])

  function select(position, candidateId) { setSelections(s => ({ ...s, [position]: candidateId })) }

  async function submitVotes() {
    const votes = Object.entries(selections).map(([position, candidate_id]) => {
      const item = ballot[position]
      return { candidate_id, position: item.type === 'house' ? position.split(' (')[0] : position, house: item.house }
    })
    try {
      const res = await fetch(`${API}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voter_id: voter.voter_id, votes }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setSubmitted(true)
    } catch (e) { setError(e.message) }
  }

  const totalPositions = ballot ? Object.keys(ballot).length : 0
  const selected = Object.keys(selections).length

  if (voter.has_voted || submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 72 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 26, color: '#166534', marginTop: 12 }}>Vote Cast Successfully!</div>
          <div style={{ color: '#4b5563', marginTop: 8, fontSize: 16 }}>Thank you, {voter.name}! Your vote has been recorded.</div>
          <div style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Sri Chaitanya Techno School — Elections 2025</div>
          <Button onClick={onLogout} style={{ marginTop: 24, background: '#166534' }}>Back to Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1e3a8a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>🏫 Sri Chaitanya Elections</div>
          <div style={{ color: '#bfdbfe', fontSize: 13 }}>Student Council 2025</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontWeight: 600 }}>{voter.name}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
              <Badge role={voter.role} />
              {voter.house && <HouseBadge house={voter.house} />}
            </div>
          </div>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: '#374151' }}>Positions voted: <strong style={{ color: '#1e3a8a' }}>{selected} / {totalPositions}</strong></div>
          <div style={{ background: '#e5e7eb', borderRadius: 999, height: 8, width: 200 }}>
            <div style={{ background: '#2563eb', borderRadius: 999, height: 8, width: `${totalPositions ? (selected / totalPositions) * 100 : 0}%`, transition: 'width 0.4s' }} />
          </div>
        </div>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading your ballot...</div>}
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 10, padding: 14, marginBottom: 16 }}>⚠️ {error}</div>}
        {ballot && Object.entries(ballot).map(([position, info]) => (
          <Card key={position} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#1e3a8a' }}>{position}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{info.type === 'house' ? '🏠 House position' : '🌐 School-wide position'}</div>
              </div>
              {selections[position] && <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>✓ Selected</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {info.candidates.map(candidate => {
                const isSelected = selections[position] === candidate.id
                return (
                  <div key={candidate.id} onClick={() => select(position, candidate.id)} style={{ border: isSelected ? '2px solid #2563eb' : '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', background: isSelected ? '#eff6ff' : '#fafafa', transition: 'all 0.18s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{candidate.name}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>SCS: {candidate.scs_number}{candidate.class_name && ` · ${candidate.class_name}`}</div>
                      {candidate.bio && <div style={{ fontSize: 13, color: '#4b5563', marginTop: 4, fontStyle: 'italic' }}>"{candidate.bio}"</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {candidate.house && <HouseBadge house={candidate.house} />}
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: isSelected ? '6px solid #2563eb' : '2px solid #d1d5db', background: isSelected ? '#fff' : 'transparent', flexShrink: 0 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
        {ballot && Object.keys(ballot).length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 40 }}>
            {selected < totalPositions && <div style={{ color: '#d97706', fontSize: 14, marginBottom: 12 }}>⚠️ You have {totalPositions - selected} position(s) left to vote for</div>}
            <Button onClick={submitVotes} disabled={selected === 0} style={{ padding: '14px 48px', fontSize: 17, background: '#1e3a8a' }}>🗳️ Submit All Votes</Button>
            <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 10 }}>You can only vote once. This cannot be undone.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminPanel({ voter, onLogout }) {
  const [tab, setTab] = useState('results')
  const [results, setResults] = useState({})
  const [audit, setAudit] = useState([])
  const [voters, setVoters] = useState([])
  const [candidates, setCandidates] = useState([])
  const [msg, setMsg] = useState('')
  const [newVoter, setNewVoter] = useState({ voter_id: '', name: '', password: '', house: '', role: 'student' })
  const [newCandidate, setNewCandidate] = useState({ name: '', scs_number: '', house: '', position: '', class_name: '', bio: '' })

  const HOUSES = ['Vikings', 'Samurais', 'Spartans', 'Knights']
  const needsHouse = ['House Captain', 'Vice Captain'].includes(newCandidate.position)

  useEffect(() => { loadAll() }, [tab])

  async function loadAll() {
    const [r, a, v, c] = await Promise.all([
      fetch(`${API}/admin/results`).then(r => r.json()),
      fetch(`${API}/admin/audit`).then(r => r.json()),
      fetch(`${API}/admin/voters`).then(r => r.json()),
      fetch(`${API}/candidates`).then(r => r.json()),
    ])
    setResults(r); setAudit(a); setVoters(v); setCandidates(c)
  }

  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function addVoter() {
    const res = await fetch(`${API}/admin/add-voter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newVoter, house: newVoter.house || null }) })
    const data = await res.json()
    if (res.ok) { showMsg('✅ Voter added!'); setNewVoter({ voter_id: '', name: '', password: '', house: '', role: 'student' }); loadAll() }
    else showMsg('❌ ' + data.detail)
  }

  async function deleteVoter(vid) {
    if (!confirm('Delete this voter?')) return
    await fetch(`${API}/admin/delete-voter/${vid}`, { method: 'DELETE' })
    loadAll()
  }

  async function addCandidate() {
    const res = await fetch(`${API}/admin/add-candidate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newCandidate, house: needsHouse ? newCandidate.house : null }) })
    const data = await res.json()
    if (res.ok) { showMsg('✅ Candidate added!'); setNewCandidate({ name: '', scs_number: '', house: '', position: '', class_name: '', bio: '' }); loadAll() }
    else showMsg('❌ ' + data.detail)
  }

  async function deleteCandidate(id) {
    if (!confirm('Delete this candidate?')) return
    await fetch(`${API}/admin/delete-candidate/${id}`, { method: 'DELETE' })
    loadAll()
  }

  async function resetVotes() {
    if (!confirm('RESET ALL VOTES? This cannot be undone!')) return
    await fetch(`${API}/admin/reset-votes`, { method: 'POST' })
    showMsg('✅ All votes reset'); loadAll()
  }

  const tabs = [{ id: 'results', label: '📊 Results' }, { id: 'audit', label: '👁️ Audit Log' }, { id: 'voters', label: '👥 Voters' }, { id: 'candidates', label: '🧑‍💼 Candidates' }]

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0f172a', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>🔐 Admin Panel — Sri Chaitanya Elections</div>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Manage candidates, voters, and view results</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={resetVotes} style={{ background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>🔄 Reset All Votes</button>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={{ background: '#1e293b', padding: '10px 28px', display: 'flex', gap: 28 }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Total voters: <strong style={{ color: '#fff' }}>{voters.length}</strong></div>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Voted: <strong style={{ color: '#22c55e' }}>{voters.filter(v => v.has_voted).length}</strong></div>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Pending: <strong style={{ color: '#f59e0b' }}>{voters.filter(v => !v.has_voted).length}</strong></div>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Total votes cast: <strong style={{ color: '#60a5fa' }}>{audit.length}</strong></div>
      </div>
      {msg && <div style={{ background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2', color: msg.startsWith('✅') ? '#166534' : '#991b1b', padding: '12px 28px', fontWeight: 600 }}>{msg}</div>}
      <div style={{ display: 'flex', gap: 4, padding: '16px 28px 0', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', border: 'none', borderBottom: tab === t.id ? '3px solid #1e3a8a' : '3px solid transparent', background: 'none', fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#1e3a8a' : '#6b7280', cursor: 'pointer', fontSize: 14 }}>{t.label}</button>
        ))}
      </div>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
        {tab === 'results' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1e293b', marginBottom: 20 }}>Live Election Results</div>
            {Object.entries(results).map(([position, cands]) => {
              const total = cands.reduce((a, c) => a + c.votes, 0)
              return (
                <Card key={position} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1e3a8a' }}>{position}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{total} total votes</div>
                  </div>
                  {cands.map((c, i) => (
                    <div key={c.scs_number} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {i === 0 && total > 0 && <span>🏆</span>}
                          <span style={{ fontWeight: 600 }}>{c.candidate}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.scs_number}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#1e3a8a' }}>{c.votes} ({total ? Math.round(c.votes / total * 100) : 0}%)</span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: 999, height: 9 }}>
                        <div style={{ background: i === 0 ? '#1e3a8a' : '#93c5fd', borderRadius: 999, height: 9, width: `${total ? (c.votes / total) * 100 : 0}%`, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  ))}
                </Card>
              )
            })}
            {Object.keys(results).length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No votes cast yet.</div>}
          </div>
        )}
        {tab === 'audit' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1e293b', marginBottom: 20 }}>Full Audit Log</div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8faff' }}>
                    {['Voter ID', 'Voter Name', 'Position', 'Voted For', 'Time'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px', color: '#6b7280' }}>{a.voter_id}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{a.voter_name}</td>
                      <td style={{ padding: '10px 16px', color: '#1e3a8a' }}>{a.position}{a.house ? ` (${a.house})` : ''}</td>
                      <td style={{ padding: '10px 16px' }}>{a.candidate_name}</td>
                      <td style={{ padding: '10px 16px', color: '#9ca3af', fontSize: 12 }}>{new Date(a.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {audit.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No votes recorded yet.</div>}
            </Card>
          </div>
        )}
        {tab === 'voters' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b', marginBottom: 16 }}>➕ Add Voter</div>
              <Card>
                <Input label="Voter ID" placeholder="SCS Number or Teacher ID" value={newVoter.voter_id} onChange={e => setNewVoter(v => ({ ...v, voter_id: e.target.value }))} />
                <Input label="Full Name" placeholder="Full name" value={newVoter.name} onChange={e => setNewVoter(v => ({ ...v, name: e.target.value }))} />
                <Input label="Password" type="password" placeholder="Set a password" value={newVoter.password} onChange={e => setNewVoter(v => ({ ...v, password: e.target.value }))} />
                <Select label="Role" value={newVoter.role} onChange={e => setNewVoter(v => ({ ...v, role: e.target.value }))}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </Select>
                {newVoter.role === 'student' && (
                  <Select label="House" value={newVoter.house} onChange={e => setNewVoter(v => ({ ...v, house: e.target.value }))}>
                    <option value="">Select House</option>
                    {HOUSES.map(h => <option key={h}>{h}</option>)}
                  </Select>
                )}
                <Button onClick={addVoter} style={{ width: '100%', marginTop: 4 }}>Add Voter</Button>
              </Card>
            </div>
            <div style={{ flex: 2, minWidth: 320 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b', marginBottom: 16 }}>👥 Voter List ({voters.length})</div>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f8faff' }}>
                      {['ID', 'Name', 'Role', 'House', 'Voted', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map(v => (
                      <tr key={v.voter_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '9px 14px', color: '#6b7280', fontSize: 13 }}>{v.voter_id}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 600 }}>{v.name}</td>
                        <td style={{ padding: '9px 14px' }}><Badge role={v.role} /></td>
                        <td style={{ padding: '9px 14px' }}>{v.house ? <HouseBadge house={v.house} /> : '—'}</td>
                        <td style={{ padding: '9px 14px' }}><span style={{ color: v.has_voted ? '#16a34a' : '#d97706', fontWeight: 600, fontSize: 13 }}>{v.has_voted ? '✓ Voted' : '⏳ Pending'}</span></td>
                        <td style={{ padding: '9px 14px' }}><button onClick={() => deleteVoter(v.voter_id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {voters.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No voters added yet.</div>}
              </Card>
            </div>
          </div>
        )}
        {tab === 'candidates' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b', marginBottom: 16 }}>➕ Add Candidate</div>
              <Card>
                <Input label="Full Name" placeholder="Candidate full name" value={newCandidate.name} onChange={e => setNewCandidate(c => ({ ...c, name: e.target.value }))} />
                <Input label="SCS Number" placeholder="e.g. SCS2024042" value={newCandidate.scs_number} onChange={e => setNewCandidate(c => ({ ...c, scs_number: e.target.value }))} />
                <Input label="Class" placeholder="e.g. 10-A" value={newCandidate.class_name} onChange={e => setNewCandidate(c => ({ ...c, class_name: e.target.value }))} />
                <Select label="Position" value={newCandidate.position} onChange={e => setNewCandidate(c => ({ ...c, position: e.target.value }))}>
                  <option value="">Select Position</option>
                  <optgroup label="General Posts">
                    {['Head Boy','Head Girl','Deputy Head Boy','Deputy Head Girl','Sports Secretary','Eco-Science Secretary','Heritage Secretary','Lit Secretary','Cultural Secretary'].map(p => <option key={p}>{p}</option>)}
                  </optgroup>
                  <optgroup label="House Positions">
                    {['House Captain','Vice Captain'].map(p => <option key={p}>{p}</option>)}
                  </optgroup>
                </Select>
                {needsHouse && (
                  <Select label="House" value={newCandidate.house} onChange={e => setNewCandidate(c => ({ ...c, house: e.target.value }))}>
                    <option value="">Select House</option>
                    {HOUSES.map(h => <option key={h}>{h}</option>)}
                  </Select>
                )}
                <Textarea label="Bio / Manifesto (optional)" placeholder="Short campaign message..." value={newCandidate.bio} onChange={e => setNewCandidate(c => ({ ...c, bio: e.target.value }))} />
                <Button onClick={addCandidate} style={{ width: '100%', marginTop: 4 }}>Add Candidate</Button>
              </Card>
            </div>
            <div style={{ flex: 2, minWidth: 320 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b', marginBottom: 16 }}>🧑‍💼 All Candidates ({candidates.length})</div>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f8faff' }}>
                      {['Name', 'SCS No.', 'Class', 'Position', 'House', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '9px 14px', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '9px 14px', color: '#6b7280' }}>{c.scs_number}</td>
                        <td style={{ padding: '9px 14px', color: '#6b7280' }}>{c.class_name || '—'}</td>
                        <td style={{ padding: '9px 14px', color: '#1e3a8a', fontWeight: 500 }}>{c.position}</td>
                        <td style={{ padding: '9px 14px' }}>{c.house ? <HouseBadge house={c.house} /> : <span style={{ color: '#9ca3af' }}>All</span>}</td>
                        <td style={{ padding: '9px 14px' }}><button onClick={() => deleteCandidate(c.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {candidates.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No candidates added yet.</div>}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [voter, setVoter] = useState(null)
  function handleLogin(voterData) { setVoter(voterData) }
  function handleLogout() { setVoter(null) }
  if (!voter) return <LoginScreen onLogin={handleLogin} />
  if (voter.role === 'admin') return <AdminPanel voter={voter} onLogout={handleLogout} />
  return <VotingScreen voter={voter} onLogout={handleLogout} />
}