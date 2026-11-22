import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [StatusBadgeComponent] });
    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  const render = (status: string, label: string | null = null): HTMLElement => {
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('label', label);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.badge') as HTMLElement;
  };

  it('uses the status colour and label', () => {
    const failed = render('FAILED');
    expect(failed.classList).toContain('tone-danger');
    expect(failed.textContent?.trim()).toBe('Failed');

    expect(render('SUCCEEDED').classList).toContain('tone-success');
    expect(render('UNKNOWN').classList).toContain('tone-neutral');
    expect(render('DEGRADED').classList).toContain('tone-warning');
  });

  it('pulses only while running', () => {
    expect(render('RUNNING').querySelector('.dot.pulse')).not.toBeNull();
    expect(render('SUCCEEDED').querySelector('.dot.pulse')).toBeNull();
  });

  it('accepts a custom label', () => {
    expect(render('UP', 'Reachable').textContent?.trim()).toBe('Reachable');
  });
});
