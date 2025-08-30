const queueTypeMap: Record<number, string> = {
  420: "Ranked Solo",
  440: "Ranked Flex",
  450: "ARAM",
  400: "Normal Draft",
  430: "Normal Blind",
};

export function getQueueTypeName(queueId: number): string {
  return queueTypeMap[queueId] || "Custom Game";
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const secondsPast = (now - timestamp) / 1000;

  if (secondsPast < 60) return `${Math.round(secondsPast)}s ago`;
  const minutesPast = secondsPast / 60;
  if (minutesPast < 60) return `${Math.round(minutesPast)}m ago`;
  const hoursPast = minutesPast / 60;
  if (hoursPast < 24) return `${Math.round(hoursPast)}h ago`;
  const daysPast = hoursPast / 24;
  return `${Math.round(daysPast)} days ago`;
}