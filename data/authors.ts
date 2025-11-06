// Справочник авторов мероприятий
import type { Author } from '~/types'

export const AUTHORS: Author[] = [
  {
    id: 'author-001',
    lastName: 'Иванов',
    firstName: 'Иван',
    middleName: 'Иванович',
    title: 'Шеф-повар, мастер кулинарного искусства'
  },
  {
    id: 'author-002',
    lastName: 'Петрова',
    firstName: 'Анна',
    middleName: 'Сергеевна',
    title: 'Искусствовед, куратор выставок'
  },
  {
    id: 'author-003',
    lastName: 'Сидоров',
    firstName: 'Петр',
    middleName: 'Михайлович',
    title: 'Мастер спорта, тренер по альпинизму'
  },
  {
    id: 'author-004',
    lastName: 'Козлова',
    firstName: 'Мария',
    title: 'Профессор, доктор исторических наук'
  },
  {
    id: 'author-005',
    lastName: 'Смирнов',
    firstName: 'Алексей',
    middleName: 'Владимирович',
    title: 'Бизнес-тренер, коуч'
  }
]

// Утилита для получения автора по ID
export const getAuthorById = (id: string): Author | undefined => {
  return AUTHORS.find(author => author.id === id)
}

// Утилита для форматирования полного имени автора
export const getAuthorFullName = (author: Author): string => {
  const parts = [author.lastName, author.firstName]
  if (author.middleName) {
    parts.push(author.middleName)
  }
  return parts.join(' ')
}

// Утилита для форматирования короткого имени (Фамилия И.О.)
export const getAuthorShortName = (author: Author): string => {
  const firstInitial = author.firstName.charAt(0).toUpperCase() + '.'
  const middleInitial = author.middleName ? author.middleName.charAt(0).toUpperCase() + '.' : ''
  return `${author.lastName} ${firstInitial}${middleInitial}`
}

