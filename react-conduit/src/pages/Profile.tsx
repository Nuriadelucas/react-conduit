import { useState, useEffect, useMemo } from 'react';
import { NavLink, Link, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { getProfile } from '../services/profile';
import { ArticleList } from '../components/ArticleList';
import { FollowButton } from '../components/FollowButton';
import { ListErrors } from '../components/ListErrors';
import { defaultImage } from '../lib/defaultImage';
import type { Profile, ArticleListConfig, Errors } from '../types';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<Errors | null>(null);
  const [page, setPage] = useState(1);

  const isFavorites = location.pathname.endsWith('/favorites');
  const isUser = profile !== null && currentUser !== null &&
    profile.username === currentUser.username;

  // Reset page when tab or user changes
  useEffect(() => {
    setPage(1);
  }, [username, isFavorites]);

  // Load profile
  useEffect(() => {
    if (!username) return;
    setProfile(null);
    setLoadError(null);
    getProfile(username)
      .then(({ data }) => setProfile(data.profile))
      .catch(err => setLoadError(err as Errors));
  }, [username]);

  const config = useMemo<ArticleListConfig>(() => {
    if (!username) return { type: 'all', filters: {} };
    return isFavorites
      ? { type: 'all', filters: { favorited: username } }
      : { type: 'all', filters: { author: username } };
  }, [username, isFavorites]);

  return (
    <div className="profile-page">
      {loadError && (
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <ListErrors errors={loadError} />
            </div>
          </div>
        </div>
      )}

      {!profile && !loadError && (
        <div className="container">Loading...</div>
      )}

      {profile && (
        <>
          <div className="user-info">
            <div className="container">
              <div className="row">
                <div className="col-xs-12 col-md-10 offset-md-1">
                  <img className="user-img" src={defaultImage(profile.image)} alt={profile.username} />
                  <h4>{profile.username}</h4>
                  <p>{profile.bio ?? ''}</p>
                  {isUser ? (
                    <Link to="/settings" className="btn btn-sm btn-outline-secondary action-btn">
                      <i className="ion-gear-a" /> Edit Profile Settings
                    </Link>
                  ) : (
                    <FollowButton profile={profile} onToggle={p => setProfile(p)} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="container">
            <div className="row">
              <div className="col-xs-12 col-md-10 offset-md-1">
                <div className="articles-toggle">
                  <ul className="nav nav-pills outline-active">
                    <li className="nav-item">
                      <NavLink
                        to={`/profile/${profile.username}`}
                        end
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                      >
                        My Posts
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        to={`/profile/${profile.username}/favorites`}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                      >
                        Favorited Posts
                      </NavLink>
                    </li>
                  </ul>
                </div>

                <ArticleList
                  config={config}
                  limit={10}
                  currentPage={page}
                  isFollowingFeed={false}
                  onPageChange={setPage}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
