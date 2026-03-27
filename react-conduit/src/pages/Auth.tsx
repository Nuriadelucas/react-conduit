import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { ListErrors } from '../components/ListErrors';
import { login, register } from '../services/user';
import type { Errors } from '../types';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const isLogin = location.pathname === '/login';
  const title = isLogin ? 'Sign in' : 'Sign up';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when switching between /login and /register
  useEffect(() => {
    setEmail('');
    setPassword('');
    setUsername('');
    setErrors(null);
  }, [location.pathname]);

  const isValid = !!email && !!password && (isLogin || !!username);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(null);
    try {
      const { data } = isLogin
        ? await login({ email, password })
        : await register({ username, email, password });
      setAuth(data.user);
      navigate('/');
    } catch (err) {
      setErrors(err as Errors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">{title}</h1>
            <p className="text-xs-center">
              {isLogin
                ? <Link to="/register">Need an account?</Link>
                : <Link to="/login">Have an account?</Link>
              }
            </p>

            <ListErrors errors={errors} />

            <form onSubmit={handleSubmit}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  {!isLogin && (
                    <input
                      name="username"
                      type="text"
                      placeholder="Username"
                      className="form-control form-control-lg"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  )}
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="email"
                    type="text"
                    placeholder="Email"
                    className="form-control form-control-lg"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    className="form-control form-control-lg"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </fieldset>
                <button
                  type="submit"
                  className="btn btn-lg btn-primary pull-xs-right"
                  disabled={!isValid}
                >
                  {title}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
