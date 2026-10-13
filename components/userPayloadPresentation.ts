type UserType = 'agentUser' | 'agencyUser'

const fieldLabels: Record<string, string> = {
  email: 'Електронна пошта',
  companyName: 'Назва компанії',
  legalCompanyName: 'Юридична назва компанії',
  phone: 'Телефон',
  edrpou: 'Код ЄДРПОУ',
  city: 'Місто',
  site: 'Сайт',
  taxForm: 'Форма оподаткування',
  passwordResetRequired: 'Потрібна зміна пароля',
  legalAgencyName: 'Юридична назва агенції',
  marketingAgencyName: 'Маркетингова назва агенції',
  login: 'Логін',
  agencyEdrpou: 'Код ЄДРПОУ агенції',
  agencyCity: 'Місто агенції',
  agencyLegalAddress: 'Юридична адреса агенції',
  agencyEmail: 'Електронна пошта агенції',
  agencyPhone: 'Телефон агенції',
  mainOfficeEmail: 'Електронна пошта головного офісу',
}

const agentCrmFields = new Set(['agencyCrmId', 'crmId', 'crmLastErrorMessage'])
const agentOpenFields = new Set([
  'email',
  'companyName',
  'legalCompanyName',
  'phone',
  'edrpou',
  'city',
  'site',
  'taxForm',
])

export function visibleUserPayloadEntries(payload: Record<string, unknown>, type: UserType) {
  return Object.entries(payload).filter(
    ([name]) =>
      name !== 'password' &&
      (type !== 'agentUser' || (!agentCrmFields.has(name) && !agentOpenFields.has(name))),
  )
}

export function userPayloadFieldLabel(name: string) {
  return fieldLabels[name] || `Додаткове поле: ${name}`
}

export function displayUserPayloadValue(name: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Так' : 'Ні'
  if (name === 'taxForm') {
    const taxForms: Record<string, string> = {fop: 'ФОП', tov: 'ТОВ', other: 'Інша'}
    return taxForms[String(value)] || String(value)
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
