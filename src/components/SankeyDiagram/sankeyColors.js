export const INDUSTRY_COLORS = {
  'Construction': '#CE93D8',
  'Manufacturing': '#81C784',
  'Oilfield Services': '#4DD0E1',
  'Staffing': '#FFB74D',
  'Transportation/Logistics': '#64B5F6',
  'Wholesale/Distribution': '#EF5350',
}

export const NOT_INTERESTED_COLOR = '#78909C'

export function getLinkColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.55)`
}

export const NOT_INTERESTED_LINK_COLOR = 'rgba(120, 144, 156, 0.4)'
