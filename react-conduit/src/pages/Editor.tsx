import { useState, useEffect } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { getArticle, createArticle, updateArticle } from '../services/articles';
import { ListErrors } from '../components/ListErrors';
import type { Errors } from '../types';

export default function Editor() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit mode: load article and verify ownership
  useEffect(() => {
    if (!slug) return;
    getArticle(slug)
      .then(({ data }) => {
        const article = data.article;
        if (currentUser !== null && currentUser.username !== article.author.username) {
          navigate('/');
          return;
        }
        setTitle(article.title);
        setDescription(article.description);
        setBody(article.body);
        setTagList(article.tagList);
      })
      .catch(() => navigate('/'));
    // currentUser is intentionally captured once at mount — RequireAuth
    // guarantees auth has already settled before this component renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const addTagFromInput = () => {
    const tag = tagInput.trim();
    if (tag && !tagList.includes(tag)) {
      setTagList(list => [...list, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTagList(list => list.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // prevent form submission on Enter in tag field
      addTagFromInput();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    // Flush any uncommitted tag input before submit (matches Angular's addTag() call)
    const finalTags = [...tagList];
    const pending = tagInput.trim();
    if (pending && !finalTags.includes(pending)) finalTags.push(pending);
    setTagInput('');

    const articleData = { title, description, body, tagList: finalTags };

    try {
      let returnedSlug: string;
      if (slug) {
        const { data } = await updateArticle({ ...articleData, slug });
        returnedSlug = data.article.slug;
      } else {
        const { data } = await createArticle(articleData);
        returnedSlug = data.article.slug;
      }
      navigate(`/article/${returnedSlug}`);
    } catch (err) {
      setErrors(err as Errors);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ListErrors errors={errors} />

            <form onSubmit={handleSubmit}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Article Title"
                    name="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="What's this article about?"
                    name="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    name="body"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter tags"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  <div className="tag-list">
                    {tagList.map(tag => (
                      <span key={tag} className="tag-default tag-pill">
                        <i className="ion-close-round" onClick={() => removeTag(tag)} />
                        {' '}{tag}
                      </span>
                    ))}
                  </div>
                </fieldset>
                <button className="btn btn-lg pull-xs-right btn-primary" type="submit">
                  Publish Article
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
