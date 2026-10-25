import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Toaster} from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'

const App = () => {
  const { authUser, isCheckingAuth } = useContext(AuthContext);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#110f1e] text-white">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[url('/bgImage.svg')] bg-contain">
      <Toaster/>
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />}/>
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />}/>
        <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />}/>
      </Routes>
      

    </div>
    
  )
}

export default App
