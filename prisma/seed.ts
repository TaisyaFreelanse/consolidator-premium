/**
 * Seed script для заполнения БД тестовыми данными
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаю заполнение БД...')

  // Тестовые события из mock/events.json
  const events = [
    {
      id: 'ev_test_early',
      title: 'Охота на медведя с рогатиной',
      author: 'author-003',
      location: 'Сибирь, Красноярский край',
      startAt: new Date('2025-12-15T08:00:00Z'),
      endAt: new Date('2025-12-17T18:00:00Z'),
      seatLimit: 5,
      priceTotal: 500000,
      pricePerSeat: 100000,
      category: 'training',
      description: 'Добыча бурого медведя из берлоги без огнестрельного оружия. Экстремальный опыт для настоящих профессионалов.',
      activities: JSON.stringify([
        'Теоретическая подготовка по безопасности',
        'Работа с рогатиной и защитным снаряжением',
        'Поиск берлоги и следов медведя'
      ]),
      startApplicationsAt: new Date('2025-11-01T10:00:00Z'),
      endApplicationsAt: new Date('2025-12-10T23:59:59Z'),
      startContractsAt: new Date('2025-12-11T10:00:00Z'),
      status: 'published',
      producerName: 'producer1',
      controlPlan: JSON.stringify(['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']),
      currentControlPoint: 'ti10',
      isCancelled: false
    },
    {
      id: 'ev_test_middle',
      title: 'Подводная фотосессия в Красном море',
      author: 'author-002',
      location: 'Египет, Хургада',
      startAt: new Date('2025-12-20T10:00:00Z'),
      endAt: new Date('2025-12-23T16:00:00Z'),
      seatLimit: 12,
      priceTotal: 840000,
      pricePerSeat: 70000,
      category: 'master-class',
      description: 'Создание профессиональных подводных фотографий с декорациями и постановочным освещением',
      activities: JSON.stringify([
        'Основы подводной фотографии',
        'Работа с подводным освещением',
        'Практическая фотосессия в Красном море'
      ]),
      startApplicationsAt: new Date('2025-11-05T10:00:00Z'),
      endApplicationsAt: new Date('2025-12-15T23:59:59Z'),
      startContractsAt: new Date('2025-12-16T10:00:00Z'),
      status: 'published',
      producerName: 'producer1',
      controlPlan: JSON.stringify(['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']),
      currentControlPoint: 't0',
      isCancelled: false
    },
    {
      id: 'ev_test_critical',
      title: 'Гастро-шоу: Разделка крокодила',
      author: 'author-001',
      location: 'Москва, ресторан Savva',
      startAt: new Date('2025-11-25T19:00:00Z'),
      endAt: new Date('2025-11-25T23:00:00Z'),
      seatLimit: 20,
      priceTotal: 1200000,
      pricePerSeat: 60000,
      category: 'gastro-show',
      description: 'Уникальное гастрономическое шоу с разделкой крокодила и приготовлением авторских блюд',
      activities: JSON.stringify([
        'Мастер-класс по разделке экзотических продуктов',
        'Приготовление блюд из крокодила',
        'Дегустация 5 авторских блюд'
      ]),
      startApplicationsAt: new Date('2025-10-20T10:00:00Z'),
      endApplicationsAt: new Date('2025-11-20T23:59:59Z'),
      startContractsAt: new Date('2025-11-21T10:00:00Z'),
      status: 'published',
      producerName: 'producer2',
      controlPlan: JSON.stringify(['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']),
      currentControlPoint: 'ti20',
      isCancelled: false
    }
  ]

  // Создаём события
  for (const event of events) {
    const created = await prisma.event.upsert({
      where: { id: event.id },
      update: event,
      create: event
    })
    console.log(`✅ Создано событие: ${created.title} (${created.id})`)

    // Создаём начальную запись в истории
    await prisma.eventStatusHistory.create({
      data: {
        eventId: created.id,
        statusCode: created.currentControlPoint || 't0',
        note: 'Инициализация мероприятия'
      }
    })
  }

  console.log('✅ База данных заполнена!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении БД:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

