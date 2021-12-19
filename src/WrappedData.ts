import * as formidable from 'formidable';
import * as fs from 'fs-extra';
import { Request } from 'express';
import * as dt from 'date-and-time'

type messageType = {[key: string]: string[]}

export default class WrappedData {

  private messageJson: messageType;
  private user1: string = '';
  private user2: string = '';
  private firstName1: string = '';
  private firstName2: string = '';
  private static msgRemove: RegExp = /^\[?\d{4}-\d{2}-\d{2}, \d{1,2}:\d{2}(:\d{2})? (P|A|p|a)\.?(M|m)\.?\]? (- )?/g;
  private static timestamp: RegExp = /^\[?\d{4}-\d{2}-\d{2}, \d{1,2}:\d{2}(:\d{2})? (P|A|p|a)\.?(M|m)\.?\]?/g;
  private static omitted: RegExp = /^[\w ]+: <?(audio|sticker|image|Media) omitted>?/g
  private static ignoreEmojis: string[] = ['🏼', '🏻', '🇮', '🇱', '🇨', '🇦', "'‍", "♀", '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#', "✖", "♂", "🇧", "🏿", "🇲", "🇵", "🇸", "🇴", "🇪", "🇺"];

  static async parseTXT(req: Request): Promise<messageType> {
    let form = formidable({ multiples: false });
    const messageJson: messageType = {}
    return new Promise<messageType>((resolve, reject) => {
      form.parse(req, async (err: any, fields: any, files: any) => {
          const rs = fs.createReadStream(files.fileUploaded.filepath)
          const chunks: any[] = [];
      
          const messages = await new Promise<string>((resolve, reject) => {
            rs.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            rs.on('error', (err) => reject(err));
            rs.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
          })
          
          let split = messages.split(/\r?\n/)
          if (split.length === 0) {
            return {}
          }

          const messageJson: messageType = split.slice(1).reduce((mjson: messageType, str: string, i) => {
            const [timestamp] = str.match(WrappedData.timestamp) || [null]
            const message = str.replace(WrappedData.msgRemove, '')
            if (!timestamp || !message || !!message.match(WrappedData.omitted)) {
              return mjson
            }
            if (mjson[timestamp]) {
              mjson[timestamp].push(message)
            } else {
              mjson[timestamp] = [message]
            }
            return mjson
          }, {})
          resolve(messageJson)
      });
    })
  }

  constructor(messageJson: messageType) {
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

  private getEmojis(s: string): string[] {
    return s.match(/[\p{Emoji}\u200d]/ugi) || []
  }

  getUser1(): string {
    return this.user1 || 'User not found';
  }

  getFirstName1(): string {
    return this.firstName1 || 'User not found';
  }

  getUser2(): string {
    return this.user2 || 'User not found';
  }

  getFirstName2(): string {
    return this.firstName2 || 'User not found';
  }

  getNumMessages(): number {
    return [...Object.values(this.messageJson)].reduce((allMsg: string[], msgs: string[]) => {
      return [...allMsg, ...msgs]
    }, []).length - 1
  }

  getMessagesPerPerson(): {[key: string]: string[]} {
    if (!this.user2) {
      return {'User1 not found': [], 'User2 not found': []}
    }
    const messagesPerPerson: {[key: string]: string[]} = {
      [this.user1]: [],
      [this.user2]: []
    }
    Object.values(this.messageJson).forEach((messages) => {
      messages.forEach(msg => {
        if (msg.startsWith(this.user1)) {
          messagesPerPerson[this.user1].push(msg) 
        } else if (msg.startsWith(this.user2)) {
          messagesPerPerson[this.user2].push(msg)
        } else {
          console.error('something is off', msg)
        }
      })
    })
    return messagesPerPerson
  }

  getNumMessagesPerPerson(): [number, number] {
    const msgPerPerson = this.getMessagesPerPerson()
    if (!this.user1 || !this.user2) {
      return [0, 0]
    }
    return [
      msgPerPerson[this.user1].length,
      msgPerPerson[this.user2].length
    ]
  }

  getWordCountTotal(): {[key: string]: number} {
    const messagesPerPerson = this.getMessagesPerPerson()
    const count: {[key: string]: number} = {}
    const u1Messages = messagesPerPerson[this.user1]
    const u2Messages = messagesPerPerson[this.user2]
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

  getWordCountPerPerson(): {[key: string]: {[key: string]: number}} {
    const messagesPerPerson = this.getMessagesPerPerson()
    const user1Count: {[key: string]: number} = {}
    const user2Count: {[key: string]: number} = {}
    const u1Messages = messagesPerPerson[this.user1]
    const u2Messages = messagesPerPerson[this.user2]
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

  getDaysTexted(utc = false): Date[] {
    const days: Date[] = []
    const added: string[] = []
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
    console.log(days.reverse())
    return days
  }

  getDateMapping(): {[key: string]: string[]} {
    const dateMapping: {[key: string]: string[]} = {}
    Object.keys(this.messageJson).forEach(key => {
      let date: string;
      let newKey: string;
      if (key.startsWith('[')) {
        newKey = key.substring(1,key.indexOf(']')) // [date] => date
        date = new Date(newKey).toString()
      } else {
        newKey = key.replace(/\./g, '')
        date  = new Date(newKey).toString()
      }
      dateMapping[date] = [...(this.messageJson[key] || [])]
    })
    return dateMapping
  }

  getLongestConversation(): string[] {
    const dateMapping = this.getDateMapping()
    let longestConvo: string[] = []
    let currConvo: string[] = []

    const dates = [...Object.keys(dateMapping)]
    for (let i = 0; i < dates.length; i++) {
      for (let msg of dateMapping[dates[i]]) {
        const currDate = new Date(dates[i])
        const prevDate = new Date(dates[i-1])

        if (currConvo.length === 0) {
          currConvo.push(msg)
        } else if (dt.subtract(currDate, prevDate).toMinutes() < 20) {
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

  getNumMessagesByHour(): {[key: number]: number} {
    const dateMapping = this.getDateMapping()
    const numByHour: {[key: number]: number} = {}
    Object.keys(dateMapping).forEach(date => {
      const hours = new Date(date).getUTCHours()
      numByHour[hours] = (numByHour[hours] || 0) + dateMapping[date].length
    })
    return numByHour
  }

  getNMostActiveHours(n: number): {[key: number]: number}[] {
    const numByHour = this.getNumMessagesByHour()
    if (n > 24) {
      return [numByHour]
    } else if (n <= 0) {
      return []
    }
    const sortedByHour: any = []
    for (let i = 0; i < n; i++) {
      const maxKey: number = Object.keys(numByHour).reduce((currMaxKey: number, currKey: string) => {
        return numByHour[currMaxKey] >= numByHour[+currKey] ? currMaxKey : +currKey
      }, -1)
      sortedByHour.push({[maxKey]: numByHour[maxKey]})
      numByHour[maxKey] = -1
    }
    return sortedByHour
  }

  getCurrentStreak(): number {
    const datesTexted = this.getDaysTexted(true)
    // console.log("datesTexted:", datesTexted.reverse())
    let day = new Date()
    console.log('Date is', day)
    let streak = 0
    for (let _i = 0; _i < datesTexted.length; _i++) {
      console.log("this happened...")
      const found = !!datesTexted.find(dateTexted => {
        return dateTexted.toDateString() === day.toDateString()
      })
      if (found) {
        streak++;
        day.setDate(day.getDate() - 1)
      } else {
        console.log("this happened ??")
        break
      }
    }
    console.log(streak)
    return streak
  }

  getLongestStreak(): number {
    const datesTexted = this.getDaysTexted()
    let day = new Date()
    let maxStreak = 0
    let streak = 0
    console.log(datesTexted.length)
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

  getEmojiCounts(): {[key: string]: number} {
    const emojiCounts: {[key: string]: number} = {};
    Object.values(this.messageJson).forEach(messages => {
      messages.forEach(message => {
        if (!message) {
          return
        }
        const emojis = this.getEmojis(message).filter(emoji => !WrappedData.ignoreEmojis.includes(emoji));
        emojis.forEach(emoji => {
          emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1
        })
      })
    })
    console.log('done')
    return emojiCounts
  }

  getEmojiCountsPerPerson(): {[key: string]: {[key: string]: number}} {
    const messagesPerPerson = this.getMessagesPerPerson()
    const u1EmojiCounts: {[key: string]: number} = {}
    const u2EmojiCounts: {[key: string]: number} = {}
    const u1Messages = messagesPerPerson[this.user1]
    const u2Messages = messagesPerPerson[this.user2]
    for (let i = 0; i < Math.max(u1Messages.length, u2Messages.length); i++) {
      const u1Msg = u1Messages[i] || ''
      const u2Msg = u2Messages[i] || ''
      const u1Emojis = this.getEmojis(u1Msg).filter(emoji => !WrappedData.ignoreEmojis.includes(emoji));
      u1Emojis.forEach(emoji => {
        u1EmojiCounts[emoji] = (u1EmojiCounts[emoji] || 0) + 1
      })
      const u2Emojis = this.getEmojis(u2Msg).filter(emoji => !WrappedData.ignoreEmojis.includes(emoji));
      u2Emojis.forEach(emoji => {
        u2EmojiCounts[emoji] = (u2EmojiCounts[emoji] || 0) + 1
      })
    }
    return {
      [this.user1]: u1EmojiCounts,
      [this.user2]: u2EmojiCounts
    }
  }

  getEmojisByUse(): string[] {
    const emojiCounts = this.getEmojiCounts()
    const byUse = Object.keys(emojiCounts).reduce((a: string[] ,b: string) => [...a, b], []).sort((a: string,b: string) => {
      return emojiCounts[b] - emojiCounts[a]
    })
    return byUse
  }

  getEmojisByUsePerPerson(): [string[], string[]] {
    const emojiCountsPerPerson = this.getEmojiCountsPerPerson()
    const user1Counts = emojiCountsPerPerson[this.user1]
    const user2Counts = emojiCountsPerPerson[this.user2]
    const byUseUser1 = Object.keys(user1Counts).reduce((a: string[] ,b: string) => [...a, b], []).sort((a: string,b: string) => {
      return user1Counts[b] - user1Counts[a]
    })
    const byUseUser2 = Object.keys(user2Counts).reduce((a: string[] ,b: string) => [...a, b], []).sort((a: string,b: string) => {
      return user2Counts[b] - user2Counts[a]
    })
    return [byUseUser1, byUseUser2]
  }
}