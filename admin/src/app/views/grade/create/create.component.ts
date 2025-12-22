import { GradeService, UtilService } from '../../../../services';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  FormControlDirective,
  FormLabelDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  FormDirective,
  RowComponent,
  ColComponent,
  FormSelectDirective,
  FormFeedbackComponent,
  InputGroupComponent,
} from '@coreui/angular';
@Component({
  selector: 'app-create-grade',
  standalone: true,
  templateUrl: './create.component.html',
  styleUrls: ['./gradeCreate.component.scss'],
  imports: [
    FormDirective,
    FormControlDirective,
    FormLabelDirective,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    RowComponent,
    ColComponent,
    FormSelectDirective,
    ReactiveFormsModule,
    FormsModule,
    FormFeedbackComponent,
    InputGroupComponent,
  ],
})
export class CreateGradeComponent implements OnInit {
  constructor(
    private gradeService: GradeService,
    private utilService: UtilService,
    private router: Router
  ) {}

  public grade: any = {
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    type: '',
    alias: '',
    ordering: 0,
  };
  public isSubmitted = false;
  public gradeForm!: FormGroup;
  public customStylesValidated = false;
  public loading = false;

  // public toasterPlacement: ToasterPlacement;
  ngOnInit(): void {}
  submit(form: any): void {
    if (this.isSubmitted) {
      return this.utilService.toastError({
        title: 'error',
        message: 'Oops! You missed a required field',
      });
    }
    this.isSubmitted = true;
    this.customStylesValidated = true;

    if (!form.valid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Something went wrong, please check and try again!',
      });
      return;
    }

    const data = {
      name: this.grade.name,
      type: this.grade.type,
      alias: this.grade.alias,
      ordering: this.grade.ordering,
    };
    this.loading = true;
    this.gradeService.create(data).subscribe((response) => {
      this.utilService.toastSuccess({
        title: 'Error',
        message: 'Grade created successfully',
      });
      this.router.navigate(['/grade/list']);
    });
  }
}
