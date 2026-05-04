'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'

type Missatge = {
  rol: 'user' | 'assistant'
  text: string
}

export default function AssessorClient() {
  const [missatges, setMissatges] = useState<Missatge[]>([
    { rol: 'assistant', text: "Hola! Soc el teu assessor polític. Pots preguntar-me sobre normativa municipal, estratègies polítiques, redacció de preguntes per al ple, o qualsevol altre tema. Com et puc ajudar?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [missatges])

  async function handleEnviar() {
    if (!input.trim() || loading) return
    const consulta = input.trim()
    setInput('')
    setMissatges(prev => [...prev, { rol: 'user', text: consulta }])
    setLoading(true)

    try {
      const res = await fetch('/api/assessor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consulta, historial: missatges }),
      })
      const data = await res.json()
      setMissatges(prev => [...prev, { rol: 'assistant', text: data.resposta || 'Error en la resposta.' }])
    } catch {
      setMissatges(prev => [...prev, { rol: 'assistant', text: 'Error de connexió.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[calc(100vh-200px)]">
      {/* Missatges */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {missatges.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.rol === 'assistant' && (
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className={`max-w-2xl px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap ${
              m.rol === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              {m.text}
            </div>
            {m.rol === 'user' && (
              <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-slate-100 px-4 py-2.5 rounded-xl rounded-bl-none">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleEnviar()}
            placeholder="Escriu la teva consulta..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleEnviar}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Enter per enviar · Shift+Enter per nova línia</p>
      </div>
    </div>
  )
}
