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

export interface FindCounts {
  uncommon: number
  rare: number
  epic: number
}

export interface System {
  name: string
  tier: number
  faction: string
  level: number
  station: boolean
  asteroids: Asteroid[]
  jovians: Jovian[]
  planets: Planet[]
  finds: Map<string, FindCounts>
}
