import React, { useState } from 'react';
import type { PlayerDetails, MatchResult } from '../hooks/types';
import { calculateMatchScore } from '../services/matchmaking';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PlayerCard } from '../components/PlayerCard';
import { Logo, Clip } from '../assets/index'
import { Link } from 'react-router-dom';

export const DuoFinderPage: React.FC = () => {
    const [playerA, setPlayerA] = useState({ riotId: '', tag: 'BR1', region: 'BR1' });
    const [playerB, setPlayerB] = useState({ riotId: '', tag: 'BR1', region: 'BR1' });

    const [playerAData, setPlayerAData] = useState<PlayerDetails | null>(null);
    const [playerBData, setPlayerBData] = useState<PlayerDetails | null>(null);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const fetchPlayerData = async (riotId: string, tag: string, region: string): Promise<PlayerDetails> => {
        const safeRiotId = encodeURIComponent(riotId);
        const safeTag = encodeURIComponent(tag);
        const response = await fetch(`/api/player-details/${region}?game_name=${safeRiotId}&tag_line=${safeTag}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro ao buscar ${riotId}#${tag}: ${errorData.detail}`);
        }
        return response.json();
    };

    const handleCompare = async () => {
        setIsLoading(true);
        setError(null);
        setPlayerAData(null);
        setPlayerBData(null);
        setMatchResult(null);

        try {
            const [dataA, dataB] = await Promise.all([
                fetchPlayerData(playerA.riotId, playerA.tag, playerA.region),
                fetchPlayerData(playerB.riotId, playerB.tag, playerB.region),
            ]);

            setPlayerAData(dataA);
            setPlayerBData(dataB);

            const result = calculateMatchScore(dataA, dataB);
            setMatchResult(result);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const scoreColor = matchResult ?
        matchResult.score >= 85 ? 'text-green-400' :
            matchResult.score >= 65 ? 'text-yellow-400' :
                matchResult.score >= 40 ? 'text-orange-400' : 'text-red-500'
        : '';

    return (
        <div className="relative min-h-screen text-white p-8 md:p-8">
            <video
                className="absolute top-0 left-0 w-full h-full object-cover -z-10"
                src={Clip}
                autoPlay
                loop
                muted
            />
            <div className="absolute top-0 left-0 w-full h-full bg-[var(--color-background)]/96 backdrop-blur-md -z-10"></div>
            <div className="relative z-10 max-w-7xl mx-auto">
            <header className="text-center mb-8 md:mb-12">
                <div className='flex justify-center items-center gap-2'>
                    <img src={Logo} alt="" className='w-10 md:w-12' />
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-[var(--color-accent-rakan)] to-[var(--color-accent-xayah)] bg-clip-text text-transparent">RiftMate</h1>
                </div>
                <p className="text-[var(--color-text-base)] mt-2 text-sm md:text-base">Encontre seu duo ideal analisando a sinergia</p>
            </header>

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 mb-8">
                <div className="bg-[var(--color-card)] p-4 rounded-lg w-full max-w-sm">
                    <h2 className="text-xl font-bold text-center mb-2 text-[var(--color-text-base)]">Jogador 1</h2>
                    <input type="text" placeholder="Riot ID" className="bg-gray-700 p-2 rounded w-full mb-2" onChange={e => setPlayerA({ ...playerA, riotId: e.target.value })} />
                    <input type="text" placeholder="Tag (ex: BR1)" className="bg-gray-700 p-2 rounded w-full" onChange={e => setPlayerA({ ...playerA, tag: e.target.value })} />
                </div>
                <div className="bg-[var(--color-card)] p-4 rounded-lg w-full max-w-sm">
                    <h2 className="text-xl font-bold text-center mb-2 text-[var(--color-text-base)]">Jogador 2</h2>
                    <input type="text" placeholder="Riot ID" className="bg-gray-700 p-2 rounded w-full mb-2" onChange={e => setPlayerB({ ...playerB, riotId: e.target.value })} />
                    <input type="text" placeholder="Tag (ex: BR1)" className="bg-gray-700 p-2 rounded w-full" onChange={e => setPlayerB({ ...playerB, tag: e.target.value })} />
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={handleCompare}
                    disabled={isLoading}
                    className="bg-[var(--color-accent-rakan)] hover:bg-yellow-600 text-gray-900 font-bold py-3 px-8 rounded-lg text-xl disabled:bg-gray-600 transition-colors duration-300 ease-in-out cursor-pointer"
                >
                    {isLoading ? 'Analisando...' : 'Analisar Duo'}
                </button>
            </div>

            {error && <p className="text-center text-red-500 mt-8">{error}</p>}

            {isLoading && <LoadingSpinner message="Analisando sinergia dos jogadores..." />}

            {playerAData && playerBData && matchResult && (
                <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 animate-fade-in">
                    <div className="flex flex-col items-center gap-2">
                        <PlayerCard player={playerAData} />
                        <Link to={`/profile/${playerA.region}/${playerA.riotId}/${playerA.tag}`}
                            className="bg-[var(--color-accent-xayah)] hover:bg-pink-700 text-white font-bold py-2 px-4 rounded transition-colors">
                            Ver Mais
                        </Link>
                    </div>

                    <div className="text-center my-6 md:my-0 md:order-none order-first">
                        <h3 className={`text-5xl md:text-6xl font-bold ${scoreColor}`}>{matchResult.score}%</h3>
                        <h4 className={`text-2xl font-semibold mt-2 ${scoreColor}`}>{matchResult.title}</h4>
                        <p className="text-gray-300 max-w-xs mx-auto mt-4">{matchResult.summary}</p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <PlayerCard player={playerBData} />
                        <Link to={`/profile/${playerB.region}/${playerB.riotId}/${playerB.tag}`}
                            className="bg-[var(--color-accent-xayah)] hover:bg-pink-700 text-white font-bold py-2 px-4 rounded transition-colors">
                            Ver Mais
                        </Link>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};