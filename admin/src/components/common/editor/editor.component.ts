import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Editor,
  NgxEditorComponent,
  NgxEditorMenuComponent,
  Toolbar,
} from 'ngx-editor';

@Component({
  selector: 'app-editor',
  standalone: true,
  templateUrl: './editor.component.html',
  imports: [NgxEditorComponent, NgxEditorMenuComponent, FormsModule],
})
export class EditorComponent implements OnInit, OnDestroy {
  @Input() set content(value: string) {
    this.html = value;
  }
  @Output() contentChange = new EventEmitter<string>();

  editor: Editor = new Editor();

  html = this.content;

  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  ngOnInit(): void {
    this.editor = new Editor();
  }

  onContentChange(value: string) {
    // Clean the content before emitting to handle pasted content with conflicting styles
    const cleanedValue = this.cleanPastedContent(value);
    this.contentChange.emit(cleanedValue);
  }

  private cleanPastedContent(content: string): string {
    if (!content) return content;

    // Remove problematic inline styles from pasted content that conflict with dark mode
    return content
      // Remove color styles that might conflict with dark mode
      .replace(/style\s*=\s*["'][^"']*color\s*:\s*[^;"']*[;"']?[^"']*["']/gi, '')
      // Remove background styles that might conflict with dark mode
      .replace(/style\s*=\s*["'][^"']*background[^;"']*[;"']?[^"']*["']/gi, '')
      // Remove font-family that might not be available
      .replace(/style\s*=\s*["'][^"']*font-family[^;"']*[;"']?[^"']*["']/gi, '')
      // Remove empty style attributes
      .replace(/style\s*=\s*["']\s*["']/gi, '')
      // Remove style attributes with only whitespace
      .replace(/style\s*=\s*["']\s+["']/gi, '')
      // Clean up any remaining empty style attributes
      .replace(/\s+style\s*=\s*["']["']/gi, '');
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }
}
