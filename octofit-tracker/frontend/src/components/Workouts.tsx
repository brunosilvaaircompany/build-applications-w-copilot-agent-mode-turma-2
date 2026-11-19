import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };
type State = { status: 'loading' } | { status: 'error' } | { status: 'success'; suggestions: Suggestion[] };

export default function Workouts() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then(({ suggestions }) => {
        if (active) setState({ status: 'success', suggestions });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Sugestões de treino" description="Receba recomendações de treino com base nos seus padrões de atividade.">
      {state.status === 'loading' && <p role="status">Carregando sugestões de treino...</p>}
      {state.status === 'error' && <p role="alert">Não foi possível carregar as sugestões de treino. Tente novamente.</p>}
      {state.status === 'success' && state.suggestions.length === 0 && <p role="status">Nenhuma sugestão de treino encontrada.</p>}
      {state.status === 'success' && state.suggestions.length > 0 && (
        <ul className="list-group list-group-flush">
          {state.suggestions.map((suggestion, index) => (
            <li className="list-group-item" key={`${suggestion.title}-${index}`}>
              <strong>{suggestion.title}</strong>
              <span className="d-block">{suggestion.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
