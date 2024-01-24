import { parse } from 'papaparse'
import { Asteroid, Jovian, Planet, Signal, System, EnemyShip } from './system'

// URL for retrieving the CSV data from Google Sheets
const DATA_URL =
  'https://docs.google.com/spreadsheets/d/1eTCM4KNb7lv7mtFmMx9WVOud2pg7EnqcDP40n9S-5go/gviz/tq?tqx=out:csv&sheet=Systems%201.7'
const LOCAL_DATA_URL = './data.csv'

// Function that creates an inclusive array of numbers over a range with an increment
function range(start: number, end: number, increment = 1) {
  return Array.from({ length: Math.floor((end - start) / increment) + 1 }, (_, i) => i * increment + start)
}

function rangeCount(start: number, count: number, increment = 1) {
  return range(start, start + (count - 1) * increment, increment)
}

// Index of the columns in the CSV data for adjustable lookup
const COL_TIER_HEADER = 1
const COL_FACTION = 1
const COL_SYSTEM = 2
const COL_LEVEL = 3
const COL_STATION = 4
const COL_SIGNAL_TOTAL = 5
const COL_SIGNALS = {
  'Cangacian Signal': rangeCount(6, 3, 2),
  'Tanoch Signal': rangeCount(12, 3, 2),
  'Yaot Signal': rangeCount(18, 3, 2),
  'Amassari Signal': rangeCount(24, 3, 2),
  'Kiithless Signal': rangeCount(30, 3, 2),
  'Relic Recovery': rangeCount(36, 3, 2),
  'Progenitor Signal': rangeCount(42, 3, 2),
  'Progenitor Activities': rangeCount(48, 3, 2),
  'Distress Call': rangeCount(54, 3, 2),
  'Traveling Trader': rangeCount(60, 3, 2),
  'Mining Ops': rangeCount(66, 3, 2),
  Other: rangeCount(72, 3, 2),
}
const COL_ASTEROIDS = range(79, 91)
const COL_HIDDEN_LENGTH = 3
const COL_JOVIANS = [rangeCount(96, 3, 1), rangeCount(99, 3, 1), rangeCount(102, 3, 1), rangeCount(105, 3, 1)]
const COL_PLANETS = range(110, 123)

const ROW_START = 5 - 1
const ROW_END = 180

const GREEK_LETTERS = [
  'Alpha',
  'Beta',
  'Gamma',
  'Delta',
  'Epsilon',
  'Zeta',
  'Eta',
  'Theta',
  'Iota',
  'Kappa',
  'Lambda',
  'Mu',
  'Nu',
  'Xi',
  'Omicron',
  'Pi',
  'Rho',
  'Sigma',
  'Tau',
  'Upsilon',
  'Phi',
  'Chi',
  'Psi',
  'Omega',
]

export async function getData(local = false) {
  if (local) {
    const response = await window.fetch(LOCAL_DATA_URL)
    const data = (await response.text().then((text) => parse(text).data)) as string[][]
    return parseData(data)
  } else {
    const response = await window.fetch(DATA_URL)
    const data = (await response.text().then((text) => parse(text).data)) as string[][]
    return parseData(data)
  }
}

function parseData(data: string[][]) {
  data = data.slice(ROW_START, ROW_END)

  const systems: Map<string, System> = new Map()

  let currentTier = 0
  for (let row of data) {
    if (row[COL_SYSTEM] === '') {
      if (row[COL_TIER_HEADER] !== '') {
        const tierString = String(row[COL_TIER_HEADER])
        const tier = Number(tierString.split(' ')[1])
        currentTier = tier
      }
    } else {
      const system: System = {
        tier: currentTier,
        faction: row[COL_FACTION],
        name: String(row[COL_SYSTEM]).split('[')[0].trim(),
        level: Number(row[COL_LEVEL]),
        station: String(row[COL_STATION]).toLowerCase().includes('y'),
        signals: [],
        asteroids: [],
        jovians: [],
        planets: [],
      }
      systems.set(system.name, system)

      for (let [type, scans] of Object.entries(COL_SIGNALS)) {
        for (let scanIndex = 0; scanIndex < scans.length; scanIndex += 1) {
          const signalTotal = Number(row[scans[scanIndex]])
          if (!signalTotal || signalTotal <= 0) continue
          const details = parseSignalDetails(row[scans[scanIndex] + 1])
          for (let sigIndex = 0; sigIndex < signalTotal; sigIndex++) {
            let name = `${type}`
            let level = system.level
            if (sigIndex < details.levels.length) {
              level = details.levels[sigIndex]
            }
            let rarity = 'common'
            if (sigIndex < details.rarities.length) {
              rarity = details.rarities[sigIndex]
            }
            const signal: Signal = {
              id: '',
              name: name,
              suffix: '',
              type: type,
              scan: scanIndex + 1,
              level: level,
              tier: system.tier,
              rarity: rarity,
              systemName: system.name,
            }
            system.signals.push(signal)
          }
        }
      }

      const nameCounts = new Map<string, number>()
      for (let signal of system.signals) {
        if (!nameCounts.has(signal.name)) {
          nameCounts.set(signal.name, 1)
        } else {
          const count = nameCounts.get(signal.name)
          if (count) {
            nameCounts.set(signal.name, count + 1)
          }
        }
      }
      const curNameCounts = new Map<string, number>()
      for (let signal of system.signals) {
        const total = nameCounts.get(signal.name)
        if (total && total > 1) {
          if (!curNameCounts.has(signal.name)) {
            curNameCounts.set(signal.name, 1)
          } else {
            const count = curNameCounts.get(signal.name)
            if (count) {
              curNameCounts.set(signal.name, count + 1)
            }
          }
          signal.suffix = `${GREEK_LETTERS[(curNameCounts.get(signal.name) as number) - 1]}`
        }
      }

      for (let signal of system.signals) {
        signal.id = `${signal.systemName}-${signal.name} ${signal.suffix}`
      }

      for (let asteroidIndex of COL_ASTEROIDS) {
        if (row[asteroidIndex] !== '') {
          let asteroidStrings = String(row[asteroidIndex]).split(',')
          for (let asteroidString of asteroidStrings) {
            let ore = asteroidString.substring(0, 1)
            let level = Number(asteroidString.substring(1))
            let asteroid: Asteroid = {
              ore: ore,
              level: level,
            }
            system.asteroids.push(asteroid)
          }
        }
      }
      for (let bandIndices of COL_JOVIANS) {
        if (row[bandIndices[0]] !== '') {
          let bands = []
          for (let bandIndex of bandIndices) {
            bands.push(String(row[bandIndex]))
          }
          let jovian: Jovian = {
            bands: bands,
          }
          system.jovians.push(jovian)
        }
      }
      for (let planetCol of COL_PLANETS) {
        if (row[planetCol] !== '') {
          let planetString = String(row[planetCol])
          let moons = 0
          if (planetString.includes("'")) {
            let moonString = planetString.substring(planetString.indexOf("'"))
            moons = moonString.length
            planetString = planetString.substring(0, planetString.indexOf("'"))
          }
          let planet: Planet = {
            type: planetString,
            moons: moons,
          }
          system.planets.push(planet)
        }
      }
    }
  }

  // console.log(data)
  // console.log(systems)

  return systems
}

export interface SignalDetails {
  levels: number[]
  rarities: string[]
  enemy?: string[]
  ally?: string[]
  enemyWaves?: EnemyShip[][]
}

function parseRarity(text: string): string {
  let rarity = 'common'
  if (text.includes('U')) {
    rarity = 'uncommon'
  } else if (text.includes('R')) {
    rarity = 'rare'
  } else if (text.includes('E')) {
    rarity = 'epic'
  } else if (text.includes('L')) {
    rarity = 'legendary'
  }
  return rarity
}

function parseLevel(text: string): number {
  return Number(text.replace(/\D/g, ''))
}

function parseSignalDetails(details: string): SignalDetails {
  const splitText = details.split(',')
  const levels = []
  const rarities = []
  for (let text of splitText) {
    levels.push(parseLevel(text))
    rarities.push(parseRarity(text))
  }
  return {
    levels: levels,
    rarities: rarities,
  }
}

export function getOresInAsteroids(asteroids: Asteroid[]) {
  const ores: string[] = []
  for (let asteroid of asteroids) {
    if (!ores.includes(asteroid.ore)) {
      ores.push(asteroid.ore)
    }
  }
  ores.sort()
  if (ores.includes('M')) {
    ores.splice(ores.indexOf('M'), 1)
    ores.unshift('M')
  }
  return ores
}

export function getOresInAsteroidsString(asteroids: Asteroid[]) {
  return getOresInAsteroids(asteroids).join('')
}

export function getOreLevelRangeHTML(asteroids: Asteroid[]) {
  let oreString = ''
  const ores = getOresInAsteroids(asteroids)
  const ranges = new Map<string, { min: number; max: number }>()
  for (let asteroid of asteroids) {
    if (!ranges.has(asteroid.ore)) {
      ranges.set(asteroid.ore, { min: asteroid.level, max: asteroid.level })
    } else {
      const range = ranges.get(asteroid.ore)
      if (range) {
        if (range.min > asteroid.level) {
          range.min = asteroid.level
        }
        if (range.max < asteroid.level) {
          range.max = asteroid.level
        }
      }
    }
  }
  let firstOre = true
  for (let ore of ores) {
    if (!firstOre) {
      oreString += '&nbsp;&nbsp;'
    }
    oreString += ore
    const range = ranges.get(ore)
    if (range) {
      if (range.min == range.max) {
        oreString += ` <span class="subtle">${range.min}</span>`
      } else {
        oreString += ` <span class="subtle">${range.min}-${range.max}</span>`
      }
    }
    firstOre = false
  }
  return oreString
}

export function getJovianBands(jovians: Jovian[]) {
  const tier3s: string[] = []
  const tier4s: string[] = []
  const tier5s: string[] = []
  for (let jovian of jovians) {
    if (!tier3s.includes(jovian.bands[0])) {
      tier3s.push(jovian.bands[0])
    }
    if (!tier4s.includes(jovian.bands[1])) {
      tier4s.push(jovian.bands[1])
    }
    if (!tier5s.includes(jovian.bands[2])) {
      tier5s.push(jovian.bands[2])
    }
  }
  tier3s.sort()
  tier4s.sort()
  tier5s.sort()
  return [tier3s, tier4s, tier5s]
}

export function getJovianBandsHTML(jovians: Jovian[], maxTier = 2) {
  const tiers = getJovianBands(jovians)
  let html = ''
  for (let tier = 0; tier < maxTier; tier++) {
    html += `${tiers[tier].join('')}`
    if (tier < maxTier - 1) {
      html += ` <span class="subtle">⸱</span> `
    }
  }
  return html
}

export function getSignals(data: Map<string, System>) {
  const signals: Signal[] = []
  for (let system of data.values()) {
    for (let signal of system.signals) {
      signals.push(signal)
    }
  }
  return signals
}
