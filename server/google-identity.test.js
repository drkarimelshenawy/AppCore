import test from 'node:test';
import assert from 'node:assert/strict';
import {PROJECTS,canonicalProjectId,identityFor,storageIdFor,identityMetadata} from '../dashboard/identity.mjs';
test('official identities and historical routing',()=>{
 assert.equal(PROJECTS.exmore.applicationId,'com.exmore.app');
 assert.equal(identityFor('3al-tabloh'),PROJECTS.altabloh);
 assert.equal(canonicalProjectId('3al-tabloh'),'altabloh');
 assert.equal(storageIdFor('altabloh'),'3al-tabloh');
 assert.equal(PROJECTS.appcore.applicationId,'com.appcore.admin');
 assert.equal(PROJECTS.appcore.androidStatus,'future');
 assert.equal(identityFor('constructor'),null);
 assert.deepEqual(identityMetadata('new-app'),{projectId:'new-app'});
});
