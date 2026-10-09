import { chromium } from 'playwright';

const formUrl = 'https://forms.gle/GyWZCMCPocgJdJon6';
let browser;
const result = { checkedUrl: formUrl, status: 'UNVERIFIED', checkedAt: new Date().toISOString() };
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);
  const raw = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  result.finalUrl = page.url();
  result.title = await page.title();
  const closed = /no longer accepting responses|not accepting responses|this form is closed|responses are closed|form is no longer available/i.test(raw);
  const explicitQuestions = /project description|bitget uid|submission materials|x promotional post|role of the llm/i.test(raw);
  const requiredForm = /\bsubmit\b/i.test(raw) && explicitQuestions;
  if (closed) result.status = 'CLOSED_MESSAGE_VISIBLE';
  else if (requiredForm) result.status = 'FORM_FIELDS_VISIBLE_NOT_PROOF_OF_ACCEPTANCE';
  else result.status = 'INDETERMINATE';
  const deadlineFragments = [...raw.matchAll(/(?:deadline|october 8|october 11|closing date)/gi)].slice(0, 3)
    .map((match) => raw.slice(Math.max(0, match.index - 45), Math.min(raw.length, match.index + 110)));
  result.deadlineFragments = deadlineFragments;
  result.formTextPresent = explicitQuestions;
} catch (error) { result.error = String(error.message); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result, null, 2));
