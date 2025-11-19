import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import JSZip from 'jszip'
import type { MonitoringSnapshot, Applicant, PaymentEntry } from '~/types'
import { DateTime } from 'luxon'

// Инициализация шрифта с поддержкой кириллицы
// Для jsPDF 3.x нужно загрузить шрифт с поддержкой Unicode
// Используем готовый шрифт или загружаем его заранее
let cyrillicFontInitialized = false

// Безопасная конвертация байтов в бинарную строку (избегает переполнения стека)
const bytesToBinaryString = (bytes: Uint8Array): string => {
  // Используем Buffer если доступен (Node.js окружение)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('binary')
  }
  
  // Для браузера: обрабатываем байты частями, чтобы избежать переполнения стека
  const chunkSize = 8192 // Размер чанка для безопасной обработки
  const chunks: string[] = []
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    // Используем spread operator для безопасной конвертации чанка
    chunks.push(String.fromCharCode(...Array.from(chunk)))
  }
  
  return chunks.join('')
}

// Функция для инициализации шрифта с поддержкой кириллицы
const initializeCyrillicFont = async (): Promise<boolean> => {
  if (cyrillicFontInitialized) return true
  
  try {
    // Загружаем шрифт DejaVu Sans с поддержкой кириллицы
    // Используем self-hosted TTF файлы из public/fonts
    const fontUrl = '/fonts/DejaVuSans.ttf'
    const italicFontUrl = '/fonts/DejaVuSans-Oblique.ttf'
    
    if (typeof window !== 'undefined') {
      const response = await fetch(fontUrl)
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const binary = bytesToBinaryString(bytes)
        // Use global btoa function for base64 encoding (browser) or Buffer (Node.js)
        let base64: string
        if (typeof Buffer !== 'undefined') {
          base64 = Buffer.from(binary, 'binary').toString('base64')
        } else {
          // Browser environment - use btoa
          base64 = btoa(binary)
        }
        
        // Сохраняем данные шрифта для использования
        (window as any).__cyrillicFontData = base64
        
        // Загружаем italic вариант
        let italicBase64: string = base64 // Default to normal font
        try {
          const italicResponse = await fetch(italicFontUrl)
          if (italicResponse.ok) {
            const italicArrayBuffer = await italicResponse.arrayBuffer()
            const italicBytes = new Uint8Array(italicArrayBuffer)
            const italicBinary = bytesToBinaryString(italicBytes)
            if (typeof Buffer !== 'undefined') {
              italicBase64 = Buffer.from(italicBinary, 'binary').toString('base64')
            } else {
              italicBase64 = btoa(italicBinary)
            }
            (window as any).__cyrillicFontItalicData = italicBase64
          }
        } catch (italicError) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('Failed to load italic font, using normal font for italic:', italicError)
          }
          // Fallback: используем тот же шрифт для italic
          (window as any).__cyrillicFontItalicData = base64
        }
        
        cyrillicFontInitialized = true
        return true
      } else {
        console.error(`Failed to load font from ${fontUrl}: HTTP ${response.status}`)
      }
    }
  } catch (error) {
    console.warn('Failed to load cyrillic font:', error)
  }
  
  return false
}

// Добавление шрифта в документ jsPDF
const addCyrillicFontToDoc = (doc: jsPDF): void => {
  try {
    const fontData = (typeof window !== 'undefined' && (window as any).__cyrillicFontData) || null
    const italicFontData = (typeof window !== 'undefined' && (window as any).__cyrillicFontItalicData) || null
    if (fontData) {
      doc.addFileToVFS('DejaVuSans.ttf', fontData)
      doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal')
      doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'bold')
      
      // Добавляем italic вариант
      if (italicFontData) {
        doc.addFileToVFS('DejaVuSans-Oblique.ttf', italicFontData)
        doc.addFont('DejaVuSans-Oblique.ttf', 'DejaVuSans', 'italic')
      } else {
        // Fallback: используем тот же шрифт для italic
        doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'italic')
      }
      
      doc.setFont('DejaVuSans', 'normal')
    }
  } catch (error) {
    // Шрифт уже добавлен или ошибка
    console.warn('Error adding cyrillic font to doc:', error)
  }
}

// Безопасная установка шрифта с поддержкой кириллицы
const setCyrillicFont = (doc: jsPDF, style: 'normal' | 'bold' | 'italic' = 'normal'): void => {
  try {
    // Проверяем, доступен ли шрифт с поддержкой кириллицы
    const fontData = (typeof window !== 'undefined' && (window as any).__cyrillicFontData) || null
    if (fontData) {
      doc.setFont('DejaVuSans', style)
    } else {
      // Fallback на стандартный шрифт
      doc.setFont('helvetica', style)
    }
  } catch {
    // Если ошибка, используем стандартный шрифт
    doc.setFont('helvetica', style)
  }
}

interface EventData {
  id: string
  title: string
  authorName?: string
  location?: string
  seatLimit?: number | string
  pricePerSeat?: number | string
  priceTotal?: number | string
  startApplicationsAtDate?: string
  startApplicationsAtTime?: string
  endApplicationsAtDate?: string
  endApplicationsAtTime?: string
  startContractsAtDate?: string
  startContractsAtTime?: string
  startAtDate?: string
  startAtTime?: string
  endAtDate?: string
  endAtTime?: string
  timezone?: string
}

interface SavedEvent {
  id: string
  title: string
  data: EventData
  serverId?: string
}

// Форматирование цены
const formatPrice = (value: number): string => {
  return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽`
}

// Форматирование даты
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Форматирование даты/времени из отдельных полей
const formatDateTime = (date?: string, time?: string, timezone?: string): string => {
  if (!date) return '—'
  try {
    if (time) {
      const [year, month, day] = date.split('-')
      const [hours, minutes] = time.split(':')
      if (timezone) {
        const dt = DateTime.fromObject(
          {
            year: Number.parseInt(year, 10),
            month: Number.parseInt(month, 10),
            day: Number.parseInt(day, 10),
            hour: Number.parseInt(hours, 10),
            minute: Number.parseInt(minutes, 10)
          },
          { zone: timezone }
        )
        if (dt.isValid) {
          return dt.toLocaleString({
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }
      return `${day}.${month}.${year} ${time}`
    }
    const [year, month, day] = date.split('-')
    return `${day}.${month}.${year}`
  } catch {
    return date
  }
}

// Генерация PDF для одного заявителя
export const generateApplicantPdf = async (
  event: SavedEvent,
  monitoringData: MonitoringSnapshot,
  applicant: Applicant,
  applicantIndex: number,
  seatLimit: number,
  effectiveCollected: number,
  required: number,
  moneyStatusType: 'surplus' | 'deficit' | 'balanced',
  moneyStatusAmount: number,
  refundToOverlimit: number,
  surplusToDistribute: number
): Promise<jsPDF> => {
  // Инициализируем шрифт с поддержкой кириллицы перед использованием
  await initializeCyrillicFont()

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let yPos = margin

  // Добавляем шрифт с поддержкой кириллицы в документ
  addCyrillicFontToDoc(doc)
  
  // Заголовок
  doc.setFontSize(18)
  setCyrillicFont(doc, 'bold')
  doc.text('Отчет по мониторингу мероприятия', margin, yPos)
  yPos += 10

  // Информация о событии
  doc.setFontSize(14)
  setCyrillicFont(doc, 'bold')
  doc.text('Информация о мероприятии', margin, yPos)
  yPos += 7

  doc.setFontSize(11)
  setCyrillicFont(doc, 'normal')
  
  // Преобразование числовых значений
  const seatLimitNum = typeof event.data.seatLimit === 'string' ? Number(event.data.seatLimit) : (event.data.seatLimit || 0)
  const pricePerSeatNum = event.data.pricePerSeat 
    ? (typeof event.data.pricePerSeat === 'string' ? Number(event.data.pricePerSeat) : event.data.pricePerSeat)
    : null
  const priceTotalNum = event.data.priceTotal
    ? (typeof event.data.priceTotal === 'string' ? Number(event.data.priceTotal) : event.data.priceTotal)
    : null
  
  const eventInfo = [
    ['Название:', event.title || '—'],
    ['Автор:', event.data.authorName || '—'],
    ['Место проведения:', event.data.location || '—'],
    ['Лимит мест:', seatLimitNum > 0 ? String(seatLimitNum) : '—'],
    ['Цена за место:', pricePerSeatNum ? formatPrice(pricePerSeatNum) : '—'],
    ['Общая цена:', priceTotalNum ? formatPrice(priceTotalNum) : '—']
  ]

  eventInfo.forEach(([label, value]) => {
    setCyrillicFont(doc, 'bold')
    doc.text(label, margin, yPos)
    setCyrillicFont(doc, 'normal')
    const textWidth = doc.getTextWidth(value)
    if (textWidth > contentWidth - 50) {
      const lines = doc.splitTextToSize(value, contentWidth - 50)
      doc.text(lines[0], margin + 50, yPos)
      yPos += 5
      if (lines.length > 1) {
        lines.slice(1).forEach((line: string) => {
          doc.text(line, margin + 50, yPos)
          yPos += 5
        })
      }
    } else {
      doc.text(value, margin + 50, yPos)
    }
    yPos += 6
  })

  // Даты мероприятия
  yPos += 2
  setCyrillicFont(doc, 'bold')
  doc.text('Даты мероприятия:', margin, yPos)
  yPos += 6

  const dates = []
  if (event.data.startApplicationsAtDate) {
    dates.push([
      'Начало приема заявок:',
      formatDateTime(event.data.startApplicationsAtDate, event.data.startApplicationsAtTime, event.data.timezone)
    ])
  }
  if (event.data.endApplicationsAtDate) {
    dates.push([
      'Окончание приема заявок:',
      formatDateTime(event.data.endApplicationsAtDate, event.data.endApplicationsAtTime, event.data.timezone)
    ])
  }
  if (event.data.startContractsAtDate) {
    dates.push([
      'Начало оформления договоров:',
      formatDateTime(event.data.startContractsAtDate, event.data.startContractsAtTime, event.data.timezone)
    ])
  }
  if (event.data.startAtDate) {
    dates.push([
      'Начало мероприятия:',
      formatDateTime(event.data.startAtDate, event.data.startAtTime, event.data.timezone)
    ])
  }
  if (event.data.endAtDate) {
    dates.push([
      'Окончание мероприятия:',
      formatDateTime(event.data.endAtDate, event.data.endAtTime, event.data.timezone)
    ])
  }

  dates.forEach(([label, value]) => {
    setCyrillicFont(doc, 'bold')
    doc.text(label, margin, yPos)
    setCyrillicFont(doc, 'normal')
    doc.text(value, margin + 70, yPos)
    yPos += 6
  })

  // Финансовые показатели
  yPos += 5
  doc.setFontSize(14)
  setCyrillicFont(doc, 'bold')
  doc.text('Финансовые показатели', margin, yPos)
  yPos += 7

  doc.setFontSize(11)
  setCyrillicFont(doc, 'normal')
  const financialInfo = [
    ['Собрано:', formatPrice(effectiveCollected)],
    ['Требуется:', formatPrice(required)],
    [
      moneyStatusType === 'deficit' ? 'Недобор:' : moneyStatusType === 'surplus' ? 'Профицит:' : 'Баланс:',
      formatPrice(moneyStatusAmount)
    ]
  ]

  if (moneyStatusType === 'surplus') {
    financialInfo.push(['Возврат сверхлимитчикам:', formatPrice(refundToOverlimit)])
    financialInfo.push(['Профицит к распределению:', formatPrice(surplusToDistribute)])
  }

  financialInfo.forEach(([label, value]) => {
    setCyrillicFont(doc, 'bold')
    doc.text(label, margin, yPos)
    setCyrillicFont(doc, 'normal')
    doc.text(value, margin + 70, yPos)
    yPos += 6
  })

  // Информация о заявителе
  yPos += 5
  doc.setFontSize(14)
  setCyrillicFont(doc, 'bold')
  doc.text('Информация о заявителе', margin, yPos)
  yPos += 7

  doc.setFontSize(11)
  const isInLimit = applicantIndex < seatLimit
  const refundAmount = isInLimit ? 0 : (applicant.paidAmount || 0)

  const applicantInfo = [
    ['Код/Логин:', applicant.login || applicant.code || '—'],
    ['Мест:', String(applicant.seats || 0)],
    ['Оплачено:', formatPrice(applicant.paidAmount || 0)],
    ['Статус:', isInLimit ? 'В лимите' : 'Вне лимита'],
    ['Возврат:', formatPrice(refundAmount)]
  ]

  applicantInfo.forEach(([label, value]) => {
    setCyrillicFont(doc, 'bold')
    doc.text(label, margin, yPos)
    setCyrillicFont(doc, 'normal')
    doc.text(value, margin + 50, yPos)
    yPos += 6
  })

  // Таблица платежей
  if (applicant.payments && applicant.payments.length > 0) {
    yPos += 5
    doc.setFontSize(14)
    setCyrillicFont(doc, 'bold')
    doc.text('Платежи заявителя', margin, yPos)
    yPos += 7

    const paymentsData = applicant.payments.map((payment: PaymentEntry) => [
      formatPrice(payment.amount || 0),
      formatDate(payment.createdAt)
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Сумма', 'Дата платежа']],
      body: paymentsData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: margin, right: margin }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // Футер с датой генерации
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  setCyrillicFont(doc, 'normal')
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Отчет сгенерирован: ${DateTime.now().toLocaleString({ day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    margin,
    pageHeight - 10
  )

  return doc
}

// Генерация ZIP-архива со всеми PDF
export const generateZipArchive = async (
  event: SavedEvent,
  monitoringData: MonitoringSnapshot,
  seatLimit: number,
  effectiveCollected: number,
  required: number,
  moneyStatusType: 'surplus' | 'deficit' | 'balanced',
  moneyStatusAmount: number,
  refundToOverlimit: number,
  surplusToDistribute: number
): Promise<Blob> => {
  const zip = new JSZip()

  // Сортировка заявителей по сумме оплаты (по убыванию)
  const sortedApplicants = [...monitoringData.applicants].sort(
    (a, b) => (b.paidAmount || 0) - (a.paidAmount || 0)
  )

  // Генерация PDF для каждого заявителя
  for (let i = 0; i < sortedApplicants.length; i++) {
    const applicant = sortedApplicants[i]
    const pdf = await generateApplicantPdf(
      event,
      monitoringData,
      applicant,
      i,
      seatLimit,
      effectiveCollected,
      required,
      moneyStatusType,
      moneyStatusAmount,
      refundToOverlimit,
      surplusToDistribute
    )

    // Формирование имени файла
    const now = DateTime.now()
    const dateStr = now.toFormat('ddMMyyyy')
    const timeStr = now.toFormat('HHmm')
    const login = applicant.login || applicant.code || `applicant_${i + 1}`
    const fileName = `Cons_${dateStr}_${timeStr}_${login}.pdf`

    // Добавление PDF в ZIP
    const pdfBlob = pdf.output('blob')
    zip.file(fileName, pdfBlob)
  }

  // Генерация ZIP-архива
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  return zipBlob
}

// Формирование имени ZIP-архива
export const getZipFileName = (): string => {
  const now = DateTime.now()
  const dateStr = now.toFormat('ddMMyyyy')
  const timeStr = now.toFormat('HHmm')
  return `Cons_${dateStr}_${timeStr}.zip`
}

