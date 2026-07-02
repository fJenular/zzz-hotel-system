'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const [showModal, setShowModal] = useState(false)

  const handleLogout = () => {
    window.location.href = '/api/auth/logout'
  }

  return (
    <>
      <button 
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200 text-left cursor-pointer"
      >
        <LogOut className="w-5 h-5" />
        <span>Log Out</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 max-w-sm w-full mx-4 shadow-xl space-y-4 animate-scale-up text-center">
            <div className="space-y-2">
              <span className="inline-block p-3 bg-rose-50/80 text-rose-500 rounded-full text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-gray-900">Confirm Log Out</h3>
              <p className="text-sm text-gray-500">Are you sure you want to log out of ZZZ Hotel?</p>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 px-4 text-xs font-bold border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 rounded-xl text-white transition shadow-md shadow-rose-200"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
