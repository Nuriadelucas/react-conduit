import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { ArticleMeta } from './ArticleMeta';
import { FavoriteButton } from './FavoriteButton';

export function ArticlePreview({ article: initial }: { article: Article }) {
  const [article, setArticle] = useState(initial);

  const handleToggle = (favorited: boolean) => {
    setArticle(a => ({
      ...a,
      favorited,
      favoritesCount: favorited ? a.favoritesCount + 1 : a.favoritesCount - 1,
    }));
  };

  return (
    <div className="article-preview">
      <ArticleMeta article={article}>
        <span className="pull-xs-right">
          <FavoriteButton article={article} onToggle={handleToggle} />
        </span>
      </ArticleMeta>
      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {article.tagList.map(tag => (
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
}
