// Sport activity icons mapping
export const SPORT_ICONS: Record<string, string> = {
  // Direct mapping from existing StapuBuzz icons
  'archery': '🏹',
  'badminton': '🏸',
  'basketball': '🏀',
  'boxing': '🥊',
  'chess': '♟️',
  'cricket': '🏏',
  'cycling': '🚴',
  'discus throw': '🥏',
  'fencing': '🤺',
  'football': '⚽',
  'golf': '⛳',
  'gymnastics': '🤸',
  'hammer throw': '🔨',
  'high jump': '🏃',
  'hockey': '🏑',
  'javelin throw': '🗿',
  'judo': '🥋',
  'kabaddi': '🤼',
  'kho-kho': '🏃',
  'long jump': '🏃',
  'ludo': '🎯',
  'marathon': '🏃',
  'martial arts/karate': '🥋',
  'martial arts/ karate': '🥋',
  'pickleball': '🏓',
  'polo': '🐎',
  'running': '🏃',
  'sailing': '⛵',
  'shooting': '🎯',
  'shot put': '🥎',
  'skating': '⛸️',
  'squash': '🎾',
  'surfing': '🏄',
  'swimming': '🏊',
  'table tennis': '🏓',
  'taekwondo': '🥋',
  'tennis': '🎾',
  'throwball': '🏐',
  'triple jump': '🏃',
  'volleyball': '🏐',
  
  // Additional mappings for activities in constants
  'biking': '🚴',
  'camping': '🏕️',
  'canoeing': '🛶',
  'gym': '🏋️',
  'hiking': '🥾',
  'horse riding': '🐎',
  'karting': '🏎️',
  'kayaking': '🛶',
  'paragliding': '🪂',
  'race walking': '🚶',
  'rappelling': '🧗',
  'rock climbing': '🧗',
  'rowing': '🚣',
  'trekking': '🥾',
  'weightlifting': '🏋️',
  'wrestling': '🤼',
  'yoga': '🧘',
  'zip lining': '🎯'
};

/**
 * Get sport icon for a given activity name
 * Returns emoji icon or fallback if not found
 */
export function getSportIcon(activityName: string): string {
  const normalizedName = activityName.toLowerCase().trim();
  return SPORT_ICONS[normalizedName] || '🏃'; // Default fallback icon
}

/**
 * Get primary activity icons for background display
 * Takes user activities and returns up to 2 primary activity icons
 */
export function getPrimaryActivityIcons(activities: any[]): Array<{ icon: string; activityName: string }> {
  if (!activities || activities.length === 0) return [];
  
  // Filter primary activities first
  const primaryActivities = activities.filter(activity => activity.isPrimary);
  
  // If no primary activities marked, use first 1-2 activities
  const activitiesToUse = primaryActivities.length > 0 
    ? primaryActivities.slice(0, 2)
    : activities.slice(0, 2);
  
  return activitiesToUse.map(activity => ({
    icon: getSportIcon(activity.activityName),
    activityName: activity.activityName
  }));
}