import { Component, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';

// import { GardeService } from '../../../../services/garde.service';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UtilService, GradeService } from '../../../../services';
import {
  FormControlDirective,
  FormLabelDirective,
  ButtonDirective,
  CardBodyComponent,
  CardHeaderComponent,
  CardComponent,
  FormDirective,
  FormFloatingDirective,
  RowComponent,
  ColComponent,
  FormSelectDirective,
  FormFeedbackComponent,
  InputGroupComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-update-grade',
  standalone: true,
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss'],
  imports: [
    FormDirective,
    FormControlDirective,
    FormFloatingDirective,
    FormLabelDirective,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    RowComponent,
    ColComponent,
    FormSelectDirective,
    ReactiveFormsModule,
    FormFeedbackComponent,
    InputGroupComponent,
    NgStyle,
    FormsModule,
  ],
})
export class UpdateGradeComponent implements OnInit {
  public gradeForm!: FormGroup;
  public isSubmitted = false;

  public gradeId: string = '';
  public grade: any = {};
  public customStylesValidated = false;

  // private readonly utilService = inject(UtilService);

  constructor(
    private gradeService: GradeService,
    private router: Router,
    private fb: FormBuilder,
    private utilService: UtilService
  ) {}

  ngOnInit(): void {
    this.gradeId = this.router.url.split('/').pop() || '';

    this.initForm();
    this.loadGrade();
  }
  private initForm(): void {
    this.gradeForm = this.fb.group({
      name: ['', Validators.required],
      alias: ['', Validators.required],
      type: [''],
      ordering: [''],
      description: ['', Validators.minLength(6)],
    });
  }
  loadGrade(): void {
    this.gradeService.findById(this.gradeId).subscribe(
      (response) => {
        this.grade = response.data;
        this.gradeForm.patchValue({
          name: this.grade.name,
          alias: this.grade.alias,
          type: this.grade.type,
          ordering: this.grade.ordering,
          description: this.grade.description,
        });
      },
      (error) => {}
    );
  }

  submit() {
    if (this.isSubmitted) {
      return this.utilService.toastError({
        title: 'error',
        message: 'Oops! You missed a required field',
      });
    }
    this.isSubmitted = true;
    this.customStylesValidated = true;
    if (this.gradeForm.invalid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please check the form and try again',
      });
      return;
    }
    const gradeData = {
      ...this.gradeForm.value,
    };
    this.gradeService.update(this.gradeId, gradeData).subscribe((response) => {
      this.utilService.toastSuccess({
        title: 'Success',
        message: 'Grade updated successfully',
      });
      this.router.navigate(['./grade/list']);
    });
  }
}
