import React from 'react';
import type { PlayerDetails } from '../hooks/types';

const DDRAGON_VERSION = "15.17.1";

export const PlayerCard: React.FC<{ player: PlayerDetails }> = ({ player }) => {
  const soloRank = player.league.find(l => l.queueType === 'RANKED_SOLO_5x5');
  const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${player.summoner.profileIconId}.png`;

  return (
    <div className="bg-[var(--color-card)] p-4 rounded-lg shadow-lg w-full max-w-sm text-center">
      <img src={profileIconUrl} className="w-24 h-24 rounded-full mx-auto border-4 border-[var(--color-accent-rakan)]" />
      <h2 className="text-2xl font-bold mt-2">{player.account.gameName} <span className="text-[var(--color-text-base)]">#{player.account.tagLine}</span></h2>
      <p className="text-[var(--color-text-base)]">Nível {player.summoner.summonerLevel}</p>
      
      {soloRank && (
        <p className="font-semibold text-lg capitalize">{soloRank.tier.toLowerCase()} {soloRank.rank}</p>
      )}

      <p className="mt-2">Lane Principal: <span className="font-bold">{player.mainLane}</span></p>

      <div className="mt-4">
        <h3 className="font-bold text-[var(--color-accent-rakan)]">Campeões Principais</h3>
        <div className="flex justify-center gap-2 mt-2">
          {player.championMastery.slice(0, 3).map(champ => (
            <img 
              key={champ.championId}
              src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.championId}.png`}
              className="w-12 h-12 rounded"
              title={`Maestria ${champ.championLevel}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};