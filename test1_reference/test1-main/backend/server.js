import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure env vars exist in deploy environments where .env may not be present
process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
process.env.DB_NAME = process.env.DB_NAME || 'levelup_db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || '*';
process.env.PORT = process.env.PORT || '8001';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// MongoDB connection
const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;
let db;

// Connect to MongoDB
const connectDB = async () => {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  console.log('Connected to MongoDB');
};

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGINS === '*' ? true : process.env.CORS_ORIGINS?.split(','),
  credentials: true
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET
});

// Register static file serving for frontend build
const frontendBuildPath = path.join(__dirname, '../frontend/build');
await fastify.register(fastifyStatic, {
  root: frontendBuildPath,
  prefix: '/',
});

// Auth decorator
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ detail: 'Invalid authentication credentials' });
  }
});

// Helper functions
const hashPassword = async (password) => bcrypt.hash(password, 10);
const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);

// Gamification helpers
const calculateXpReward = (difficulty, estimatedMinutes, streakMultiplier = 1.0) => {
  const baseXp = difficulty * 20;
  const timeBonus = estimatedMinutes * 2;
  return Math.floor((baseXp + timeBonus) * streakMultiplier);
};

const calculateLevelFromXp = (totalXp) => {
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  return Math.max(1, Math.min(1000, level));
};

const xpForNextLevel = (currentLevel) => {
  if (currentLevel >= 1000) return 0;
  return currentLevel * currentLevel * 100;
};

const calculateStreak = (lastActive, currentStreak) => {
  const now = new Date();
  const diff = (now - new Date(lastActive)) / 1000;
  
  if (diff < 86400) return [currentStreak, 1.0];
  if (diff < 172800) {
    const newStreak = currentStreak + 1;
    const multiplier = Math.min(1.0 + newStreak * 0.1, 3.0);
    return [newStreak, multiplier];
  }
  return [0, 1.0];
};

const calculateGrade = (scorePercentage) => {
  const score = Math.round(scorePercentage * 10) / 10;
  let grade, xpMultiplier;
  
  if (score >= 95.0) { grade = 'A*'; xpMultiplier = 2.0; }
  else if (score >= 85.0) { grade = 'A'; xpMultiplier = 1.5; }
  else if (score >= 70.0) { grade = 'B'; xpMultiplier = 1.2; }
  else if (score >= 50.0) { grade = 'C'; xpMultiplier = 1.0; }
  else if (score >= 40.0) { grade = 'D'; xpMultiplier = 0.5; }
  else { grade = 'F'; xpMultiplier = 0.0; }
  
  let xpPenalty = 0, extraQuests = 0;
  if (score < 50.0) {
    xpPenalty = Math.floor((50.0 - score) * 10);
    extraQuests = Math.max(1, Math.floor((50.0 - score) / 10));
  }
  
  return { grade, score, xpMultiplier, xpPenalty, extraDailyQuests: extraQuests };
};

const ACHIEVEMENTS = {
  first_task: { title: 'First Steps', description: 'Complete your first task', icon: '🎯', check: (s) => s.tasksCompleted >= 1 },
  speed_demon: { title: 'Speed Demon', description: 'Complete 5 tasks in one day', icon: '⚡', check: (s) => s.tasksToday >= 5 },
  week_warrior: { title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', check: (s) => s.currentStreak >= 7 },
  level_10: { title: 'Rising Star', description: 'Reach level 10', icon: '⭐', check: (s) => s.level >= 10 },
  focus_master: { title: 'Focus Master', description: 'Complete 100 focus sessions', icon: '🧠', check: (s) => s.totalFocusSessions >= 100 },
  discipline_god: { title: 'Discipline God', description: 'Reach 90+ discipline score', icon: '👑', check: (s) => s.disciplineScore >= 90 }
};

const checkAchievements = (userStats) => {
  return Object.entries(ACHIEVEMENTS)
    .filter(([, ach]) => ach.check(userStats))
    .map(([id]) => id);
};

const generateBossChallenge = (userLevel) => {
  const challenges = [
    'Complete 5 high-difficulty tasks',
    'Study for 2 hours without breaks',
    'Complete all tasks in your weakest skill tree',
    'Achieve a perfect focus session (no distractions)',
    'Complete tasks worth 500+ XP today'
  ];
  const difficulty = Math.min(5, Math.max(1, Math.floor(userLevel / 5) + 1));
  const xpReward = difficulty * 100 + userLevel * 10;
  return {
    challengeText: challenges[Math.floor(Math.random() * challenges.length)],
    difficulty,
    xpReward
  };
};

// AI-Powered Quest Generator
const generateAIQuests = async (questType, userContext) => {
  // emergentintegrations is not available in Emergent Deploy for Node.
  // Disable AI calls in Node backend to prevent runtime crashes.
  return null;

  try {
    // const { LlmChat, UserMessage } = await import('emergentintegrations/llm/chat');
    
    const systemPrompt = `You are a gamification expert designing productivity quests. Generate engaging, achievable quests that help users build good habits and earn XP.

Quest Types:
- daily: 3-5 quick daily tasks (30-50 XP each)
- weekly: 3-4 bigger weekly goals (100-300 XP each)
- monthly: 2-3 major monthly achievements (500-1000 XP each)
- micro: 5-10 quick wins (10-25 XP each, 5-15 min tasks)

User Context:
- Level: ${userContext.level}
- Current Streak: ${userContext.streak} days
- Discipline Score: ${userContext.disciplineScore}/100
- Completed Tasks: ${userContext.tasksCompleted}

Return ONLY valid JSON array of quests with this exact format:
[
  {
    "title": "Quest title (action-oriented, clear)",
    "description": "Brief description",
    "xpReward": number,
    "target": number (quantity to complete),
    "type": "tasks|focus|streak|skill|study|habit|challenge",
    "difficulty": "easy|medium|hard",
    "category": "productivity|learning|wellness|discipline"
  }
]

Make quests:
- Specific and measurable
- Varied (mix categories)
- Appropriate for user level
- Motivating and fun
- Progressive (harder as level increases)`;

    const userPrompt = `Generate ${questType === 'daily' ? '5' : questType === 'weekly' ? '4' : questType === 'monthly' ? '3' : '8'} ${questType} quests for a level ${userContext.level} user.`;
    
    const chat = new LlmChat({
      apiKey: process.env.EMERGENT_LLM_KEY,
      sessionId: `quest_gen_${questType}_${Date.now()}`,
      systemMessage: systemPrompt
    }).withModel('openai', 'gpt-5.2');
    
    const response = await chat.sendMessage(new UserMessage({ text: userPrompt }));
    
    // Parse AI response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const quests = JSON.parse(jsonMatch[0]);
      return quests;
    }
    
    return null;
  } catch (error) {
    console.error('AI quest generation failed:', error);
    return null;
  }
};

// Fallback quest templates
const getDailyQuestTemplates = (userLevel) => {
  const baseQuests = [
    { title: 'Complete 3 Study Tasks', description: 'Finish 3 tasks of any difficulty', xpReward: 50, target: 3, type: 'tasks', difficulty: 'easy', category: 'productivity' },
    { title: 'Focus for 30 minutes', description: 'Complete a focused study session', xpReward: 40, target: 30, type: 'focus', difficulty: 'easy', category: 'productivity' },
    { title: 'Maintain your streak', description: 'Keep your daily streak alive', xpReward: 30, target: 1, type: 'streak', difficulty: 'easy', category: 'discipline' },
    { title: 'Level up one skill tree', description: 'Earn XP in any skill tree', xpReward: 60, target: 1, type: 'skill', difficulty: 'medium', category: 'learning' },
    { title: 'Complete AI Study session', description: 'Use AI Coach for learning', xpReward: 50, target: 1, type: 'study', difficulty: 'medium', category: 'learning' },
    { title: 'Pomodoro Master', description: 'Complete 4 Pomodoro cycles', xpReward: 70, target: 4, type: 'focus', difficulty: 'medium', category: 'productivity' },
    { title: 'Early Bird', description: 'Complete a task before 10 AM', xpReward: 40, target: 1, type: 'habit', difficulty: 'easy', category: 'discipline' },
    { title: 'Task Crusher', description: 'Complete 5 tasks in one day', xpReward: 80, target: 5, type: 'tasks', difficulty: 'hard', category: 'productivity' }
  ];
  
  // Scale rewards by user level
  return baseQuests.map(q => ({
    ...q,
    xpReward: Math.floor(q.xpReward * (1 + userLevel * 0.05))
  }));
};

const getWeeklyQuestTemplates = (userLevel) => {
  return [
    { title: 'Weekly Warrior', description: 'Complete 20 tasks this week', xpReward: 200 + userLevel * 10, target: 20, type: 'tasks', difficulty: 'medium', category: 'productivity' },
    { title: '7-Day Streak Master', description: 'Maintain a 7-day streak', xpReward: 300 + userLevel * 15, target: 7, type: 'streak', difficulty: 'hard', category: 'discipline' },
    { title: 'Boss Hunter', description: 'Complete 3 Boss Challenges', xpReward: 250 + userLevel * 12, target: 3, type: 'challenge', difficulty: 'hard', category: 'productivity' },
    { title: 'XP Grinder', description: 'Earn 1000 XP this week', xpReward: 150 + userLevel * 8, target: 1000, type: 'xp', difficulty: 'medium', category: 'productivity' },
    { title: 'Skill Master', description: 'Gain levels in all 4 skill trees', xpReward: 280 + userLevel * 14, target: 4, type: 'skill', difficulty: 'hard', category: 'learning' }
  ];
};

const getMonthlyQuestTemplates = (userLevel) => {
  return [
    { title: 'Monthly Marathon', description: 'Complete 100 tasks this month', xpReward: 800 + userLevel * 40, target: 100, type: 'tasks', difficulty: 'hard', category: 'productivity' },
    { title: 'Unstoppable Force', description: 'Achieve a 30-day streak', xpReward: 1200 + userLevel * 60, target: 30, type: 'streak', difficulty: 'legendary', category: 'discipline' },
    { title: 'Skill Tree Champion', description: 'Reach level 10 in any skill tree', xpReward: 1000 + userLevel * 50, target: 10, type: 'skill', difficulty: 'hard', category: 'learning' },
    { title: 'XP Legend', description: 'Earn 5000 XP this month', xpReward: 900 + userLevel * 45, target: 5000, type: 'xp', difficulty: 'hard', category: 'productivity' }
  ];
};

const getMicroQuestTemplates = (userLevel) => {
  return [
    { title: 'Quick Win', description: 'Complete 1 easy task', xpReward: 15, target: 1, type: 'tasks', difficulty: 'easy', category: 'productivity' },
    { title: '5-Min Focus', description: 'Focus for 5 minutes', xpReward: 10, target: 5, type: 'focus', difficulty: 'easy', category: 'productivity' },
    { title: 'Skill Boost', description: 'Complete any task in Mind tree', xpReward: 20, target: 1, type: 'skill', difficulty: 'easy', category: 'learning' },
    { title: 'Habit Stack', description: 'Complete 2 tasks in a row', xpReward: 25, target: 2, type: 'habit', difficulty: 'easy', category: 'discipline' },
    { title: 'Speed Demon', description: 'Complete a task in under 10 min', xpReward: 20, target: 1, type: 'tasks', difficulty: 'easy', category: 'productivity' },
    { title: 'Morning Ritual', description: 'Complete 1 task before noon', xpReward: 15, target: 1, type: 'habit', difficulty: 'easy', category: 'discipline' },
    { title: 'Knowledge Seeker', description: 'Complete 1 Knowledge tree task', xpReward: 20, target: 1, type: 'skill', difficulty: 'easy', category: 'learning' },
    { title: 'Micro Focus', description: 'Do a 10-minute focus session', xpReward: 18, target: 10, type: 'focus', difficulty: 'easy', category: 'productivity' }
  ];
};

// AI Coach helper
const COACH_MODES = {
  strict: "You are a strict military-style discipline coach. Be tough, direct, and push the user to their limits.",
  strategic: "You are a calm, strategic planner and productivity expert. Analyze the situation logically.",
  analytical: "You are a data-driven performance analyst. Use stats and patterns to provide insights.",
  motivational: "You are an energetic, supportive motivational coach. Inspire and energize the user."
};

const getAIResponse = async (message, mode, userContext = {}) => {
  try {
    // emergentintegrations is not available in Emergent Deploy for Node.
    // Disable AI calls in Node backend to prevent runtime crashes.
    return null;

    // const { LlmChat, UserMessage } = await import('emergentintegrations/llm/chat');
    
    let systemMessage = COACH_MODES[mode] || COACH_MODES.motivational;
    if (userContext.level) {
      systemMessage += `\n\nUser Context: Level ${userContext.level}, Streak: ${userContext.streak || 0} days, Discipline: ${userContext.disciplineScore || 50}/100`;
    }
    
    const chat = new LlmChat({
      apiKey: process.env.EMERGENT_LLM_KEY,
      sessionId: `coach_${mode}`,
      systemMessage
    }).withModel('openai', 'gpt-5.2');
    
    const response = await chat.sendMessage(new UserMessage({ text: message }));
    return response;
  } catch (error) {
    return `Coach response: ${message}. Keep pushing forward!`;
  }
};

const detectBurnoutRisk = (focusSessions, tasks) => {
  if (focusSessions.length < 7) return { riskLevel: 'low', message: 'Not enough data yet' };
  
  const recent = focusSessions.slice(-7);
  const avgDuration = recent.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 7;
  const successRate = recent.filter(s => s.successful).length / 7;
  
  if (avgDuration > 360) return { riskLevel: 'high', message: 'Warning: Overworking detected. Take breaks.' };
  if (successRate < 0.5) return { riskLevel: 'medium', message: 'Focus success rate dropping. Try shorter sessions.' };
  return { riskLevel: 'low', message: "You're doing great!" };
};

const suggestOptimalTime = (focusSessions) => {
  if (focusSessions.length < 10) return 'Try studying in the morning for better focus.';
  
  const hourPerformance = {};
  focusSessions.forEach(s => {
    if (s.startTime && s.successful) {
      const hour = new Date(s.startTime).getHours();
      hourPerformance[hour] = (hourPerformance[hour] || 0) + 1;
    }
  });
  
  if (Object.keys(hourPerformance).length === 0) return 'Complete more sessions for recommendations.';
  
  const bestHour = Object.entries(hourPerformance).sort((a, b) => b[1] - a[1])[0][0];
  if (bestHour < 12) return `Your peak performance is at ${bestHour}:00. Morning power!`;
  if (bestHour < 17) return `You focus best at ${bestHour}:00. Afternoon warrior!`;
  return `You're most productive at ${bestHour}:00. Night owl mode!`;
};

// Helper to get current user
const getCurrentUser = async (request) => {
  const userId = request.user.userId;
  const user = await db.collection('users').findOne({ id: userId }, { projection: { _id: 0 } });
  if (!user) throw { statusCode: 401, message: 'User not found' };
  // Normalize field names (support both camelCase and snake_case from old Python data)
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    level: user.level,
    xp: user.xp,
    totalXp: user.totalXp ?? user.total_xp ?? 0,
    currentStreak: user.currentStreak ?? user.current_streak ?? 0,
    longestStreak: user.longestStreak ?? user.longest_streak ?? 0,
    disciplineScore: user.disciplineScore ?? user.discipline_score ?? 50,
    createdAt: user.createdAt ?? user.created_at,
    lastActive: user.lastActive ?? user.last_active
  };
};

// Helper to get current admin
const getCurrentAdmin = async (request) => {
  const adminId = request.user.adminId;
  const admin = await db.collection('admins').findOne({ id: adminId }, { projection: { _id: 0 } });
  if (!admin) throw { statusCode: 401, message: 'Admin not found' };
  // Normalize field names
  return {
    ...admin,
    isSuperAdmin: admin.isSuperAdmin ?? admin.is_super_admin ?? false,
    hashedPassword: admin.hashedPassword || admin.hashed_password
  };
};

// ==================== ROUTES ====================

// Health check endpoint (required for Kubernetes/ingress)
fastify.get('/health', async () => {
  return { status: 'ok', service: 'backend', timestamp: new Date().toISOString() };
});

fastify.get('/healthz', async () => {
  return { status: 'ok' };
});

// Alias health check under /api for ingress setups that only route /api
fastify.get('/api/healthz', async () => {
  return { status: 'ok' };
});

// Public Stats
fastify.get('/api/public/stats', async () => {
  const totalUsers = await db.collection('users').countDocuments({});
  const totalTasks = await db.collection('tasks').countDocuments({ completed: true });
  const allTasks = await db.collection('tasks').countDocuments({});
  const successRate = allTasks > 0 ? Math.round((totalTasks / allTasks) * 100) : 95;
  return { total_users: totalUsers, completed_tasks: totalTasks, success_rate: successRate };
});

// Auth Routes
fastify.post('/api/auth/signup', async (request, reply) => {
  const { email, username, password } = request.body;
  
  const existing = await db.collection('users').findOne({ email });
  if (existing) return reply.status(400).send({ detail: 'Email already registered' });
  
  const user = {
    id: uuidv4(),
    email,
    username,
    hashedPassword: await hashPassword(password),
    level: 1,
    xp: 0,
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    disciplineScore: 50,
    backgroundTokens: 10, // Free tokens for new users
    country: 'Unknown', // Can be updated by user later
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };
  
  await db.collection('users').insertOne(user);
  
  // Initialize skill trees
  for (const skill of ['Mind', 'Knowledge', 'Discipline', 'Fitness']) {
    await db.collection('skill_trees').insertOne({
      id: uuidv4(),
      userId: user.id,
      skillTree: skill,
      level: 1,
      xp: 0,
      totalXp: 0
    });
  }
  
  const token = fastify.jwt.sign({ userId: user.id });
  const { hashedPassword, ...userResponse } = user;
  return { access_token: token, token_type: 'bearer', user: userResponse };
});

fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  const user = await db.collection('users').findOne({ email });
  if (!user) return reply.status(401).send({ detail: 'Invalid credentials' });
  
  const valid = await verifyPassword(password, user.hashedPassword);
  if (!valid) return reply.status(401).send({ detail: 'Invalid credentials' });
  
  const token = fastify.jwt.sign({ userId: user.id });
  const { hashedPassword, _id, ...userResponse } = user;
  return { access_token: token, token_type: 'bearer', user: userResponse };
});

fastify.get('/api/auth/me', { preHandler: [fastify.authenticate] }, async (request) => {
  return getCurrentUser(request);
});

// Task Routes
fastify.post('/api/tasks', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { title, description, skill_tree, difficulty, estimated_minutes } = request.body;
  
  const xpReward = calculateXpReward(difficulty, estimated_minutes, 1.0 + user.currentStreak * 0.1);
  
  const task = {
    id: uuidv4(),
    userId: user.id,
    title,
    description: description || '',
    skillTree: skill_tree,
    difficulty,
    estimatedMinutes: estimated_minutes,
    xpReward,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  await db.collection('tasks').insertOne(task);
  const { _id, ...taskResponse } = task;
  return { ...taskResponse, skill_tree, estimated_minutes, xp_reward: xpReward };
});

fastify.get('/api/tasks', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const query = { userId: user.id };
  if (request.query.completed !== undefined) {
    query.completed = request.query.completed === 'true';
  }

  const limit = Math.min(parseInt(request.query.limit || '200', 10) || 200, 500);
  const skip = Math.max(parseInt(request.query.skip || '0', 10) || 0, 0);

  const tasks = await db.collection('tasks')
    .find(query, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return tasks.map(t => ({
    ...t,
    skill_tree: t.skillTree,
    estimated_minutes: t.estimatedMinutes,
    xp_reward: t.xpReward,
    user_id: t.userId,
    created_at: t.createdAt,
    completed_at: t.completedAt
  }));
});

fastify.patch('/api/tasks/:taskId/complete', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { taskId } = request.params;
  
  const task = await db.collection('tasks').findOne({ id: taskId, userId: user.id });
  if (!task) return reply.status(404).send({ detail: 'Task not found' });
  if (task.completed) return reply.status(400).send({ detail: 'Task already completed' });
  
  await db.collection('tasks').updateOne(
    { id: taskId },
    { $set: { completed: true, completedAt: new Date().toISOString() } }
  );
  
  const xpGained = task.xpReward;
  const newTotalXp = user.totalXp + xpGained;
  const newLevel = calculateLevelFromXp(newTotalXp);
  const [newStreak] = calculateStreak(user.lastActive, user.currentStreak);
  
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: {
      totalXp: newTotalXp,
      xp: newTotalXp % xpForNextLevel(newLevel),
      level: newLevel,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak),
      lastActive: new Date().toISOString()
    }}
  );
  
  await db.collection('skill_trees').updateOne(
    { userId: user.id, skillTree: task.skillTree },
    { $inc: { xp: xpGained, totalXp: xpGained } }
  );
  
  return { success: true, xp_gained: xpGained, new_level: newLevel, level_up: newLevel > user.level };
});

fastify.delete('/api/tasks/:taskId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const result = await db.collection('tasks').deleteOne({ id: request.params.taskId, userId: user.id });
  if (result.deletedCount === 0) return reply.status(404).send({ detail: 'Task not found' });
  return { success: true };
});

// Skill Trees
fastify.get('/api/skill-trees', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const trees = await db.collection('skill_trees').find({ userId: user.id }, { projection: { _id: 0 } }).toArray();
  return trees.map(t => ({ ...t, skill_tree: t.skillTree, user_id: t.userId, total_xp: t.totalXp }));
});

// Achievements
fastify.get('/api/achievements', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const achievements = await db.collection('achievements').find({ userId: user.id }, { projection: { _id: 0 } }).toArray();
  return achievements.map(a => ({ ...a, user_id: a.userId, achievement_id: a.achievementId, unlocked_at: a.unlockedAt }));
});

fastify.get('/api/achievements/available', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const today = new Date().toISOString().split('T')[0];
  
  const tasksCompleted = await db.collection('tasks').countDocuments({ userId: user.id, completed: true });
  const tasksToday = await db.collection('tasks').countDocuments({
    userId: user.id, completed: true, completedAt: { $regex: today }
  });
  const focusSessions = await db.collection('focus_sessions').countDocuments({ userId: user.id });
  
  const userStats = {
    tasksCompleted,
    tasksToday,
    currentStreak: user.currentStreak,
    level: user.level,
    totalFocusSessions: focusSessions,
    disciplineScore: user.disciplineScore
  };
  
  const unlockedIds = checkAchievements(userStats);
  const existing = await db.collection('achievements').find({ userId: user.id }).toArray();
  const existingIds = existing.map(a => a.achievementId);
  
  const newAchievements = [];
  for (const achId of unlockedIds) {
    if (!existingIds.includes(achId)) {
      const achievement = {
        id: uuidv4(),
        userId: user.id,
        achievementId: achId,
        title: ACHIEVEMENTS[achId].title,
        description: ACHIEVEMENTS[achId].description,
        icon: ACHIEVEMENTS[achId].icon,
        unlockedAt: new Date().toISOString()
      };
      await db.collection('achievements').insertOne(achievement);
      newAchievements.push(achievement);
    }
  }
  
  const allAchievements = Object.entries(ACHIEVEMENTS).map(([id, data]) => ({
    achievement_id: id,
    title: data.title,
    description: data.description,
    icon: data.icon,
    unlocked: unlockedIds.includes(id) || existingIds.includes(id)
  }));
  
  return { achievements: allAchievements, new_unlocks: newAchievements };
});

// Focus Sessions
fastify.post('/api/focus-sessions', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { mode } = request.body;
  
  const session = {
    id: uuidv4(),
    userId: user.id,
    mode: mode || 'normal',
    startTime: new Date().toISOString(),
    successful: false
  };
  
  await db.collection('focus_sessions').insertOne(session);
  const { _id, ...sessionResponse } = session;
  return { ...sessionResponse, user_id: session.userId, start_time: session.startTime };
});

fastify.patch('/api/focus-sessions/:sessionId/end', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { duration_minutes, successful } = request.body;
  
  await db.collection('focus_sessions').updateOne(
    { id: request.params.sessionId, userId: user.id },
    { $set: { endTime: new Date().toISOString(), durationMinutes: duration_minutes, successful } }
  );
  
  return { success: true };
});

fastify.get('/api/focus-sessions', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const sessions = await db.collection('focus_sessions').find({ userId: user.id }, { projection: { _id: 0 } }).sort({ startTime: -1 }).toArray();
  return sessions.map(s => ({ ...s, user_id: s.userId, start_time: s.startTime, end_time: s.endTime, duration_minutes: s.durationMinutes }));
});

// AI Coach
fastify.post('/api/ai-coach/chat', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { message, mode } = request.body;
  
  const today = new Date().toISOString().split('T')[0];
  const tasksToday = await db.collection('tasks').countDocuments({
    userId: user.id, completed: true, completedAt: { $regex: today }
  });
  
  const userContext = {
    level: user.level,
    streak: user.currentStreak,
    disciplineScore: user.disciplineScore,
    tasksToday
  };
  
  const response = await getAIResponse(message, mode, userContext);
  
  await db.collection('chat_history').insertOne({
    userId: user.id,
    mode,
    userMessage: message,
    assistantMessage: response,
    timestamp: new Date().toISOString()
  });
  
  return { response, mode };
});

// Analytics
fastify.get('/api/analytics/dashboard', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);

  const days = Math.min(parseInt(request.query.days || '30', 10) || 30, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const tasks = await db.collection('tasks')
    .find({ userId: user.id, completed: true, completedAt: { $gte: since } }, { projection: { _id: 0 } })
    .sort({ completedAt: -1 })
    .limit(2000)
    .toArray();

  const focusSessions = await db.collection('focus_sessions')
    .find({ userId: user.id, startTime: { $gte: since } }, { projection: { _id: 0 } })
    .sort({ startTime: -1 })
    .limit(2000)
    .toArray();

  const totalTasks = tasks.length;
  const totalFocusTime = focusSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  const burnoutRisk = detectBurnoutRisk(focusSessions, tasks);
  const optimalTime = suggestOptimalTime(focusSessions);

  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayTasks = tasks.filter(t => t.completedAt?.startsWith(dateStr)).length;
    const dayFocus = focusSessions
      .filter(s => s.startTime?.startsWith(dateStr))
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    weeklyData.push({ date: dateStr, tasks: dayTasks, focus_minutes: dayFocus });
  }

  return {
    total_tasks: totalTasks,
    total_focus_time: totalFocusTime,
    current_level: user.level,
    current_xp: user.xp,
    next_level_xp: xpForNextLevel(user.level),
    discipline_score: user.disciplineScore,
    current_streak: user.currentStreak,
    longest_streak: user.longestStreak,
    burnout_risk: { risk_level: burnoutRisk.riskLevel, message: burnoutRisk.message },
    optimal_time: optimalTime,
    weekly_data: weeklyData,
    window_days: days
  };
});

// Boss Challenge
fastify.get('/api/boss-challenge/today', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const today = new Date().toISOString().split('T')[0];
  
  let existing = await db.collection('boss_challenges').findOne({ userId: user.id, date: today }, { projection: { _id: 0 } });
  if (existing) {
    return { ...existing, user_id: existing.userId, challenge_text: existing.challengeText, xp_reward: existing.xpReward };
  }
  
  const bossData = generateBossChallenge(user.level);
  const boss = {
    id: uuidv4(),
    userId: user.id,
    date: today,
    challengeText: bossData.challengeText,
    difficulty: bossData.difficulty,
    xpReward: bossData.xpReward,
    completed: false
  };
  
  await db.collection('boss_challenges').insertOne(boss);
  return { ...boss, user_id: boss.userId, challenge_text: boss.challengeText, xp_reward: boss.xpReward };
});

fastify.get('/api/boss-challenge/:challengeId/generate-exam', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { challengeId } = request.params;
  
  const challenge = await db.collection('boss_challenges').findOne({ id: challengeId, userId: user.id });
  if (!challenge) return { statusCode: 404, message: 'Challenge not found' };
  
  const scaledDifficulty = Math.min(5, Math.max(1, Math.floor(user.level / 200) + 1));
  const questions = `Q1. What is the primary benefit of breaking tasks into micro-wins?
A) Less work overall
B) Instant dopamine rewards that reinforce positive habits
C) Avoiding responsibility
D) Making tasks harder
Correct: B

Q2. How does the streak multiplier work?
A) 5% per day
B) 10% per day up to 3x maximum
C) 20% per day
D) No multiplier exists
Correct: B

Q3. What happens when you score below 50% on a boss exam?
A) Nothing
B) XP penalty and extra daily quests
C) Account deletion
D) Level reset
Correct: B

Q4. Which skill tree focuses on mental agility?
A) Knowledge
B) Discipline
C) Mind
D) Fitness
Correct: C

Q5. What is the maximum level in the system?
A) 100
B) 500
C) 1000
D) Unlimited
Correct: C`;
  
  const exam = {
    id: uuidv4(),
    userId: user.id,
    challengeId,
    questions,
    createdAt: new Date().toISOString(),
    submitted: false
  };
  
  await db.collection('exams').insertOne(exam);
  return { exam_id: exam.id, questions };
});

fastify.post('/api/boss-challenge/submit-exam', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const examId = request.query.exam_id;
  const answers = request.body;
  
  const exam = await db.collection('exams').findOne({ id: examId, userId: user.id });
  if (!exam) return reply.status(404).send({ detail: 'Exam not found' });
  if (exam.submitted) return reply.status(400).send({ detail: 'Exam already submitted' });
  
  const correctAnswers = { q1: 'B', q2: 'B', q3: 'B', q4: 'C', q5: 'C' };
  let correct = 0;
  for (let i = 1; i <= 5; i++) {
    if (answers[`q${i}`]?.toUpperCase() === correctAnswers[`q${i}`]) correct++;
  }
  const scorePercentage = (correct / 5) * 100;
  
  const gradeData = calculateGrade(scorePercentage);
  const challenge = await db.collection('boss_challenges').findOne({ id: exam.challengeId });
  const baseXp = challenge?.xpReward || 100;
  const finalXp = Math.floor(baseXp * gradeData.xpMultiplier);
  const xpGained = finalXp - gradeData.xpPenalty;
  
  const newTotalXp = Math.max(0, user.totalXp + xpGained);
  const newLevel = calculateLevelFromXp(newTotalXp);
  
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { totalXp: newTotalXp, xp: newTotalXp % xpForNextLevel(newLevel), level: newLevel } }
  );
  
  await db.collection('exams').updateOne(
    { id: examId },
    { $set: { submitted: true, score: scorePercentage, grade: gradeData.grade, xpGained, submittedAt: new Date().toISOString() } }
  );
  
  await db.collection('boss_challenges').updateOne(
    { id: exam.challengeId },
    { $set: { completed: true, completedAt: new Date().toISOString() } }
  );
  
  return {
    success: true,
    score: gradeData.score,
    grade: gradeData.grade,
    xp_gained: xpGained,
    xp_penalty: gradeData.xpPenalty,
    extra_quests: gradeData.extraDailyQuests,
    level_up: newLevel > user.level,
    new_level: newLevel
  };
});

// Daily Quests
fastify.get('/api/quests/daily', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const today = new Date().toISOString().split('T')[0];
  
  const existing = await db.collection('daily_quests').find({ userId: user.id, date: today }, { projection: { _id: 0 } }).toArray();
  if (existing.length > 0) {
    return { quests: existing.map(q => ({ ...q, user_id: q.userId, xp_reward: q.xpReward })), date: today };
  }
  
  let extraQuests = 0;
  const recentExam = await db.collection('exams').findOne(
    { userId: user.id, submitted: true },
    { sort: { submittedAt: -1 } }
  );
  if (recentExam && recentExam.score < 50) {
    const gradeData = calculateGrade(recentExam.score);
    extraQuests = gradeData.extraDailyQuests;
  }
  
  const tasksCompleted = await db.collection('tasks').countDocuments({ userId: user.id, completed: true });
  const userContext = {
    level: user.level,
    streak: user.currentStreak,
    disciplineScore: user.disciplineScore,
    tasksCompleted
  };
  
  // Try AI generation first
  let questTemplates = await generateAIQuests('daily', userContext);
  
  // Fallback to templates if AI fails
  if (!questTemplates || questTemplates.length === 0) {
    questTemplates = getDailyQuestTemplates(user.level);
  }
  
  const totalQuests = Math.min(5 + extraQuests, questTemplates.length);
  const shuffled = questTemplates.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, totalQuests);
  
  const quests = [];
  for (const template of selected) {
    const quest = {
      id: uuidv4(),
      userId: user.id,
      date: today,
      title: template.title,
      description: template.description || '',
      xpReward: template.xpReward,
      target: template.target,
      progress: 0,
      completed: false,
      type: template.type,
      difficulty: template.difficulty || 'medium',
      category: template.category || 'productivity'
    };
    await db.collection('daily_quests').insertOne(quest);
    quests.push({ ...quest, user_id: quest.userId, xp_reward: quest.xpReward });
  }
  
  return { quests, date: today, extra_quests: extraQuests, ai_generated: questTemplates !== getDailyQuestTemplates(user.level) };
});

// Weekly Quests
fastify.get('/api/quests/weekly', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const now = new Date();
  const weekNum = `${now.getFullYear()}-W${String(Math.ceil((now.getDate() + new Date(now.getFullYear(), 0, 1).getDay()) / 7)).padStart(2, '0')}`;
  
  const existing = await db.collection('weekly_quests').find({ userId: user.id, week: weekNum }, { projection: { _id: 0 } }).toArray();
  if (existing.length > 0) {
    return { quests: existing.map(q => ({ ...q, user_id: q.userId, xp_reward: q.xpReward })), week: weekNum };
  }
  
  const tasksCompleted = await db.collection('tasks').countDocuments({ userId: user.id, completed: true });
  const userContext = {
    level: user.level,
    streak: user.currentStreak,
    disciplineScore: user.disciplineScore,
    tasksCompleted
  };
  
  // Try AI generation first
  let questTemplates = await generateAIQuests('weekly', userContext);
  
  // Fallback to templates if AI fails
  if (!questTemplates || questTemplates.length === 0) {
    questTemplates = getWeeklyQuestTemplates(user.level);
  }
  
  const quests = [];
  for (const template of questTemplates) {
    const quest = {
      id: uuidv4(),
      userId: user.id,
      week: weekNum,
      title: template.title,
      description: template.description || '',
      xpReward: template.xpReward,
      target: template.target,
      progress: 0,
      completed: false,
      type: template.type,
      difficulty: template.difficulty || 'medium',
      category: template.category || 'productivity'
    };
    await db.collection('weekly_quests').insertOne(quest);
    quests.push({ ...quest, user_id: quest.userId, xp_reward: quest.xpReward });
  }
  
  return { quests, week: weekNum };
});

// Monthly Quests (NEW)
fastify.get('/api/quests/monthly', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const existing = await db.collection('monthly_quests').find({ userId: user.id, month: monthKey }, { projection: { _id: 0 } }).toArray();
  if (existing.length > 0) {
    return { quests: existing.map(q => ({ ...q, user_id: q.userId, xp_reward: q.xpReward })), month: monthKey };
  }
  
  const tasksCompleted = await db.collection('tasks').countDocuments({ userId: user.id, completed: true });
  const userContext = {
    level: user.level,
    streak: user.currentStreak,
    disciplineScore: user.disciplineScore,
    tasksCompleted
  };
  
  // Try AI generation first
  let questTemplates = await generateAIQuests('monthly', userContext);
  
  // Fallback to templates if AI fails
  if (!questTemplates || questTemplates.length === 0) {
    questTemplates = getMonthlyQuestTemplates(user.level);
  }
  
  const quests = [];
  for (const template of questTemplates) {
    const quest = {
      id: uuidv4(),
      userId: user.id,
      month: monthKey,
      title: template.title,
      description: template.description || '',
      xpReward: template.xpReward,
      target: template.target,
      progress: 0,
      completed: false,
      type: template.type,
      difficulty: template.difficulty || 'hard',
      category: template.category || 'productivity'
    };
    await db.collection('monthly_quests').insertOne(quest);
    quests.push({ ...quest, user_id: quest.userId, xp_reward: quest.xpReward });
  }
  
  return { quests, month: monthKey };
});

// Micro Quests (NEW) - Quick 5-15 min wins
fastify.get('/api/quests/micro', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const today = new Date().toISOString().split('T')[0];
  
  // Check if user already has micro quests for today
  const existing = await db.collection('micro_quests').find({ userId: user.id, date: today, completed: false }, { projection: { _id: 0 } }).toArray();
  if (existing.length >= 8) {
    return { quests: existing.map(q => ({ ...q, user_id: q.userId, xp_reward: q.xpReward })), date: today };
  }
  
  const tasksCompleted = await db.collection('tasks').countDocuments({ userId: user.id, completed: true });
  const userContext = {
    level: user.level,
    streak: user.currentStreak,
    disciplineScore: user.disciplineScore,
    tasksCompleted
  };
  
  // Try AI generation first
  let questTemplates = await generateAIQuests('micro', userContext);
  
  // Fallback to templates if AI fails
  if (!questTemplates || questTemplates.length === 0) {
    questTemplates = getMicroQuestTemplates(user.level);
  }
  
  // Generate 8 micro quests
  const selected = questTemplates.sort(() => 0.5 - Math.random()).slice(0, 8);
  
  const quests = [];
  for (const template of selected) {
    const quest = {
      id: uuidv4(),
      userId: user.id,
      date: today,
      title: template.title,
      description: template.description || '',
      xpReward: template.xpReward,
      target: template.target,
      progress: 0,
      completed: false,
      type: template.type,
      difficulty: template.difficulty || 'easy',
      category: template.category || 'productivity'
    };
    await db.collection('micro_quests').insertOne(quest);
    quests.push({ ...quest, user_id: quest.userId, xp_reward: quest.xpReward });
  }
  
  return { quests: [...existing.map(q => ({ ...q, user_id: q.userId, xp_reward: q.xpReward })), ...quests], date: today };
});

// Complete Quest
fastify.post('/api/quests/:questId/complete', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { questId } = request.params;
  const questType = request.query.quest_type || 'daily';
  
  const collectionMap = {
    'daily': 'daily_quests',
    'weekly': 'weekly_quests',
    'monthly': 'monthly_quests',
    'micro': 'micro_quests'
  };
  
  const collection = collectionMap[questType] || 'daily_quests';
  const quest = await db.collection(collection).findOne({ id: questId, userId: user.id });
  
  if (!quest) return reply.status(404).send({ detail: 'Quest not found' });
  if (quest.completed) return reply.status(400).send({ detail: 'Quest already completed' });
  
  await db.collection(collection).updateOne(
    { id: questId },
    { $set: { completed: true, progress: quest.target, completedAt: new Date().toISOString() } }
  );
  
  const newTotalXp = user.totalXp + quest.xpReward;
  const newLevel = calculateLevelFromXp(newTotalXp);
  
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { totalXp: newTotalXp, xp: newTotalXp % xpForNextLevel(newLevel), level: newLevel } }
  );
  
  return { success: true, xp_gained: quest.xpReward, level_up: newLevel > user.level, new_level: newLevel, quest_type: questType };
});

// YouTube Learning (mocked)
fastify.get('/api/learning/youtube', { preHandler: [fastify.authenticate] }, async (request) => {
  const { subject, topic } = request.query;
  
  const videoDatabase = {
    math: [
      { title: 'Algebra Basics', url: 'https://youtube.com/watch?v=example1', channel: 'Khan Academy' },
      { title: 'Calculus Fundamentals', url: 'https://youtube.com/watch?v=example2', channel: '3Blue1Brown' }
    ],
    physics: [
      { title: 'Classical Mechanics', url: 'https://youtube.com/watch?v=example3', channel: 'MIT OpenCourseWare' },
      { title: 'Quantum Physics', url: 'https://youtube.com/watch?v=example4', channel: 'PBS Space Time' }
    ],
    programming: [
      { title: 'Python Tutorial', url: 'https://youtube.com/watch?v=example5', channel: 'freeCodeCamp' },
      { title: 'JavaScript Basics', url: 'https://youtube.com/watch?v=example6', channel: 'Traversy Media' }
    ]
  };
  
  const videos = videoDatabase[subject?.toLowerCase()] || [
    { title: `${subject} - ${topic}`, url: `https://youtube.com/results?search_query=${subject}+${topic}`, channel: 'Search Results' }
  ];
  
  return { videos, subject, topic };
});

// ==================== AI LIFE STRATEGIST MODE ====================

// Get User Vision & Goals
fastify.get('/api/strategist/vision', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  
  const vision = await db.collection('user_vision').findOne({ userId: user.id });
  
  if (!vision) {
    return { 
      has_vision: false,
      message: 'Define your 5-year vision to get started'
    };
  }
  
  return {
    has_vision: true,
    vision: vision.vision,
    yearly_goals: vision.yearlyGoals || [],
    monthly_goals: vision.monthlyGoals || [],
    weekly_goals: vision.weeklyGoals || [],
    created_at: vision.createdAt
  };
});

// Save 5-Year Vision
fastify.post('/api/strategist/vision', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { vision, yearly_goals } = request.body;
  
  if (!vision) {
    return reply.status(400).send({ detail: 'Vision is required' });
  }
  
  await db.collection('user_vision').updateOne(
    { userId: user.id },
    {
      $set: {
        vision,
        yearlyGoals: yearly_goals || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );
  
  return { success: true, message: 'Vision saved successfully' };
});

// Get AI Daily Priority
fastify.get('/api/strategist/daily-priority', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  
  try {
    // Get user's vision and recent tasks
    const vision = await db.collection('user_vision').findOne({ userId: user.id });
    const recentTasks = await db.collection('tasks').find({ 
      userId: user.id 
    }).sort({ createdAt: -1 }).limit(10).toArray();
    
    const completedToday = await db.collection('tasks').countDocuments({
      userId: user.id,
      completed: true,
      completedAt: { $gte: new Date().toISOString().split('T')[0] }
    });
    
    // Use AI to generate priority
    // const { LlmChat, UserMessage } = await import('emergentintegrations/llm/chat');
    
    const prompt = `Based on this user's 5-year vision: "${vision?.vision || 'Building a successful future'}"
Current level: ${user.level}
Tasks completed today: ${completedToday}
Recent tasks: ${recentTasks.map(t => t.title).join(', ')}

Generate ONE specific, actionable priority task for today that moves them toward their vision.
Format: Just the task title, nothing else. Keep it under 100 characters.`;

    const chat = new LlmChat({
      apiKey: process.env.EMERGENT_LLM_KEY,
      sessionId: `daily_priority_${user.id}_${Date.now()}`
    }).withModel('openai', 'gpt-5.2');
    
    const response = await chat.sendMessage(new UserMessage({ text: prompt }));
    
    return {
      priority: response.trim(),
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI priority generation failed:', error);
    return {
      priority: 'Focus on your most important long-term goal today',
      generated_at: new Date().toISOString()
    };
  }
});

// Weekly Performance Analysis
fastify.get('/api/strategist/weekly-analysis', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const weeklyTasks = await db.collection('tasks').find({
    userId: user.id,
    createdAt: { $gte: weekAgo }
  }).toArray();
  
  const completed = weeklyTasks.filter(t => t.completed).length;
  const total = weeklyTasks.length;
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  
  // Focus sessions this week
  const focusSessions = await db.collection('focus_sessions').countDocuments({
    userId: user.id,
    createdAt: { $gte: weekAgo }
  });
  
  return {
    completed_tasks: completed,
    total_tasks: total,
    completion_rate: parseFloat(completionRate),
    focus_sessions: focusSessions,
    current_streak: user.currentStreak,
    xp_gained: Math.min(user.totalXp - 0, 1000), // Weekly XP (simplified)
    procrastination_detected: completionRate < 50,
    week_start: weekAgo
  };
});

// ==================== IDENTITY TRANSFORMATION MODE ====================

// Get Alter Ego Profile
fastify.get('/api/identity/alter-ego', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  
  const alterEgo = await db.collection('alter_ego').findOne({ userId: user.id });
  
  return {
    has_alter_ego: !!alterEgo,
    alter_ego: alterEgo || null
  };
});

// Create/Update Alter Ego
fastify.post('/api/identity/alter-ego', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { name, traits, values, daily_habits, decision_framework } = request.body;
  
  if (!name) {
    return reply.status(400).send({ detail: 'Alter ego name is required' });
  }
  
  await db.collection('alter_ego').updateOne(
    { userId: user.id },
    {
      $set: {
        name,
        traits: traits || [],
        values: values || [],
        dailyHabits: daily_habits || [],
        decisionFramework: decision_framework || '',
        createdAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );
  
  return { success: true, message: 'Alter ego profile saved' };
});

// Generate Decision Scenario
fastify.get('/api/identity/decision-scenario', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  
  try {
    // const { LlmChat, UserMessage } = await import('emergentintegrations/llm/chat');
    
    const prompt = `Generate a realistic decision scenario for personal development training.
Scenario should test: strategic thinking, delayed gratification, or rational decision-making.
Format as JSON:
{
  "scenario": "description of situation",
  "option_a": "emotional/impulsive choice",
  "option_b": "logical/strategic choice",
  "correct": "a or b"
}`;

    const chat = new LlmChat({
      apiKey: process.env.EMERGENT_LLM_KEY,
      sessionId: `scenario_${user.id}_${Date.now()}`
    }).withModel('openai', 'gpt-5.2');
    
    const response = await chat.sendMessage(new UserMessage({ text: prompt }));
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse scenario');
  } catch (error) {
    console.error('Scenario generation failed:', error);
    return {
      scenario: "You're offered a high-paying job that requires 70-hour weeks, potentially affecting your health and personal relationships.",
      option_a: "Accept immediately for the money and status",
      option_b: "Decline and continue building skills for better long-term opportunities",
      correct: "b"
    };
  }
});

// ==================== WORLD IMPACT LAYER ====================

// Get Impact Stats
fastify.get('/api/impact/stats', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const contributions = await db.collection('contributions').find({
    userId: user.id,
    createdAt: { $gte: weekAgo }
  }).toArray();
  
  const totalContributions = await db.collection('contributions').countDocuments({ userId: user.id });
  
  return {
    weekly_contributions: contributions.length,
    total_contributions: totalContributions,
    contribution_types: contributions.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {}),
    carbon_impact: contributions.reduce((sum, c) => sum + (c.carbonImpact || 0), 0),
    contribution_streak: user.contributionStreak || 0
  };
});

// Log Contribution
fastify.post('/api/impact/contribution', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { type, description, hours, carbon_impact } = request.body;
  
  if (!type || !description) {
    return reply.status(400).send({ detail: 'Type and description required' });
  }
  
  await db.collection('contributions').insertOne({
    id: uuidv4(),
    userId: user.id,
    type, // volunteer, build, teach, environmental, community
    description,
    hours: hours || 0,
    carbonImpact: carbon_impact || 0,
    createdAt: new Date().toISOString()
  });
  
  // Award XP
  const xpReward = 50;
  await db.collection('users').updateOne(
    { id: user.id },
    { $inc: { totalXp: xpReward, xp: xpReward } }
  );
  
  return { 
    success: true, 
    xp_gained: xpReward,
    message: 'Contribution logged! +50 XP' 
  };
});

// ==================== FOUNDER MODE ====================

// Get Startup Ideas
fastify.get('/api/founder/ideas', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  
  const ideas = await db.collection('startup_ideas').find({ userId: user.id }).toArray();
  
  return { ideas: ideas.map(idea => ({
    ...idea,
    id: idea.id,
    title: idea.title,
    description: idea.description,
    status: idea.status,
    revenue_potential: idea.revenuePotential,
    validation_score: idea.validationScore,
    created_at: idea.createdAt
  })) };
});

// Add Startup Idea
fastify.post('/api/founder/ideas', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { title, description, target_market, revenue_model } = request.body;
  
  if (!title) {
    return reply.status(400).send({ detail: 'Title is required' });
  }
  
  const idea = {
    id: uuidv4(),
    userId: user.id,
    title,
    description: description || '',
    targetMarket: target_market || '',
    revenueModel: revenue_model || '',
    status: 'idea', // idea, validating, building, launched
    validationScore: 0,
    revenuePotential: 0,
    createdAt: new Date().toISOString()
  };
  
  await db.collection('startup_ideas').insertOne(idea);
  
  return { success: true, idea };
});

// ==================== PSYCHOLOGICAL ANALYTICS ====================

// Log Mood
fastify.post('/api/psychology/mood', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { mood, energy, notes } = request.body;
  
  if (!mood) {
    return reply.status(400).send({ detail: 'Mood is required' });
  }
  
  await db.collection('mood_logs').insertOne({
    id: uuidv4(),
    userId: user.id,
    mood, // 1-10 scale
    energy, // 1-10 scale
    notes: notes || '',
    timestamp: new Date().toISOString()
  });
  
  return { success: true, message: 'Mood logged' };
});

// Get Psychological Insights
fastify.get('/api/psychology/insights', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const moodLogs = await db.collection('mood_logs').find({
    userId: user.id,
    timestamp: { $gte: weekAgo }
  }).toArray();
  
  if (moodLogs.length === 0) {
    return {
      average_mood: 0,
      average_energy: 0,
      burnout_risk: false,
      insights: ['Start tracking your mood to get insights']
    };
  }
  
  const avgMood = (moodLogs.reduce((sum, log) => sum + (log.mood || 5), 0) / moodLogs.length).toFixed(1);
  const avgEnergy = (moodLogs.reduce((sum, log) => sum + (log.energy || 5), 0) / moodLogs.length).toFixed(1);
  
  const burnoutRisk = avgEnergy < 4 && avgMood < 5;
  
  const insights = [];
  if (burnoutRisk) insights.push('⚠️ Burnout risk detected - consider taking a break');
  if (avgMood < 5) insights.push('Your mood has been low this week - try outdoor activities');
  if (avgEnergy < 5) insights.push('Energy levels are low - focus on sleep and nutrition');
  if (avgMood >= 7 && avgEnergy >= 7) insights.push('✨ Great momentum! Keep up the positive habits');
  
  return {
    average_mood: parseFloat(avgMood),
    average_energy: parseFloat(avgEnergy),
    burnout_risk: burnoutRisk,
    mood_logs_count: moodLogs.length,
    insights
  };
});

// ==================== GLOBAL QUESTS ====================

// Get Global Quests (available to all users)
fastify.get('/api/quests/global', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const now = new Date();
  
  // Get all active global quests (not expired)
  const globalQuests = await db.collection('global_quests').find({
    $or: [
      { expiresAt: { $gt: now.toISOString() } },
      { expiresAt: null }
    ]
  }, { projection: { _id: 0 } }).toArray();
  
  // Get user's completion status for each global quest
  const completions = await db.collection('user_quest_completions').find({
    userId: user.id,
    questId: { $in: globalQuests.map(q => q.id) }
  }, { projection: { _id: 0 } }).toArray();
  
  const completionMap = {};
  completions.forEach(c => {
    completionMap[c.questId] = c;
  });
  
  // Merge quest data with completion status
  const questsWithStatus = globalQuests.map(quest => ({
    ...quest,
    completed: !!completionMap[quest.id],
    completedAt: completionMap[quest.id]?.completedAt,
    user_id: user.id,
    xp_reward: quest.xpReward,
    is_global: true,
    time_remaining: quest.expiresAt ? Math.max(0, new Date(quest.expiresAt) - now) : null
  }));
  
  return { quests: questsWithStatus };
});

// Get Beginner Quests (for new users, level < 5)
fastify.get('/api/quests/beginner', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  
  // Only show beginner quests for users below level 5
  if (user.level >= 5) {
    return { quests: [], message: 'Beginner quests are for users below level 5' };
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check if beginner quests already generated for today
  const existing = await db.collection('beginner_quests').find({
    userId: user.id,
    date: today
  }, { projection: { _id: 0 } }).toArray();
  
  if (existing.length > 0) {
    return { quests: existing.map(q => ({ ...q, user_id: q.userId, xp_reward: q.xpReward })) };
  }
  
  // Beginner quest templates
  const beginnerTemplates = [
    // Language Learning
    { title: '5-Minute Vocabulary', description: 'Learn 5 new words in any language', category: 'language', subject: 'vocabulary', xpReward: 20, target: 5, type: 'study', difficulty: 'easy' },
    { title: 'Grammar Basics', description: 'Complete a basic grammar lesson', category: 'language', subject: 'grammar', xpReward: 25, target: 1, type: 'study', difficulty: 'easy' },
    { title: 'Practice Pronunciation', description: 'Practice speaking for 10 minutes', category: 'language', subject: 'speaking', xpReward: 30, target: 10, type: 'practice', difficulty: 'easy' },
    
    // STEM - Math
    { title: 'Math Warm-up', description: 'Solve 5 basic math problems', category: 'stem', subject: 'math', xpReward: 25, target: 5, type: 'practice', difficulty: 'easy' },
    { title: 'Number Sense', description: 'Complete mental math exercises', category: 'stem', subject: 'math', xpReward: 20, target: 1, type: 'practice', difficulty: 'easy' },
    
    // STEM - Science
    { title: 'Science Explorer', description: 'Watch a 5-min science video', category: 'stem', subject: 'science', xpReward: 20, target: 5, type: 'study', difficulty: 'easy' },
    { title: 'Experiment Time', description: 'Learn about a scientific concept', category: 'stem', subject: 'science', xpReward: 30, target: 1, type: 'study', difficulty: 'easy' },
    
    // STEM - Programming
    { title: 'Code Your First Program', description: 'Write a simple "Hello World" program', category: 'stem', subject: 'programming', xpReward: 35, target: 1, type: 'practice', difficulty: 'easy' },
    { title: 'Learn Basic Syntax', description: 'Study programming basics for 10 minutes', category: 'stem', subject: 'programming', xpReward: 25, target: 10, type: 'study', difficulty: 'easy' },
    
    // General Learning
    { title: 'Reading Time', description: 'Read for 15 minutes', category: 'general', subject: 'reading', xpReward: 20, target: 15, type: 'study', difficulty: 'easy' },
    { title: 'Note Taking Practice', description: 'Take organized notes from any lesson', category: 'general', subject: 'study_skills', xpReward: 25, target: 1, type: 'practice', difficulty: 'easy' }
  ];
  
  // Select 5 random beginner quests
  const selected = beginnerTemplates.sort(() => 0.5 - Math.random()).slice(0, 5);
  
  const quests = [];
  for (const template of selected) {
    const quest = {
      id: uuidv4(),
      userId: user.id,
      date: today,
      title: template.title,
      description: template.description,
      category: template.category,
      subject: template.subject,
      xpReward: template.xpReward,
      target: template.target,
      progress: 0,
      completed: false,
      type: template.type,
      difficulty: template.difficulty,
      is_beginner: true
    };
    await db.collection('beginner_quests').insertOne(quest);
    quests.push({ ...quest, user_id: quest.userId, xp_reward: quest.xpReward });
  }
  
  return { quests };
});

// Complete Global Quest
fastify.post('/api/quests/global/:questId/complete', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { questId } = request.params;
  
  const quest = await db.collection('global_quests').findOne({ id: questId });
  if (!quest) return reply.status(404).send({ detail: 'Quest not found' });
  
  // Check if already completed
  const existing = await db.collection('user_quest_completions').findOne({
    userId: user.id,
    questId: questId
  });
  
  if (existing) return reply.status(400).send({ detail: 'Quest already completed' });
  
  // Check if expired
  if (quest.expiresAt && new Date(quest.expiresAt) < new Date()) {
    return reply.status(400).send({ detail: 'Quest has expired' });
  }
  
  // Mark as completed
  await db.collection('user_quest_completions').insertOne({
    id: uuidv4(),
    userId: user.id,
    questId: questId,
    completedAt: new Date().toISOString()
  });
  
  // Award XP
  const newTotalXp = user.totalXp + quest.xpReward;
  const newLevel = calculateLevelFromXp(newTotalXp);
  
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { totalXp: newTotalXp, xp: newTotalXp % xpForNextLevel(newLevel), level: newLevel } }
  );
  
  return { 
    success: true, 
    xp_gained: quest.xpReward, 
    level_up: newLevel > user.level, 
    new_level: newLevel 
  };
});

// ==================== LEADERBOARD ====================

// Global Leaderboard (all users worldwide)
fastify.get('/api/leaderboard/global', { preHandler: [fastify.authenticate] }, async (request) => {
  const limit = parseInt(request.query.limit) || 100;
  const timeframe = request.query.timeframe || 'all_time';
  
  let query = {};
  
  if (timeframe === 'weekly') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query.lastActive = { $gte: weekAgo };
  } else if (timeframe === 'monthly') {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query.lastActive = { $gte: monthAgo };
  }
  
  const topUsers = await db.collection('users').find(query, {
    projection: { 
      _id: 0, 
      id: 1, 
      username: 1, 
      level: 1, 
      totalXp: 1, 
      currentStreak: 1, 
      disciplineScore: 1,
      createdAt: 1,
      country: 1
    }
  })
  .sort({ level: -1, totalXp: -1 })
  .limit(limit)
  .toArray();
  
  const currentUser = await getCurrentUser(request);
  const usersAbove = await db.collection('users').countDocuments({
    $or: [
      { level: { $gt: currentUser.level } },
      { 
        level: currentUser.level, 
        totalXp: { $gt: currentUser.totalXp } 
      }
    ]
  });
  
  const userRank = usersAbove + 1;
  
  const leaderboard = topUsers.map((user, index) => ({
    rank: index + 1,
    id: user.id,
    username: user.username,
    level: user.level,
    total_xp: user.totalXp,
    current_streak: user.currentStreak,
    discipline_score: user.disciplineScore,
    country: user.country || 'Unknown',
    created_at: user.createdAt,
    is_current_user: user.id === currentUser.id
  }));
  
  return { 
    leaderboard, 
    current_user_rank: userRank,
    total_users: await db.collection('users').countDocuments({}),
    timeframe,
    type: 'global'
  };
});

// Local Leaderboard (users from same country/region)
fastify.get('/api/leaderboard/local', { preHandler: [fastify.authenticate] }, async (request) => {
  const currentUser = await getCurrentUser(request);
  const userCountry = currentUser.country || 'Unknown';
  const limit = parseInt(request.query.limit) || 100;
  const timeframe = request.query.timeframe || 'all_time';
  
  let query = { country: userCountry };
  
  if (timeframe === 'weekly') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query.lastActive = { $gte: weekAgo };
  } else if (timeframe === 'monthly') {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query.lastActive = { $gte: monthAgo };
  }
  
  const topUsers = await db.collection('users').find(query, {
    projection: { 
      _id: 0, 
      id: 1, 
      username: 1, 
      level: 1, 
      totalXp: 1, 
      currentStreak: 1, 
      disciplineScore: 1,
      createdAt: 1,
      country: 1
    }
  })
  .sort({ level: -1, totalXp: -1 })
  .limit(limit)
  .toArray();
  
  const usersAbove = await db.collection('users').countDocuments({
    country: userCountry,
    $or: [
      { level: { $gt: currentUser.level } },
      { 
        level: currentUser.level, 
        totalXp: { $gt: currentUser.totalXp } 
      }
    ]
  });
  
  const userRank = usersAbove + 1;
  
  const leaderboard = topUsers.map((user, index) => ({
    rank: index + 1,
    id: user.id,
    username: user.username,
    level: user.level,
    total_xp: user.totalXp,
    current_streak: user.currentStreak,
    discipline_score: user.disciplineScore,
    country: user.country || 'Unknown',
    created_at: user.createdAt,
    is_current_user: user.id === currentUser.id
  }));
  
  return { 
    leaderboard, 
    current_user_rank: userRank,
    total_users: await db.collection('users').countDocuments({ country: userCountry }),
    timeframe,
    type: 'local',
    country: userCountry
  };
});

// ==================== BACKGROUND CUSTOMIZATION ====================

// Get User Background Preferences
fastify.get('/api/user/background', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  
  const prefs = await db.collection('user_preferences').findOne({ userId: user.id });
  
  return {
    background_url: prefs?.backgroundUrl || null,
    background_type: prefs?.backgroundType || 'default', // default, url, ai-generated
    tokens: user.backgroundTokens || 10, // Free tokens to start
    ai_prompt: prefs?.aiPrompt || null
  };
});

// Update Background (costs 1 token)
fastify.post('/api/user/background/update', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { background_url, background_type } = request.body;
  
  if (!background_url || !background_type) {
    return reply.status(400).send({ detail: 'Missing background_url or background_type' });
  }
  
  // Check if user has tokens
  const tokens = user.backgroundTokens || 0;
  if (tokens < 1) {
    return reply.status(400).send({ detail: 'Not enough tokens. You need 1 token to change background.' });
  }
  
  // Deduct 1 token
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { backgroundTokens: tokens - 1 } }
  );
  
  // Update or create preferences
  await db.collection('user_preferences').updateOne(
    { userId: user.id },
    { 
      $set: { 
        backgroundUrl: background_url,
        backgroundType: background_type,
        updatedAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );
  
  return { 
    success: true, 
    message: 'Background updated successfully',
    remaining_tokens: tokens - 1,
    background_url
  };
});

// Generate AI Background (costs 2 tokens)
fastify.post('/api/user/background/generate', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { prompt } = request.body;
  
  if (!prompt) {
    return reply.status(400).send({ detail: 'Missing prompt for AI generation' });
  }
  
  // Check if user has tokens
  const tokens = user.backgroundTokens || 0;
  if (tokens < 2) {
    return reply.status(400).send({ detail: 'Not enough tokens. You need 2 tokens to generate AI background.' });
  }
  
  try {
    // Use Emergent LLM key for image generation
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMERGENT_LLM_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: `Beautiful abstract background for productivity app: ${prompt}. Professional, modern, inspiring.`,
        n: 1,
        size: '1792x1024',
        quality: 'standard'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
    
    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    // Deduct 2 tokens
    await db.collection('users').updateOne(
      { id: user.id },
      { $set: { backgroundTokens: tokens - 2 } }
    );
    
    // Save preferences
    await db.collection('user_preferences').updateOne(
      { userId: user.id },
      { 
        $set: { 
          backgroundUrl: imageUrl,
          backgroundType: 'ai-generated',
          aiPrompt: prompt,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    
    return {
      success: true,
      image_url: imageUrl,
      remaining_tokens: tokens - 2,
      message: 'AI background generated successfully'
    };
  } catch (error) {
    console.error('AI generation error:', error);
    return reply.status(500).send({ detail: 'Failed to generate AI background' });
  }
});

// Add Background Tokens (Admin or purchase)
fastify.post('/api/user/background/add-tokens', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { amount } = request.body;
  
  if (!amount || amount < 1) {
    return reply.status(400).send({ detail: 'Invalid token amount' });
  }
  
  const currentTokens = user.backgroundTokens || 0;
  const newTokens = currentTokens + amount;
  
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { backgroundTokens: newTokens } }
  );
  
  return {
    success: true,
    tokens_added: amount,
    new_total: newTokens,
    message: `Added ${amount} background tokens`
  };
});

// ==================== ADMIN ROUTES ====================

fastify.post('/api/system/access', async (request, reply) => {
  const { username, password } = request.body;
  
  const admin = await db.collection('admins').findOne({ username });
  if (!admin) return reply.status(401).send({ detail: 'Access denied' });
  
  // Support both camelCase and snake_case password field
  const hashedPwd = admin.hashedPassword || admin.hashed_password;
  const valid = await verifyPassword(password, hashedPwd);
  if (!valid) return reply.status(401).send({ detail: 'Access denied' });
  
  const token = fastify.jwt.sign({ adminId: admin.id });
  // Support both naming conventions for isSuperAdmin
  const isSuperAdmin = admin.isSuperAdmin ?? admin.is_super_admin ?? false;
  return { access_token: token, token_type: 'bearer', admin: { id: admin.id, username: admin.username, is_super_admin: isSuperAdmin } };
});

fastify.get('/api/system/status', { preHandler: [fastify.authenticate] }, async (request) => {
  const admin = await getCurrentAdmin(request);
  
  const totalUsers = await db.collection('users').countDocuments({});
  const totalTasks = await db.collection('tasks').countDocuments({});
  const completedTasks = await db.collection('tasks').countDocuments({ completed: true });
  
  const focusAgg = await db.collection('focus_sessions').aggregate([
    { $group: { _id: null, total: { $sum: '$durationMinutes' } } }
  ]).toArray();
  const totalFocusMinutes = focusAgg[0]?.total || 0;
  
  const users = await db.collection('users').find({}, { projection: { _id: 0, hashedPassword: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
  
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const activeUsers = await db.collection('users').countDocuments({ lastActive: { $gte: yesterday } });
  
  const recentTasks = await db.collection('tasks').find({ completed: true }, { projection: { _id: 0 } }).sort({ completedAt: -1 }).limit(20).toArray();
  
  return {
    total_users: totalUsers,
    active_users_24h: activeUsers,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    total_focus_minutes: totalFocusMinutes,
    users: users.map(u => ({
      ...u,
      total_xp: u.totalXp,
      current_streak: u.currentStreak,
      created_at: u.createdAt
    })),
    recent_activity: recentTasks,
    admin: { username: admin.username, is_super_admin: admin.isSuperAdmin }
  };
});

fastify.post('/api/system/admin/create', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const admin = await getCurrentAdmin(request);
  if (!admin.isSuperAdmin) return reply.status(403).send({ detail: 'Only super admins can create new admins' });
  
  const { username, password } = request.body;
  
  const existing = await db.collection('admins').findOne({ username });
  if (existing) return reply.status(400).send({ detail: 'Admin username already exists' });
  
  const newAdmin = {
    id: uuidv4(),
    username,
    hashedPassword: await hashPassword(password),
    createdBy: admin.id,
    isSuperAdmin: false,
    createdAt: new Date().toISOString()
  };
  
  await db.collection('admins').insertOne(newAdmin);
  return { success: true, message: `Admin ${username} created` };
});

fastify.get('/api/system/admins', { preHandler: [fastify.authenticate] }, async () => {
  const admins = await db.collection('admins').find({}, { projection: { _id: 0, hashedPassword: 0 } }).toArray();
  return { admins: admins.map(a => ({ ...a, is_super_admin: a.isSuperAdmin, created_at: a.createdAt })) };
});

fastify.delete('/api/system/users/:userId', { preHandler: [fastify.authenticate] }, async (request) => {
  const { userId } = request.params;
  
  await db.collection('users').deleteOne({ id: userId });
  await db.collection('tasks').deleteMany({ userId });
  await db.collection('skill_trees').deleteMany({ userId });
  await db.collection('achievements').deleteMany({ userId });
  await db.collection('focus_sessions').deleteMany({ userId });
  await db.collection('boss_challenges').deleteMany({ userId });
  
  return { success: true, message: 'User deleted' };
});

fastify.post('/api/system/users/:userId/award-xp', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { userId } = request.params;
  const xpAmount = parseInt(request.query.xp_amount) || 0;
  
  const user = await db.collection('users').findOne({ id: userId });
  if (!user) return reply.status(404).send({ detail: 'User not found' });
  
  const newTotalXp = user.totalXp + xpAmount;
  const newLevel = calculateLevelFromXp(newTotalXp);
  
  await db.collection('users').updateOne(
    { id: userId },
    { $set: { totalXp: newTotalXp, xp: newTotalXp % xpForNextLevel(newLevel), level: newLevel } }
  );
  
  return { success: true, xp_awarded: xpAmount, new_level: newLevel };
});

fastify.post('/api/system/users/:userId/ban', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const admin = await getCurrentAdmin(request);
  if (!admin.isSuperAdmin) return reply.status(403).send({ detail: 'Only super admins can ban users' });
  
  const { userId } = request.params;
  const durationDays = parseInt(request.query.duration_days) || 1;
  const banUntil = new Date(Date.now() + durationDays * 86400000).toISOString();
  
  await db.collection('users').updateOne(
    { id: userId },
    { $set: { banned: true, banUntil } }
  );
  
  return { success: true, banned_until: banUntil };
});

fastify.post('/api/system/users/:userId/reset', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const admin = await getCurrentAdmin(request);
  if (!admin.isSuperAdmin) return reply.status(403).send({ detail: 'Only super admins can reset progress' });
  
  const { userId } = request.params;
  
  await db.collection('users').updateOne(
    { id: userId },
    { $set: { level: 1, xp: 0, totalXp: 0, currentStreak: 0, disciplineScore: 50 } }
  );
  
  await db.collection('tasks').deleteMany({ userId });
  await db.collection('skill_trees').deleteMany({ userId });
  await db.collection('achievements').deleteMany({ userId });
  await db.collection('exams').deleteMany({ userId });
  
  return { success: true, message: 'User progress reset' };
});

fastify.get('/api/system/analytics/export', { preHandler: [fastify.authenticate] }, async (request) => {
  const format = request.query.format || 'json';
  const users = await db.collection('users').find({}, { projection: { _id: 0, hashedPassword: 0 } }).toArray();
  
  if (format === 'json') {
    return { users, total: users.length };
  }
  
  // CSV format
  let csv = 'Username,Email,Level,Total XP,Streak,Discipline\n';
  users.forEach(u => {
    csv += `${u.username},${u.email},${u.level},${u.totalXp},${u.currentStreak},${u.disciplineScore}\n`;
  });
  
  return { csv };
});

// ==================== ADMIN GLOBAL QUEST MANAGEMENT ====================

// Get All Global Quests (Admin)
fastify.get('/api/admin/quests/global', { preHandler: [fastify.authenticate] }, async (request) => {
  await getCurrentAdmin(request);
  
  const quests = await db.collection('global_quests').find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  
  // Get completion stats for each quest
  const questsWithStats = await Promise.all(quests.map(async (quest) => {
    const completions = await db.collection('user_quest_completions').countDocuments({ questId: quest.id });
    const totalUsers = await db.collection('users').countDocuments({});
    
    return {
      ...quest,
      xp_reward: quest.xpReward,
      expires_at: quest.expiresAt,
      created_at: quest.createdAt,
      completion_count: completions,
      completion_rate: totalUsers > 0 ? ((completions / totalUsers) * 100).toFixed(1) : 0
    };
  }));
  
  return { quests: questsWithStats };
});

// Create Global Quest (Admin)
fastify.post('/api/admin/quests/global', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const admin = await getCurrentAdmin(request);
  const { title, description, xpReward, target, type, difficulty, category, expiresIn } = request.body;
  
  if (!title || !xpReward || !target || !type) {
    return reply.status(400).send({ detail: 'Missing required fields: title, xpReward, target, type' });
  }
  
  let expiresAt = null;
  if (expiresIn && expiresIn > 0) {
    // expiresIn is in hours
    expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString();
  }
  
  const quest = {
    id: uuidv4(),
    title,
    description: description || '',
    xpReward: parseInt(xpReward),
    target: parseInt(target),
    type,
    difficulty: difficulty || 'medium',
    category: category || 'productivity',
    is_global: true,
    expiresAt,
    createdBy: admin.id,
    createdAt: new Date().toISOString()
  };
  
  await db.collection('global_quests').insertOne(quest);
  
  return { 
    success: true, 
    quest: { ...quest, xp_reward: quest.xpReward, expires_at: quest.expiresAt, created_at: quest.createdAt },
    message: 'Global quest created successfully' 
  };
});

// Update Global Quest (Admin)
fastify.put('/api/admin/quests/global/:questId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  await getCurrentAdmin(request);
  const { questId } = request.params;
  const updates = request.body;
  
  const quest = await db.collection('global_quests').findOne({ id: questId });
  if (!quest) return reply.status(404).send({ detail: 'Quest not found' });
  
  // Handle expiration update
  if (updates.expiresIn !== undefined) {
    updates.expiresAt = updates.expiresIn > 0 
      ? new Date(Date.now() + updates.expiresIn * 60 * 60 * 1000).toISOString()
      : null;
    delete updates.expiresIn;
  }
  
  await db.collection('global_quests').updateOne(
    { id: questId },
    { $set: { ...updates, updatedAt: new Date().toISOString() } }
  );
  
  return { success: true, message: 'Quest updated successfully' };
});

// Delete Global Quest (Admin)
fastify.delete('/api/admin/quests/global/:questId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  await getCurrentAdmin(request);
  const { questId } = request.params;
  
  const result = await db.collection('global_quests').deleteOne({ id: questId });
  if (result.deletedCount === 0) return reply.status(404).send({ detail: 'Quest not found' });
  
  // Also delete all user completions for this quest
  await db.collection('user_quest_completions').deleteMany({ questId });
  
  return { success: true, message: 'Quest deleted successfully' };
});

// Get Global Quest Stats (Admin)
fastify.get('/api/admin/quests/stats', { preHandler: [fastify.authenticate] }, async (request) => {
  await getCurrentAdmin(request);
  
  const totalGlobalQuests = await db.collection('global_quests').countDocuments({});
  const activeQuests = await db.collection('global_quests').countDocuments({
    $or: [
      { expiresAt: { $gt: new Date().toISOString() } },
      { expiresAt: null }
    ]
  });
  const expiredQuests = totalGlobalQuests - activeQuests;
  
  const totalCompletions = await db.collection('user_quest_completions').countDocuments({});
  const totalUsers = await db.collection('users').countDocuments({});
  
  return {
    total_global_quests: totalGlobalQuests,
    active_quests: activeQuests,
    expired_quests: expiredQuests,
    total_completions: totalCompletions,
    average_completions_per_user: totalUsers > 0 ? (totalCompletions / totalUsers).toFixed(2) : 0
  };
});

// SPA Catch-all route - MUST be last to serve index.html for all non-API routes
fastify.setNotFoundHandler((request, reply) => {
  // If request is for API endpoint, return 404
  if (request.url.startsWith('/api')) {
    reply.status(404).send({ detail: 'Not Found' });
    return;
  }
  
  // For all other routes, serve index.html to support SPA routing
  reply.sendFile('index.html');
});

// Initialize super admin if not exists
const initSuperAdmin = async () => {
  const adminUsername = process.env.ADMIN_USERNAME || 'Rebadion';
  const adminPassword = process.env.ADMIN_PASSWORD;

  const existing = await db.collection('admins').findOne({ username: adminUsername });
  if (!existing) {
    if (!adminPassword) {
      console.warn('ADMIN_PASSWORD is not set; skipping super admin creation');
      return;
    }

    await db.collection('admins').insertOne({
      id: uuidv4(),
      username: adminUsername,
      hashedPassword: await hashPassword(adminPassword),
      isSuperAdmin: true,
      createdAt: new Date().toISOString()
    });
    console.log(`Super admin created: ${adminUsername}`);
  }
};

// Start server (only when running as a standalone server, not when imported for serverless)
const start = async () => {
  try {
    await connectDB();
    await initSuperAdmin();
    const port = parseInt(process.env.PORT || '8001', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://0.0.0.0:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// If running on Vercel/serverless, this module will be imported.
// Only start listening when executed directly.
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  start();
}

export default fastify;
