import { asteroidsHaveOre, joviansHasGas } from './data'
import { System } from './system'

function getSystemCompareFunction(filters: Map<string, string>) {
  function keepSystem(system: System) {
    let keep = true
    for (let [filterName, filterValue] of filters) {
      if (filterName == 'tier') {
        if (!(Number(filterValue) == system.tier)) {
          keep = false
        }
      } else if (filterName == 'level') {
        if (!filters.has('asteroid')) {
          if (system.level > Number(filterValue)) {
            keep = false
          }
        }
      } else if (filterName == 'station') {
        if (filterValue.toLowerCase() == '0' && !system.station) {
          keep = false
        } else if (filterValue.toLowerCase() == '1' && system.station) {
          keep = false
        }
      } else if (filterName == 'gas') {
        const tier = Number(filterValue.substring(0, 1))
        const gas = filterValue.substring(1)
        if (!joviansHasGas(system.jovians, tier, gas)) {
          keep = false
        }
      } else if (filterName == 'asteroid') {
        let level = 0
        if (filters.has('level')) {
          level = Number(filters.get('level'))
        }
        if (!asteroidsHaveOre(system.asteroids, filterValue, level)) {
          keep = false
        }
      } else if (filterName == 'search') {
        if (!system.name.toLowerCase().includes(filterValue.toLowerCase())) {
          keep = false
        }
      } else if (filterName == 'finds') {
        const [findStr, rarity] = filterValue.split('-')
        if (findStr && rarity) {
          const find = system.finds.get(findStr)
          if (find) {
            switch (rarity.toLowerCase()) {
              case 'uncommon':
                if (isNaN(find.uncommon) || find.uncommon <= 0) {
                  keep = false
                }
                break
              case 'rare':
                if (isNaN(find.rare) || find.rare <= 0) {
                  keep = false
                }
                break
              case 'epic':
                if (isNaN(find.epic) || find.epic <= 0) {
                  keep = false
                }
                break
            }
          }
        }
        // const rarity = filterValue.toLowerCase()
        // switch (rarity) {
        //   case 'uncommon':
        //     if (isNaN(system.boxes.uncommon) || system.boxes.uncommon <= 0) {
        //       keep = false
        //     }
        //     break
        //   case 'rare':
        //     if (isNaN(system.boxes.rare) || system.boxes.rare <= 0) {
        //       keep = false
        //     }
        //     break
        //   case 'epic':
        //     if (isNaN(system.boxes.epic) || system.boxes.epic <= 0) {
        //       keep = false
        //     }
        //     break
        // }
      }
    }
    return keep
  }
  return keepSystem
}

export function getFilteredSystems(data: Map<string, System>, filters: Map<string, string>) {
  return Array.from(data.values()).filter(getSystemCompareFunction(filters))
}
