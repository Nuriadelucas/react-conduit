import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { favoriteArticle, unfavoriteArticle } from '../services/articles';
import type { Article } from '../types';

interface Props {
  article: Article;
  onToggle: (favorited: boolean) => void;
  children?: ReactNode;
}

export function FavoriteButton({ article, onToggle, children }: Props) {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (authState === 'unauthenticated' || authState === 'loading') {
      navigate('/register');
      return;
    }
    setIsSubmitting(true);
    try {
      if (article.favorited) {
        await unfavoriteArticle(article.slug);
      } else {
        await favoriteArticle(article.slug);
      }
      onToggle(!article.favorited);
    } catch {
      // keep current state on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm ${article.favorited ? 'btn-primary' : 'btn-outline-primary'}${isSubmitting ? ' disabled' : ''}`}
      onClick={handleClick}
      disabled={isSubmitting}
    >
      <i className="ion-heart" /> {children ?? article.favoritesCount}
    </button>
  );
}
