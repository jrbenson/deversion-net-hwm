const ROMAN_LOOKUP = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
export function numberToRomanNumeral(number: number) {
  return ROMAN_LOOKUP[number]
}
