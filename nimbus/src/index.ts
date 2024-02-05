import './css/index.css'
import './css/map.css'
import './css/ui.css'

import mapSVG from '../map.svg'

import { StarChart } from './starchart'
import { SystemList } from './ui-system-list'
import { getData } from './data'
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

    systemList.on('select', (id: string) => {
      starChart.setSelected(id, false)
      saveState()
    })

    starChart.on('select', (id: string) => {
      systemList.setSelected(id, false)
      if (getSelectedSystem()) {
        setPanelOpen(true)
      }
      saveState()
    })

    const btnRightPane = document.querySelector('#btn-right-pane') as HTMLElement
    btnRightPane.addEventListener('click', () => {
      const open = getPanelOpen()
      setPanelOpen(!open)
      saveState()
    })

    function updateFilters() {
      const filters = getFilters()
      starChart.setFiltered(filters, data)
      systemList.setFiltered(filters, data)
      saveState()
    }

    const selects = document.querySelectorAll('select')
    if (selects) {
      selects.forEach((filter) => {
        const filterElem = filter as HTMLSelectElement
        filterElem.addEventListener('change', () => {
          updateFilters()
        })
      })
    }
    const search = document.querySelector('#search') as HTMLInputElement
    if (search) {
      search.addEventListener('keyup', () => {
        updateFilters()
      })
      search.addEventListener('search', () => {
        updateFilters()
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
  const searchFilter = document.querySelector('#search') as HTMLInputElement
  if (searchFilter) {
    const filterValue = searchFilter.value
    if (filterValue) {
      filters.set('search', filterValue)
    }
  }

  // console.log(filters)
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
      if (filterElem.name == 'sort') {
        filterElem.value = 'name'
      } else {
        filterElem.value = ''
      }
    }
  }
  const searchFilter = document.querySelector('#search') as HTMLInputElement
  if (searchFilter) {
    const searchQuery = filters.get(searchFilter.name)
    if (searchQuery) {
      searchFilter.value = searchQuery
    } else {
      searchFilter.value = ''
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

function getPanelOpen() {
  const rightPanelElem = document.querySelector('#right-panel') as HTMLElement
  if (!rightPanelElem.classList.contains('hidden')) {
    return true
  }
  return false
}

function setPanelOpen(open: boolean) {
  const rightPanelElem = document.querySelector('#right-panel') as HTMLElement
  const searchBarElem = document.querySelector('#search-bar') as HTMLElement
  const btnRightPane = document.querySelector('#btn-right-pane') as HTMLElement
  if (open) {
    rightPanelElem.classList.remove('hidden')
    searchBarElem.classList.remove('hidden')
    btnRightPane.classList.add('selected')
  } else {
    rightPanelElem.classList.add('hidden')
    searchBarElem.classList.add('hidden')
    btnRightPane.classList.remove('selected')
  }
}

interface State {
  filters: Map<string, string>
  selectedSystem: string
  panel: boolean
}

function getState() {
  return {
    filters: Object.fromEntries(getFilters()),
    selectedSystem: getSelectedSystem(),
    panel: getPanelOpen(),
  }
}

function saveState() {
  setURLState(getState())
  // console.log(getState().selectedSystem)
}

function setState(state: State) {
  let filters = new Map<string, string>()
  if (state.filters) {
    filters = new Map(Object.entries(state.filters))
  }
  setFilters(filters)
  if (state.selectedSystem) {
    setSelectedSystem(state.selectedSystem)
  }
  setPanelOpen(state.panel)
}

function loadState() {
  const state = getURLState()
  setState(state)
}
