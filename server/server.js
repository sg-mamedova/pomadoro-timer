process.env.NODE_CONFIG_DIR = './server/config';
var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var path = require("path");
var mongoose = require('mongoose');
var Cookies = require('cookies');

var app = express();

//app.use("/", express.static(path.join(__dirname, 'www')));
app.use("/", express.static('www'));

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/todos', function(err) {
  if (err) {
    console.log("Connection issue: " + err)
  } else {
    console.log("Success connect");
  }
});

var Todo = mongoose.model('Todo', {
  userId: mongoose.Schema.Types.ObjectId,
  text: String,
  isDone: Boolean,
  pinStatus: Boolean,
  pomoRounds: Number
});

var User = mongoose.model('User', {
  login: String,
  password: String
});

function authorize(req, res, next) {
  var cookies = new Cookies(req, res);
  var userId = cookies.get('token');
  if (!userId) {
    return res.status(401).json({messages: ['Unauthorized'], error: true});
  }
  User.findById(userId, function(err, user) {
    if (err) {
      return res.status(500).json({messages: [err.message || err.stack], error: true});
    } else if (!user) {
      return res.status(401).json({messages: ['Unauthorized'], error: true});
    }
    req.user = user;
    next();
  });
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cookieParser());

app.post("/todo/add", authorize, function(req, res) {
  req.body.userId = req.user._id;
  var newTodo = new Todo(req.body);

  newTodo.save(function(err) {
    if (err) {
      return res.status(500).json({messages: [err.message || err.stack], error: true});
    } else {
      res.send(newTodo);
    }
  });
});

app.post('/todo/update', authorize, function(req, res) {
  Todo.findByIdAndUpdate(req.body._id, req.body, function(err, todo) {
    if (err) {
      return res.status(500).json({messages: [err.message || err.stack], error: true});
    } else if (!todo) {
      return res.status(404).json({messages: ["Todo not found"], error: true});
    }
    res.json(todo.toJSON());
  })
});

app.post("/todo/find", authorize, function(req, res) {
  var searchRequest = req.body;
  Todo.find(searchRequest, function(err, todos) {
    if (err) {
      return res.status(500).json({messages: [err.message || err.stack], error: true});
    }
    res.json(todos);
  });
});

app.get("/todo", authorize, function(req, res) {
  Todo.find({ userId: req.user._id }, function(err, todos) {
    if (err) {
      return res.status(500).json({messages: [err.message || err.stack], error: true});
    }
    res.json(todos);
  });
});

app.post("/todo/delete", function(req, res) {
  var todo = req.body;

  Todo.remove({ _id: todo._id }, function(err) {
    if (err) {
      return res.status(500).json({messages: [err.message || err.stack], error: true});
    } else {
      res.send(true);
    }
  });

});

app.post('/signin', function (req, res){
  User.findOne(req.body, function(err, user) {
    if (err) {
      return res.status(500).json({messages: [err.message || err.stack], error: true});
    } else if (!user) {
      return res.status(401).json({messages: ['Unauthorized'], error: true});
    }
    var cookies = new Cookies(req, res);
    cookies.set('token', user._id, { maxAge: 3600 * 30 });
    res.json(user.toJSON());
  });
});

app.post('/signup', function (req, res){
  var newUser = new User(req.body);
  newUser.save(function(err, user) {
    if (err) {
      return res.status(500).json({messages: [err.message || err.stack], error: true});
    }
    var cookies = new Cookies(req, res);
    cookies.set('token', user._id, { maxAge: 3600 * 30 });
    res.json(user.toJSON());
  });
});


app.listen(3000, function() {
  console.log("I'm running on http://localhost:3000")
});