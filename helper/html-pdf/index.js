const {default: puppeteer} = require("puppeteer");

module.exports = {
 generatePDFfromHTML: async function (htmlContent, outputPath) {
  const browser = await puppeteer.launch({
   headless: true,
   args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, {waitUntil: "networkidle0"});
  await page.pdf({path: outputPath, format: "A4", printBackground: true});
  await browser.close();

  console.log(`PDF generated successfully at ${outputPath}`);
 },
};
