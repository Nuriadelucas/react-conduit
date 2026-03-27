import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { defaultImage } from '../lib/defaultImage';

interface Props {
  article: Article;
  children?: ReactNode;
}

export function ArticleMeta({ article, children }: Props) {
  const { author, createdAt } = article;
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="article-meta">
      <Link to={`/profile/${author.username}`}>
        <img src={defaultImage(author.image)} alt={author.username} />
      </Link>
      <div className="info">
        <Link className="author" to={`/profile/${author.username}`}>
          {author.username}
        </Link>
        <span className="date">{date}</span>
      </div>
      {children}
    </div>
  );
}
