import './css/index.css'
import './css/map.css'
import './css/ui.css'

import mapSVG from '../map.svg'

import { StarChart } from './starchart'
import { SystemList } from './ui-system-list'
import { getData } from './data'
import { SignalList } from './ui-signal-list'
import { getURLState, setURLState } from './persist'

init()

async function init() {
  getData(true).then(async (data) => {
    const mapElem = document.querySelector('#map') as HTMLElement
    const mapSSVGText = await window.fetch(mapSVG)
    const svgText = await mapSSVGText.text()
    const starChart = new StarChart(mapElem, svgText, data)

    const systemListElem = document.querySelector('#system-list') as HTMLElement
    const systemList = new SystemList(systemListElem, data)

    const signalListElem = document.querySelector('#signal-list') as HTMLElement
    const signalList = new SignalList(signalListElem, data)

    systemList.on('select', (id: string) => {
      starChart.setSelected(id, false)
      signalList.setSelected('__deselect__', false)
      saveState()
    })

    starChart.on('select', (id: string) => {
      systemList.setSelected(id, false)
      signalList.setSelected('__deselect__', false)
      saveState()
    })

    signalList.on('select', (id: string) => {
      const system = id.split('-')[0]
      starChart.setSelected(system, false)
      systemList.setSelected(system, false)
      saveState()
    })

    const btnSystemList = document.querySelector('#btn-system-list') as HTMLElement
    const btnSignalList = document.querySelector('#btn-signal-list') as HTMLElement
    btnSystemList.addEventListener('click', () => {
      const panel = getOpenPanel()
      if (panel == 'system') {
        setOpenPanel('none')
      } else {
        setOpenPanel('system')
      }
      saveState()
    })
    btnSignalList.addEventListener('click', () => {
      const panel = getOpenPanel()
      if (panel == 'signal') {
        setOpenPanel('none')
      } else {
        setOpenPanel('signal')
      }
      saveState()
    })

    const selects = document.querySelectorAll('select')
    if (selects) {
      selects.forEach((filter) => {
        const filterElem = filter as HTMLSelectElement
        filterElem.addEventListener('change', () => {
          const filters = getFilters()
          starChart.setFiltered(filters, data)
          signalList.setFiltered(filters, data)
          systemList.setFiltered(filters, data)
          saveState()
        })
      })
    }

    const btnReset = document.querySelector('#filter-reset') as HTMLElement
    btnReset.addEventListener('click', () => {
      setFilters(new Map<string, string>())
    })

    loadState()
    saveState()
  })
}

function getFilters() {
  let filters = new Map<string, string>()

  const allFilters = document.querySelectorAll('select')
  for (let filterElem of allFilters) {
    const filterName = filterElem.name
    const filterValue = filterElem.value
    if (filterName && filterValue) {
      filters.set(filterName, filterValue)
    }
  }

  return filters
}

function setFilters(filters: Map<string, string>) {
  const allFilters = document.querySelectorAll('select')
  for (let filterElem of allFilters) {
    const filterName = filterElem.name
    if (filterName && filters.has(filterName)) {
      const filterValue = filters.get(filterName)
      if (filterValue) {
        filterElem.value = filterValue
      }
    } else {
      filterElem.value = ''
    }
  }
  const select = document.querySelector('select') as HTMLSelectElement
  if (select) {
    select.dispatchEvent(new Event('change'))
  }
}

function getSelectedSystem() {
  const systemElem = document.querySelector('#system-list li.selected') as HTMLElement
  if (systemElem) {
    return systemElem.dataset.id
  }
  return ''
}

function setSelectedSystem(id: string) {
  const systemElem = document.querySelector(`#system-list li[data-id="${id}"] .header`) as HTMLElement
  if (systemElem) {
    systemElem.dispatchEvent(new Event('click'))
  }
}

function getSelectedSignal() {
  const signalElem = document.querySelector('#signal-list li.selected') as HTMLElement
  if (signalElem) {
    return signalElem.dataset.id
  }
  return ''
}

function setSelectedSignal(id: string) {
  const signalElem = document.querySelector(`#signal-list li[data-id="${id}"] .header`) as HTMLElement
  if (signalElem) {
    signalElem.dispatchEvent(new Event('click'))
  }
}

function getOpenPanel() {
  const systemListElem = document.querySelector('#system-list') as HTMLElement
  const signalListElem = document.querySelector('#signal-list') as HTMLElement
  if (!systemListElem.classList.contains('hidden')) {
    return 'system'
  }
  if (!signalListElem.classList.contains('hidden')) {
    return 'signal'
  }
  return 'none'
}

function setOpenPanel(panel: string) {
  const systemListElem = document.querySelector('#system-list') as HTMLElement
  const signalListElem = document.querySelector('#signal-list') as HTMLElement
  const btnSystemList = document.querySelector('#btn-system-list') as HTMLElement
  const btnSignalList = document.querySelector('#btn-signal-list') as HTMLElement
  if (!panel || panel == 'system') {
    signalListElem.classList.add('hidden')
    btnSignalList.classList.remove('selected')
    systemListElem.classList.remove('hidden')
    btnSystemList.classList.add('selected')
  } else if (panel == 'signal') {
    signalListElem.classList.remove('hidden')
    btnSignalList.classList.add('selected')
    systemListElem.classList.add('hidden')
    btnSystemList.classList.remove('selected')
  } else if (panel == 'none') {
    signalListElem.classList.add('hidden')
    btnSignalList.classList.remove('selected')
    systemListElem.classList.add('hidden')
    btnSystemList.classList.remove('selected')
  }
}

interface State {
  filters: Map<string, string>
  selectedSystem: string
  selectedSignal: string
  panel: string
}

function getState() {
  return {
    filters: Object.fromEntries(getFilters()),
    selectedSystem: getSelectedSystem(),
    selectedSignal: getSelectedSignal(),
    panel: getOpenPanel(),
  }
}

function saveState() {
  setURLState(getState())
  console.log(getState().selectedSystem)
}

function setState(state: State) {
  let filters = new Map<string, string>()
  if (state.filters) {
    filters = new Map(Object.entries(state.filters))
  }
  setFilters(filters)
  if (state.selectedSystem && state.selectedSignal) {
    setSelectedSignal(state.selectedSignal)
  } else if (state.selectedSignal) {
    setSelectedSignal(state.selectedSignal)
  } else {
    setSelectedSystem(state.selectedSystem)
  }
  setOpenPanel(state.panel)
}

function loadState() {
  const state = getURLState()
  setState(state)
}
