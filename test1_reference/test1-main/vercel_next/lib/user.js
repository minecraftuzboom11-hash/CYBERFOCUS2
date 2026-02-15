import clientPromise from './mongodb';

export async function usersCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');
  return db.collection('users');
}

export async function tasksCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');
  return db.collection('tasks');
}

export async function questsCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');
  return db.collection('quests');
}

export async function globalQuestsCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');
  return db.collection('global_quests');
}

export async function adminsCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');
  return db.collection('admins');
}

export function publicUser(u) {
  if (!u) return null;
  const { _id, hashedPassword, ...rest } = u;
  return rest;
}
