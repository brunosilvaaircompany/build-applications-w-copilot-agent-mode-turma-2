import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };
type State = { status: 'loading' } | { status: 'error' } | { status: 'success'; teams: Team[] };

export default function Teams() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams }) => {
        if (active) setState({ status: 'success', teams });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Equipes" description="Consulte equipes e integrantes.">
      {state.status === 'loading' && <p role="status">Carregando equipes...</p>}
      {state.status === 'error' && <p role="alert">Não foi possível carregar as equipes. Tente novamente.</p>}
      {state.status === 'success' && state.teams.length === 0 && <p role="status">Nenhuma equipe encontrada.</p>}
      {state.status === 'success' && state.teams.length > 0 && (
        <ul className="list-group list-group-flush">
          {state.teams.map((team, index) => (
            <li className="list-group-item" key={`${team.name}-${index}`}>
              <strong>{team.name}</strong>
              <span className="d-block">{team.members.length} {team.members.length === 1 ? 'integrante' : 'integrantes'}</span>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
