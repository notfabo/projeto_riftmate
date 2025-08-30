import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PlayerDetails, Match } from '../hooks/types';
import { MatchHistoryItem } from '../components/MatchHistoryItem';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ProfilePage: React.FC = () => {
  const { region, riotId, tag } = useParams<{ region: string; riotId: string; tag: string }>();

  const [playerData, setPlayerData] = useState<PlayerDetails | null>(null);
  const [matchHistory, setMatchHistory] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const fetchAllData = async () => {
      if (!region || !riotId || !tag) return;
      setIsLoading(true);
      setError(null);
      try {
        const safeRiotId = encodeURIComponent(riotId);
        const safeTag = encodeURIComponent(tag);
        const playerDetailsResponse = await fetch(`/api/player-details/${region}?game_name=${safeRiotId}&tag_line=${safeTag}`);
        if (!playerDetailsResponse.ok) throw new Error('Jogador não encontrado.');
        const detailsData: PlayerDetails = await playerDetailsResponse.json();
        setPlayerData(detailsData);

        const regionRouting = 'americas';
        const matchHistoryResponse = await fetch(`/api/match-history/${regionRouting}/${detailsData.account.puuid}`);
        const historyData: Match[] = await matchHistoryResponse.json();
        setMatchHistory(historyData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [region, riotId, tag]);

  if (isLoading) return <div className="bg-[var(--color-background)] min-h-screen text-[var(--color-text-base)] text-center p-10"><LoadingSpinner message="Carregando perfil do jogador..." /></div>;
  if (error) return <div className="bg-[var(--color-background)] min-h-screen text-[var(--color-text-base)] text-center p-10">Erro: {error}</div>;
  if (!playerData) return <div className="bg-[var(--color-background)] min-h-screen text-[var(--color-text-base)] text-center p-10">Nenhum dado de jogador encontrado.</div>;

  const soloRank = playerData.league.find(l => l.queueType === 'RANKED_SOLO_5x5');
  const mainChampionKey = playerData.mainChampionKey;
  const splashArtUrl = mainChampionKey 
    ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${mainChampionKey}_0.jpg`
    : ''; 

  return (
    <div className="bg-[var(--color-background)] min-h-screen text-[var(--color-text-base)] p-4 md:p-8">
      <Link to="/" className="text-[var(--color-accent-rakan)] hover:text-yellow-600 mb-4 inline-block">&larr; Voltar para a busca</Link>

      <header className="relative bg-[var(--color-card)] rounded-lg mb-8 overflow-hidden shadow-lg">
        {splashArtUrl && (
          <img
            src={splashArtUrl}
            alt="Champion Splash Art"
            className="absolute top-2/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-auto w-full min-w-full min-h-full object-cover opacity-65 blur-sm"
          />
        )}
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6">
          <img
            src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${playerData.summoner.profileIconId}.jpg`}
            className="w-32 h-32 rounded-full border-4 border-yellow-400 flex-shrink-0"
            alt="Profile Icon"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{playerData.account.gameName} <span className="text-gray-300">#{playerData.account.tagLine}</span></h1>
            {soloRank && (
              <h2 className="text-xl md:text-3xl capitalize text-yellow-300 drop-shadow-md">{soloRank.tier.toLowerCase()} {soloRank.rank} - {soloRank.leaguePoints} LP</h2>
            )}
            <p className="drop-shadow-sm">Vitórias: {soloRank?.wins} / Derrotas: {soloRank?.losses}</p>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1 bg-[var(--color-card)] p-6 rounded-lg self-start">
          <h3 className="text-2xl font-bold mb-4 text-[var(--color-accent-rakan)]">Top 5 Maestria</h3>
          <ul className="space-y-4">
            {playerData.championMastery.slice(0, 5).map(champ => (
              <li key={champ.championId} className="flex items-center gap-4">
                <img
                  src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.championId}.png`}
                  className="w-12 h-12 rounded"
                  alt={`Champion Icon ${champ.championId}`}
                />
                <div>
                  <p className="font-bold">Maestria {champ.championLevel}</p>
                  <p className="text-sm text-gray-400">{champ.championPoints.toLocaleString()} pontos</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <section className="lg:col-span-2 bg-[var(--color-card)] p-6 rounded-lg">
          <h3 className="text-2xl font-bold mb-4 text-[var(--color-accent-rakan)]">Histórico de Partidas</h3>
          <ul className="space-y-2">
            {matchHistory.map(match => (
              <MatchHistoryItem key={match.matchId} match={match} />
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};