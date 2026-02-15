export const QUEST_TEMPLATES = {
  daily: [
    { title: 'Win the morning', description: 'Complete 1 focused task', xpReward: 80, category: 'productivity', difficulty: 'easy' },
    { title: 'Deep work burst', description: 'Do 25 minutes of focus', xpReward: 120, category: 'discipline', difficulty: 'medium' },
    { title: 'Health check', description: 'Drink water and stretch', xpReward: 60, category: 'wellness', difficulty: 'easy' }
  ],
  weekly: [
    { title: 'Weekly conquest', description: 'Complete 10 tasks', xpReward: 500, category: 'productivity', difficulty: 'hard' },
    { title: 'Streak builder', description: 'Maintain a 3-day streak', xpReward: 350, category: 'discipline', difficulty: 'medium' }
  ],
  monthly: [
    { title: 'Monthly mastery', description: 'Complete 60 tasks', xpReward: 2500, category: 'productivity', difficulty: 'legendary' }
  ],
  beginner: [
    { title: 'First mission', description: 'Create your first task', xpReward: 100, category: 'productivity', difficulty: 'easy' },
    { title: 'First focus', description: 'Start a focus session', xpReward: 120, category: 'discipline', difficulty: 'easy' }
  ]
};

export function expiryFor(type) {
  const now = new Date();
  if (type === 'daily') {
    const end = new Date(now);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
    return end.toISOString();
  }
  if (type === 'weekly') return new Date(now.getTime() + 7 * 86400000).toISOString();
  if (type === 'monthly') return new Date(now.getTime() + 30 * 86400000).toISOString();
  return null;
}
