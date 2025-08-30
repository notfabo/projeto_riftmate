import React from 'react';
import type { Match, Participant } from '../hooks/types';
import { getQueueTypeName, formatTimeAgo } from '../services/utils';

const summonerSpellMap: Record<number, string> = {
  4: 'SummonerFlash',
  14: 'SummonerDot', 
  12: 'SummonerTeleport',
  6: 'SummonerHaste', 
  7: 'SummonerHeal',
  3: 'SummonerExhaust',
  11: 'SummonerSmite',
  1: 'SummonerBoost', 
  21: 'SummonerBarrier',
  32: 'SummonerSnowball'
};

const PlayerList: React.FC<{ players: Participant[] }> = ({ players }) => (
  <ul className="space-y-1 w-32">
    {players.map(p => (
      <li key={p.gameName + p.tagLine} className="flex items-center gap-1 text-xs truncate">
        <img
          src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${p.championId}.png`}
          className="w-4 h-4 rounded"
          alt=""
        />
        <span className="truncate">{p.gameName}</span>
      </li>
    ))}
  </ul>
);

export const MatchHistoryItem: React.FC<{ match: Match }> = ({ match }) => {
  const kda = match.deaths === 0 ? 'Perfect' : ((match.kills + match.assists) / match.deaths).toFixed(2);
  const gameDurationMinutes = Math.floor(match.gameDuration / 60);
  const gameDurationSeconds = match.gameDuration % 60;

  return (
    <li className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg mb-3 ${match.win ? 'bg-blue-900/40' : 'bg-red-900/40'} border-l-4 ${match.win ? 'border-blue-400' : 'border-red-500'}`}>
      
      <div className="flex flex-row justify-between items-center md:flex-col text-sm text-gray-300 md:w-32 md:text-center">
        <p className="font-bold">{getQueueTypeName(match.queueId)}</p>
        <p>{formatTimeAgo(match.gameEndTimestamp)}</p>
        <p className={`font-bold mt-2 ${match.win ? 'text-blue-400' : 'text-red-400'}`}>{match.win ? 'Vitória' : 'Derrota'}</p>
        <p>{gameDurationMinutes}m {gameDurationSeconds}s</p>
      </div>

      <div className={`w-full h-px my-2 md:hidden ${match.win ? 'bg-blue-400/30' : 'bg-red-500/30'}`}></div>


      <div className="flex items-center gap-2 md:gap-5">
        <img
          src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${match.championId}.png`}
          className="w-12 h-12 md:w-16 md:h-16 rounded"
          alt={match.championName}
        />
        <div className="flex gap-1">
            <div className='flex flex-col gap-1'>
                <img src={`https://ddragon.leagueoflegends.com/cdn/14.9.1/img/spell/${summonerSpellMap[match.summoner1Id]}.png`} className="w-6 h-6 md:w-7 md:h-7 rounded" />
                <img src={`https://ddragon.leagueoflegends.com/cdn/14.9.1/img/spell/${summonerSpellMap[match.summoner2Id]}.png`} className="w-6 h-6 md:w-7 md:h-7 rounded" />
            </div>
            <div className='flex flex-col gap-1'>
                {match.runes.primaryRuneUrl && <img src={match.runes.primaryRuneUrl} className="w-7 h-7 bg-black rounded-full" />}
                {match.runes.secondaryStyleUrl && <img src={match.runes.secondaryStyleUrl} className="w-7 h-7" />}
            </div>
        </div>
        <div className="flex flex-col items-center">
            <p className="font-semibold text-base md:text-xl">{match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}</p>
            <p className="text-xs md:text-sm text-gray-300">{kda} KDA</p>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {match.itemUrls.slice(0, 7).map((url, index) => url ?
            <img key={index} src={url} className="w-7 h-7 md:w-8 md:h-8 rounded bg-gray-700" alt={`Item ${index}`} /> :
            <div key={index} className="w-7 h-7 md:w-8 md:h-8 rounded bg-gray-700/50"></div>
          )}
        </div>
      </div>
      
      <div className="hidden md:flex flex-grow justify-end gap-6">
        <PlayerList players={match.allPlayers.slice(0, 5)} />
        <PlayerList players={match.allPlayers.slice(5, 10)} />
      </div>

    </li>
  );
};