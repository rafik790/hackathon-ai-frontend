import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { NAV_GROUPS } from '../../../../layout/navigation';
import { SharedModule } from '../../../../shared/shared.module';
import { FailurePatternsComponent } from './failure-patterns.component';

@Component({ selector: 'app-failure-pattern-analysis', template: '', standalone: false })
class AnalysisStubComponent {
  @Input() namespace: string | null = null;
}

describe('FailurePatternsComponent', () => {
  const params = new BehaviorSubject(convertToParamMap({ namespace: 'ci' }));

  const render = () => {
    TestBed.configureTestingModule({
      declarations: [FailurePatternsComponent, AnalysisStubComponent],
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: params.asObservable() } },
        { provide: CollectorStatusStore, useValue: { namespaces$: of(['ci', 'staging']) } },
      ],
    });
    const fixture = TestBed.createComponent(FailurePatternsComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('is its own page and passes the namespace of the URL to the analysis', () => {
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;
    const analysis = fixture.debugElement.query(By.directive(AnalysisStubComponent));

    expect(element.querySelector('app-page-header')?.textContent).toContain('Failure Patterns');
    expect((analysis.componentInstance as AnalysisStubComponent).namespace).toBe('ci');

    params.next(convertToParamMap({}));
    fixture.detectChanges();
    expect((analysis.componentInstance as AnalysisStubComponent).namespace).toBeNull();
  });

  it('keeps the namespace in the URL', () => {
    const fixture = render();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    fixture.componentInstance.setNamespace('staging');

    expect(navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { namespace: 'staging' }, queryParamsHandling: 'merge' }));
  });

  it('is listed in the sidebar directly below Failure Analysis', () => {
    const items = NAV_GROUPS.flatMap((group) => group.items);
    const index = items.findIndex((item) => item.route === '/failure-analysis');

    expect(items[index + 1]).toEqual(jasmine.objectContaining({ label: 'Failure Patterns', route: '/failure-patterns', icon: 'insights' }));
  });
});
