// import * as dt from 'date-and-time'

// const msgRemove = /^\[?\d{1,4}-?\/?\d{1,2}-?\/?\d{2}, \d{1,2}:\d{2}(:\d{2})? ?(P|A|p|a)?\.?(M|m)?\.?\]? (- )?/g;
// const timergx = /^\[?\d{1,4}-?\/?\d{1,2}-?\/?\d{2}, \d{1,2}:\d{2}(:\d{2})? ?(P|A|p|a)?\.?(M|m)?\.?\]?/g;
const msgRemove = /^\[?\d{1,4}-?\/?\d{1,2}-?\/?\d{2}, \d{1,2}:\d{2}(:\d{2})? (P|A|p|a)?\.?(M|m)?\.?\]? (- )?/g;
const timergx = /^\[?\d{1,4}-?\/?\d{1,2}-?\/?\d{2}, \d{1,2}:\d{2}(:\d{2})? (P|A|p|a)?\.?(M|m)?\.?\]?/g;
const omitted = /<?(audio|sticker|image|Media) omitted>?/g
const ignoreEmojis = ['🏼', '🏻', '🇮', '🇱', '🇨', '🇦', "'‍", "♀", '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#', "✖", "♂", "🇧", "🏿", "🇲", "🇵", "🇸", "🇴", "🇪", "🇺"];

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsText(file);
  })
}

async function parseTXT(file) {
    let messageJson = {}
    const result = await readFileAsync(file)
    const lines = result.split(/\r?\n/g)
    if (lines.length > 0) {
      messageJson = lines.slice(1).reduce((mjson, str, i) => {
        const [timestamp] = str.match(timergx) || [null]
        const message = str.replace(msgRemove, '')
        if (!!message && !!message.match(omitted)) {
          return mjson
        }
        if (!timestamp) {
          if (!message) {
            return mjson
          }
          // part of last message still
          let j = i
          let newts = ""
          while (!newts && j > 1) {
            [newts] = lines[j].match(timergx) || [null]
            j--
          }
          mjson[newts][mjson[newts].length - 1] += ` ${message}`
        } else if (mjson[timestamp]) {
            mjson[timestamp].push(message)
        } else {
            mjson[timestamp] = [message]
        }
        return mjson
      }, {})
    }
    return messageJson
}

class WrappedData {
  constructor(messageJson) {
    this.messageJson = messageJson;
    let exitLoop = false
    for (let messages of Object.values(messageJson)) {
      if (exitLoop) {
        break;
      }
      for (let msg of messages) {
        const user = msg.slice(0,msg.indexOf(':'));
        if (!user) {
          continue
        }
        const [firstName] = user.split(' ');
        if (!this.user1) {
          this.user1 = user;
          this.firstName1 = firstName
        } else if (!this.user2 && user !== this.user1) {
          this.user2 = user;
          this.firstName2 = firstName
        } else if (!this.user2 && user === this.user1) {
          continue
        } else {
          exitLoop = true; // exit outer loop also
          break;
        }
      }
    }
  }

  getEmojis(s) {
    return s.match(/[\p{Emoji}\u200d]/ugi) || []
  }

  getUser1() {
    return this.user1 || 'User not found';
  }

  getFirstName1() {
    return this.firstName1 || 'User not found';
  }

  getUser2() {
    return this.user2 || 'User not found';
  }

  getFirstName2() {
    return this.firstName2 || 'User not found';
  }

  getNumMessages() {
    return [...Object.values(this.messageJson)].reduce((total, msgs) => total + msgs.length, 0) - 1
  }

  getMessagesPerPerson() {
    if (!this.user2) {
      return {'User1 not found': [], 'User2 not found': []}
    }
    const messagesPerPerson = {
      [this.user1]: [],
      [this.user2]: []
    }
    Object.values(this.messageJson).forEach((messages) => {
      messages.forEach(msg => {
        if (msg.startsWith(this.user1)) {
          messagesPerPerson[this.user1].push(msg)
        } else if (msg.startsWith(this.user2)) {
          messagesPerPerson[this.user2].push(msg)
        }
      })
    })
    this.messagesPerPerson = messagesPerPerson
    return messagesPerPerson
  }

  getNumMessagesPerPerson() {
    const msgPerPerson = this.getMessagesPerPerson()
    if (!this.user1 || !this.user2) {
      return [0, 0]
    }
    return [
      msgPerPerson[this.user1].length,
      msgPerPerson[this.user2].length
    ]
  }

  getWordCountTotal() {
    const messagesPerPerson = this.getMessagesPerPerson()
    const count = {}
    const u1Messages = messagesPerPerson[this.user1] || []
    const u2Messages = messagesPerPerson[this.user2] || []
    for (let i = 0; i < Math.max(u1Messages.length, u2Messages.length); i++) {
      let u1MsgSplit = (u1Messages[i] || '').replace(new RegExp(`^${this.user1}: `, 'g'), '').split(' ')
      let u2MsgSplit = (u2Messages[i] || '').replace(new RegExp(`^${this.user2}: `, 'g'), '').split(' ')
      for (let u1word of u1MsgSplit) {
        count[u1word] = (count[u1word] || 0) + 1
      }
      for (let u2word of u2MsgSplit) {
        count[u2word] = (count[u2word] || 0) + 1
      }
    }
    return count
  }

  getWordCountPerPerson() {
    const messagesPerPerson = this.messagesPerPerson || this.getMessagesPerPerson() // don't run again unnecessarily
    const user1Count = {}
    const user2Count = {}
    const u1Messages = messagesPerPerson[this.user1] || []
    const u2Messages = messagesPerPerson[this.user2] || []
    for (let i = 0; i < Math.max(u1Messages.length, u2Messages.length); i++) {
      const u1MsgSplit = (u1Messages[i] || '').split(' ')
      const u2MsgSplit = (u2Messages[i] || '').split(' ')
      for (let u1word of u1MsgSplit) {
        user1Count[u1word] = (user1Count[u1word] || 0) + 1
      }
      for (let u2word of u2MsgSplit) {
        user2Count[u2word] = (user2Count[u2word] || 0) + 1
      }
    }
    return {
      [this.user1]: user1Count,
      [this.user2]: user2Count
    }
  }

  getDaysTexted(utc = false) {
    const days = []
    const added = []
    const dateMapping = this.getDateMapping()
    for (let ts of Object.keys(dateMapping)) {
      let s = new Date(ts).toUTCString()
      s = s.replace(" GMT", "")
      const day = utc
        ? new Date(s)
        : new Date(ts)
      if (!added.includes(day.toDateString())) {
        days.push(day)
        added.push(day.toDateString())
      }
    }
    return days
  }

  getDateMapping() {
    const dateMapping = {}
    Object.keys(this.messageJson).forEach(key => {
      let newKey = key.startsWith('[') ? key.substring(1,key.indexOf(']')) : key.replace(/\./g, '')
      newKey = /^\d\//g.test(newKey) ? "200" + newKey : newKey
      let date = new Date(newKey).toString()
      dateMapping[date] = [...(this.messageJson[key] || [])]
    })
    return dateMapping
  }

  getLongestConversation() {
    const dateMapping = this.getDateMapping()
    let longestConvo = []
    let currConvo = []

    const dates = [...Object.keys(dateMapping)]
    for (let i = 0; i < dates.length; i++) {
      for (let msg of dateMapping[dates[i]]) {
        const currDate = new Date(dates[i])
        const prevDate = new Date(dates[i-1])

        if (currConvo.length === 0) {
          currConvo.push(msg)
        } else if (this.getDiffMins(currDate, prevDate) < 20) {
          currConvo.push(msg)
        } else {
          if (currConvo.length > longestConvo.length) {
            longestConvo = [...currConvo]
          }
          currConvo = [msg]
        }
      }
    }

    return longestConvo
  }

  getDiffMins = (x, y) => Math.round((((Math.abs(x - y)) % 86400000) % 3600000) / 60000);

  getNumMessagesByHour() {
    const dateMapping = this.getDateMapping()
    const numByHour = {}
    Object.keys(dateMapping).forEach(date => {
      const hours = new Date(date).getHours()
      numByHour[hours] = (numByHour[hours] || 0) + dateMapping[date].length
    })
    return numByHour
  }

  getNMostActiveHours(n) {
    const numByHour = this.getNumMessagesByHour()
    if (n > 24) {
      return [numByHour]
    } else if (n <= 0) {
      return []
    }
    const sortedByHour = []
    for (let i = 0; i < n; i++) {
      const maxKey = Object.keys(numByHour)
        .reduce((currMaxKey, currKey) => numByHour[currMaxKey] >= numByHour[+currKey] ? currMaxKey : +currKey, -1)
      sortedByHour.push({[maxKey]: numByHour[maxKey]})
      numByHour[maxKey] = -1
    }
    return sortedByHour
  }

  getCurrentStreak() {
    const datesTexted = this.getDaysTexted(true)
    let day = new Date()
    let streak = 0
    for (let _i = 0; _i < datesTexted.length; _i++) {
      const found = !!datesTexted.find(dateTexted => {
        return dateTexted.toDateString() === day.toDateString()
      })
      if (found) {
        streak++;
        day.setDate(day.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  getLongestStreak() {
    const datesTexted = this.getDaysTexted()
    let day = new Date()
    let maxStreak = 0
    let streak = 0
    for (let _i = 0; _i < datesTexted.length; _i++) {
      const found = !!datesTexted.find(dateTexted => {
        return dateTexted.toDateString() === day.toDateString()
      })
      if (found) {
        streak++;
        if (streak > maxStreak) {
          maxStreak = streak
        }
        day.setDate(day.getDate() - 1)
      } else {
        streak = 0
      }
    }
    return maxStreak
  }

  getEmojiCounts() {
    const emojiCounts = {};
    Object.values(this.messageJson).forEach(messages => {
      messages.forEach(message => {
        if (!message) {
          return
        }
        const emojis = this.getEmojis(message).filter(emoji => !ignoreEmojis.includes(emoji));
        emojis.forEach(emoji => {
          emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1
        })
      })
    })
    return emojiCounts
  }

  getEmojiCountsPerPerson() {
    const messagesPerPerson = this.getMessagesPerPerson()
    const u1EmojiCounts = {}
    const u2EmojiCounts = {}
    const u1Messages = messagesPerPerson[this.user1] || []
    const u2Messages = messagesPerPerson[this.user2] || []
    for (let i = 0; i < Math.max(u1Messages.length, u2Messages.length); i++) {
      const u1Msg = (u1Messages[i] || '').replace(/^.+: /g, '')
      const u2Msg = (u2Messages[i] || '').replace(/^.+: /g, '')
      const u1Emojis = this.getEmojis(u1Msg).filter(emoji => !ignoreEmojis.includes(emoji));
      u1Emojis.forEach(emoji => {
        u1EmojiCounts[emoji] = (u1EmojiCounts[emoji] || 0) + 1
      })
      const u2Emojis = this.getEmojis(u2Msg).filter(emoji => !ignoreEmojis.includes(emoji));
      u2Emojis.forEach(emoji => {
        u2EmojiCounts[emoji] = (u2EmojiCounts[emoji] || 0) + 1
      })
    }
    return {
      [this.user1]: u1EmojiCounts,
      [this.user2]: u2EmojiCounts
    }
  }

  getEmojisByUse() {
    const emojiCounts = this.getEmojiCounts()
    const byUse = Object.keys(emojiCounts).reduce((a, b) => [...a, b], []).sort((a,b) => {
      return emojiCounts[b] - emojiCounts[a]
    })
    return byUse
  }

  getEmojisByUsePerPerson() {
    const emojiCountsPerPerson = this.getEmojiCountsPerPerson()
    const user1Counts = emojiCountsPerPerson[this.user1]
    const user2Counts = emojiCountsPerPerson[this.user2]
    const byUseUser1 = Object.keys(user1Counts).reduce((a, b) => [...a, b], []).sort((a, b) => {
      return user1Counts[b] - user1Counts[a]
    })
    const byUseUser2 = Object.keys(user2Counts).reduce((a, b) => [...a, b], []).sort((a, b) => {
      return user2Counts[b] - user2Counts[a]
    })
    return [byUseUser1, byUseUser2]
  }

  getTopNEmojis(counts, n) {
    const topThree = []
    Object.keys(counts).forEach(key => {
      if (topThree.length < n) {
        topThree.push(key)
      }
      const index = topThree.findIndex(emoji => counts[emoji] < counts[key])
      if (index >= 0) {
        topThree[index] = key
      }
    })
    return topThree
  }

  getTopNEmojisPerPerson(n) {
    const emojiCountsPerPerson = this.getEmojiCountsPerPerson()
    const topThreeUser1 = this.getTopNEmojis(emojiCountsPerPerson[this.user1], n)
    const topThreeUser2 = this.getTopNEmojis(emojiCountsPerPerson[this.user2], n)
    return [topThreeUser1, topThreeUser2]
  }
}
