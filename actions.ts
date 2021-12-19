// document.querySelector("#file-submit")?.addEventListener('click', (e) => {
//   const inputEl = document.querySelector('#file-input')
//   let file: File | null;
//   if (inputEl) {
//     file = (inputEl as HTMLInputElement).files[0]
//     if (!file) {
//       return
//     }
//   } else {
//     return
//   }
//   const req = new Request('/upload', {
//     method: 'POST',
//     body: file,
//     headers: {
//       "Content-Type": "multipart/form-data"
//     }
//   })
//   fetch(req)
//     .then(res => res.json())
//     .then(res => console.log('got', res))
//     .catch(console.error)
// })