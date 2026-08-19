import { execFileSync } from 'node:child_process';

export default async function globalTeardown(): Promise<void> {
  execFileSync('docker', ['compose', 'rm', '--stop', '--force', 'postgres-e2e'], {
    stdio: 'inherit',
  });
}
