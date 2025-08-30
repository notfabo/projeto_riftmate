export interface AccountData {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerData {
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface LeagueEntry {
  queueType: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR';
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface PlayerDetails {
  account: AccountData;
  summoner: SummonerData;
  league: LeagueEntry[];
  championMastery: ChampionMastery[];
  mainLane: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPORTE" | "N/A";
  mainChampionKey: string | null;
}

export interface MatchResult {
  score: number;
  title: string;
  summary: string;
}

export interface Participant {
  gameName: string;
  tagLine: string;
  championId: number;
  teamId: number;
}

export interface Match {
  matchId: string;
  win: boolean;
  championId: number;
  championName: string;
  gameDuration: number;
  gameEndTimestamp: number;
  queueId: number;
  summoner1Id: number;
  summoner2Id: number;
  kills: number;
  deaths: number;
  assists: number;
  itemUrls: (string | null)[];
  runes: {
    primaryRuneUrl: string | null;
    secondaryStyleUrl: string | null;
  };
  allPlayers: Participant[];
}