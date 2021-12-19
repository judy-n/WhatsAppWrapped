import * as express from 'express';
import * as path from 'path';
import * as busboy from 'connect-busboy';
import WrappedData from './WrappedData';

const app = express();

app.use(busboy())
app.use(express.static(path.join(path.resolve(), '/static')))

app.get('/', (req, res, next) => {
  console.log('homepage')
  res.sendFile(path.join(path.resolve(), '/index.html'))
})

app.get('/wrapped', (req, res, next) => {
  console.log('wrapped')
  res.sendFile(path.join(path.resolve(), '/wrap.html'))
})

app.post('/upload', async (req, res, next) => {
  const messageJson = await WrappedData.parseTXT(req);
  const data = new WrappedData(messageJson);
  const user1 = data.getUser1();
  const user2 = data.getUser2();
  const firstName1 = data.getFirstName1();
  const firstName2 = data.getFirstName2();
  const numMessages = data.getNumMessages();
  const messagesPerPerson = data.getMessagesPerPerson()
  const wordCountTotal = data.getWordCountTotal()
  const emojisByUsePerPerson = data.getEmojisByUsePerPerson()
  const currentStreak = data.getCurrentStreak()
  const mostActiveHour = data.getNMostActiveHours(1)[0]
  res.json({
    user1,
    user2,
    firstName1,
    firstName2,
    numMessages,
    messagesPerPerson,
    wordCountTotal,
    emojisByUsePerPerson,
    currentStreak,
    mostActiveHour,
  })
})

app.listen(() => {
  console.log('Server started');
});
