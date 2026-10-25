import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const LoginPage = () => {

    const [currState, setCurrState] = useState("Sign up")
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [bio, setBio] = useState("")
    const [isDataSubmitted, setIsDataSubmitted] = useState(false);

    // Forgot password states
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [otpSent, setOtpSent] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const { login, axios } = useContext(AuthContext)

    // Handle sending OTP via nodemailer
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await axios.post("/api/auth/send-reset-otp", { email });
            if (data.success) {
                toast.success(data.message);
                setOtpSent(true);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password reset using OTP
    const handleResetPassword = async (e) => {
        if (e) e.preventDefault();
        if (!otp || !newPassword) {
            toast.error("Please enter OTP and new password");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await axios.post("/api/auth/reset-password", { email, otp, newPassword });
            if (data.success) {
                toast.success(data.message);
                setCurrState("Login");
                setOtpSent(false);
                setOtp("");
                setNewPassword("");
                setPassword("");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitHandler = (event)=>{
        event.preventDefault();

        if (currState === "Forgot Password") {
            if (!otpSent) {
                handleSendOtp();
            } else {
                handleResetPassword();
            }
            return;
        }

        if(currState === 'Sign up' && !isDataSubmitted){
            setIsDataSubmitted(true)
            return;
        }

        login(currState === "Sign up" ? 'signup' : 'login', {fullName, email, password, bio})
    }

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>

      {/* ------ left ------ */}
      <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)]' />
      
      {/* ------ right ------ */}

      <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-5 rounded-lg shadow-lg w-[min(90vw,400px)]'>
        <h2 className='font-medium text-2xl flex justify-between items-center'>
            {currState === "Forgot Password" ? "Reset Password" : currState}
            {((currState === "Sign up" && isDataSubmitted) || (currState === "Forgot Password")) && (
                <img 
                    onClick={()=> {
                        if (currState === "Forgot Password") {
                            if (otpSent) setOtpSent(false);
                            else setCurrState("Login");
                        } else {
                            setIsDataSubmitted(false);
                        }
                    }} 
                    src={assets.arrow_icon} 
                    alt="Back" 
                    className='w-5 cursor-pointer' 
                />
            )}
        </h2>

        {/* --- SIGN UP & LOGIN FIELDS --- */}
        {currState === "Sign up" && !isDataSubmitted && (
            <input onChange={(e)=> setFullName(e.target.value)} value={fullName}
            type="text" className='p-2 border border-gray-500 rounded-md focus:outline-none' placeholder='Full Name' required />
        )}

        {currState !== "Forgot Password" && !isDataSubmitted && (
            <>
            <input onChange={(e)=> setEmail(e.target.value)} value={email}
            type="email" placeholder='Email Address' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' />
            <div className="relative">
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                className="p-2 pr-10 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-7 0-10-7-10-7a21.12 21.12 0 0 1 1.86-2.86" /><path d="M2 2l20 20" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            </>
        )}

        {/* Forgot password link on login state */}
        {currState === "Login" && (
            <div className='flex justify-end -mt-2'>
                <span 
                    onClick={() => { setCurrState("Forgot Password"); setOtpSent(false); }} 
                    className='text-xs text-violet-400 hover:text-violet-300 hover:underline cursor-pointer'
                >
                    Forgot password?
                </span>
            </div>
        )}

        {currState === "Sign up" && isDataSubmitted && (
                <textarea onChange={(e)=> setBio(e.target.value)} value={bio}
                rows={4} className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' placeholder='provide a short bio...' required></textarea>
            )
        }

        {/* --- FORGOT PASSWORD FIELDS --- */}
        {currState === "Forgot Password" && !otpSent && (
            <>
                <p className='text-xs text-gray-300 -mt-2'>
                    Enter your registered email address to receive a 6-digit verification code.
                </p>
                <input 
                    onChange={(e)=> setEmail(e.target.value)} 
                    value={email}
                    type="email" 
                    placeholder='Email Address' 
                    required 
                    className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' 
                />
            </>
        )}

        {currState === "Forgot Password" && otpSent && (
            <>
                <p className='text-xs text-gray-300 -mt-2'>
                    Enter the code sent to <span className='text-violet-400 font-semibold'>{email}</span> and your new password.
                </p>
                <input 
                    onChange={(e)=> setOtp(e.target.value)} 
                    value={otp}
                    type="text" 
                    placeholder='6-Digit OTP' 
                    maxLength={6}
                    required 
                    className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest text-center text-lg' 
                />
                <input 
                    onChange={(e)=> setNewPassword(e.target.value)} 
                    value={newPassword}
                    type="password" 
                    placeholder='New Password (min 6 characters)' 
                    required 
                    className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' 
                />
                <p className='text-xs text-gray-400 text-center'>
                    Didn't get the code?{" "}
                    <span onClick={handleSendOtp} className='text-violet-400 hover:underline cursor-pointer font-medium'>
                        Resend OTP
                    </span>
                </p>
            </>
        )}

        <button 
            type='submit' 
            disabled={isLoading}
            className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed font-medium'
        >
            {isLoading ? "Please wait..." : (
                currState === "Sign up" 
                    ? "Create Account" 
                    : currState === "Login" 
                        ? "Login Now" 
                        : !otpSent ? "Send OTP" : "Reset Password"
            )}
        </button>

        {currState === "Sign up" && (
            <div className='flex items-center gap-2 text-sm text-gray-500'>
                <input type="checkbox" required />
                <p>Agree to the terms of use & privacy policy.</p>
            </div>
        )}

        <div className='flex flex-col gap-2'>
            {currState === "Forgot Password" ? (
                <p className='text-sm text-gray-400'>Remember your password? <span onClick={()=>{setCurrState("Login"); setOtpSent(false)}} className='font-medium text-violet-500 cursor-pointer'>Login here</span></p>
            ) : currState === "Sign up" ? (
                <p className='text-sm text-gray-400'>Already have an account? <span onClick={()=>{setCurrState("Login"); setIsDataSubmitted(false)}} className='font-medium text-violet-500 cursor-pointer'>Login here</span></p>
            ) : (
                <p className='text-sm text-gray-400'>Create an account <span onClick={()=> {setCurrState("Sign up"); setIsDataSubmitted(false)}} className='font-medium text-violet-500 cursor-pointer'>Click here</span></p>
            )}
        </div>
        
      </form>
    </div>
  )
}

export default LoginPage
