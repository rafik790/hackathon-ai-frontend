import { Clipboard } from '@angular/cdk/clipboard';
import { Directive, HostListener, Input } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

/** `<button [appCopyToClipboard]="run.pipelineRunUid">` copies the value and confirms with a toast. */
@Directive({ selector: '[appCopyToClipboard]', standalone: false })
export class CopyToClipboardDirective {
  @Input('appCopyToClipboard') value: string | null | undefined = null;
  @Input() copyLabel = 'Value';

  constructor(private readonly clipboard: Clipboard, private readonly notifications: NotificationService) {}

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.stopPropagation();
    if (!this.value) {
      return;
    }
    if (this.clipboard.copy(this.value)) {
      this.notifications.info(`${this.copyLabel} copied to clipboard`);
    } else {
      this.notifications.error('Could not access the clipboard');
    }
  }
}
