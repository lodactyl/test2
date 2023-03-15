function main() {
  const listWrapperElement = document.querySelector('.list-wrapper')
  const listElement = document.querySelector('.list')
  const buttonsElement = document.querySelector('.buttons')
  const startElement = buttonsElement?.querySelector('.start')
  const fileElement = buttonsElement?.querySelector('.file')
  const winnerNameElement = document.querySelector('.winner-name')
  const winnerDescriptionElement = document.querySelector('.winner-description')

  if(!listWrapperElement) console.warn(`Элемент с классом .list-wrapper не найден`)
  if(!listElement) console.warn(`Элемент с классом .list не найден`)
  if(!buttonsElement) console.warn(`Элемент с классом .buttons не найден`)
  if(!startElement) console.warn(`Элемент с классом .start не найден`)
  if(!fileElement) console.warn(`Элемент с классом .file не найден`)
  if(!winnerNameElement) console.warn(`Элемент с классом .winner-name не найден`)
  if(!winnerDescriptionElement) console.warn(`Элемент с классом .winner-description не найден`)

  const minItemsToSpin = 40
  const maxItemsToSpin = 100
  const winnerEdges = { top: 0, bottom: 0 }

  let frameId = 0
  let startSpinTime = 0
  let duration = 5000
  let itemHeight = 0
  let itemsToSpin = 0
  let translatedTotal = 0
  let translatedCurrent = 0

  let items = []
  let fileData = []

  addEventListener('resize', resize)
  fileElement?.addEventListener('change', upload)
  startElement?.addEventListener('click', startSpin)

  function upload(event) {
    if(frameId) return

    try {
      const files = event.target.files;

      if (!files.length) {
        alert('Файл не выбран!')
        return
      }

      const file = files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          fileData = JSON.parse(event.target.result)
          fillList()
          fileElement.value = ''
          startElement?.classList.remove('disabled')
        } catch(error) {
          alert('Что-то пошло не так при парсинге файла')
          startElement?.classList.add('disabled')
        }

        reader.onload = null
      }

      reader.readAsText(file)
    } catch(error) {
      console.error(error)
    }
  }


  function resize() {
    if(!listWrapperElement) return

    const wrapperRect = listWrapperElement.getBoundingClientRect()

    let itemsInView = items.length > 7 ? 7 : items.length > 5 ? 5 : 3

    itemHeight = Math.floor(wrapperRect.height / itemsInView)

    items.forEach((item, i) => {
      item.element.style.height = itemHeight + 'px'
    })

    winnerEdges.top = itemHeight * Math.floor(itemsInView / 2)
    winnerEdges.bottom = winnerEdges.top + itemHeight
  }

  async function startSpin() {
    if(frameId || !listElement || !items.length) return

    buttonsElement?.classList.add('spinning')

    itemsToSpin = minItemsToSpin + Math.floor(maxItemsToSpin * Math.random())

    updateWinner(undefined)

    startSpinTime = Date.now()
    frameId = requestAnimationFrame(tick)
  }

  function fillList() {
    if(!listElement) return

    listElement.style.transform = ''
    listElement.innerHTML = ''
    items = []
    translatedTotal = 0

    if(winnerDescriptionElement) {
      winnerDescriptionElement.innerHTML = ''
    }

    if(winnerNameElement) {
      winnerNameElement.innerHTML = ''
    }

    fileData.sort(() => Math.random() - 0.5).forEach(data => {
      const itemElement = document.createElement('div')
      itemElement.classList.add('item')

      const contentElement = document.createElement('div')
      contentElement.classList.add('item-content')
      contentElement.textContent = data.name

      itemElement.appendChild(contentElement)

      items.push({
        element: itemElement,
        contentElement: contentElement,
        counter: 0,
        data
      })

      listElement.appendChild(itemElement)
    })

    resize()
  }

  function stop() {
    cancelAnimationFrame(frameId)
    frameId = 0
    spin(1)

    translatedTotal += translatedCurrent

    buttonsElement?.classList.remove('spinning')

    if(!listWrapperElement) return

    const wrapperRect = listWrapperElement.getBoundingClientRect()

    items.forEach((item, i) => {
      const itemRect = item.element.getBoundingClientRect()

      const offsetTop = itemRect.top - wrapperRect.top
      const offsetBottom = offsetTop + itemHeight

      if (offsetTop >= winnerEdges.top - 5 && offsetBottom <= winnerEdges.bottom + 5) {
        updateWinner(item.data)
      }
    })
  }

  function updateWinner(itemData) {
    if(winnerNameElement) {
      winnerNameElement.textContent = itemData ? itemData.name : ''
    }

    if(winnerDescriptionElement) {
      winnerDescriptionElement.textContent = itemData ? itemData.description : ''
    }
  }

  function tick() {
    frameId = requestAnimationFrame(tick)

    const now = Date.now()
    const t = (now - startSpinTime) / 1000 / (duration / 1000)
    const et = easeInOutCubic(t)

    if (t >= 1) {
      stop()
      return
    }

    spin(et)
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }

  function spin(t) {
    if(!listWrapperElement || !listElement) return

    const wrapperRect = listWrapperElement.getBoundingClientRect()
    const listRect = listElement.getBoundingClientRect()

    translatedCurrent = Math.floor(t * itemsToSpin * itemHeight)

    listElement.style.transform = `translateY(${translatedTotal + translatedCurrent}px)`

    items.forEach((item, i) => {

      const itemRect = item.element.getBoundingClientRect()

      if (itemRect.top > wrapperRect.bottom) {
        item.counter += 1
      }

      const y = Math.floor((listRect.height) * -1 * item.counter)

      const offsetTop = itemRect.top - wrapperRect.top

      if(
        offsetTop > winnerEdges.top - itemHeight / 2 &&
        offsetTop + itemHeight < winnerEdges.bottom + itemHeight / 2
      ) {
        item.element.classList.add('candidate')
      } else {
        item.element.classList.remove('candidate')
      }

      item.element.style.transform = `translateY(${y}px)`
    })
  }
}

main()
