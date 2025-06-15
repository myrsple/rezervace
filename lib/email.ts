import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { getGearNames } from './gear-config'
import { generateCzechPaymentQR } from './qr-payment'
import { DEFAULT_BANK_ACCOUNT } from './qr-payment'

// Types imported are optional; keeping typing loose for now

// Cache the transporter in global scope so that it isn't re-created on every invocation in serverless environments
const globalForEmail = globalThis as unknown as {
  mailTransporter?: nodemailer.Transporter
}

/**
 * Lazily create and cache Nodemailer transporter.
 * – Tries both the SMTP_* and EMAIL_* env-var conventions for flexibility.
 * – Performs `transporter.verify()` once to fail fast on bad credentials.
 */
async function getTransporter() {
  if (globalForEmail.mailTransporter) return globalForEmail.mailTransporter

  const {
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
    EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
  } = process.env as Record<string, string | undefined>

  const host = SMTP_HOST || EMAIL_HOST
  const portStr = SMTP_PORT || EMAIL_PORT
  const user = SMTP_USER || EMAIL_USER
  const pass = SMTP_PASS || EMAIL_PASS

  if (!host || !portStr || !user || !pass) {
    console.warn('[email] SMTP credentials not found – email sending disabled')
    return null
  }

  const port = Number(portStr)
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS ; 587 & others use STARTTLS
    auth: { user, pass }
  })

  try {
    // Fail fast if credentials are wrong or host unreachable.
    await transporter.verify()
    console.info('[email] SMTP connection verified')
  } catch (err) {
    console.error('[email] SMTP verification failed – emails disabled', err)
    return null
  }

  globalForEmail.mailTransporter = transporter
  return transporter
}

/**
 * Sends a confirmation email to the customer after a successful reservation.
 * Gracefully no-ops if SMTP is not configured.
 */
export async function sendReservationConfirmation(reservation: any) {
  const transporter = await getTransporter()
  if (!transporter) return // SMTP not configured or verification failed

  const {
    customerEmail,
    customerName,
    fishingSpot,
    startDate,
    endDate,
    totalPrice,
    variableSymbol,
    duration,
    gearPrice,
    rentedGear
  } = reservation as any

  const rentedGearNames: string[] = rentedGear ? getGearNames(rentedGear) : []
  const gearListStr = rentedGearNames.length ? rentedGearNames.join(', ') : ''

  // Format dates nicely in Czech locale
  const startStr = format(new Date(startDate), "d. MMMM yyyy 'v' HH:mm", { locale: cs })
  const endStr   = format(new Date(endDate),   "d. MMMM yyyy 'v' HH:mm", { locale: cs })

  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)
  const dateRange = `${format(startDateObj, 'd.', { locale: cs })} – ${format(endDateObj, 'd. MMMM yyyy', { locale: cs })}`
  const weekday = format(startDateObj, 'EEEE', { locale: cs })
  const startLabel = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} 12:00 (poledne)`

  const spotLabel = (fishingSpot?.name ?? '').includes('VIP') || fishingSpot?.number === 99 ? 'VIP' : fishingSpot?.number

  const subject = `🎣 Potvrzení rezervace – ${fishingSpot?.name ?? 'Lovné místo'}${fishingSpot?.number ? ' ('+fishingSpot?.number+')' : ''}`

  const bank = process.env.BANK_ACCOUNT ?? `${DEFAULT_BANK_ACCOUNT.accountNumber}/${DEFAULT_BANK_ACCOUNT.bankCode}`
  const textBody = `Dobrý den ${customerName},\n\n`+
    `děkujeme za vaši rezervaci lovného místa. Posíláme shrnutí a informace k platbě:\n`+
    `------------------------------------------------------------\n`+
    `🎣 Lovné místo: ${spotLabel}\n`+
    `📅 Datum:    ${dateRange}\n`+
    `🕒 Začátek:   ${startLabel}\n`+
    `📏 Délka pobytu: ${duration}\n`+
    `💰 Cena:      ${totalPrice} Kč${gearListStr ? ` (včetně vybavení: ${gearListStr})` : ''}\n`+
    `${variableSymbol ? '#️⃣ VS: ' + variableSymbol + '\n' : ''}`+
    `------------------------------------------------------------\n`+
    `Platbu prosím odešlete převodem na účet ${bank} a uveďte VS ${variableSymbol}.\n\n`+
    `Pokud rezervaci potřebujete zrušit, dejte nám prosím včas vědět na +420 773 291 941 nebo napište na info@rybysemin.cz. Tento email je generovaný automaticky, neodpovídejte na něj.\n\n`+
    `Těšíme se na vás.<br><strong>Lovu zdar!</strong>\n\n`+
    `Tým Sportovní Rybolov Semín`;

  let htmlBody = `\n<style>\n  .rs-table td{padding:4px 8px;}\n  .rs-label{font-weight:600;color:#003366;}\n</style>\n<p style="font-family:Arial,sans-serif;font-size:15px;">Dobrý den <strong>${customerName}</strong>,</p>\n<p style="font-family:Arial,sans-serif;font-size:15px;">děkujeme za vaši rezervaci lovného místa. Posíláme shrnutí a informace k platbě:</p>\n<table class="rs-table" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px;">\n  <tr><td class="rs-label">📅 Datum:</td><td>${dateRange}</td></tr>\n  <tr><td class="rs-label">🕒 Začátek:</td><td>${startLabel}</td></tr>\n  <tr><td class="rs-label">🎣 Lovné místo:</td><td>${spotLabel}</td></tr>\n  <tr><td class="rs-label">📏 Délka pobytu:</td><td>${duration}</td></tr>\n  <tr><td class="rs-label">✅ Cena:</td><td>${totalPrice} Kč${gearListStr ? ` (včetně vybavení: ${gearListStr})` : ''}</td></tr>\n</table>\n<p style="font-family:Arial,sans-serif;font-size:15px;">Platbu prosím odešlete převodem na účet <strong>${bank}</strong> a uveďte <strong>VS&nbsp;${variableSymbol}</strong>.</p>`

  let attachments: any[] = []
  try {
    const [accNumber, bankCode] = bank.split('/')
    const qrDataUrl = await generateCzechPaymentQR({
      accountNumber: accNumber,
      bankCode,
      amount: totalPrice,
      variableSymbol,
    })
    const base64Data = qrDataUrl.split(',')[1]
    attachments.push({ filename: 'platba-qr.png', content: Buffer.from(base64Data, 'base64'), cid: 'qrpay' })
  } catch(e) {
    console.error('QR generation failed', e)
  }

  // If QR code was successfully generated, embed the image into the HTML
  if (attachments.length > 0) {
    htmlBody += `<p><img src="cid:qrpay" alt="QR platba" style="width:160px;height:160px;border-radius:8px;"/></p>`
  }

  htmlBody += `<p style="font-family:Arial,sans-serif;font-size:15px;">Pokud rezervaci potřebujete zrušit, dejte nám prosím včas vědět na <a href="tel:+420773291941">+420&nbsp;773&nbsp;291&nbsp;941</a> nebo napište na <a href="mailto:info@rybysemin.cz">info@rybysemin.cz</a>. Tento email je generovaný automaticky, neodpovídejte na něj.</p>`
  htmlBody += `<p style="font-family:Arial,sans-serif;font-size:15px;">Těšíme se na vás.<br><strong>Lovu zdar!</strong></p>`
  htmlBody += `<p style="font-family:Arial,sans-serif;font-size:15px;">Tým&nbsp;Sportovní&nbsp;Rybolov&nbsp;Semín</p>`

  try {
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL || 'Ryby Semín <noreply@rybysemin.cz>',
      to: customerEmail,
      subject,
      text: textBody,
      html: htmlBody,
      attachments
    })
    console.info('[email] Reservation summary sent:', info.messageId)
  } catch (err) {
    console.error('Error sending confirmation email:', err)
  }
}

// Competition confirmation email ---------------------------------------------
export async function sendCompetitionConfirmation(registration: any) {
  const transporter = await getTransporter()
  if (!transporter) return

  const {
    customerEmail,
    customerName,
    competition,
    totalPrice,
    variableSymbol,
    rentedGear,
    gearPrice
  } = registration as any

  const compName = competition?.name ?? 'Rybářský závod'
  const startDateObj = new Date(competition?.date)
  const endDateObj = competition?.endDate ? new Date(competition.endDate) : new Date(startDateObj.getTime() + 24*60*60*1000)

  const dateRange = `${format(startDateObj,'d.',{locale:cs})} – ${format(endDateObj,'d. MMMM yyyy',{locale:cs})}`
  const startLabel = `${format(startDateObj,'EEEE',{locale:cs}).replace(/^./,s=>s.toUpperCase())} ${format(startDateObj,'HH:mm',{locale:cs})}`

  const rentedGearNames: string[] = rentedGear ? getGearNames(rentedGear) : []
  const gearListStr = rentedGearNames.length ? rentedGearNames.join(', ') : ''

  const bank = process.env.BANK_ACCOUNT ?? `${DEFAULT_BANK_ACCOUNT.accountNumber}/${DEFAULT_BANK_ACCOUNT.bankCode}`

  const subject = `🎣 Potvrzení registrace – ${compName}`

  const textBody = `Dobrý den ${customerName},\n\n`+
    `děkujeme za vaši registraci do závodu. Posíláme shrnutí a informace k platbě:\n`+
    `------------------------------------------------------------\n`+
    `🏆 Závod:     ${compName}\n`+
    `📅 Datum:     ${dateRange}\n`+
    `🕒 Start:     ${startLabel}\n`+
    `💰 Cena:      ${totalPrice} Kč${gearListStr ? ` (včetně vybavení: ${gearListStr})` : ''}\n`+
    `#️⃣ VS:       ${variableSymbol}\n`+
    `------------------------------------------------------------\n`+
    `Platbu prosím odešlete převodem na účet ${bank} a uveďte VS ${variableSymbol}.\n\n`+
    `Pokud se potřebujete odhlásit, dejte nám prosím včas vědět na +420 773 291 941 nebo napište na info@rybysemin.cz. Tento email je generovaný automaticky, neodpovídejte na něj.\n\n`+
    `Těšíme se na vás.\nLovu zdar!\n\n`+
    `Tým Sportovní Rybolov Semín`

  let htmlBody = `\n<style>\n  .rs-table td{padding:4px 8px;}\n  .rs-label{font-weight:600;color:#003366;}\n</style>\n<p style="font-family:Arial,sans-serif;font-size:15px;">Dobrý den <strong>${customerName}</strong>,</p>\n<p style="font-family:Arial,sans-serif;font-size:15px;">děkujeme za vaši registraci do závodu. Posíláme shrnutí a informace k platbě:</p>\n<table class="rs-table" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px;">\n  <tr><td class="rs-label">🏆 Závod:</td><td>${compName}</td></tr>\n  <tr><td class="rs-label">📅 Datum:</td><td>${dateRange}</td></tr>\n  <tr><td class="rs-label">🕒 Start:</td><td>${startLabel}</td></tr>\n  <tr><td class="rs-label">✅ Cena:</td><td>${totalPrice} Kč${gearListStr ? ` (včetně vybavení: ${gearListStr})` : ''}</td></tr>\n</table>\n<p style="font-family:Arial,sans-serif;font-size:15px;">Platbu prosím odešlete převodem na účet <strong>${bank}</strong> a uveďte <strong>VS&nbsp;${variableSymbol}</strong>.</p>`

  // QR
  let attachments: any[] = []
  try {
    const [accNumber, bankCode] = bank.split('/')
    const qrDataUrl = await generateCzechPaymentQR({
      accountNumber: accNumber,
      bankCode,
      amount: totalPrice,
      variableSymbol,
    })
    const base64Data = qrDataUrl.split(',')[1]
    attachments.push({ filename: 'platba-qr.png', content: Buffer.from(base64Data,'base64'), cid:'qrpay' })
    htmlBody += `<p><img src="cid:qrpay" alt="QR platba" style="width:160px;height:160px;border-radius:8px;"/></p>`
  } catch(e) { console.error('QR gen failed',e) }

  htmlBody += `<p style="font-family:Arial,sans-serif;font-size:15px;">Pokud se potřebujete odhlásit, dejte nám prosím včas vědět na <a href="tel:+420773291941">+420&nbsp;773&nbsp;291&nbsp;941</a> nebo napište na <a href="mailto:info@rybysemin.cz">info@rybysemin.cz</a>. Tento email je generovaný automaticky, neodpovídejte na něj.</p>`
  htmlBody += `<p style="font-family:Arial,sans-serif;font-size:15px;">Těšíme se na vás.<br><strong>Lovu zdar!</strong></p>`
  htmlBody += `<p style="font-family:Arial,sans-serif;font-size:15px;">Tým&nbsp;Sportovní&nbsp;Rybolov&nbsp;Semín</p>`

  try {
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL || 'Ryby Semín <noreply@rybysemin.cz>',
      to: customerEmail,
      subject,
      text: textBody,
      html: htmlBody,
      attachments
    })
    console.info('[email] Competition summary sent:', info.messageId)
  } catch (err) {
    console.error('Error sending competition confirmation email:', err)
  }
}

// Update default export
export default { sendReservationConfirmation, sendCompetitionConfirmation } 