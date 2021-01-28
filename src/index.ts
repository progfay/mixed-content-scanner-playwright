import { chromium } from 'playwright'

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('https://www.example.com/')
  await page.screenshot({ path: 'dist/capture.png' })

  await browser.close()
}

main().catch(console.error)
