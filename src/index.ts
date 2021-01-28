import { chromium } from 'playwright'
import urls from './urls'

interface NetworkMixedContentIssue {
  type: 'network'
  url: string
  target: string
}

interface DOMMixedContentIssue {
  type: 'dom'
  url: string
  node: string
}

type MixedContentIssue = NetworkMixedContentIssue | DOMMixedContentIssue

interface MixedContentScanner {
  selector: string
  description: string
}

const scanners: MixedContentScanner[] = [
  { description: 'non secure image', selector: 'img[src^="http://"]' },
  { description: 'non secure audio', selector: 'audio[src^="http://"]' },
  { description: 'non secure link', selector: 'link[href^="http://"]' },
  { description: 'non secure script', selector: 'script[src^="http://"]' },
  { description: 'non secure iframe', selector: 'iframe[src^="http://"]' },
  { description: 'non secure form', selector: 'form[action^="http://"]' },
  { description: 'non secure source', selector: 'source[src^="http://"]' }
]

const main = async (): Promise<void> => {
  const browser = await chromium.launch()
  console.warn(browser.version())
  const context = await browser.newContext()

  let url = ''
  const issues: MixedContentIssue[] = []

  const page = await context.newPage()
  const client = await context.newCDPSession(page)
  await client.send('Network.enable')
  client.on('Network.requestWillBeSent', ({ request }) => {
    if (url === '') return
    try {
      const { protocol } = new URL(request.url)
      if (protocol !== 'http:') return
    } catch {
      return
    }
    const issue: NetworkMixedContentIssue = {
      type: 'network',
      url,
      target: request.url
    }
    issues.push(issue)
    console.warn(issue)
  })

  for (const u of urls) {
    url = u
    console.warn(url)
    await page.goto(url)
    await page.waitForLoadState('load')

    for (const scanner of scanners) {
      const nodes = await page.$$eval(scanner.selector, elements => {
        return elements.map(element => element.outerHTML)
      })
      for (const node of nodes) {
        const issue: DOMMixedContentIssue = {
          type: 'dom',
          url,
          node
        }
        issues.push(issue)
        console.warn(issue)
      }
    }
  }

  await browser.close()

  console.log(JSON.stringify(issues))
  process.exit(0)
}

main().catch(console.error)
