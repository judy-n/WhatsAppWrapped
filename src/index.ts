import * as express from 'express';
import * as path from 'path';
import axios from 'axios'
import WrappedData from './WrappedData';

const app = express();

app.use(express.static(path.join(path.resolve(), '../static')))

function requireHTTPS(req: express.Request, res: express.Response, next: express.NextFunction) {
  // The 'x-forwarded-proto' check is for Heroku
  // if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
  //   return res.redirect('https://' + req.get('host') + req.url);
  // }
  next();
}

app.get('/', requireHTTPS, (req, res, next) => {
  res.sendFile(path.join(path.resolve(), '../index.html'))
})

app.get('/wrapped', requireHTTPS, async (req, res, next) => {
  await axios.get("https://www.fourquadrant.tech/api/whatsappwrapped")
  res.sendFile(path.join(path.resolve(), '../wrap.html'))
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

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log('Server started on', port);
});
