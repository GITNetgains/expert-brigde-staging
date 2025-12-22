import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { IconModule } from '@coreui/icons-angular';
import { UtilService } from 'src/services';
import { AddCertificationComponent } from '../modal-create-education/add';
import { EyeIconComponent } from 'src/components/common/icons/eye-icon/eye-icon.component';
import { TutorService } from '../../../../services/tutor.service';
import { CommonModule } from '@angular/common';
import { cilPencil, cilTrash } from '@coreui/icons';
import {
  TabsModule,
  ButtonModule,
  CardModule,
  GridModule,
  Tabs2Module,
  TabsComponent,
} from '@coreui/angular';
import { IUser } from 'src/interfaces';

@Component({
  selector: 'app-tutor-education',
  templateUrl: './tutor-education.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    ButtonModule,
    CardModule,
    GridModule,
    Tabs2Module,
    TabsComponent,
    AddCertificationComponent,
    IconModule,
    EyeIconComponent,
  ],
})
export class TutorEducationComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() tutorId!: string;
  info: any = {
    education: [],
    experience: [],
    certification: [],
  };
  @Input() tutor!: IUser;

  activeTabKey = 'education';
  isLoading = false;

  modalData = {
    certificate: undefined as any,
    type: '',
    visible: false,
  };

  icons = { cilPencil, cilTrash };
  private tutorService = inject(TutorService);
  private util = inject(UtilService);
  private cdr = inject(ChangeDetectorRef);

  education: any[] = [];
  experience: any[] = [];
  certification: any[] = [];

  ngOnInit() {
    this.loadTutorInfo();
  }

  ngAfterViewInit() {
    this.activeTabKey = 'education';
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tutor'] && changes['tutor'].currentValue) {
      this.loadTutorInfo();
    }
  }

  loadTutorInfo() {
    if (!this.tutorId) {
      this.util.toastError({
        title: 'Error',
        message: 'Tutor ID is required',
      });
      return;
    }
    this.isLoading = true;
    this.tutorService.findOne(this.tutorId).subscribe({
      next: (resp: any) => {
        if (resp && resp.data) {
          this.tutor = resp.data;
          this.education = this.tutor.education || [];
          this.experience = this.tutor.experience || [];
          this.certification = this.tutor.certification || [];
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.util.toastError({
          title: 'Error',
          message: err.error?.message || 'Failed to load tutor information',
        });
      },
    });
  }

  open(type: string, index?: number, item?: any) {
    this.modalData = {
      certificate: item ? { ...item } : undefined,
      type: type,
      visible: true,
    };
  }

  closeModal(result?: any) {
    this.modalData.visible = false;

    if (result) {
      this.loadTutorInfo();
    }
  }

  deleteCer(type: string, index: number, item: any) {
    if (!window.confirm('Are you sure you want to delete this certificate?')) {
      return;
    }

    this.tutorService.deleteCertificate(item._id).subscribe({
      next: () => {
        this.util.toastSuccess({
          title: 'Success',
          message: 'Deleted successfully',
        });
        if (type === 'education') {
          this.education.splice(index, 1);
        } else if (type === 'experience') {
          this.experience.splice(index, 1);
        } else if (type === 'certification') {
          this.certification.splice(index, 1);
        }
      },
      error: (err: any) => {
        this.util.toastError({
          title: 'Error',
          message:
            err.error?.message || 'Something went wrong, please try again!',
        });
      },
    });
  }

  isDoc(document: any): boolean {
    if (!document || !document.mimeType) {
      return false;
    }

    const mimeType = document.mimeType.toLowerCase();
    return (
      mimeType.includes('pdf') ||
      mimeType.includes('doc') ||
      mimeType.includes('word') ||
      mimeType.includes('xls') ||
      mimeType.includes('excel')
    );
  }

  showDocument(document: any) {
    if (document && document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  }
}
