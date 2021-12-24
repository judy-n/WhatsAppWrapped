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

document.querySelector('#file-submit').addEventListener('click', (e) => {
  const input = document.querySelector('#file-input')
  if (input.files.length === 0) {
    return
  }
  document.querySelector('#status').innerText = "Loading..."
  document.querySelector('.loader').classList.remove("hide")
  e.target.setAttribute('disabled', 'true')
  const data = new FormData()
  data.append('fileUploaded', input.files[0])
  fetch('/upload', {
    method: 'POST',
    body: data,
    "Content-Type": "multipart/form-data"
  }).then(res => res.json()).then(json => {
    localStorage.setItem('WAWData', JSON.stringify(json))
    window.location.href = '/wrapped'
  }).catch(console.error)
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
