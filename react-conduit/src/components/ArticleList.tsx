import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article, ArticleListConfig } from '../types';
import { LoadingState } from '../types';
import { queryArticles } from '../services/articles';
import { ArticlePreview } from './ArticlePreview';

interface Props {
  config: ArticleListConfig;
  limit: number;
  currentPage: number;
  isFollowingFeed: boolean;
  onPageChange: (page: number) => void;
}

export function ArticleList({ config, limit, currentPage, isFollowingFeed, onPageChange }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesCount, setArticlesCount] = useState(0);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.NOT_LOADED);

  // Stable string key derived from config values — avoids object identity issues in deps
  const configKey = `${config.type}:${config.filters.tag ?? ''}:${config.filters.author ?? ''}:${config.filters.favorited ?? ''}`;

  useEffect(() => {
    setLoadingState(LoadingState.LOADING);
    setArticles([]);

    queryArticles({
      type: config.type,
      filters: {
        ...config.filters,
        limit,
        offset: limit * (currentPage - 1),
      },
    })
      .then(({ data }) => {
        setArticles(data.articles);
        setArticlesCount(data.articlesCount);
        setLoadingState(LoadingState.LOADED);
      })
      .catch(() => setLoadingState(LoadingState.ERROR));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, currentPage, limit]);

  if (loadingState === LoadingState.LOADING || loadingState === LoadingState.NOT_LOADED) {
    return <div className="article-preview">Loading articles...</div>;
  }

  if (loadingState === LoadingState.ERROR) {
    return <div className="article-preview">Error loading articles.</div>;
  }

  const totalPages = Math.ceil(articlesCount / limit);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      {articles.length === 0 ? (
        <div className="article-preview">
          {isFollowingFeed ? (
            <>
              Your feed is empty. Follow some users to see their articles here, or check out the{' '}
              <Link to="/">Global Feed</Link>!
            </>
          ) : (
            'No articles are here... yet.'
          )}
        </div>
      ) : (
        articles.map(article => <ArticlePreview key={article.slug} article={article} />)
      )}

      {pageNumbers.length > 1 && (
        <nav>
          <ul className="pagination">
            {pageNumbers.map(n => (
              <li key={n} className={`page-item${n === currentPage ? ' active' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(n)}>
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
