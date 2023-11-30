import createPanZoom, { PanZoom } from 'panzoom'
import { System } from './system'
import { getJovianBandsHTML, getOresInAsteroids } from './data'
import { newSVG } from './svg'
import { getFilteredSystems } from './filtering'

import { numberToRomanNumeral } from './utils'

import iconJovian from '../ico-jovian.svg'
import iconMining from '../ico-mining.svg'
import iconStation from '../ico-station.svg'

export class StarChart {
  element: HTMLElement
  panzoom: PanZoom
  stars: Map<string, Star> = new Map()
  staticElements: SVGElement[] = []

  _events: Map<string, Function[]> = new Map()

  constructor(element: HTMLElement, svgText: string, data: Map<string, System>) {
    this.element = element

    this.panzoom = createPanZoom(this.element, {
      minZoom: 1,
      maxZoom: 10,
      bounds: true,
      boundsPadding: 0.1,
      onTouch: function (e) {
        // console.log(e)
        return false
      },
    })

    const listElems = document.querySelectorAll('.list').forEach((elem) => {
      const listElem = elem as HTMLElement
      listElem.addEventListener('mouseover', () => {
        this.panzoom.pause()
      })
      listElem.addEventListener('mouseout', () => {
        this.panzoom.resume()
      })
      // listElem.addEventListener('mousewheel', () => {
      //   this.panzoom.pause()
      // })
      listElem.addEventListener('touchstart', () => {
        this.panzoom.pause()
      })
      listElem.addEventListener('touchend', () => {
        this.panzoom.resume()
      })
    })

    this.element.innerHTML = svgText

    const svg = this.element.querySelector('svg') as SVGSVGElement
    let y = window.innerHeight / 2 - svg.clientHeight / 2

    this.panzoom.moveTo(0, y)

    this.update(data)
    this.handleZoom()
    this.panzoom.on('zoom', (e) => {
      this.handleZoom()
    })
    window.onresize = () => {
      this.handleZoom()
    }
  }

  on(event: string, callback: Function) {
    if (!this._events.has(event)) {
      this._events.set(event, [])
    }
    this._events.get(event)?.push(callback)
  }

  off(event: string, callback: Function) {
    if (this._events.has(event)) {
      const callbacks = this._events.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  handleZoom() {
    const interactiveZoom = this.panzoom.getTransform().scale //Number(this.element.style.transform.split(',')[0].split('(')[1])
    const resizeZoom = window.innerWidth / (32 * 40)
    for (let star of this.stars.values()) {
      star.handleZoom(interactiveZoom * resizeZoom)
    }
  }

  update(data: Map<string, System>) {
    for (let [name, system] of data) {
      const svg = this.element.querySelector('svg') as SVGSVGElement
      if (name === '') {
        console.log('name is empty', system)
        break
      }
      const marker = this.element.querySelector(`#${name.replace(/ /g, '_')}`) as SVGCircleElement
      if (marker) {
        this.stars.set(name, new Star(system, svg, marker.cx.baseVal.value, marker.cy.baseVal.value))
        marker.remove()
      }
    }
    let starList = Array.from(this.stars.values())
    starList
      .sort((a, b) => {
        return a.y - b.y
      })
      .forEach((star) => {
        star.addSVG()
      })

    this.element.querySelectorAll('.header-wrapper').forEach((elem) => {
      elem.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const id = target.closest('div')?.dataset.id
        if (id) {
          this.setSelected(id)
        }
      })
    })
  }

  setSelected(id: string, userAction = true) {
    const curSelectedDiv = this.element.querySelector('div.selected') as HTMLElement
    let curSelectedId = ''
    if (curSelectedDiv) {
      curSelectedDiv.classList.remove('selected')
      this.stars.get(id)?.returnToOriginalPosition()
      if (curSelectedDiv.dataset.id) {
        curSelectedId = curSelectedDiv.dataset.id
      }
    }

    if (curSelectedId === id && userAction) {
      this._events.get('select')?.forEach((callback) => {
        callback('__deselect__', false)
      })
      return
    }

    if (id && id !== '__deselect__') {
      const item = this.element.querySelector(`div[data-id="${id}"]`) as HTMLElement
      if (item) {
        item.classList.add('selected')
        this.stars.get(id)?.moveToFront()
        const selectedStar = this.stars.get(id)
        if (selectedStar && !userAction) {
          const list = document.querySelector('#system-list') as HTMLElement
          const listWidth = list.clientWidth

          const curTransform = this.panzoom.getTransform()
          const curScale = curTransform.scale
          const winMidY = window.innerHeight / 2
          const winMidX = window.innerWidth / 2
          const svg = this.element.querySelector('svg') as SVGSVGElement
          const svgMidY = svg.clientHeight / 2
          const svgMidX = svg.clientWidth / 2
          const svgViewBox = svg.viewBox.baseVal
          const svgScale = svgViewBox.width / svg.clientWidth
          const verticalCenterOffset = window.innerHeight / 2 - svg.clientHeight / 2

          const targetX = svgMidX - selectedStar.x * (1 / svgScale) - listWidth / 2
          const targetY = svgMidY - selectedStar.y * (1 / svgScale) + verticalCenterOffset

          // console.log('target', targetX, targetY)
          // console.log('svgmid', svgMidX, svgMidY)
          // console.log('svgScale', svgScale)
          // console.log('starcoord', selectedStar.x, selectedStar.y)
          // console.log('offeset', verticalCenterOffset)

          this.panzoom.zoomAbs(winMidX, winMidY, 1)
          this.panzoom.smoothMoveTo(targetX, targetY)
          // this.panzoom.zoomAbs(winMidX, winMidY, curScale)
        }
      }
      if (userAction) {
        this._events.get('select')?.forEach((callback) => {
          callback(id, false)
        })
      }
    }
  }

  setFiltered(filters: Map<string, string>, data: Map<string, System>) {
    const keepIds = getFilteredSystems(data, filters).map((system) => {
      return system.name
    })
    this.element.querySelectorAll('#map .container').forEach((cont) => {
      const contElem = cont as HTMLDivElement
      const gElem = cont.closest('g') as SVGGElement
      const id = contElem.dataset.id
      if (id && keepIds.includes(id)) {
        gElem.style.display = 'unset'
      } else {
        gElem.style.display = 'none'
      }
    })
  }
}

class Star {
  data: System
  svg: SVGSVGElement
  x: number
  y: number

  svgMainGroup = newSVG('g') as SVGGElement

  containerElem: HTMLDivElement | null = null
  nameElem: HTMLSpanElement | null = null
  detailsElem: HTMLSpanElement | null = null

  _nextSibling: SVGElement | null = null

  constructor(data: System, svg: SVGSVGElement, x: number, y: number) {
    this.data = data
    this.svg = svg
    this.x = x
    this.y = y
    this.createSVG()
  }

  createSVG() {
    const CONNECT_OFFSET = { x: 0, y: -26 }
    const PADDING = 4
    const STAR_RADIUS = 5
    const BASE_FONT_SIZE = 20
    const BOX_SIZE = BASE_FONT_SIZE + 1

    this.svgMainGroup.setAttribute('transform', `translate(${this.x} ${this.y})`)

    const star = newSVG('circle')
    star.setAttribute('cx', `${CONNECT_OFFSET.x}`)
    star.setAttribute('cy', `${CONNECT_OFFSET.y}`)
    star.setAttribute('r', `${STAR_RADIUS}`)
    star.setAttribute('fill', '#ffffff')
    star.classList.add('star')
    this.svgMainGroup.appendChild(star)

    const newMarker = newSVG('circle')
    newMarker.setAttribute('cx', '0')
    newMarker.setAttribute('cy', '0')
    newMarker.setAttribute('r', `${STAR_RADIUS / 2}`)
    newMarker.setAttribute('fill', '#ffffff55')
    this.svgMainGroup.appendChild(newMarker)

    const connector = newSVG('line')
    connector.setAttribute('x1', `${CONNECT_OFFSET.x}`)
    connector.setAttribute('y1', `${CONNECT_OFFSET.y}`)
    connector.setAttribute('x2', '0')
    connector.setAttribute('y2', `${-STAR_RADIUS / 2}`)
    connector.setAttribute('stroke', '#ffffff66')
    connector.setAttribute('stroke-width', '0.5')
    this.svgMainGroup.appendChild(connector)

    let html = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    html.setAttribute('x', `${STAR_RADIUS + PADDING}`)
    html.setAttribute('y', `${CONNECT_OFFSET.y}`)
    html.setAttribute('height', '1')
    html.setAttribute('width', '100%')
    html.style.overflow = 'visible'

    this.containerElem = document.createElement('div')
    this.containerElem.classList.add('container')
    this.containerElem.dataset.id = this.data.name

    const header = document.createElement('span')
    header.classList.add('row')

    const headerWrapper = document.createElement('span')
    headerWrapper.classList.add('header-wrapper')

    const tierWrapper = document.createElement('span')
    tierWrapper.classList.add('tier-wrapper')

    const tier = document.createElement('span')
    tier.classList.add('tier')
    tier.innerHTML = numberToRomanNumeral(this.data.tier)

    const level = document.createElement('span')
    level.classList.add('level')
    level.innerHTML = String(this.data.level)

    this.nameElem = document.createElement('span')
    this.nameElem.classList.add('name')
    this.nameElem.innerHTML = this.data.name

    this.containerElem.appendChild(header)
    header.appendChild(headerWrapper)
    headerWrapper.appendChild(tierWrapper)
    tierWrapper.appendChild(tier)
    tierWrapper.appendChild(level)
    headerWrapper.appendChild(this.nameElem)

    this.detailsElem = document.createElement('span')
    this.detailsElem.classList.add('row', 'detail-row')

    if (this.data.station) {
      const station = document.createElement('span')
      station.classList.add('detail')
      const stationIcon = document.createElement('img')
      stationIcon.src = iconStation
      stationIcon.classList.add('icon')
      station.appendChild(stationIcon)
      this.detailsElem.appendChild(station)
    }

    if (this.data.asteroids.length > 0) {
      const mining = document.createElement('span')
      mining.classList.add('detail')
      const miningIcon = document.createElement('img')
      miningIcon.src = iconMining
      miningIcon.classList.add('icon')
      const miningDetails = document.createElement('span')
      miningDetails.innerHTML = `${getOresInAsteroids(this.data.asteroids).join('')}`
      mining.appendChild(miningIcon)
      mining.appendChild(miningDetails)
      this.detailsElem.appendChild(mining)
    }

    if (this.data.jovians.length > 0) {
      const jovian = document.createElement('span')
      jovian.classList.add('detail')
      const jovianIcon = document.createElement('img')
      jovianIcon.src = iconJovian
      jovianIcon.classList.add('icon')
      const jovianDetails = document.createElement('span')
      jovianDetails.innerHTML = getJovianBandsHTML(this.data.jovians)
      jovian.appendChild(jovianIcon)
      jovian.appendChild(jovianDetails)
      this.detailsElem.appendChild(jovian)
    }

    this.containerElem.appendChild(this.detailsElem)

    html.appendChild(this.containerElem)

    this.svgMainGroup.appendChild(html)
  }

  addSVG() {
    this.svg.appendChild(this.svgMainGroup)
    this._nextSibling = this.svgMainGroup.nextSibling as SVGElement
  }

  moveToFront() {
    this.svg.appendChild(this.svgMainGroup)
  }

  returnToOriginalPosition() {
    if (this._nextSibling) {
      this.svg.insertBefore(this.svgMainGroup, this._nextSibling)
    } else {
      this.svg.appendChild(this.svgMainGroup)
    }
  }

  handleZoom(scale: number) {
    this.containerElem?.classList.remove('lod-1', 'lod-2', 'lod-3', 'lod-4')
    if (scale > 2) {
      this.containerElem?.classList.add('lod-1')
    } else if (scale > 1.5) {
      this.containerElem?.classList.add('lod-2')
    } else if (scale > 0.8) {
      this.containerElem?.classList.add('lod-3')
    } else {
      this.containerElem?.classList.add('lod-4')
    }
    if (this.svgMainGroup) {
      let transform = this.svgMainGroup.getAttribute('transform')
      if (transform) {
        if (transform.includes('scale')) {
          transform = transform.replace(/scale(.*)/g, `scale(${1 / scale})`)
        } else {
          transform += ` scale(${1 / scale})`
        }
        this.svgMainGroup.setAttribute('transform', transform)
      }
    }
  }
}
