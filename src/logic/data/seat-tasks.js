// src/logic/data/seat-tasks.js
export function generateSeatTasks(count = 27) {
  const names = ['张代表','李代表','王代表','刘代表','陈代表','杨代表','赵代表','黄代表','周代表','吴代表','徐代表','孙代表','胡代表','朱代表','高代表','林代表','何代表','郭代表','马代表','罗代表','梁代表','宋代表','郑代表','谢代表','韩代表','唐代表','冯代表'];
  const taskDefs = [
    { type: 'arrangeSchool', costMin: 1, costMax: 2, resource: 'education' },
    { type: 'arrangeJob', costMin: 1, costMax: 2, resource: 'sasac' },
    { type: 'bailFriend', costMin: 1, costMax: 2, resource: 'publicSecurity' },
    { type: 'businessProject', costMin: 1, costMax: 2, resource: 'housing' },
    { type: 'buildConnections', costMin: 2, costMax: 2, resource: 'any' }
  ];
  const tasks = [];
  for (let i = 0; i < count; i++) {
    const def = taskDefs[Math.floor(Math.random() * taskDefs.length)];
    const cost = def.costMin + Math.floor(Math.random() * (def.costMax - def.costMin + 1));
    tasks.push({
      id: `seat_${String(i + 1).padStart(2, '0')}`,
      name: names[i] || `代表${i + 1}`,
      task: { type: def.type, cost, resourceType: def.resource },
      visitorId: null, lockedById: null, roundsRemaining: 2, revealed: false, visitedOnTurn: 0, scoutedBy: []
    });
  }
  return tasks;
}
