import {checkPublicHealth} from '../dashboard/public-health.mjs';
import {writeFile} from 'node:fs/promises';
const report={checkedAt:new Date().toISOString(),checks:await checkPublicHealth(),scope:'Public remote configuration only; no authenticated mutations, no device acceptance.'};
console.log(JSON.stringify(report,null,2));if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');
if(report.checks.some(r=>!r.ok))process.exitCode=1;
