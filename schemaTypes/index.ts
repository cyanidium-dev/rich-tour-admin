import blockContent from './blockContent'
// import category from './category'
// import post from './post'
// import author from './author'
import review from './review'
import faq from './faq'
import team from './team'
import doc from './doc'
import contact from './contact'
import tourCategory from './tour-category'
import tourBasic from './tour-basic'
import tourToDate from './tour-to-date'
import country from './country'
import agencyUser from './agencyUser'
import agentUser from './agentUser'
import siteSettings from './siteSettings'
import encryptedUserPayload from './encryptedUserPayload'

export const tourSchemaTypes = [country, tourCategory, tourBasic, tourToDate, blockContent]
export const siteSchemaTypes = [siteSettings, review, faq, team, doc, contact, blockContent]
export const contentSchemaTypes = [siteSettings, country, tourCategory, tourBasic, tourToDate, review, faq, team, doc, contact, blockContent]
export const userSchemaTypes = [encryptedUserPayload, agentUser, agencyUser]
export const schemaTypes = [...contentSchemaTypes, ...userSchemaTypes]
