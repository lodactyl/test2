function main() {
  const listWrapperElement = document.querySelector('.list-wrapper')
  const listElement = document.querySelector('.list')
  const winnerContainerElement = document.querySelector('.winner-container')
  const startElement = document.querySelector('.start')

  if(!listWrapperElement) console.warn(`Элемент с классом .list-wrapper не найден`)
  if(!listElement) console.warn(`Элемент с классом .list не найден`)
  if(!winnerContainerElement) console.warn(`Элемент с классом .result не найден`)
  if(!startElement) console.warn(`Элемент с классом .start не найден`)

  let frameId = 0
  let startSpinTime = 0
  let duration = 5000

  let itemHeight = 0

  let items = []
  let minItemsToSpin = 20
  let maxItemsToSpin = 100
  let itemsToSpin = 0
  let winnerEdges = { top: 0, bottom: 0 }

  startElement?.addEventListener('click', startSpin)
  addEventListener('resize', resize)

  function resize() {
    if(!listWrapperElement) return

    const wrapperRect = listWrapperElement.getBoundingClientRect()

    let itemsInView = items.length > 7 ? 7 : items.length > 5 ? 5 : 3

    itemHeight = wrapperRect.height / itemsInView

    items.forEach((item, i) => {
      item.element.style.height = itemHeight + 'px'
    })

    winnerEdges.top = Math.floor(itemHeight * Math.floor(itemsInView / 2))
    winnerEdges.bottom = Math.floor(winnerEdges.top + itemHeight)
  }

  async function startSpin() {
    if(frameId || !listElement || !winnerContainerElement) return

    itemsToSpin = minItemsToSpin + Math.floor(maxItemsToSpin * Math.random())

    listElement.innerHTML = ''
    winnerContainerElement.innerHTML = ''
    items = []

    fillList(await getData())

    startSpinTime = Date.now()
    frameId = requestAnimationFrame(tick)
  }

  async function getData() {
    const response = await fetch('./data.txt')
    const data = await response.text()

    const dataItems = data.split(/\r?\n/g)
    const shuffledDataItems = dataItems.sort(() => Math.random() - 0.5)

    return shuffledDataItems
  }

  function fillList(dataItems) {
    if(!listElement) return

    dataItems.forEach(data => {
      const itemElement = document.createElement('div')
      itemElement.classList.add('item')

      const contentElement = document.createElement('div')
      contentElement.classList.add('item-content')
      contentElement.textContent = data

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

    if(!listWrapperElement) return

    const wrapperRect = listWrapperElement.getBoundingClientRect()

    items.forEach((item, i) => {
      const itemRect = item.element.getBoundingClientRect()

      const offsetTop = Math.floor(itemRect.top - wrapperRect.top)
      const offsetBottom = Math.floor(offsetTop + itemHeight)

      if (offsetTop >= winnerEdges.top - 3 && offsetBottom <= winnerEdges.bottom + 3) {
        placeWinner(item)
      }
    })
  }

  function placeWinner(item) {
    if(winnerContainerElement) {
      winnerContainerElement.textContent = item.data
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

    listElement.style.transform = `translateY(${t * itemsToSpin * itemHeight}px)`

    items.forEach((item, i) => {

      const itemRect = item.element.getBoundingClientRect()

      if (itemRect.top > wrapperRect.bottom) {
        item.counter += 1
      }

      const y = (listRect.height ) * -1 * item.counter

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