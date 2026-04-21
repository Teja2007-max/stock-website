import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, User, Mail, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(username, email, phoneNumber, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: -2,
          filter: 'brightness(0.3) saturate(1.4)'
        }}
      >
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Decorative Glowing Orbs behind the card (Greenish for Register) */}
      <div style={{
        position: 'absolute', top: '50%', right: '25%', transform: 'translate(50%, -50%)',
        width: 400, height: 400, background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(40px)', zIndex: -1, animation: 'pulse 8s infinite alternate'
      }} />
      <div style={{
        position: 'absolute', top: '60%', right: '15%', transform: 'translate(50%, -50%)',
        width: 300, height: 300, background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(40px)', zIndex: -1, animation: 'pulse 6s infinite alternate-reverse'
      }} />

      <div style={{
        width: '100%',
        maxWidth: 1200,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 60,
        zIndex: 1,
      }}>
        
        {/* Left Side: Hero Text */}
        <div className="login-hero-text" style={{ flex: '1 1 400px', padding: '20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 30, marginBottom: 24, backdropFilter: 'blur(10px)'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Join The Future</span>
          </div>

          <h1 style={{
            fontFamily: 'Outfit', fontWeight: 800, fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            lineHeight: 1.1, color: '#ffffff', marginBottom: 24, letterSpacing: '-0.02em'
          }}>
            Level Up Your <br />
            <span style={{
              background: 'linear-gradient(135deg, #4ade80, #3b82f6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(74,222,128,0.3))'
            }}>Portfolio.</span>
          </h1>
          <p style={{
            fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: 480, fontWeight: 400
          }}>
            Create a free account to unlock real-time financial tracking, advanced technical screeners, and AI-powered market alerts.
          </p>
        </div>

        {/* Right Side: The Premium Glass Card */}
        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: 'rgba(10, 15, 25, 0.45)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 0 0 20px rgba(255,255,255,0.02)',
            borderRadius: 24,
            padding: '40px 36px',
            width: '100%',
            maxWidth: 440,
            transform: 'translateZ(0)',
          }}>
            
            {/* Logo area */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))',
                  border: '1px solid rgba(34,197,94,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(34,197,94,0.2), inset 0 0 10px rgba(255,255,255,0.1)'
                }}>
                  <TrendingUp size={24} color="#4ade80" />
                </div>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontFamily: 'Outfit', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Create Account
              </h2>
            </div>

            {error && (
              <div style={{
                marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.1)',
                borderLeft: '3px solid #ef4444', borderRadius: '4px 8px 8px 4px',
                display: 'flex', alignItems: 'center', gap: 10, color: '#fca5a5', fontSize: '0.85rem'
              }}>
                <AlertCircle size={16} color="#ef4444" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {[
                { icon: User, type: 'text', value: username, setter: setUsername, placeholder: 'Username' },
                { icon: Mail, type: 'email', value: email, setter: setEmail, placeholder: 'Email Address' },
                { icon: Phone, type: 'tel', value: phoneNumber, setter: setPhoneNumber, placeholder: 'Phone (+91 98765 43210)' },
                { icon: Lock, type: 'password', value: password, setter: setPassword, placeholder: 'Create Password' },
              ].map(({ icon: Icon, type, value, setter, placeholder }) => (
                <div key={placeholder} style={{ marginBottom: 14 }}>
                  <div style={{ position: 'relative' }}>
                    <Icon size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type={type}
                      required
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      style={{
                        width: '100%', padding: '12px 16px 12px 42px',
                        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12, color: '#fff', fontSize: '0.9rem',
                        outline: 'none', transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.border = '1px solid rgba(34,197,94,0.5)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }}
                      onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(0,0,0,0.2)'; }}
                    />
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', marginTop: 8,
                  background: loading ? '#334155' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                  border: 'none', borderRadius: 12, color: '#fff', fontSize: '0.95rem',
                  fontWeight: 600, fontFamily: 'Outfit', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 10px 25px -5px rgba(34,197,94,0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(34,197,94,0.6)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(34,197,94,0.4)'; }}
              >
                {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> : <>Get Started <ArrowRight size={18} /></>}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 600 }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
