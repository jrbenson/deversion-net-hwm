export interface EnemyShip {
  count: number
  faction: string
  class: string
  name: string
}

export interface Signal {
  id: string
  name: string
  suffix: string
  type: string
  scan: number
  tier: number
  level: number
  systemName: string
  rarity: string
  enemy?: string
  ally?: string
  waves?: EnemyShip[][]
}

export interface Asteroid {
  ore: string
  level: number
}

export interface Jovian {
  bands: string[]
}

export interface Planet {
  type: string
  moons: number
  color?: string
}

export interface System {
  name: string
  tier: number
  faction: string
  level: number
  station: boolean
  signals: Signal[]
  asteroids: Asteroid[]
  jovians: Jovian[]
  planets: Planet[]
}
