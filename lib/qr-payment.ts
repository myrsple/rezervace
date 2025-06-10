import QRCode from 'qrcode'

interface CzechPaymentData {
  accountNumber: string
  bankCode: string
  amount: number
  variableSymbol: string
  message?: string
}

export const generateCzechPaymentQR = async (paymentData: CzechPaymentData): Promise<string> => {
  // Czech bank payment QR code format (SPAYD)
  const spaydData = [
    `ACC:${paymentData.accountNumber}+${paymentData.bankCode}`,
    `AM:${paymentData.amount.toFixed(2)}`,
    `CC:CZK`,
    `VS:${paymentData.variableSymbol}`,
    paymentData.message ? `MSG:${paymentData.message}` : null
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
  accountNumber: '123456789',
  bankCode: '0100' // Komerční banka
} 