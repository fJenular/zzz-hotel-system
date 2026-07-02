'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Home, LogOut, Bell, RefreshCw, CheckCircle, Clock, 
  Sparkles, User, DoorOpen, ListTodo, Play, Check
} from 'lucide-react'
import Link from 'next/link'

export default function HousekeepingDashboard() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (userData?.role !== 'housekeeping' && userData?.role !== 'admin' && userData?.role !== 'super_admin') {
        router.push('/')
        return
      }
      setUser(userData)
      fetchTasks()
    }
    checkUser()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .select(`
        *,
        rooms (room_number, floor, status)
      `)
      .order('due_date', { ascending: true })

    if (error) {
      alert(error.message)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

  const handleStartCleaning = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId)

      if (error) throw error
      alert('Cleaning started!')
      fetchTasks()
    } catch (err: any) {
      alert(err.message || 'Failed to start cleaning')
    }
  }

  const handleCompleteCleaning = async (taskId: string, roomId: string) => {
    try {
      // 1. Update task to completed
      const { error: taskErr } = await supabase
        .from('housekeeping_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)

      if (taskErr) throw taskErr

      // 2. Update room status to available
      const { error: roomErr } = await supabase
        .from('rooms')
        .update({ status: 'available' })
        .eq('id', roomId)

      if (roomErr) throw roomErr

      alert('Room marked Cleaned & Available!')
      fetchTasks()
    } catch (err: any) {
      alert(err.message || 'Failed to complete task')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold text-gray-900 tracking-tight">
            <span className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-200">🏨</span>
            <span>ZZZ HOTEL</span>
          </Link>

          <nav className="space-y-1">
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <ListTodo className="w-5 h-5 text-rose-500" />
              <span>Cleaning Tasks</span>
            </div>
          </nav>
        </div>

        <div className="space-y-4">
          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-400 px-4 uppercase tracking-wider">Account</p>
          <div className="px-4 py-2 bg-gray-50 rounded-xl mb-2">
            <p className="text-xs font-bold text-gray-800">{user?.full_name}</p>
            <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Housekeeping & Cleaning Staff</h1>
            <p className="text-xs text-gray-500">View and update daily room cleaning activities.</p>
          </div>
          <button 
            onClick={fetchTasks}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 transition"
            aria-label="Refresh list"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-8 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-semibold animate-pulse">Loading housekeeping tasks...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Pending Tasks */}
              <div className="space-y-4 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900">To Do / Pending</h3>
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
                </div>
                
                {pendingTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No pending cleaning tasks.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <div key={task.id} className="p-4 border border-rose-100 bg-rose-50/10 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-lg font-black text-rose-600">Room {task.rooms?.room_number}</span>
                          <span className="px-2 py-0.5 text-[8px] font-bold uppercase bg-rose-100 text-rose-700 rounded-full">{task.priority}</span>
                        </div>
                        <p className="text-xs text-gray-500">Floor {task.rooms?.floor} • Type: {task.task_type}</p>
                        <button 
                          onClick={() => handleStartCleaning(task.id)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start Cleaning
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: In Progress Tasks */}
              <div className="space-y-4 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900">In Progress</h3>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{inProgressTasks.length}</span>
                </div>
                
                {inProgressTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No tasks currently in progress.</p>
                ) : (
                  <div className="space-y-3">
                    {inProgressTasks.map((task) => (
                      <div key={task.id} className="p-4 border border-amber-100 bg-amber-50/10 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-lg font-black text-amber-600">Room {task.rooms?.room_number}</span>
                          <span className="px-2 py-0.5 text-[8px] font-bold uppercase bg-amber-100 text-amber-700 rounded-full">{task.priority}</span>
                        </div>
                        <p className="text-xs text-gray-500">Floor {task.rooms?.floor} • Type: {task.task_type}</p>
                        <button 
                          onClick={() => handleCompleteCleaning(task.id, task.room_id)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Cleaned
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 3: Completed Tasks */}
              <div className="space-y-4 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900">Completed Today</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{completedTasks.length}</span>
                </div>
                
                {completedTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No tasks completed today.</p>
                ) : (
                  <div className="space-y-3">
                    {completedTasks.map((task) => (
                      <div key={task.id} className="p-4 border border-emerald-100 bg-emerald-50/10 rounded-xl space-y-2 opacity-75">
                        <div className="flex justify-between items-start">
                          <span className="text-lg font-black text-emerald-600">Room {task.rooms?.room_number}</span>
                          <span className="px-2 py-0.5 text-[8px] font-bold uppercase bg-emerald-100 text-emerald-700 rounded-full">Done</span>
                        </div>
                        <p className="text-xs text-gray-400">Floor {task.rooms?.floor} • Status: Cleaned</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
