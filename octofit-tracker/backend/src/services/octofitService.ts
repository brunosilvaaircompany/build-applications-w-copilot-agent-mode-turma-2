import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function requestError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw requestError('Dados da atividade inválidos');
  }

  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId) || typeof type !== 'string' || !type.trim() ||
      typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw requestError('Dados da atividade inválidos');
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw requestError('Pessoa ou equipe não encontrada', 404);
  }

  const occurredAtInput = input.occurredAt;
  if (occurredAtInput !== undefined &&
      typeof occurredAtInput !== 'string' && typeof occurredAtInput !== 'number' && !(occurredAtInput instanceof Date)) {
    throw requestError('Data da atividade inválida');
  }
  const occurredAt = occurredAtInput instanceof Date
    ? new Date(occurredAtInput.getTime())
    : occurredAtInput === undefined ? new Date() : new Date(occurredAtInput);
  if (Number.isNaN(occurredAt.getTime())) {
    throw requestError('Data da atividade inválida');
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt,
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) {
    throw requestError('Dados da equipe inválidos');
  }

  const { name, mascot } = input;
  const membersInput = input.members === undefined ? [] : input.members;
  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim() ||
      !Array.isArray(membersInput) || !membersInput.every(isObjectId)) {
    throw requestError('Dados da equipe inválidos');
  }

  const members = [...new Set(membersInput)];
  if (members.length && await User.countDocuments({ _id: { $in: members } }) !== members.length) {
    throw requestError('Uma ou mais pessoas não foram encontradas', 404);
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const teamTotals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return teamTotals.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw requestError('Pessoa não encontrada', 404);
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const activityFocusCounts = new Map<string, number>();
  for (const activity of activities) {
    const focus = activity.type === 'run' || activity.type === 'cycle'
      ? 'endurance'
      : activity.type === 'strength' ? 'strength' : undefined;
    if (focus) {
      activityFocusCounts.set(focus, (activityFocusCounts.get(focus) ?? 0) + 1);
    }
  }

  const score = (focus: string) => (focus === user.fitnessGoal ? 100 : 0) + (activityFocusCounts.get(focus) ?? 0);
  return workouts
    .sort((a, b) => score(b.focus) - score(a.focus) || String(a.title ?? '').localeCompare(String(b.title ?? '')))
    .map((workout) => {
      const activityCount = activityFocusCounts.get(workout.focus) ?? 0;
      let reason = 'Este treino pode complementar seu padrão de atividade.';
      if (activityCount > 0 && workout.focus === 'endurance') {
        reason = 'Este treino combina com seu padrão de corrida e resistência.';
      } else if (activityCount > 0 && workout.focus === 'strength') {
        reason = 'Este treino combina com seu padrão de atividade de força.';
      } else if (workout.focus === 'endurance') {
        reason = 'Este treino apoia seu objetivo de resistência.';
      } else if (workout.focus === 'strength') {
        reason = 'Este treino apoia seu objetivo de força.';
      }
      return { ...workout, reason };
    });
}

export { User };
