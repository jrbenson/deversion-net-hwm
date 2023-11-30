import { getSignals } from './data'
import { Signal, System } from './system'
import { numberToRomanNumeral } from './utils'
import { getFilteredSignals } from './filtering'

import iconJovian from '../ico-jovian.svg'
import iconMining from '../ico-mining.svg'
import iconStation from '../ico-station.svg'
import iconBlank from '../ico-blank.svg'

export class SignalList {
  element: HTMLElement

  _events: Map<string, Function[]> = new Map()

  constructor(element: HTMLElement, data: Map<string, System>) {
    this.element = element

    let html = '<ul>'
    for (let signal of getSignals(data)) {
      html += this.getListItemHTML(signal)
    }
    html += '</ul>'
    this.element.innerHTML = html

    this.element.querySelectorAll('li .header').forEach((li) => {
      li.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const id = target.closest('li')?.dataset.id
        if (id) {
          this.setSelected(id)
        }
      })
    })

    this.element.querySelectorAll('span.system-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const id = target.dataset.id
        document.getElementById('btn-system-list')?.click()
      })
    })
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

  setSelected(id: string, userAction = true) {
    const li = this.element.querySelector('li.selected') as HTMLElement
    let curSelectedId = ''
    if (li) {
      li.classList.remove('selected')
      let selDetails = li.querySelector('.details') as HTMLElement
      if (selDetails) {
        selDetails.style.display = 'none'
      }
      if (li.dataset.id) {
        curSelectedId = li.dataset.id.trim()
      }
    }

    if (curSelectedId === id && userAction) {
      this._events.get('select')?.forEach((callback) => {
        callback('__deselect__')
      })
      return
    }

    if (id && id !== '__deselect__') {
      const item = this.element.querySelector(`li[data-id="${id}"]`) as HTMLElement
      if (item) {
        item.classList.add('selected')
        let selDetails = item.querySelector('.details') as HTMLElement
        if (selDetails) {
          selDetails.style.display = 'inline-block'
        }
        let prevOffset = 0
        const header = item.querySelector('.header') as HTMLElement
        if (header) {
          prevOffset = header.offsetHeight + header.offsetHeight * 0.2
        }
        this.element.scrollTo({ top: item.offsetTop - prevOffset, behavior: 'smooth' })
        //this.element.scrollTop = item.offsetTop
      }

      if (userAction) {
        this._events.get('select')?.forEach((callback) => {
          callback(id)
        })
      }
    }
  }

  getListItemHTML(signal: Signal) {
    // const stationIndicatorHTML = system.station
    //   ? `<img class="icon" src="${iconStation}"/>`
    //   : `<img class="icon" src="${iconBlank}"/>`
    // const asteroidIndicatorHTML =
    //   system.asteroids.length > 0 ? `<img class="icon" src="${iconMining}"/>` : `<img class="icon" src="${iconBlank}"/>`
    // const jovianIndicatorHTML =
    //   system.jovians.length > 0 ? `<img class="icon" src="${iconJovian}"/>` : `<img class="icon" src="${iconBlank}"/>`

    let html = `
      <li data-id="${signal.id}">
        <div class="header">
          <span class="name">${signal.name} <span class="subtle">${signal.suffix}</span></span>
          <span class="summary">
            <span class="type"></span>
            <span class="tier-wrapper ${signal.rarity}">
              <span class="tier">${numberToRomanNumeral(signal.tier)}</span>
              <span class="level">${signal.level}</span>
            </span>
          </span>
        </div>
        <div class="details">
          <span class="system-link" data-id="${signal.systemName}">${signal.systemName}</span>
        </div>
      </li>
    `
    return html
  }

  setFiltered(filters: Map<string, string>, data: Map<string, System>) {
    const keepIds = getFilteredSignals(data, filters).map((signal) => {
      return signal.id
    })
    this.element.querySelectorAll('li').forEach((li) => {
      const id = li.dataset.id
      if (id && keepIds.includes(id)) {
        li.classList.remove('hidden')
      } else {
        li.classList.add('hidden')
      }
    })
  }
}
