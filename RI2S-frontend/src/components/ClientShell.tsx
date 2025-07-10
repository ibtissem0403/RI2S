// src/components/ClientShell.tsx

'use client'

import { useState } from 'react'

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Ri2S</h1>
        <button onClick={() => setOpen(!open)} className="bg-white text-blue-600 px-3 py-1 rounded">
          {open ? 'Fermer le menu' : 'Ouvrir le menu'}
        </button>
      </header>

      {open && (
        <nav className="bg-gray-200 p-4">
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/about">À propos</a></li>
          </ul>
        </nav>
      )}

      <main className="p-4">
        {children}
      </main>
    </div>
  )
}
