import { getSignals } from './data'
import { Signal, System } from './system'

function getSignalCompareFunction(filters: Map<string, string>) {
  function keepSignal(signal: Signal) {
    let keep = true
    for (let [filterName, filterValue] of filters) {
      if (filterName == 'tier') {
        if (!(Number(filterValue) == signal.tier)) {
          keep = false
        }
      } else if (filterName == 'level') {
        if (signal.level > Number(filterValue)) {
          keep = false
        }
      } else if (filterName == 'rarity') {
        if (filterValue !== signal.rarity) {
          keep = false
        }
      } else if (filterName == 'type') {
      } else if (filterName == 'scan') {
        if (signal.scan > Number(filterValue)) {
          keep = false
        }
      }
    }
    return keep
  }
  return keepSignal
}

export function getFilteredSignals(data: Map<string, System>, filters: Map<string, string>) {
  let signals = getSignals(data)
  const keepSignal = getSignalCompareFunction(filters)
  signals = signals.filter(keepSignal)
  return signals
}

export function getFilteredSystems(data: Map<string, System>, filters: Map<string, string>) {
  let systems = Array.from(data.values())
  const keepSignal = getSignalCompareFunction(filters)
  systems = systems.filter((system) => {
    return system.signals.some(keepSignal)
  })
  return systems
}
