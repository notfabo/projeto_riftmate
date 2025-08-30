import React from 'react';
import type { PlayerDetails, LeagueEntry } from '../hooks/types';

interface PlayerProfileProps {
  data: PlayerDetails;
}

const DDRAGON_VERSION = "15.17.1";


const RankedInfoCard: React.FC<{ queueData: LeagueEntry; title: string }> = ({ queueData, title }) => {
  const tierLowerCase = queueData.tier.toLowerCase();
  const rankEmblemUrl = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${tierLowerCase}.png`;

  const totalGames = queueData.wins + queueData.losses;
  const winrate = totalGames > 0 ? ((queueData.wins / totalGames) * 100).toFixed(1) : "0.0";

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <div className="flex items-center gap-4 bg-gray-700 p-4 rounded-lg">
        <img 
          src={rankEmblemUrl} 
          alt={queueData.tier}
          className="w-24 h-24" 
        />
        <div>
          <p className="text-xl font-bold capitalize">{tierLowerCase} {queueData.rank}</p>
          <p className="text-gray-300">{queueData.leaguePoints} LP</p>
          <p>
            <span className="text-green-400">{queueData.wins}V</span> / <span className="text-red-400">{queueData.losses}D</span>
          </p>
          <p className="text-sm text-gray-400">Winrate: {winrate}%</p>
        </div>
      </div>
    </div>
  );
};

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ data }) => {
  const { summoner, league, account } = data;

  const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${summoner.profileIconId}.png`;
  
  const soloQueueData = league.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
  const flexQueueData = league.find(entry => entry.queueType === 'RANKED_FLEX_SR');

  return (
    <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in">
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <img src={profileIconUrl} alt="Ícone de Perfil" className="w-28 h-28 rounded-full border-4 border-yellow-400" />
          <span className="absolute bottom-0 right-0 bg-gray-900 px-2 py-1 text-xs font-bold rounded-full border-2 border-yellow-400">{summoner.summonerLevel}</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold">{account.gameName}</h2>
          <p className="text-gray-400 text-lg">#{account.tagLine}</p>
        </div>
      </div>

      <div className="space-y-6">
        {soloQueueData && (
          <RankedInfoCard queueData={soloQueueData} title="Ranqueada Solo/Duo" />
        )}
        
        {flexQueueData && (
          <RankedInfoCard queueData={flexQueueData} title="Ranqueada Flex" />
        )}

        {!soloQueueData && !flexQueueData && (
           <p className="text-gray-400 bg-gray-700 p-4 rounded-lg">Este jogador não possui ranque em nenhuma fila ranqueada.</p>
        )}
      </div>
    </div>
  );
};