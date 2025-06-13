import QRCode from 'qrcode'

interface CzechPaymentData {
  iban?: string // Full IBAN string (preferred)
  accountNumber?: string // Domestic account number (may include prefix e.g., 131-794480287)
  bankCode?: string // 4-digit bank code (e.g., 0100)
  amount: number
  variableSymbol: string
  message?: string
}

// Convert domestic Czech account to IBAN ( CZ )
const toCzIban = (account: string, bankCode: string): string => {
  // Split possible prefix-number form (prefix-account)
  const [prefixRaw, numberRaw] = account.includes('-') ? account.split('-') as [string,string] : ['0', account]
  const prefix = prefixRaw.padStart(6, '0')
  const number = numberRaw.padStart(10, '0')
  const bban = `${bankCode}${prefix}${number}` // 4 + 6 +10 = 20 digits

  // Convert to numeric string for mod calculation by appending country code as numbers + "00"
  const replaced = `${bban}123500` // C=12, Z=35, 00 as placeholders

  // Compute mod-97 remainder iteratively to avoid BigInt issues
  let remainder = 0
  for (const ch of replaced) {
    remainder = (remainder * 10 + Number(ch)) % 97
  }
  const checkDigits = String(98 - remainder).padStart(2, '0')
  return `CZ${checkDigits}${bban}`
}

export const generateCzechPaymentQR = async (paymentData: CzechPaymentData): Promise<string> => {
  const iban = paymentData.iban ?? (paymentData.accountNumber && paymentData.bankCode ? toCzIban(paymentData.accountNumber, paymentData.bankCode) : null)
  if(!iban) throw new Error('Missing IBAN or account details')

  // Czech bank payment QR code format (SPAYD)
  const spaydData = [
    `ACC:${iban}`,
    `AM:${paymentData.amount.toFixed(2)}`,
    `CC:CZK`,
    `X-VS:${paymentData.variableSymbol}`,
    paymentData.message ? `MSG:${encodeURIComponent(paymentData.message)}` : null
  ].filter(Boolean).join('*')

  const fullSpaydString = `SPD*1.0*${spaydData}`

  try {
    const qrCodeDataURL = await QRCode.toDataURL(fullSpaydString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1e40af', // Blue color for QR code
        light: '#ffffff'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate payment QR code')
  }
}

// Default bank account for the fishing spot (you can change this)
export const DEFAULT_BANK_ACCOUNT = {
  accountNumber: '131-794480287',
  bankCode: '0100', // Komerční banka
  iban: 'CZ8701000001310794480287'
} 