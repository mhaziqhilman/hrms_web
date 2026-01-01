import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

/**
 * Provides ZardUI configuration for the application
 * This is required for ZardUI components to work properly
 */
export function provideZard(): EnvironmentProviders {
  return makeEnvironmentProviders([
    // ZardUI providers can be added here as needed
    // For now, this is a placeholder for future ZardUI configuration
  ]);
}
