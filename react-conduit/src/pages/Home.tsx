import { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { ArticleList } from '../components/ArticleList';
import { getTags } from '../services/tags';
import type { ArticleListConfig } from '../types';

export default function Home() {
  const { tag } = useParams<{ tag?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authState } = useAuth();

  const feed = searchParams.get('feed');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const isAuthenticated = authState === 'authenticated' || authState === 'unavailable';

  // Redirect unauthenticated users away from the following feed
  useEffect(() => {
    if (feed === 'following' && authState === 'unauthenticated') {
      navigate('/login');
    }
  }, [feed, authState, navigate]);

  const config = useMemo<ArticleListConfig>(() => {
    if (tag) return { type: 'all', filters: { tag } };
    if (feed === 'following') return { type: 'feed', filters: {} };
    return { type: 'all', filters: {} };
  }, [tag, feed]);

  const isFollowingFeed = config.type === 'feed';

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  useEffect(() => {
    getTags()
      .then(({ data }) => {
        setTags(data.tags);
        setTagsLoaded(true);
      })
      .catch(() => setTagsLoaded(true));
  }, []);

  const handlePageChange = (newPage: number) => {
    const params: Record<string, string> = {};
    if (feed) params['feed'] = feed;
    if (newPage > 1) params['page'] = String(newPage);
    setSearchParams(params);
  };

  return (
    <div className="home-page">
      {!isAuthenticated && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">
              <img src="/assets/conduit-logo.svg" alt="Conduit" className="banner-logo" />
            </h1>
            <p>
              This is the{' '}
              <a href="https://github.com/gothinkster/realworld">React frontend</a> demo from the{' '}
              <a href="https://github.com/gothinkster/realworld">RealWorld</a> project.
            </p>
          </div>
        </div>
      )}

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {isAuthenticated && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link${isFollowingFeed ? ' active' : ''}`}
                      to="/?feed=following"
                    >
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link
                    className={`nav-link${!isFollowingFeed && !tag ? ' active' : ''}`}
                    to="/"
                  >
                    Global Feed
                  </Link>
                </li>
                {tag && (
                  <li className="nav-item">
                    <span className="nav-link active">
                      <i className="ion-pound" /> {tag}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <ArticleList
              config={config}
              limit={10}
              currentPage={page}
              isFollowingFeed={isFollowingFeed}
              onPageChange={handlePageChange}
            />
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>
              {!tagsLoaded && <div>Loading tags...</div>}
              {tagsLoaded && tags.length === 0 && <div>No tags are here... yet.</div>}
              {tagsLoaded && tags.length > 0 && (
                <div className="tag-list">
                  {tags.map(t => (
                    <Link key={t} className="tag-default tag-pill" to={`/tag/${t}`}>
                      {t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
