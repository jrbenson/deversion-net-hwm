import { getOreLevelRangeHTML, getJovianBandsHTML } from './data'
import { System } from './system'
import { numberToRomanNumeral } from './utils'
import { getFilteredSystems } from './filtering'

import iconJovian from '../ico-jovian.svg'
import iconMining from '../ico-mining.svg'
import iconStation from '../ico-station.svg'
import iconBlank from '../ico-blank.svg'

export class SystemList {
  element: HTMLElement

  _events: Map<string, Function[]> = new Map()

  constructor(element: HTMLElement, data: Map<string, System>) {
    this.element = element

    let html = '<ul>'
    for (let [name, system] of data) {
      html += this.getListItemHTML(system)
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

  getListItemHTML(system: System) {
    const stationIndicatorHTML = system.station
      ? `<img class="icon" src="${iconStation}"/>`
      : `<img class="icon" src="${iconBlank}"/>`
    const asteroidIndicatorHTML =
      system.asteroids.length > 0 ? `<img class="icon" src="${iconMining}"/>` : `<img class="icon" src="${iconBlank}"/>`
    const jovianIndicatorHTML =
      system.jovians.length > 0 ? `<img class="icon" src="${iconJovian}"/>` : `<img class="icon" src="${iconBlank}"/>`

    let html = `
      <li data-id="${system.name}">
        <div class="header">
          <span class="name">${system.name}</span>
          <span class="summary">
          ${asteroidIndicatorHTML}${jovianIndicatorHTML}${stationIndicatorHTML}
            <span class="tier-wrapper">
              <span class="tier">${numberToRomanNumeral(system.tier)}</span>
              <span class="level">${system.level}</span>
            </span>
          </span>
        </div>
        <div class="details">
          ${this.getAsteroidHTML(system)}
          ${this.getJovianHTML(system)}
          ${system.asteroids.length > 0 || system.jovians.length > 0 ? '<hr>' : ''}
          <div class="signals">
          ${this.getSignalHTML(system)}
          </div>
        </div>
      </li>
    `
    return html
  }

  getAsteroidHTML(system: System) {
    let html = ''
    if (system.asteroids.length > 0) {
      html += `<div class="detail-row"><img class="icon" src="${iconMining}"/>&nbsp;${getOreLevelRangeHTML(
        system.asteroids
      )}</div>`
    }
    return html
  }

  getSignalHTML(system: System) {
    let html = ''
    for (let signal of system.signals) {
      html += `<div class="signal"><div class="sig-header"><span class="level ${signal.rarity}">${signal.level}</span>${signal.name}<span class="subtle">${signal.suffix}</span></div><div class="sig-details"></div></div>`
    }
    return html
  }

  getJovianHTML(system: System) {
    let html = ''
    if (system.jovians.length > 0) {
      html += `<div class="detail-row"><img class="icon" src="${iconJovian}"/>&nbsp;${getJovianBandsHTML(
        system.jovians,
        3
      )}</div>`
    }
    return html
  }

  setFiltered(filters: Map<string, string>, data: Map<string, System>) {
    const keepIds = getFilteredSystems(data, filters).map((system) => {
      return system.name
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
