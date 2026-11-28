import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { CollectorStatusStore } from '../../../core/services/collector-status.store';
import { FeatureFlagsService } from '../../../core/services/feature-flags.service';
import { SharedModule } from '../../../shared/shared.module';
import { NAV_GROUPS } from '../../navigation';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  const render = (reliabilityAgent: boolean): string[] => {
    TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: CollectorStatusStore, useValue: { health$: of('UP') } },
        { provide: FeatureFlagsService, useValue: { reliabilityAgent$: of(reliabilityAgent) } },
        { provide: APP_CONFIG, useValue: { appVersion: '1.0.0' } },
      ],
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.nav-item')).map((a) => a.getAttribute('href') ?? '');
  };

  it('offers the Reliability Agent below Failure Patterns when the backend enables it', () => {
    const routes = render(true);

    expect(routes).toContain('/reliability-agent');
    expect(routes.indexOf('/reliability-agent')).toBe(routes.indexOf('/failure-patterns') + 1);
    const item = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.route === '/reliability-agent');
    expect(item?.label).toBe('Reliability Agent');
  });

  it('hides it while the feature is switched off and keeps every other item', () => {
    const routes = render(false);

    expect(routes).not.toContain('/reliability-agent');
    expect(routes).toEqual(['/overview', '/pipeline-runs', '/task-runs', '/failure-analysis', '/failure-patterns', '/monitoring', '/settings']);
  });
});
