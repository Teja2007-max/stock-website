/**
 * In-memory store — replaces MongoDB for zero-config dev.
 * Data is lost on server restart (by design for dev).
 * Replace with real Mongoose models when connecting to a real MongoDB URI.
 */
const { v4: uuidv4 } = (() => {
  try { return require('uuid'); } catch { return { v4: () => Math.random().toString(36).slice(2) }; }
})();

const users = [];    // [{ _id, username, email, password, createdAt }]
const history = [];  // [{ _id, userId, symbol, action, metadata, timestamp }]

const store = {
  users: {
    findByEmail: (email) => users.find(u => u.email === email),
    findByUsername: (username) => users.find(u => u.username === username),
    findById: (id) => users.find(u => u._id === id),
    create: (data) => {
      const user = { _id: uuidv4(), ...data, createdAt: new Date() };
      users.push(user);
      return user;
    },
  },
  history: {
    findByUser: (userId) => history.filter(h => h.userId === userId).sort((a, b) => b.timestamp - a.timestamp),
    create: (data) => {
      const entry = { _id: uuidv4(), ...data, timestamp: new Date() };
      history.push(entry);
      return entry;
    },
  },
};

module.exports = store;
