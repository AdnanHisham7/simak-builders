import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../../services/authService';
import { toast } from 'sonner';

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get('token');
  const hasVerified = useRef(false);

  useEffect(() => {
    const verify = async () => {
      if (token && !hasVerified.current) {
        hasVerified.current = true;
        try {
          await verifyEmail(token);
          toast.success('Email verified successfully!');
          navigate('/login');
        } catch (error) {
          toast.error('Invalid or expired token');
          navigate('/signup');
        }
      }
    };
  
    verify();
  }, [token, navigate]);

  return <div>Verifying email...</div>;
};

export default VerifyEmail;