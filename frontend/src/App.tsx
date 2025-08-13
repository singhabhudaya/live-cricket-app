import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import './styles.css'

const API = (p: string) => (import.meta.env.VITE_API_URL || 'https://live-cricket-app.onrender.com/api') + p
const WS  = (import.meta.env.VITE_WS_URL || 'https://live-cricket-app.onrender.com') + '/ws'

type Match = {
  id:number; code:number; teamA:string; teamB:string;
  oversPerSide:number; status:string; currentInnings?: number; winner?: string; result?: string
}
type Entry = {
  id:number; innings:number; over:number; ball:number; event:string;
  runsBat:number; runsExtra:number; wicket:boolean; notes?:string; createdAt:string
}

export const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([])
  const [active, setActive] = useState<Match | null>(null)
  const [commentary, setCommentary] = useState<Entry[]>([])
  const [sums, setSums] = useState<any>(null)

  // pause/confirm when switching to innings 2
  const [needsAck, setNeedsAck] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const timerRef = useRef<number | null>(null)
  const prevInningsRef = useRef<{code:number|null; inns:number|null}>({code:null, inns:null})

  const socket = useMemo<Socket>(() => io(WS, { transports: ['websocket'], autoConnect: false }), [])
  const currentCodeRef = useRef<number | null>(null)
  const fetchSeq = useRef(0)

  const refreshList = () => fetch(API('/matches')).then(r => r.json()).then(setMatches)
  useEffect(() => { refreshList() }, [])

  useEffect(() => {
    const onNew = () => { const c = currentCodeRef.current; if (c) refreshOne(c) }
    const onMatchUpdate = () => { const c = currentCodeRef.current; if (c) refreshOne(c); refreshList() }
    socket.on('commentary:new', onNew)
    socket.on('match:update', onMatchUpdate)
    return () => { socket.off('commentary:new', onNew); socket.off('match:update', onMatchUpdate); socket.disconnect() }
  }, [socket])

  const refreshOne = async (code: number) => {
    const mySeq = ++fetchSeq.current
    const res = await fetch(API(`/matches/${code}`))
    const m = await res.json()
    if (fetchSeq.current !== mySeq || currentCodeRef.current !== code) return
    setCommentary(m.commentary || [])
    setSums(m.sums)
    setActive(prev => prev ? { ...prev, ...m } : m)
  }

  const selectMatch = (m: Match) => {
    setActive(m)
    setCommentary([])
    setSums(null)
    // cancel any pending modal when switching matches
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null }
    setNeedsAck(false)

    currentCodeRef.current = m.code
    fetchSeq.current++
    try { socket.disconnect() } finally {
      socket.connect()
      socket.emit('join', { matchCode: m.code })
    }
    prevInningsRef.current = { code: m.code, inns: m.currentInnings ?? 1 }
    refreshOne(m.code)
  }

  const startMatch = async () => {
    const teamA = prompt('Team A?') || 'A'
    const teamB = prompt('Team B?') || 'B'
    const overs = Number(prompt('Overs per side?', '1') || 1)
    const res = await fetch(API('/matches/start'), {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ teamA, teamB, oversPerSide: overs })
    })
    const m: Match = await res.json()
    setMatches(prev => [m, ...prev])
    selectMatch(m)
  }

  const delMatch = async (m: Match) => {
    if (!confirm(`Delete match #${m.code} — ${m.teamA} vs ${m.teamB}?`)) return
    const res = await fetch(API(`/matches/${m.code}`), { method: 'DELETE' })
    if (!res.ok) return alert(await res.text())
    setMatches(prev => prev.filter(x => x.code !== m.code))
    if (active?.code === m.code) {
      setActive(null); setCommentary([]); setSums(null)
      currentCodeRef.current = null
      try { socket.disconnect() } catch {}
    }
  }

  // Detect switch 1 ➜ 2 for the SAME match and show a short confirmation
  useEffect(() => {
    if (!active) return
    const prev = prevInningsRef.current
    const nowInns = active.currentInnings ?? 1
    if (prev.code === active.code && prev.inns === 1 && nowInns === 2 && active.status !== 'COMPLETED') {
      // show modal + countdown (3s)
      setNeedsAck(true)
      setCountdown(3)
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = window.setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null }
            setNeedsAck(false)
            return 0
          }
          return c - 1
        })
      }, 1000) as unknown as number
    }
    prevInningsRef.current = { code: active.code, inns: nowInns }
  }, [active?.code, active?.currentInnings, active?.status])

  // derived UI state
  const LEGAL = new Set(['DOT','ONE','TWO','THREE','FOUR','SIX','BYE','LEG_BYE','WICKET'])
  const currentInnings = active?.currentInnings ?? 1
  const inningsFeed = commentary.filter(c => c.innings === currentInnings)
  const legalCount = inningsFeed.filter(c => LEGAL.has(c.event)).length
  const maxLegal = active ? active.oversPerSide * 6 : 0
  const complete = !!active && (active.status === 'COMPLETED' || legalCount >= maxLegal)
  const controlsDisabled = complete || needsAck
  const battingTeam = active ? (currentInnings === 1 ? active.teamA : active.teamB) : ''
  const target = sums ? (sums.i1?.runs ?? 0) + 1 : undefined

  const add = async (event:string, rb=0, re=0, w=false) => {
    if (!active) return alert('Pick a match first')
    if (controlsDisabled) return
    const res = await fetch(API(`/matches/${active.code}/commentary`), {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ event, runsBat: rb, runsExtra: re, wicket: w })
    })
    if (!res.ok) return alert(await res.text())
    refreshOne(active.code)
  }

  return (
    <div className="app">
      <aside className="sidebar card">
        <div className="sidebar__header">
          <h2>Matches</h2>
          <button className="btn btn--primary" onClick={startMatch}>+ Start Match</button>
        </div>
        <ul className="matchlist">
          {matches.map(m => (
            <li
              key={m.id}
              className={`matchlist__item ${active?.id===m.id ? 'is-active' : ''}`}
              onClick={() => selectMatch(m)}
            >
              <div className="badge">#{m.code}</div>
              <div className="matchlist__meta">
                <div className="matchlist__title">{m.teamA} <span className="muted">vs</span> {m.teamB}</div>
                <div className="meta-right">
                  <div className={`status ${m.status.toLowerCase()}`}>{m.status}</div>
                  <button
                    className="icon-btn icon-btn--trash"
                    title="Delete match"
                    onClick={(e) => { e.stopPropagation(); delMatch(m) }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main">
        {!active ? (
          <div className="empty card">Pick a match on the left.</div>
        ) : (
          <>
            <header className="header">
              <h1>Match #{active.code} — <span>{active.teamA}</span> <em>vs</em> <span>{active.teamB}</span></h1>
              <div className="sub">
                {active.status === 'COMPLETED'
                  ? (active.result || 'Completed')
                  : <>Innings {currentInnings}: <b>{battingTeam}</b> batting</>}
              </div>
            </header>

            <section className="scoreboard card">
              <div className="scoreboard__row">
                <div className="team">
                  <div className="team__name">{active.teamA}</div>
                  <div className="team__score">{sums ? `${sums.i1.runs}/${sums.i1.wkts}` : '—/—'}</div>
                  <div className="team__overs">{sums ? `${sums.i1.overs} overs` : '— overs'}</div>
                </div>
                <div className="divider" />
                <div className="team">
                  <div className="team__name">{active.teamB}</div>
                  <div className="team__score">{sums ? `${sums.i2.runs}/${sums.i2.wkts}` : '—/—'}</div>
                  <div className="team__overs">{sums ? `${sums.i2.overs} overs` : '— overs'}</div>
                </div>
              </div>
              {active.status !== 'COMPLETED' && currentInnings === 2 && sums &&
                <div className="target">Target: <b>{target}</b></div>}
            </section>

            <section className="controls card">
              <div className="controls__row">
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('DOT')}>•</button>
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('ONE',1)}>1</button>
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('TWO',2)}>2</button>
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('THREE',3)}>3</button>
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('FOUR',4)}>4</button>
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('SIX',6)}>6</button>
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('WIDE',0,1)}>Wd</button>
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('NO_BALL',0,1)}>Nb</button>
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('BYE',0,1)}>B</button>
                <button disabled={controlsDisabled} className="pill" onClick={()=>add('LEG_BYE',0,1)}>Lb</button>
                <button disabled={controlsDisabled} className="pill danger" onClick={()=>add('WICKET',0,0,true)}>W</button>
              </div>
              {active.status !== 'COMPLETED' && (complete || needsAck) &&
                <div className="hint">{needsAck ? 'Second innings about to start…' : 'Innings complete.'}</div>}
            </section>

            <section className="timeline card">
              <h3>Commentary</h3>
              {commentary.length === 0 ? (
                <div className="muted">No events yet.</div>
              ) : (
                <ol className="timeline__list">
                  {commentary.map(c => (
                    <li key={c.id} className="timeline__item">
                      <span className="dot" />
                      <div className="timeline__content">
                        <div className="when">Inns {c.innings} • {c.over}.{c.ball}</div>
                        <div className="what">
                          <b>{c.event}</b>
                          {c.runsBat ? `, bat ${c.runsBat}` : ''}
                          {c.runsExtra ? `, extra ${c.runsExtra}` : ''}
                          {c.wicket ? ', W' : ''}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </main>

      {/* Simple modal: blocks clicks + shows countdown */}
      {active && needsAck && (
        <div className="modal-backdrop">
          <div className="modal">
            <h4>Start 2nd innings?</h4>
            <p><b>{active.teamB}</b> to bat. Starting in <b>{countdown}</b>…</p>
            <div className="modal__actions">
              <button className="btn" onClick={() => setNeedsAck(false)}>Start now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
