import puppeteer from 'puppeteer'

const PAPYRUS_USERNAME = ''
const PAPYRUS_PASSWORD = ''

const tryParse = (s: string | undefined | null): number | null => {
  if (s == null) {
    return null
  }

  try {
    return parseInt(s, 10)
  } catch (err) {
    return null
  }
}

type PHABasicInformation = {
  id: string
  name: string
  day: string | null
  start: string | null
  end: string | null
  shifts: readonly {
    timeRange: string
    signedUpVolunteers: number | null
    neededVolunteers: number | null
  }[]
}

const getDetailedInformation = async (page: puppeteer.Page, phaName: string, phaStart: string): Promise<void> => {
  await page.goto('https://papyrus.rodekruis.be/Pages/ManageVolunteerHelpActions.aspx')


  const listTabSelector = '#ctl00_ctl00_ContentPlaceHolderBody_ContentPlaceHolder_rtsVolunteerHelpActions > div > ul > li.rtsLI.rtsLast > a > span > span > span'
  await page.waitForSelector(listTabSelector)
  await page.click(listTabSelector)

  const tableSelector = '#ctl00_ctl00_ContentPlaceHolderBody_ContentPlaceHolder_ucVolunteerHelpActionsListControl_rgPha_ctl00'
  await page.waitForSelector(tableSelector)
  const table = await page.$(tableSelector)
  const rows = await table?.$$('.rgRow, .rgAltRow') || []

  const rowToClick = rows.filter()
}

const renameMe = async (headless = true) => {
  console.log('Launching puppeteer...')

  // --no-sandbox required for running on GCF
  const browser = await puppeteer.launch({ headless, args: ['--no-sandbox'] })

  const page = await browser.newPage()


  console.log('Opening Papyrus site...')
  await page.goto('https://papyrus.rodekruis.be')


  const usernameInputSelector = 'input[name="ctl00$ContentPlaceHolder1$txtUsername"]'
  const passwordInputSelector = 'input[name="ctl00$ContentPlaceHolder1$txtPassword"]'
  const loginButtonSelector = 'input[name="ctl00$ContentPlaceHolder1$btnLogin"]'

  await page.waitForSelector(usernameInputSelector)
  await page.waitForSelector(passwordInputSelector)

  await page.type(usernameInputSelector, PAPYRUS_USERNAME)
  await page.type(passwordInputSelector, PAPYRUS_PASSWORD)

  await page.click(loginButtonSelector)


  const dropdownSelector = "#ContentPlaceHolderNav_leftMenu > li:nth-child(1) > a"
  await page.waitForSelector(dropdownSelector)
  await page.click(dropdownSelector)

  await page.click("#ContentPlaceHolderNav_leftMenu > li:nth-child(1) > ul > li:nth-child(1) > a")

  const listTabSelector = '#ctl00_ctl00_ContentPlaceHolderBody_ContentPlaceHolder_rtsVolunteerHelpActions > div > ul > li.rtsLI.rtsLast > a > span > span > span'
  await page.waitForSelector(listTabSelector)
  await page.click(listTabSelector)

  const tableSelector = '#ctl00_ctl00_ContentPlaceHolderBody_ContentPlaceHolder_ucVolunteerHelpActionsListControl_rgPha_ctl00'
  await page.waitForSelector(tableSelector)
  const table = await page.$(tableSelector)
  const rows = await table?.$$('.rgRow, .rgAltRow') || []

  const basicInformation = await Promise.all(rows.map(async (row): Promise<PHABasicInformation | null> => {
    const name = await (await row.$('span[style*="font-weight:bold"]'))?.evaluate((node) => (node as HTMLSpanElement).innerText)
    const summaryText = await (await row.$('td:nth-child(1) > span[id*="lblSummary"'))?.evaluate((node) => (node as HTMLSpanElement).innerText)
    const shifts = (summaryText?.split('\n') || []).slice(1).filter(unparsed => unparsed.includes(', Aantal HV nodig: ')).map(unparsedShift => {
      const split = unparsedShift.split(', Aantal HV nodig:')

      return {
        timeRange: split[0],
        signedUpVolunteers: tryParse(split[1]?.split(' / ')[0].trim()),
        neededVolunteers: tryParse(split[1]?.split(' / ')[1].trim())
      }
    })
    
    const day = await (await row.$('td:nth-child(2) > span'))?.evaluate((node) => (node as HTMLSpanElement).innerText) || null
    const start = await (await row.$('td:nth-child(3)'))?.evaluate((node) => (node as HTMLSpanElement).innerText) || null
    const end = await (await row.$('td:nth-child(4)'))?.evaluate((node) => (node as HTMLSpanElement).innerText) || null

    if (name == null) {
      return null
    }

    return {
      id: `${name} ${start}`,
      name,
      day,
      start,
      end,
      shifts
    }
  }))

  console.log(JSON.stringify(basicInformation))

}


renameMe(false)
