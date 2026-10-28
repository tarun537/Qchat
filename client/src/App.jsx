import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Toaster} from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'
import CallUI from './components/CallUI'

const App = () => {
  const { authUser, isCheckingAuth } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  if (isCheckingAuth) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-[#0f1412] text-white' : 'bg-[#eef2ef] text-gray-800'}`}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f1412] text-gray-100' : 'bg-[#dce3de] text-gray-900'}`}>
      <Toaster/>
      <CallUI />
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />}/>
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />}/>
        <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />}/>
      </Routes>
    </div>
  )
}

export default App
