import type { PlayerDetails, MatchResult } from "../hooks/types";

const laneSynergies: Record<string, string> = {
  ADC: "SUPORTE",
  SUPORTE: "ADC",
  MID: "JUNGLE",
  JUNGLE: "MID",
  TOP: "JUNGLE",
};

export function calculateMatchScore(playerA: PlayerDetails, playerB: PlayerDetails): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (playerA.mainLane !== "N/A" && playerB.mainLane !== "N/A") {
    if (playerA.mainLane === playerB.mainLane) {
      score -= 40;
      reasons.push("Conflito de Rota: Ambos querem brilhar no mesmo lugar.");
    } else if (laneSynergies[playerA.mainLane] === playerB.mainLane) {
      score += 60;
      reasons.push("Sinergia de Rota Lendária! Uma dupla pronta para dominar o mapa.");
    } else {
      score += 20; 
      reasons.push("Composição Sólida. As rotas se complementam para um bom controle de jogo.");
    }
  }

  const topChampsA = playerA.championMastery.slice(0, 3).map(c => c.championId);
  const topChampsB = playerB.championMastery.slice(0, 3).map(c => c.championId);

  const commonChamps = topChampsA.filter(id => topChampsB.includes(id));
  
  if (commonChamps.length === 0) {
    score += 40;
    reasons.push("Champion Pool Impecável! Vocês se completam sem roubar os picks um do outro.");
  } else if (commonChamps.length === 1) {
    score += 15;
    reasons.push("Flexibilidade Tática. Compartilham um campeão, mas têm muitas outras opções para surpreender.");
  } else {
    score -= 10;
    reasons.push("Alerta de Disputa! A Seleção de Campeões pode virar uma batalha pelos seus mains.");
  }

  const finalScore = Math.max(0, Math.min(100, score));

  let title = "";
  if (finalScore >= 85) title = "Duo Perfeito! Sinergia Desafiante";
  else if (finalScore >= 65) title = "Grande Potencial! Duo bem Equilibrado";
  else if (finalScore >= 40) title = "Potencial a ser Lapidado";
  else title = "Talvez em outra linha do tempo...";

  return {
    score: finalScore,
    title,
    summary: reasons.join(" "),
  };
}