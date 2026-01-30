import { registerInfrastructure } from './infra.container';
import { registerAllModules } from './modules';

export function registerContainer() {
  registerInfrastructure();
  registerAllModules();
}
