
google.charts.load('current', {'packages':['corechart', 'bar']});
google.charts.setOnLoadCallback(drawChart);
const { 
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
} = JSON.parse(localStorage.getItem('WAWData') || '{}')

const stopWords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'on', 'in', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"] // ignore this haha

console.log("sdf", emojisByUsePerPerson)

document.querySelectorAll('.fn1').forEach(el => el.innerText = firstName1)
document.querySelectorAll('.fn2').forEach(el => el.innerText = firstName2)
document.querySelector('#count').innerText = numMessages
let hourFormatted = Object.keys(mostActiveHour)[0]
if (+hourFormatted > 12) {
  hourFormatted = `${+hourFormatted - 12} PM`
} else {
  hourFormatted += " AM"
}
document.querySelector("#hour").innerText = hourFormatted
const user1Top3 = emojisByUsePerPerson[0].slice(0,3).reduce((acc, curr) => {
  return acc + curr
}, "")
const user2Top3 = emojisByUsePerPerson[1].slice(0,3).reduce((acc, curr) => {
  return acc + curr
}, "")
document.querySelector("#el1").innerText = user1Top3
document.querySelector("#el2").innerText = user2Top3
document.querySelector("#streak").innerText = currentStreak
console.log(currentStreak)

console.log(user1, user2, messagesPerPerson, 'ye')

function nWordsForCloud(n) {
  if (!wordCountTotal) {
    return []
  }
  let wordList = []
  Object.keys(wordCountTotal)
    .forEach(key => {
      if (!stopWords.includes(key.toLowerCase())) {
        wordList.push({word: key, size: wordCountTotal[key].toString()})
      }
    })
  wordList = wordList.sort((a,b) => {
    return +b.size - +a.size
  })
  console.log('w', wordList.slice(0,n))
  return cloudNormalize(wordList.slice(0,n))
}

function cloudNormalize(wordList) {
  const max = wordList[0].size
  const min = wordList[wordList.length - 1].size
  const cloudMax = 150
  const cloudMin = 25
  return wordList.map(el => {
    const zeroToOne = (el.size - min) / (max - min)
    const normalized = (zeroToOne*(cloudMax - cloudMin)) + cloudMin
    return {...el, size: normalized}
  })
}

function drawChart() {
  
  let style1 = '#EDEDED'
  let style2 = '#4ACA59'
  if (messagesPerPerson[user1].length >= messagesPerPerson[user2].length){
    style1 = '#4ACA59'
    style2 = '#EDEDED'
  }
  
  console.log(messagesPerPerson[user1]);
   let data = google.visualization.arrayToDataTable([
         ['Person', 'Messages', { role: 'style' }],
         [firstName1, messagesPerPerson[user1].length, style1],            
         [firstName2, messagesPerPerson[user2].length, style2],
      ]);

      let chart = new google.visualization.ColumnChart(
      document.getElementById('chart_div'));

      let options = {
      'width': 600,
      'height': 400,
      'legend': 'none',
       'vAxis': {'minValue': 0},
       'animation': {'startup': true,'duration': 5000}
       }

      chart.draw(data, options);
}

// List of words
let myWords = nWordsForCloud(75)
// set the dimensions and margins of the graph
let margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 750 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

// append the svg object to the body of the page
let svg = d3.select("#my_dataviz").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Constructs a new cloud layout instance. It run an algorithm to find the position of words that suits your requirements
// Wordcloud features that are different from one word to the other must be here
let layout = d3.layout.cloud()
  .size([width, height])
  .words(myWords.map(function(d) { return {text: d.word, size:d.size}; }))
  .padding(5)        //space between words
  .rotate(function() { return ~~(Math.random()) * 90; })
  .fontSize(function(d) { return d.size; })      // font size of words
  .on("end", draw);
layout.start();

// This function takes the output of 'layout' above and draw the words
// Wordcloud features that are THE SAME from one word to the other can be here
function draw(words) {
  svg
    .append("g")
      .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
      .selectAll("text")
        .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d.size; })
        .style("fill", function(d) { return Math.random() > 0.5 ? "#4ACA59" : "#c6c6c6"})
        .attr("text-anchor", "middle")
        .style("font-family", "Helvetica")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
}

async function shareDiv(query, selectors = []) {
  try {
    const div = document.querySelector(query)
    div.classList.add('frame')
    const bubble = document.querySelector('.bubble').cloneNode(true)
    const p = document.createElement('p')
    p.classList.add('plug', 'center-for-ss')
    p.append(document.createTextNode("Created with WhatsApp Wrapped"))
    div.insertBefore(bubble, div.childNodes[0])
    div.append(p)
    selectors.forEach(s => document.querySelector(s).classList.add('center-for-ss'))
    const canvas = await html2canvas(div)
    selectors.forEach(s => document.querySelector(s).classList.remove('center-for-ss'))
    div.removeChild(bubble)
    div.removeChild(p)
    div.classList.remove('frame')
    const url = canvas.toDataURL()
    const res1 = await fetch(url)
    const blob = await res1.blob()
    const file = new File([blob], 'fileName.png', {type:"image/png", lastModified:new Date()});
    navigator.share({files: [file]})
  } catch (e) {
    console.error('error generating graphic', e)
  }
}
