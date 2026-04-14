
export type CrowdLevel = 'Low' | 'Moderate' | 'High' | 'Peak';

export interface Guardhouse {
  id: string;
  name: string;
  location: string;
  currentCrowd: number;
  capacity: number;
  lastUpdated: string;
}

export interface HistoricalEntry {
  guardhouseId: string;
  timestamp: string;
  crowdCount: number;
}

export const GUARDHOUSES: Guardhouse[] = [
  {
    id: 'gh-aftc',
    name: 'AFTC Guardhouse',
    location: 'Main Gate',
    currentCrowd: 15,
    capacity: 100,
    lastUpdated: new Date().toISOString(),
  },
];

export const HISTORICAL_DATA: HistoricalEntry[] = [
  // Morning Peak (around 7am)
  { guardhouseId: 'gh-aftc', timestamp: '2023-10-27T06:00:00Z', crowdCount: 10 },
  { guardhouseId: 'gh-aftc', timestamp: '2023-10-27T07:00:00Z', crowdCount: 85 },
  { guardhouseId: 'gh-aftc', timestamp: '2023-10-27T08:00:00Z', crowdCount: 40 },
  // Evening Peak (around 5pm-5:30pm)
  { guardhouseId: 'gh-aftc', timestamp: '2023-10-27T16:00:00Z', crowdCount: 20 },
  { guardhouseId: 'gh-aftc', timestamp: '2023-10-27T17:00:00Z', crowdCount: 95 },
  { guardhouseId: 'gh-aftc', timestamp: '2023-10-27T17:30:00Z', crowdCount: 88 },
  { guardhouseId: 'gh-aftc', timestamp: '2023-10-27T18:30:00Z', crowdCount: 30 },
];

export function getCrowdLevel(count: number, capacity: number): CrowdLevel {
  const percentage = (count / capacity) * 100;
  if (percentage < 30) return 'Low';
  if (percentage < 60) return 'Moderate';
  if (percentage < 85) return 'High';
  return 'Peak';
}

export function getLevelColor(level: CrowdLevel): string {
  switch (level) {
    case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Peak': return 'bg-rose-100 text-rose-700 border-rose-200';
  }
}
