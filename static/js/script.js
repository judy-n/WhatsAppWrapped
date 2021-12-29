const actualBtn = document.getElementById('file-input');

const fileChosen = document.getElementById('file-chosen');

actualBtn.addEventListener('change', function(){
  fileChosen.textContent = this.files[0].name
})

function dropHandler(ev) {

  const dragText = document.getElementById('drag')
  dragText.innerText = "Drag & drop here"

  ev.preventDefault();
  if (ev.dataTransfer.files) {
      let i = ev.dataTransfer.files.length
      if (ev.dataTransfer.files[i-1].type === "text/plain") {
         const fileInput = document.getElementById('file-input')
        fileInput.files = ev.dataTransfer.files
        const uploadedFile = document.getElementById('file-chosen')
        uploadedFile.innerText = fileInput.files[0].name
      }
    }
}

function dragOverHandler(ev) {
  ev.preventDefault();

  const dragText = document.getElementById('drag')
  dragText.innerText = "Release to upload..."
}

function dragLeaveHandler(e) {
  const dragText = document.getElementById('drag')
  dragText.innerText = "Drag & drop here"
}

document.querySelector('#samp').addEventListener('click', (e) => {
  e.preventDefault()
  fetch('sample.txt')
    .then(response => response.text())
    .then(text => {
      const lines = text.split('\r?\n').map(line => line + "\n")
      const file = new File(lines, "fileUploaded.txt", {type: "text/plain", lastModified: new Date()})
      parseTXT(file).then(parsed => {
        const wrapped = new WrappedData(parsed)
        const toStore = JSON.stringify({
          user1: wrapped.getUser1(),
          user2: wrapped.getUser2(),
          firstName1: wrapped.getFirstName1(),
          firstName2: wrapped.getFirstName2(),
          numMessages: wrapped.getNumMessages(),
          messagesPerPerson: wrapped.getMessagesPerPerson(),
          wordCountTotal: wrapped.getWordCountTotal(),
          topThreeEmojisPerPerson: wrapped.getTopNEmojisPerPerson(3),
          currentStreak: wrapped.getCurrentStreak(),
          mostActiveHour: wrapped.getNMostActiveHours(1)[0]
        })
        sessionStorage.setItem('WAWData', toStore)
        window.location.href = '/wrapped'
      })
    })
})
document.querySelector('#file-submit').addEventListener('click', (e) => {
  const input = document.querySelector('#file-input')
  if (input.files.length === 0) {
    return
  }
  document.querySelector('#status').innerText = "Loading..."
  document.querySelector('.loader').classList.remove("hide")
  e.target.setAttribute('disabled', 'true')
  parseTXT(input.files[0]).then(parsed => {
    const wrapped = new WrappedData(parsed)
    const toStore = JSON.stringify({
      user1: wrapped.getUser1(),
      user2: wrapped.getUser2(),
      firstName1: wrapped.getFirstName1(),
      firstName2: wrapped.getFirstName2(),
      numMessages: wrapped.getNumMessages(),
      messagesPerPerson: wrapped.getMessagesPerPerson(),
      wordCountTotal: wrapped.getWordCountTotal(),
      topThreeEmojisPerPerson: wrapped.getTopNEmojisPerPerson(3),
      currentStreak: wrapped.getCurrentStreak(),
      mostActiveHour: wrapped.getNMostActiveHours(1)[0]
    })
    sessionStorage.setItem('WAWData', toStore)
    window.location.href = '/wrapped'
  })
})

const dataDesc = document.querySelector("#data")
const tooltip = document.querySelector("#tooltip")
const arrow = document.querySelector("#p-arrow")
const disclaimer = document.querySelector("#disclaim")
Popper.createPopper(dataDesc, tooltip, { placement: 'bottom' })

disclaimer.addEventListener('mouseover', () => {
  tooltip.classList.remove('hidden');
  [...tooltip.children].forEach(child => child.classList.remove('hidden'))
})

disclaimer.addEventListener('mouseout', () => {
  tooltip.classList.add('hidden');
  [...tooltip.children].forEach(child => child.classList.add('hidden'))
})
