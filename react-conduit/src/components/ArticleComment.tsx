import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { defaultImage } from '../lib/defaultImage';
import type { Comment } from '../types';

interface Props {
  comment: Comment;
  onDelete: () => void;
}

export function ArticleComment({ comment, onDelete }: Props) {
  const { currentUser } = useAuth();
  const canModify = currentUser?.username === comment.author.username;

  const date = new Date(comment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{comment.body}</p>
      </div>
      <div className="card-footer">
        <Link className="comment-author" to={`/profile/${comment.author.username}`}>
          <img
            className="comment-author-img"
            src={defaultImage(comment.author.image)}
            alt={comment.author.username}
          />
        </Link>
        &nbsp;
        <Link className="comment-author" to={`/profile/${comment.author.username}`}>
          {comment.author.username}
        </Link>
        <span className="date-posted">{date}</span>
        {canModify && (
          <span className="mod-options">
            <i className="ion-trash-a" onClick={onDelete} />
          </span>
        )}
      </div>
    </div>
  );
}
