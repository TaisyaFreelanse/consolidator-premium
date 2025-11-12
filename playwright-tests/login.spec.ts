import { test, expect } from '@playwright/test'

test('producer can sign in via auth modal', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Гость' }).click()

  await page.getByPlaceholder('Введите ваш логин').fill('прод1')
  await page.getByPlaceholder('Введите пароль').fill('пар1')

  await page.getByRole('button', { name: 'Войти' }).click()

  await expect(page.getByText('Вход выполнен успешно')).toBeVisible()
  await expect(page.getByText('PROD001')).toBeVisible()
})

