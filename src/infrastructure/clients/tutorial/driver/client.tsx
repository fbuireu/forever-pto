'use client';

import { createRoot, type Root } from 'react-dom/client';
import { driver, type Config, type Driver, type DriveStep } from 'driver.js';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { X } from 'src/components/animate-ui/icons/x';

export interface DriverConfig extends Omit<Config, 'steps'> {
  steps?: DriveStep[];
}

export class DriverClient {
  private driver: Driver | null = null;
  private closeButtonRoots: Root[] = [];
  private readonly config: DriverConfig;

  constructor(config: DriverConfig) {
    this.config = config;
  }

  private getDriver(): Driver {
    this.driver ??= driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        smoothScroll: true,
        stagePadding: 10,
        stageRadius: 8,
        ...this.config,
        onPopoverRender: (popover, options) => {
          this.config.onPopoverRender?.(popover, options);

          const closeButton = popover.wrapper.querySelector('.driver-popover-close-btn');
          if (closeButton) {
            closeButton.innerHTML = '';
            const iconContainer = document.createElement('span');
            iconContainer.style.color = 'var(--foreground)';
            closeButton.appendChild(iconContainer);
            const root = createRoot(iconContainer);

            root.render(
              <AnimateIcon animateOnHover>
                <X className='h-4 w-4' />
              </AnimateIcon>
            );
            this.closeButtonRoots.push(root);
          }
        },
        onDestroyStarted: (element, step, options) => {
          this.config.onDestroyStarted?.(element, step, options);

          this.closeButtonRoots.forEach((root) => root.unmount());
          this.closeButtonRoots = [];

          if (this.driver) {
            this.driver.destroy();
            this.driver = null;
          }
        },
      });
    return this.driver;
  }

  start(steps?: DriveStep[]): void {
    if (steps) {
      this.config.steps = steps;
    }

    if (this.driver) {
      this.destroy();
    }

    const driverInstance = this.getDriver();

    if (this.config.steps) {
      driverInstance.setSteps(this.config.steps);
    }

    driverInstance.drive();
  }

  destroy(): void {
    if (this.driver) {
      this.driver.destroy();
      this.driver = null;
    }
  }

  isActive(): boolean {
    return !!this.driver?.isActive();
  }
}

let driverClientInstance: DriverClient | null = null;

export const getDriverClientInstance = (): DriverClient => {
  driverClientInstance ??= new DriverClient({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      smoothScroll: true,
      stagePadding: 10,
      stageRadius: 8,
    });

  return driverClientInstance;
};
