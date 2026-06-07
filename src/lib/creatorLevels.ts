export type CreatorLevel = {
  level: number;
  title: string;
  minApprovedUploads: number;
};

export const creatorLevels: CreatorLevel[] = [
  { level: 1, title: "Starter", minApprovedUploads: 1 },
  { level: 2, title: "Rising Creator", minApprovedUploads: 5 },
  { level: 3, title: "Contributor", minApprovedUploads: 15 },
  { level: 4, title: "Expert Creator", minApprovedUploads: 30 },
  { level: 5, title: "Master Creator", minApprovedUploads: 60 },
  { level: 6, title: "Legend Creator", minApprovedUploads: 100 },
];

export function getCreatorLevel(approvedUploads: number) {
  return [...creatorLevels]
    .reverse()
    .find((level) => approvedUploads >= level.minApprovedUploads) || creatorLevels[0];
}

export function getNextCreatorLevel(approvedUploads: number) {
  return creatorLevels.find(
    (level) => approvedUploads < level.minApprovedUploads
  ) || null;
}

export function getCreatorLevelProgress(approvedUploads: number) {
  const current = getCreatorLevel(approvedUploads);
  const next = getNextCreatorLevel(approvedUploads);

  if (!next) return 100;

  const previousMin = current.minApprovedUploads;
  const needed = next.minApprovedUploads - previousMin;
  const progress = approvedUploads - previousMin;

  return Math.max(0, Math.min(100, Math.round((progress / needed) * 100)));
}