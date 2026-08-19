import { execFileSync } from 'node:child_process';
/* eslint-disable */

module.exports = async function () {
  execFileSync('docker', ['compose', 'rm', '--stop', '--force', 'postgres-e2e'], {
    stdio: 'inherit',
  });
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
