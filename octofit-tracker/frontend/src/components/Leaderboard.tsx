import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type State = { status: 'loading' } | { status: 'error' } | { status: 'success'; leaderboard: Entry[] };

export default function Leaderboard() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (active) setState({ status: 'success', leaderboard });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Placar" description="Compare a pontuação total das equipes.">
      {state.status === 'loading' && <p role="status">Carregando placar...</p>}
      {state.status === 'error' && <p role="alert">Não foi possível carregar o placar. Tente novamente.</p>}
      {state.status === 'success' && state.leaderboard.length === 0 && <p role="status">Sem classificação disponível.</p>}
      {state.status === 'success' && state.leaderboard.length > 0 && (
        <div className="table-responsive">
          <table className="table">
            <caption className="visually-hidden">Classificação das equipes</caption>
            <thead>
              <tr><th scope="col">Posição</th><th scope="col">Equipe</th><th scope="col">Pontos</th></tr>
            </thead>
            <tbody>
              {state.leaderboard.map((entry, index) => (
                <tr key={`${entry.teamName}-${index}`}>
                  <td>{entry.rank}º lugar</td>
                  <th scope="row">{entry.teamName}</th>
                  <td>{entry.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CapabilityCard>
  );
}
