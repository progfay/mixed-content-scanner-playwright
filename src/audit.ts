import { chromium } from 'playwright'
import urls from './urls'

import type { Protocol } from 'playwright/types/protocol'

interface MixedContentIssue {
  url: string
  details?: Protocol.Audits.MixedContentIssueDetails
}

const main = async (): Promise<void> => {
  const browser = await chromium.launch()
  console.warn(browser.version())
  const context = await browser.newContext()

  let url = ''
  const issues: MixedContentIssue[] = []

  const page = await context.newPage()
  const client = await context.newCDPSession(page)
  await client.send('Audits.enable')
  client.on('Audits.issueAdded', ({ issue }) => {
    if (url === '') return
    if (issue.code !== 'MixedContentIssue') return
    const mixedContentIssue: MixedContentIssue = {
      url,
      details: issue.details?.mixedContentIssueDetails
    }
    issues.push(mixedContentIssue)
    console.warn(mixedContentIssue)
  })

  for (const u of urls) {
    url = u
    console.warn(url)
    await page.goto(url)
    await page.waitForLoadState('load')
  }

  await browser.close()

  console.log(JSON.stringify(issues))
  process.exit(0)
}

main().catch(console.error)
