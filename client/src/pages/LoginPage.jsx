import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const LoginPage = () => {
    const [currState, setCurrState] = useState("Sign up")
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [bio, setBio] = useState("")
    const [isDataSubmitted, setIsDataSubmitted] = useState(false)

    // Forgot password states
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [otpSent, setOtpSent] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const { login, axios } = useContext(AuthContext)
    const { theme, toggleTheme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

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

    const onSubmitHandler = (event) => {
        event.preventDefault();

        if (currState === "Forgot Password") {
            if (!otpSent) {
                handleSendOtp();
            } else {
                handleResetPassword();
            }
            return;
        }

        if (currState === 'Sign up' && !isDataSubmitted) {
            setIsDataSubmitted(true);
            return;
        }

        login(currState === "Sign up" ? 'signup' : 'login', { fullName, email, password, bio });
    };

    return (
        <div className={`min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1412] text-gray-100' : 'bg-[#e4eae6] text-gray-900'
        }`}>
            {/* Top Bar with Logo & Theme Toggle */}
            <div className="w-full max-w-5xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <span className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        reachat
                    </span>
                </div>

                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-xl border transition-colors flex items-center gap-2 text-xs font-medium ${
                        isDark 
                            ? 'bg-[#151c19] border-emerald-950/80 text-emerald-400 hover:bg-white/5' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                    }`}
                    title="Toggle Theme"
                >
                    {isDark ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                            </svg>
                            <span>Light</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            </svg>
                            <span>Dark</span>
                        </>
                    )}
                </button>
            </div>

            {/* Main Center Area */}
            <div className="w-full max-w-5xl mx-auto flex items-center justify-center gap-12 lg:gap-20 my-auto py-8 max-md:flex-col">
                {/* Left side: reachat Brand & Tagline */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-md">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                        Good conversations<br />
                        <span className="text-emerald-600 dark:text-emerald-400">start here.</span>
                    </h1>

                    <p className={`mt-3 text-sm leading-relaxed max-w-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Connect privately with your friends, groups, audio calls, and voice messages in a clean, modern space.
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>End-to-end encrypted messaging</span>
                    </div>
                </div>

                {/* Right side: Login / Signup Form Card */}
                <form
                    onSubmit={onSubmitHandler}
                    className={`w-full max-w-[390px] p-7 rounded-3xl border shadow-xl flex flex-col gap-4.5 transition-colors duration-300 ${
                        isDark
                            ? 'bg-[#151c19] border-emerald-950/70 shadow-black/40 text-gray-100'
                            : 'bg-white border-emerald-100/90 shadow-emerald-950/5 text-gray-900'
                    }`}
                >
                    <div className="flex justify-between items-center mb-1">
                        <div>
                            <h2 className="font-bold text-xl tracking-tight">
                                {currState === "Forgot Password" ? "Reset Password" : currState === "Sign up" ? "Create Account" : "Welcome Back"}
                            </h2>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {currState === "Forgot Password" 
                                    ? "Recover access to your reachat account" 
                                    : currState === "Sign up" 
                                        ? "Sign up to start chatting on reachat" 
                                        : "Enter your credentials to continue"}
                            </p>
                        </div>

                        {((currState === "Sign up" && isDataSubmitted) || (currState === "Forgot Password")) && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (currState === "Forgot Password") {
                                        if (otpSent) setOtpSent(false);
                                        else setCurrState("Login");
                                    } else {
                                        setIsDataSubmitted(false);
                                    }
                                }}
                                className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* --- SIGN UP & LOGIN FIELDS --- */}
                    {currState === "Sign up" && !isDataSubmitted && (
                        <div className="flex flex-col gap-1">
                            <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                            <input
                                onChange={(e) => setFullName(e.target.value)}
                                value={fullName}
                                type="text"
                                placeholder="e.g. Alison Martin"
                                required
                                className={`p-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                                    isDark
                                        ? 'bg-[#1b2320] border-emerald-950 text-white placeholder-gray-500 focus:border-emerald-500'
                                        : 'bg-[#f4f7f5] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600'
                                }`}
                            />
                        </div>
                    )}

                    {currState !== "Forgot Password" && !isDataSubmitted && (
                        <>
                            <div className="flex flex-col gap-1">
                                <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                                <input
                                    onChange={(e) => setEmail(e.target.value)}
                                    value={email}
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    className={`p-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                                        isDark
                                            ? 'bg-[#1b2320] border-emerald-950 text-white placeholder-gray-500 focus:border-emerald-500'
                                            : 'bg-[#f4f7f5] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600'
                                    }`}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                                <div className="relative">
                                    <input
                                        onChange={(e) => setPassword(e.target.value)}
                                        value={password}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter password"
                                        required
                                        className={`w-full p-2.5 pr-10 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                                            isDark
                                                ? 'bg-[#1b2320] border-emerald-950 text-white placeholder-gray-500 focus:border-emerald-500'
                                                : 'bg-[#f4f7f5] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-7 0-10-7-10-7a21.12 21.12 0 0 1 1.86-2.86" /><path d="M2 2l20 20" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Forgot password link */}
                    {currState === "Login" && (
                        <div className="flex justify-end -mt-1">
                            <span
                                onClick={() => { setCurrState("Forgot Password"); setOtpSent(false); }}
                                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium"
                            >
                                Forgot password?
                            </span>
                        </div>
                    )}

                    {currState === "Sign up" && isDataSubmitted && (
                        <div className="flex flex-col gap-1">
                            <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>About You (Bio)</label>
                            <textarea
                                onChange={(e) => setBio(e.target.value)}
                                value={bio}
                                rows={3}
                                className={`p-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                                    isDark
                                        ? 'bg-[#1b2320] border-emerald-950 text-white placeholder-gray-500 focus:border-emerald-500'
                                        : 'bg-[#f4f7f5] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600'
                                }`}
                                placeholder="Hi everyone, I am using reachat..."
                                required
                            />
                        </div>
                    )}

                    {/* --- FORGOT PASSWORD FIELDS --- */}
                    {currState === "Forgot Password" && !otpSent && (
                        <div className="flex flex-col gap-2">
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Enter your registered email to receive a 6-digit OTP verification code.
                            </p>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email"
                                placeholder="Registered Email Address"
                                required
                                className={`p-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                                    isDark
                                        ? 'bg-[#1b2320] border-emerald-950 text-white placeholder-gray-500 focus:border-emerald-500'
                                        : 'bg-[#f4f7f5] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600'
                                }`}
                            />
                        </div>
                    )}

                    {currState === "Forgot Password" && otpSent && (
                        <div className="flex flex-col gap-3">
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Enter the 6-digit code sent to <span className="font-semibold text-emerald-600 dark:text-emerald-400">{email}</span>
                            </p>
                            <input
                                onChange={(e) => setOtp(e.target.value)}
                                value={otp}
                                type="text"
                                placeholder="6-Digit OTP"
                                maxLength={6}
                                required
                                className={`p-2.5 rounded-xl border text-center text-lg tracking-widest font-bold outline-none transition-colors ${
                                    isDark
                                        ? 'bg-[#1b2320] border-emerald-950 text-white placeholder-gray-500 focus:border-emerald-500'
                                        : 'bg-[#f4f7f5] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600'
                                }`}
                            />
                            <input
                                onChange={(e) => setNewPassword(e.target.value)}
                                value={newPassword}
                                type="password"
                                placeholder="New Password (min 6 chars)"
                                required
                                className={`p-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                                    isDark
                                        ? 'bg-[#1b2320] border-emerald-950 text-white placeholder-gray-500 focus:border-emerald-500'
                                        : 'bg-[#f4f7f5] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600'
                                }`}
                            />
                            <p className="text-xs text-center text-gray-400">
                                Didn't get the code?{" "}
                                <span onClick={handleSendOtp} className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium">
                                    Resend OTP
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="py-3 mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                    >
                        {isLoading ? "Please wait..." : (
                            currState === "Sign up"
                                ? isDataSubmitted ? "Complete Signup" : "Next"
                                : currState === "Login"
                                    ? "Sign In"
                                    : !otpSent ? "Send OTP" : "Reset Password"
                        )}
                    </button>

                    {/* Switcher links */}
                    <div className="text-center pt-2 border-t border-gray-100 dark:border-emerald-950/60">
                        {currState === "Forgot Password" ? (
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Remember password?{" "}
                                <span onClick={() => { setCurrState("Login"); setOtpSent(false); }} className="font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">
                                    Sign In here
                                </span>
                            </p>
                        ) : currState === "Sign up" ? (
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Already have an account?{" "}
                                <span onClick={() => { setCurrState("Login"); setIsDataSubmitted(false); }} className="font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">
                                    Sign In
                                </span>
                            </p>
                        ) : (
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Don't have an account?{" "}
                                <span onClick={() => { setCurrState("Sign up"); setIsDataSubmitted(false); }} className="font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">
                                    Create one
                                </span>
                            </p>
                        )}
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className={`w-full max-w-5xl mx-auto flex justify-between items-center text-[11px] pt-4 border-t ${
                isDark ? 'border-emerald-950/60 text-gray-500' : 'border-gray-200 text-gray-500'
            }`}>
                <span>reachat • Private & personal</span>
                <span>Protected with End-to-End Encryption</span>
            </div>
        </div>
    );
};

export default LoginPage;
