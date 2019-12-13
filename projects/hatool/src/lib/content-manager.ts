import { Subject } from 'rxjs';
import { first as first_ } from 'rxjs/operators';

export class ContentManager {

  public messages: any[] = [];
  public inputs = new Subject<any>();
  public updated = new Subject<any>();
  public inputEnabled = false;
  public textArea = false;
  public placeholder = '';
  public validator = null;

  public sendButtonText = 'Send';
  public inputPlaceholder = 'Type something...';
  public uploadFileText = 'Upload File...';
  public uploadedFileText = 'Uploaded Successfully';
  public notUploadedFileText = 'Failed to upload file';
  public timeout = 1000;

  toQueue = [];

  constructor() { }

  clear() {
    this.messages = [];
    this.toQueue = [];
  }

  reportValue(value) {
    this.inputs.next(value);
  }

  reportUpdated(value) {
    window.setTimeout(() => {
      this.updated.next(value);
    }, this.timeout / 10);
  }

  add(kind, params) {
    if (kind === 'wait') {
      return;
    }
    const first = (
      this.messages.length === 0 ||
      kind !== this.messages[this.messages.length - 1].kind
    );
    this.messages.push({kind, params, first});
  }

  queue(kind, params, inputEnabled?) {
    this.toQueue.push({kind, params, inputEnabled});
    if (this.toQueue.length === 1) {
      this.typing();
    }
  }

  typing() {
    if (this.toQueue.length > 0) {
      this.add('typing', null);
      window.setTimeout(() => {
        if (this.toQueue.length > 0) {
          const item = this.toQueue.shift();
          this.replace(item.kind, item.params);
          if (item.params && item.params.meta) {
            item.params.meta();
          }
          if (this.toQueue.length === 0) {
            this.inputEnabled = item.inputEnabled;
          }
          this.reportUpdated(item);
          this.typing();
        }
      }, this.timeout);
      }
  }

  replace(kind, params) {
    const first = (this.messages.length < 2 || kind !== this.messages[this.messages.length - 2].kind);
    this.messages[this.messages.length - 1] = {kind, params, first};
  }

  addFrom(message: string) {
    this.add('from', {message});
    this.reportValue(message);
    this.reportUpdated(message);
    this.textArea = false;
    this.placeholder = '';
    this.validator = null;
  }

  queueFrom(message: string) {
    this.queue('from', {message});
  }

  addTo(message: string, meta?: () => void) {
    this.queue('to', {message, meta});
  }

  addOptions(message, options: any[], selected?: any) {
    if (message) {
      this.queue('to', {message});
    }
    this.queue('options', {options, selected});
  }

  addUploader(message, options?: any) {
    if (message) {
      this.queue('to', {message});
    }
    this.queue('uploader', options);
  }

  setTextArea() {
    this.textArea = true;
  }

  setPlaceholder(placeholder) {
    this.placeholder = placeholder;
  }

  setValidator(validator) {
    this.validator = validator;
  }

  waitForInput(enableTextInput?): Promise<any> {
    enableTextInput = (enableTextInput !== false);
    if (enableTextInput) {
      this.queue('wait', {}, true);
    }
    return new Promise((resolve, reject) => {
      this.inputs.pipe(
        first_()
      ).subscribe((value) => {
        this.inputEnabled = false;
        resolve(value);
      });
    });
  }

  setQueueTimeout(timeout) {
    this.timeout = timeout;
  }

}
