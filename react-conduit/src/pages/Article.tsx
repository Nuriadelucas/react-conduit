import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { getArticle, deleteArticle } from '../services/articles';
import { getComments, addComment, deleteComment } from '../services/comments';
import { ArticleMeta } from '../components/ArticleMeta';
import { FavoriteButton } from '../components/FavoriteButton';
import { FollowButton } from '../components/FollowButton';
import { ArticleComment } from '../components/ArticleComment';
import { ListErrors } from '../components/ListErrors';
import { parseMarkdown } from '../lib/markdown';
import { defaultImage } from '../lib/defaultImage';
import type { Article, Comment, Profile, Errors } from '../types';

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, authState } = useAuth();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [parsedBody, setParsedBody] = useState('');
  const [loadError, setLoadError] = useState<Errors | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [commentErrors, setCommentErrors] = useState<Errors | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthenticated = authState === 'authenticated' || authState === 'unavailable';
  const canModify = currentUser !== null && article !== null &&
    currentUser.username === article.author.username;

  // Load article + comments in parallel
  useEffect(() => {
    if (!slug) return;
    Promise.all([getArticle(slug), getComments(slug)])
      .then(([{ data: articleData }, { data: commentsData }]) => {
        setArticle(articleData.article);
        setComments(commentsData.comments);
      })
      .catch(err => setLoadError(err as Errors));
  }, [slug]);

  // Parse markdown whenever the article body changes
  useEffect(() => {
    if (!article?.body) return;
    parseMarkdown(article.body).then(setParsedBody);
  }, [article?.body]);

  const handleToggleFavorite = (favorited: boolean) => {
    setArticle(a => a ? {
      ...a,
      favorited,
      favoritesCount: favorited ? a.favoritesCount + 1 : a.favoritesCount - 1,
    } : a);
  };

  const handleToggleFollow = (profile: Profile) => {
    setArticle(a => a ? { ...a, author: { ...a.author, following: profile.following } } : a);
  };

  const handleDeleteArticle = async () => {
    if (!article) return;
    setIsDeleting(true);
    try {
      await deleteArticle(article.slug);
      navigate('/');
    } catch {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!article || !commentBody.trim()) return;
    setIsSubmittingComment(true);
    setCommentErrors(null);
    try {
      const { data } = await addComment(article.slug, commentBody);
      setComments(cs => [data.comment, ...cs]);
      setCommentBody('');
    } catch (err) {
      setCommentErrors(err as Errors);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!article) return;
    try {
      await deleteComment(article.slug, comment.id);
      setComments(cs => cs.filter(c => c !== comment));
    } catch {
      // ignore
    }
  };

  if (loadError) {
    return (
      <div className="article-page">
        <div className="container">
          <ListErrors errors={loadError} />
        </div>
      </div>
    );
  }

  if (!article) {
    return <div className="article-page"><div className="container">Loading...</div></div>;
  }

  const articleActions = (
    <span>
      {canModify ? (
        <>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article.slug}`}>
            <i className="ion-edit" /> Edit Article
          </Link>
          {' '}
          <button
            className={`btn btn-sm btn-outline-danger${isDeleting ? ' disabled' : ''}`}
            onClick={handleDeleteArticle}
            disabled={isDeleting}
          >
            <i className="ion-trash-a" /> Delete Article
          </button>
        </>
      ) : (
        <>
          <FollowButton profile={article.author} onToggle={handleToggleFollow} />
          {' '}
          <FavoriteButton article={article} onToggle={handleToggleFavorite}>
            {article.favorited ? 'Unfavorite' : 'Favorite'} Article{' '}
            <span className="counter">({article.favoritesCount})</span>
          </FavoriteButton>
        </>
      )}
    </span>
  );

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          <ArticleMeta article={article}>{articleActions}</ArticleMeta>
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <div dangerouslySetInnerHTML={{ __html: parsedBody }} />
            <ul className="tag-list">
              {article.tagList.map(tag => (
                <li key={tag} className="tag-default tag-pill tag-outline">{tag}</li>
              ))}
            </ul>
          </div>
        </div>

        <hr />

        <div className="article-actions">
          <ArticleMeta article={article}>{articleActions}</ArticleMeta>
        </div>

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            {isAuthenticated ? (
              <>
                <ListErrors errors={commentErrors} />
                <form className="card comment-form" onSubmit={handleAddComment}>
                  <fieldset disabled={isSubmittingComment}>
                    <div className="card-block">
                      <textarea
                        className="form-control"
                        placeholder="Write a comment..."
                        rows={3}
                        value={commentBody}
                        onChange={e => setCommentBody(e.target.value)}
                      />
                    </div>
                    <div className="card-footer">
                      <img
                        className="comment-author-img"
                        src={defaultImage(currentUser?.image)}
                        alt={currentUser?.username ?? 'author'}
                      />
                      <button className="btn btn-sm btn-primary" type="submit">
                        Post Comment
                      </button>
                    </div>
                  </fieldset>
                </form>
              </>
            ) : (
              <p>
                <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add
                comments on this article.
              </p>
            )}

            {comments.map(comment => (
              <ArticleComment
                key={comment.id}
                comment={comment}
                onDelete={() => handleDeleteComment(comment)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
