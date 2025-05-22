require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
console.log(process.env.PORT)
const app = express();
const User = require('./models/User');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ✅ Create user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const user = new User({ username });
  await user.save();
  res.json({ username: user.username, _id: user._id });
});

// 📄 Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});

// 🏋️ Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = await User.findById(_id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const exercise = {
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date(),
  };

  user.log.push(exercise);
  await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    date: exercise.date.toDateString(),
    duration: exercise.duration,
    description: exercise.description,
  });
});

// 📜 Get logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = await User.findById(_id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let log = [...user.log];

  if (from) {
    const fromDate = new Date(from);
    log = log.filter((e) => e.date >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    log = log.filter((e) => e.date <= toDate);
  }
  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    })),
  });
});

// 🎧 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
