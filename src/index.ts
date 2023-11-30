import Parallax from 'parallax-js'

const parallaxInstance = new Parallax(document.body)

const shipLayer = document.querySelector('#ships') as HTMLElement
shipLayer.appendChild(getShip('destroyer', 0.4))
shipLayer.appendChild(getShip('carrier', 0.1))
shipLayer.appendChild(getShip('battlecruiser', 0.2))

const frigates = ['frigate-a', 'frigate-b', 'frigate-c', 'frigate-d', 'frigate-e', 'frigate-f']
for (let frigate of frigates) {
  shipLayer.appendChild(getShip(frigate, 0.6))
}

const fighters = ['fighter-a', 'fighter-c']
for (let fighter of fighters) {
  const top = 15 + Math.random() * 60
  for (let i = 0; i < 8; i++) {
    shipLayer.appendChild(getShip(fighter, 1, top))
  }
}

const corvettes = ['corvette-b', 'fighter-b']
for (let corvette of corvettes) {
  const top = 15 + Math.random() * 60
  for (let i = 0; i < 2; i++) {
    shipLayer.appendChild(getShip(corvette, 0.7, top))
  }
}

document.querySelectorAll('#ships img').forEach((ship) => {
  ship.addEventListener('animationiteration', () => {
    ;(ship as HTMLImageElement).style.top = `${15 + Math.random() * 60}%`
  })
})

function getShip(shipImg: string, speed = 0.5, top: number | undefined = undefined) {
  const ship = document.createElement('img') as HTMLImageElement
  ship.src = `ships/${shipImg}.png`
  let topPercent = 15 + Math.random() * 60
  if (top) {
    topPercent = top - 3 + Math.random() * 6
  }
  ship.style.top = `${topPercent}%`
  ship.style.animationName = 'shipMovement'
  ship.style.animationDuration = `${70 - 60 * speed + Math.random() * 20}s`
  ship.style.animationTimingFunction = 'linear'
  ship.style.animationIterationCount = 'infinite'
  ship.style.animationFillMode = 'both'
  return ship
}
