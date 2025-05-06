const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const mongoose = require('mongoose');

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); // for parsing JSON bodies

// MongoDB connection
const uri = `mongodb+srv://randomboiii069:samsung@freecodecampprojects.amkpvst.mongodb.net/?retryWrites=true&w=majority&appName=FreeCodeCampProjects`;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  }
});

const exerciseSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Get all users
app.get('/api/users', async (_, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;

  const newUser = new User({ username });

  newUser.save()
    .then(user => {
      res.json({ username: user.username, _id: user._id });
    })
    .catch(err => {
      console.error('Error creating user:', err);
      res.status(400).json({ error: 'Username already taken or invalid' });
    });
});

// Add new exercise
app.post('/api/users/:id/exercises', async (req, res) => {
  const userId = req.params.id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newExercise = new Exercise({
      userId,
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date(),
    });

    const savedExercise = await newExercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: savedExercise.date.toDateString(),
      duration: savedExercise.duration,
      description: savedExercise.description,
    });
  } catch (err) {
    console.error('Error creating exercise:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  let { from, to, limit } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const filter = { userId };

    // Handle 'from' and 'to' query parameters for date filtering
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);  // Date >= from
      if (to) filter.date.$lte = new Date(to);      // Date <= to
    }

    // Initialize the query
    let query = Exercise.find(filter).select('-__v -userId');

    // Apply 'limit' if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const exercises = await query.exec();

    // Send the response in the required format
    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date.toDateString(),
      })),
    });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Server start
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
