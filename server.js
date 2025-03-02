const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'Viraj&*#$', 
  resave: false,
  saveUninitialized: true
}));

const users = [
  { username: 'user1', password: 'password1' },
  { username: 'user2', password: 'password2' }
];

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send('Invalid credentials');
  }
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = user;
    res.redirect(`/userFiles.html?username=${user.username}`);
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/');
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userFolderPath = path.join(__dirname, 'user_files', req.session.user.username);
    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath);
    }
    cb(null, userFolderPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.get('/files/:username', isAuthenticated, (req, res) => {
  const userFolderPath = path.join(__dirname, 'user_files', req.params.username);

  fs.readdir(userFolderPath, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading user files.');
    }
    res.json(files);
  });
});

app.get('/files/:username/:filename', isAuthenticated, (req, res) => {
  const filePath = path.join(__dirname, 'user_files', req.params.username, req.params.filename);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(404).send('File not found.');
    }
    res.send(data);
  });
});

app.post('/upload', isAuthenticated, upload.single('file'), (req, res) => {
  res.send('File uploaded successfully.');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
