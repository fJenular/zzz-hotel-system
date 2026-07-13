'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  LogOut, Bell, RefreshCw, CheckCircle, Clock, 
  Sparkles, User, Play, Check, ListTodo, SprayCan, Wind,
  Heart, Search, Droplets, Shield, MoreHorizontal
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
      .select('*, rooms (room_number, floor, status)')
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
      alert('Pembersihan dimulai!')
      fetchTasks()
    } catch (err: any) {
      alert(err.message || 'Gagal memulai pembersihan')
    }
  }

  const handleCompleteCleaning = async (taskId: string, roomId: string) => {
    try {
      const { error: taskErr } = await supabase
        .from('housekeeping_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)

      if (taskErr) throw taskErr

      const { error: roomErr } = await supabase
        .from('rooms')
        .update({ status: 'available' })
        .eq('id', roomId)

      if (roomErr) throw roomErr

      alert('Kamar sudah bersih & tersedia!')
      fetchTasks()
    } catch (err: any) {
      alert(err.message || 'Gagal menyelesaikan tugas')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const pendingTasks = tasks.filter((t: any) => t.status === 'pending')
  const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress')
  const completedTasks = tasks.filter((t: any) => t.status === 'completed')

  return (
    <div className="flex min-h-screen bg-sky-50/30 font-sans text-slate-800 antialiased">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-sky-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
              <SprayCan className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-800 tracking-tight block leading-tight">zzz-hotel</span>
              <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block mt-0.5">Housekeeping</span>
            </div>
          </Link>

          <nav className="space-y-1">
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-sky-600 bg-sky-50 border border-sky-100/50 rounded-xl">
              <ListTodo className="w-5 h-5 text-sky-500" />
              <span>Tugas Pembersihan</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-sky-600 hover:bg-sky-50/50 rounded-xl transition-all duration-200 cursor-pointer">
              <Droplets className="w-5 h-5" />
              <span>Perlengkapan</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-sky-600 hover:bg-sky-50/50 rounded-xl transition-all duration-200 cursor-pointer">
              <Shield className="w-5 h-5" />
              <span>Cek Kualitas</span>
            </div>
          </nav>

          <div className="pt-4 space-y-2">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky-100/50">
              <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Staf Kebersihan</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{user?.full_name || 'Staf'}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-sky-100/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
          <p className="text-[9px] text-slate-400 font-medium text-center leading-relaxed">
            Housekeeping ZZZ Hotel<br />
            © 2026 Hak Cipta Dilindungi
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-white border-b border-sky-100/50 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Housekeeping & Pembersihan</h1>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-lg border border-sky-100/50">
              <span className="inline-flex items-center gap-1">
                <Wind className="w-3 h-3" />
                {new Date().toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari tugas..." 
                className="pl-9 pr-4 py-2 w-full border border-sky-100 bg-sky-50/20 rounded-2xl text-xs focus:outline-none focus:border-sky-300 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 border-r border-sky-100 pr-5">
              <button className="p-2 text-slate-400 hover:text-sky-500 transition-colors relative" aria-label="Notifikasi">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 border border-white rounded-full"></span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100/50 text-xs font-bold font-mono">
                {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'HK'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-800 leading-none">{user?.full_name || 'Housekeeping'}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">Staf Kebersihan</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">Memuat tugas housekeeping...</div>
          ) : (
            <>
              {/* KPI ROW */}
              <div className="grid grid-cols-3 gap-6 animate-scale-up">
                <div className="bg-white border border-sky-100 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tertunda</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{pendingTasks.length}</p>
                  </div>
                </div>
                <div className="bg-white border border-sky-100 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <SprayCan className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sedang Berjalan</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{inProgressTasks.length}</p>
                  </div>
                </div>
                <div className="bg-white border border-sky-100 p-5 rounded-[20px] shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Selesai</p>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">{completedTasks.length}</p>
                  </div>
                </div>
              </div>

              {/* 3-COLUMN KANBAN */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
                {/* PENDING */}
                <div className="space-y-4 bg-white border border-sky-100 p-5 rounded-[24px] shadow-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-sky-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
                      <h3 className="font-bold text-slate-800">Antrean / Tertunda</h3>
                    </div>
                    <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{pendingTasks.length}</span>
                  </div>
                  
                  {pendingTasks.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckCircle className="w-10 h-10 text-sky-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Tidak ada tugas pembersihan yang tertunda.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {pendingTasks.map((task: any) => (
                        <div key={task.id} className="p-4 border border-sky-100 bg-sky-50/20 rounded-2xl space-y-3 hover:shadow-sm transition">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-sky-100 text-sky-600 text-sm font-black">
                                {task.rooms?.room_number}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-sky-700">Kamar {task.rooms?.room_number}</span>
                                <p className="text-[10px] text-slate-400">Lantai {task.rooms?.floor}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-full ${
                              task.priority === 'high' ? 'bg-rose-100 text-rose-700' : 
                              task.priority === 'normal' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {task.priority === 'high' ? 'Tinggi' : task.priority === 'normal' ? 'Normal' : task.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Droplets className="w-3 h-3" />
                            <span>Tipe: {task.task_type}</span>
                          </div>
                          <button 
                            onClick={() => handleStartCleaning(task.id)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-all shadow-sm hover:shadow-md"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Mulai Bersih-Bersih
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* IN PROGRESS */}
                <div className="space-y-4 bg-white border border-amber-100 p-5 rounded-[24px] shadow-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-amber-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <h3 className="font-bold text-slate-800">Sedang Berjalan</h3>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{inProgressTasks.length}</span>
                  </div>
                  
                  {inProgressTasks.length === 0 ? (
                    <div className="text-center py-10">
                      <SprayCan className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Tidak ada tugas yang sedang berjalan.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {inProgressTasks.map((task: any) => (
                        <div key={task.id} className="p-4 border border-amber-100 bg-amber-50/20 rounded-2xl space-y-3 hover:shadow-sm transition">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-amber-100 text-amber-600 text-sm font-black">
                                {task.rooms?.room_number}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-amber-700">Kamar {task.rooms?.room_number}</span>
                                <p className="text-[10px] text-slate-400">Lantai {task.rooms?.floor}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-full ${
                              task.priority === 'high' ? 'bg-rose-100 text-rose-700' : 
                              task.priority === 'normal' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {task.priority === 'high' ? 'Tinggi' : task.priority === 'normal' ? 'Normal' : task.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Droplets className="w-3 h-3" />
                            <span>Tipe: {task.task_type}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full w-3/4"></div>
                            </div>
                            <span className="text-[9px] font-semibold text-amber-600">75%</span>
                          </div>
                          <button 
                            onClick={() => handleCompleteCleaning(task.id, task.room_id)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-sm hover:shadow-md"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Tandai Selesai
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* COMPLETED */}
                <div className="space-y-4 bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                      <h3 className="font-bold text-slate-800">Selesai Hari Ini</h3>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{completedTasks.length}</span>
                  </div>
                  
                  {completedTasks.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Belum ada tugas yang selesai hari ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {completedTasks.map((task: any) => (
                        <div key={task.id} className="p-4 border border-emerald-100 bg-emerald-50/20 rounded-2xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-emerald-100 text-emerald-600 text-sm font-black">
                                {task.rooms?.room_number}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-emerald-700">Kamar {task.rooms?.room_number}</span>
                                <p className="text-[10px] text-slate-400">Lantai {task.rooms?.floor}</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 text-[8px] font-bold uppercase bg-emerald-100 text-emerald-700 rounded-full">Selesai</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-semibold text-emerald-500">Bersih & Tersedia</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}