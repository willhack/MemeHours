const express = require('express');
const app = express();
const socketIO = require('socket.io');
const path = require('path');

const port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (_request, response) =>
  response.sendFile(path.resolve(`${__dirname}/../dist/index.html`)),
);
const server = app.listen(port, () => console.log(`server listening on ${port}.`));
const io = socketIO(server);

const players = [];
const submissions = [];
io.on('connection', socket => {
  console.log('new client connected');
  socket.on('newPlayer', playerName => {
    const playerObject = {
      name: playerName,
      id: socket.id,
      isHost: players.length < 1,
    };
    players.push(playerObject);
    io.emit('updatePlayers', players);
    socket.emit('getSelf', playerObject);
  });
  socket.on('ideate', () => {
    io.emit('ideate');
    io.emit('randomNumber', Math.floor(Math.random() * 100));
  });

  socket.on('submitImage', ([name, id, memeUrl]) => {
    // console.log(name, memeUrl);
    // once submissions line 16 length === players length move on
    submissions.push({ name, id, memeUrl });
    // console.log(submissions);
    if (submissions.length === players.length) io.emit('voting');
  });

  socket.on('disconnect', sckt => {
    // removal from users array
    for (let i = 0; i < players.length; i++) {
      if (players[i].id === socket.id) {
        players.splice(i, 1);
        break;
      }
    }
    if (players.length) players[0].isHost = true;
    io.emit('updatePlayers', players);
    console.log('a user disconnected');
    // removal from submissions array
    for (let i = 0; i < submissions.length; i += 1) {
      if (submissions[i].id === socket.id) {
        submissions.splice(i, 1);
        break;
      }
    }
    if (submissions.length === players.length) io.emit('voting');
  });
});
