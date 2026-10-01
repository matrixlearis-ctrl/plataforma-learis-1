import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';

interface ProfileRedirectProps {
  user: User | null;
}

const ProfileRedirect: React.FC<ProfileRedirectProps> = ({ user }) => {
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={`/social/${user.id}`} replace />;
};

export default ProfileRedirect;