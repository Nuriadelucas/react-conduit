import type { Errors } from '../types';

export function ListErrors({ errors }: { errors: Errors | null }) {
  if (!errors) return null;
  const list = Object.keys(errors.errors || {}).flatMap(k => errors.errors[k].map(msg => `${k} ${msg}`));
  return (
    <ul className="error-messages">
      {list.map(e => <li key={e}>{e}</li>)}
    </ul>
  );
}
