import 'source-map-support/register';

import { formatErrorJSONResponse, formatInternalErrorJSONResponse, formatSuccessJSONResponse } from '@libs/apiGateway';

import { Browser, Page } from 'puppeteer';
import { checkIfTextExistsInAPage, waitForNavigation } from '../../helper';
import { APIGatewayEvent, SQSEvent } from 'aws-lambda';
import { APIResponse, getChrome } from 'src/utils';

const checker = async (browser: Browser) => {
  console.log('Checker started...');
  const url = "http://www.isere.gouv.fr/booking/create/14544";
  let foundSchedule = false
  const page = await browser.newPage();
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    if (['image', 'stylesheet', 'font', 'other'].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
  try {
    console.log(`Visiting ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    page.setViewport({ height: 1920, width: 1080 });
    console.log(`${url} loaded Successfully`);
    await page.waitForSelector("#condition");
    const condition = await page.$('#condition');
    condition.click();
    await page.waitForTimeout(1000);
    console.log(`condition accepted`);
    await waitForNavigation(page, 10000, 'input[name="nextButton"]');
    const nextButton = await page.$('input[name="nextButton"]');
    nextButton.click();
    console.log(`nextButton clicked`);
    await ignoreUnsecuredConnection(page, '#fchoix_Booking', '#planning35227').catch(console.log);
    await waitForNavigation(page, 10000, '#planning35227');
    console.log(`DEMANDE DE RENDEZ-VOUS loaded Successfully`);
    const matinOption = await page.$('#planning35227');
    // const apresMidiOption = await page.$('#planning35228');
    matinOption.click();
    await page.waitForTimeout(1000);
    const firstStepNextButton = await page.$('input[name="nextButton"]');
    firstStepNextButton.click();
    await ignoreUnsecuredConnection(page).catch(console.log);
    const noSchedule = await checkIfTextExistsInAPage(page, `Il n'existe plus de plage horaire libre pour votre demande de rendez-vous. Veuillez recommencer ultérieurement.`);
    foundSchedule = !noSchedule;
    const response = JSON.stringify({ foundSchedule });
    if (foundSchedule) {
      console.log('Schedule available');
      return formatSuccessJSONResponse(response);
    } else {
      console.log('No Schedule found');
      return formatErrorJSONResponse(response);
    }
  } catch (err) {
    console.log('Chaining error');
    console.log(err);
    return formatErrorJSONResponse(JSON.stringify({ err }));
  } finally {
    page.close();
  }
}

const createHandler = (
  workFunction: (browser: Browser) => Promise<APIResponse>
) => async (event: APIGatewayEvent | SQSEvent): Promise<APIResponse> => {
  console.log(event);
  const browser = await getChrome();
  if (!browser) {
    return formatInternalErrorJSONResponse("Error launching Chrome");
  }
  try {
    const response = await workFunction(browser);
    await browser.close();
    return response;
  } catch (err) {
    await browser.close();
    return formatInternalErrorJSONResponse({ msg: "Unhandled Error", err });
  }
}

export const main = createHandler(checker);


async function ignoreUnsecuredConnection(page: Page, ...selectors: string[]) {
  await waitForNavigation(page, 10000, '#proceed-button', ...selectors);
  if (await page.$('#proceed-button') !== null) {
    await page.click('#proceed-button');
  }
}
