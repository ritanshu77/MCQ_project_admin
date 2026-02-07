import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, BookOpen, Settings, LogOut, Menu, X, Users as UsersIcon } from 'lucide-react'
import axios from 'axios'
import { Toaster, toast } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Questions from './pages/Questions'
import QuestionEditPage from './pages/QuestionEditPage'
import Users from './pages/Users'
import { API_BASE_URL } from './config'

// Axios Interceptor for Auth Token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Components
const Sidebar = ({ isOpen, onClose, isMobile }: { isOpen: boolean; onClose: () => void; isMobile: boolean }) => {
  const location = useLocation()
  
  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/admin/login'
  }

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/users', icon: <UsersIcon size={20} />, label: 'Users' },
    { path: '/feedback', icon: <MessageSquare size={20} />, label: 'Feedback' },
    { path: '/questions', icon: <BookOpen size={20} />, label: 'Questions' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ]

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">Exam Admin</div>
        {isMobile && (
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        )}
      </div>
      <nav>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => isMobile && onClose()}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', marginTop: 'auto' }}>
          <LogOut size={20} />
          Logout
        </button>
      </nav>
    </div>
  )
}

// Protected Route Component
const ProtectedRoute = () => {
  const token = localStorage.getItem('admin_token')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="admin-layout">
      {isMobile && (
        <div className="mobile-header">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span className="mobile-title">Exam Admin</span>
        </div>
      )}
      
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isMobile={isMobile} 
      />
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    pendingFeedback: 0,
    activeUsers: 0,
    totalSubjects: 0,
    totalUnits: 0,
    totalChapters: 0,
    registeredUsers: 0,
    guestUsers: 0,
    totalTestsTaken: 0,
    averageGlobalScore: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/stats`)
        setStats(res.data)
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }
    fetchStats()
  }, [])

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Dashboard Overview</h2>
      
      {/* Content Stats */}
      <h3 style={{ color: '#555', marginBottom: '15px' }}>Content Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h3>Total Subjects</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#8e44ad' }}>{stats.totalSubjects}</p>
        </div>
        <div className="card">
          <h3>Total Units</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#2980b9' }}>{stats.totalUnits}</p>
        </div>
        <div className="card">
          <h3>Total Chapters</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#d35400' }}>{stats.totalChapters}</p>
        </div>
        <div className="card">
          <h3>Total Questions</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#34495e' }}>{stats.totalQuestions}</p>
        </div>
      </div>

      {/* User Stats */}
      <h3 style={{ color: '#555', marginBottom: '15px' }}>User Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h3>Total Users</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#27ae60' }}>{stats.activeUsers}</p>
        </div>
        <div className="card">
          <h3>Registered Users</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#16a085' }}>{stats.registeredUsers}</p>
        </div>
        <div className="card">
          <h3>Guest Users</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#f39c12' }}>{stats.guestUsers}</p>
        </div>
      </div>

      {/* Exam Stats */}
      <h3 style={{ color: '#555', marginBottom: '15px' }}>Exam Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h3>Total Tests Taken</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#9b59b6' }}>{stats.totalTestsTaken || 0}</p>
        </div>
        <div className="card">
          <h3>Avg Global Score</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#3498db' }}>{stats.averageGlobalScore || 0}%</p>
        </div>
      </div>

      {/* Operational Stats */}
      <h3 style={{ color: '#555', marginBottom: '15px' }}>System Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h3>Pending Feedback</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#e67e22' }}>{stats.pendingFeedback}</p>
        </div>
      </div>
    </div>
  )
}

interface Feedback {
  _id: string;
  userId: any;
  questionId: any;
  feedback: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'ignored';
  createdAt: string;
}

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter States
  const [filters, setFilters] = useState({
    userName: '',
    questionText: '',
    feedbackText: '',
    status: 'pending' // Default as requested
  })

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/feedback`)
      setFeedbacks(res.data)
    } catch (err) {
      console.error('Error fetching feedback:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/feedback/${id}/status`, { status })
      setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, status: status as any } : f))
      toast.success(`Status updated to ${status}`)
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Failed to update status')
    }
  }

  // Filter and Sort Logic
  const filteredFeedbacks = feedbacks
    .filter(fb => {
      // Status Filter
      if (filters.status && filters.status !== 'all' && fb.status !== filters.status) return false;

      // User Name Filter
      const userName = fb.userId?.name || fb.userId?.gmail || (typeof fb.userId === 'string' ? fb.userId : '');
      if (filters.userName && !userName.toLowerCase().includes(filters.userName.toLowerCase())) return false;

      // Question Text Filter (En & Hi)
      const qEn = fb.questionId?.questionText?.en || '';
      const qHi = fb.questionId?.questionText?.hi || '';
      if (filters.questionText && 
          !qEn.toLowerCase().includes(filters.questionText.toLowerCase()) && 
          !qHi.toLowerCase().includes(filters.questionText.toLowerCase())) {
        return false;
      }

      // Feedback Text Filter
      if (filters.feedbackText && !fb.feedback.toLowerCase().includes(filters.feedbackText.toLowerCase())) return false;

      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Latest first

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>User Feedback</h2>
        <button className="btn btn-primary" onClick={() => { fetchFeedback(); toast.success('Refreshed!'); }}>Refresh</button>
      </div>

      {/* Filters Section */}
      <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
        <h4 style={{ marginBottom: '10px', marginTop: 0 }}>Filters</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>Status</label>
            <select 
              value={filters.status} 
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>User Name</label>
            <input 
              type="text" 
              placeholder="Search User..." 
              value={filters.userName}
              onChange={e => setFilters({ ...filters, userName: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>Question Text</label>
            <input 
              type="text" 
              placeholder="Search Question (En/Hi)..." 
              value={filters.questionText}
              onChange={e => setFilters({ ...filters, questionText: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>Feedback Content</label>
            <input 
              type="text" 
              placeholder="Search Feedback..." 
              value={filters.feedbackText}
              onChange={e => setFilters({ ...filters, feedbackText: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
      </div>
      
      <div className="card">
        {loading ? (
          <p>Loading feedback...</p>
        ) : filteredFeedbacks.length === 0 ? (
          <p>No feedback found matching criteria.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Question</th>
                <th>Feedback</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((fb) => (
                <tr key={fb._id}>
                  <td>
                    {fb.userId?.name || fb.userId?.gmail || (typeof fb.userId === 'string' ? fb.userId : 'Unknown')}
                  </td>
                  <td>
                    <code style={{fontSize: '0.8rem'}}>
                      {fb.questionId && typeof fb.questionId === 'object' ? (
                        <Link to={`/questions/edit/${fb.questionId._id}`} style={{ color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>
                          {fb.questionId.questionText?.en?.substring(0, 30) || 'Question'}...
                        </Link>
                      ) : (
                        fb.questionId || 'N/A'
                      )}
                    </code>
                  </td>
                  <td>{fb.feedback}</td>
                  <td>
                    <span className={`badge badge-${fb.status}`}>
                      {fb.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(fb.createdAt).toLocaleDateString()}</td>
                  <td>
                    {fb.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          className="btn btn-sm" 
                          style={{ backgroundColor: '#27ae60', color: 'white' }}
                          onClick={() => updateStatus(fb._id, 'resolved')}
                        >
                          Resolve
                        </button>
                        <button 
                          className="btn btn-sm" 
                          style={{ backgroundColor: '#e74c3c', color: 'white' }}
                          onClick={() => updateStatus(fb._id, 'ignored')}
                        >
                          Ignore
                        </button>
                      </div>
                    )}
                    {fb.status !== 'pending' && <span>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const App = () => {
  // Keep-alive mechanism: Hit backend /help endpoint every 15 minutes
  useEffect(() => {
    const keepAlive = () => {
      axios.get(`${API_BASE_URL}/help`)
        .then(() => console.log('Keep-alive ping successful'))
        .catch((err) => {
          // Ignore errors for background ping
        });
    };

    // Initial call
    keepAlive();

    // Schedule every 15 minutes
    const interval = setInterval(keepAlive, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter basename="/admin">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/feedback" element={<FeedbackList />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/questions/edit/:id" element={<QuestionEditPage />} />
          <Route path="/settings" element={<div><h2>Admin Settings</h2><p>Coming Soon...</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
