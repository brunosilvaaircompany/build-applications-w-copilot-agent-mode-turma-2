import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };
type State = { status: 'loading' } | { status: 'error' } | { status: 'success'; activities: Activity[] };
const activityTypeLabels: Record<string, string> = { run: 'Corrida', cycle: 'Ciclismo', strength: 'Força' };

function activityTypeLabel(type: string) {
  return activityTypeLabels[type] ?? 'Atividade';
}

export default function Activities() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities }) => {
        if (active) setState({ status: 'success', activities });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Atividades" description="Acompanhe os minutos de atividade e os pontos das pessoas participantes.">
      {state.status === 'loading' && <p role="status">Carregando atividades...</p>}
      {state.status === 'error' && <p role="alert">Não foi possível carregar as atividades. Tente novamente.</p>}
      {state.status === 'success' && state.activities.length === 0 && <p role="status">Nenhuma atividade encontrada.</p>}
      {state.status === 'success' && state.activities.length > 0 && (
        <ul className="list-group list-group-flush">
          {state.activities.map((activity, index) => (
            <li className="list-group-item" key={`${activity.type}-${activity.minutes}-${index}`}>
              <strong>{activityTypeLabel(activity.type)}</strong>
              <span className="d-block">{activity.minutes} minutos · {activity.points} pontos</span>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
