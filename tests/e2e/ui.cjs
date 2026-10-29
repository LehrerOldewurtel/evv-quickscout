// Exercise the actual More menu when a secondary action is collapsed.
async function revealAction(page,selector){if(!(await page.locator(selector).isVisible()))await page.locator('#moreActions').click()}
module.exports={revealAction};
async function openTab(page,tab){const b=page.locator(`[data-tab="${tab}"]`);if(await b.isVisible()){await b.click();return}await page.locator('#turnaroundReport').click();await page.locator({coach:'#analysisGoCoach',stats:'#analysisGoStats',opponent:'#analysisGoOpponent'}[tab]).click()}
module.exports.openTab=openTab;
