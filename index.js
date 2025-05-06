const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config()
const mongoose = require('mongoose');
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
const uri = "mongodb+srv://randomboiii069:samsung@freecodecampprojects.amkpvst.mongodb.net/?retryWrites=true&w=majority&appName=FreeCodeCampProjects";
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  }
})
const User = mongoose.model('User', userSchema);
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
const Exercise = mongoose.model('Exercise', exerciseSchema);
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.get('/api/users', async (_, res) => {
  try {
    const users = await User.find({}, 'username _id'); // Only return username and _id
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }

})
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const newUser = new User({
    username: username
  })
  newUser.save().then(user => {
    res.json({
      username,
      _id: user._id
    })
  })
    .catch(err => {
      console.error('Error creating user:', err);
    });

})

app.post('/api/users/:id/exercises', (req, res) => {
  const id = req.params.id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const newExercise = new Exercise({
    userId: id,
    description: description,
    duration: duration,
    date: date
  })
  newExercise.save().then(exercise => {
    User.findById(id).then(user => {
      res.json({
        _id: id,
        username: user.username,
        date: exercise.date.toDateString(),
        duration: exercise.duration,
        description: exercise.description,
      })
    })
      .catch(err => {
        console.error('Error finding user:', err);
      });
  })
    .catch(err => {
      console.error('Error creating exercise:', err);
    });

})
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const { _id } = req.params;

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Build query object
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const filter = {
      userId: _id,
      ...(from || to ? { date: dateFilter } : {})
    };

    // Find exercises
    let query = Exercise.find(filter).select('description duration date');

    if (limit) query = query.limit(parseInt(limit));

    const exercises = await query.exec();

    // Format log with date as string
    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log: log
    });

  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const { _id } = req.params;

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const query = { userId: _id };
    
    // Filter by date range
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    let exercisesQuery = Exercise.find(query).select("-__v -_id");

    // Apply limit
    if (limit) exercisesQuery = exercisesQuery.limit(parseInt(limit));

    const logs = await exercisesQuery.exec();

    const formattedLogs = logs.map(log => ({
      description: log.description,
      duration: log.duration,
      date: log.date.toDateString(),
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: formattedLogs.length,
      log: formattedLogs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
