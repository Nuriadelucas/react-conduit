import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { followUser, unfollowUser } from '../services/profile';
import type { Profile } from '../types';

interface Props {
  profile: Profile;
  onToggle: (profile: Profile) => void;
}

export function FollowButton({ profile, onToggle }: Props) {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (authState === 'unauthenticated' || authState === 'loading') {
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = profile.following
        ? await unfollowUser(profile.username)
        : await followUser(profile.username);
      onToggle(data.profile);
    } catch {
      // keep current state on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm action-btn ${profile.following ? 'btn-secondary' : 'btn-outline-secondary'}${isSubmitting ? ' disabled' : ''}`}
      onClick={handleClick}
      disabled={isSubmitting}
    >
      <i className="ion-plus-round" />&nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
