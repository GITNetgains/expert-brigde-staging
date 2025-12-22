import { Component } from '@angular/core';
import { type ChartData } from 'chart.js';
import { FileUploadComponent } from '@components/common/uploader/uploader.component';
import { ICalendarPayload, IDatePickerOptions, IUploaderOptions } from 'src/interfaces';
import { environment } from 'src/environments/environment';
import { videoMimeTypes } from 'src/constants';
import { CalendarComponent } from '@components/common/calendar/calendar.component';
import dayjs, { Dayjs } from 'dayjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerCustomComponent } from '@components/common/date-picker-custom/date-picker-custom.component';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  imports: [ CommonModule, FormsModule, DatePickerCustomComponent],
  standalone: true,
})
export class TestComponent {
  data: ChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'GitHub Commits',
        backgroundColor: '#f87979',
        data: [40, 20, 12, 39, 10, 80, 40]
      }
    ]
  };

  public uploadOptions: IUploaderOptions = {
    url: environment.apiUrl + '/media/videos',
    autoUpload: false,
    multiple: false,
    fileFieldName: 'file',
    onProgressItem: (fileItem, progress) => {
      // console.log(`File ${fileItem.file.name} progress: ${progress}%`);
    },
    onProgressAll: (progress) => {
      // console.log(`Overall progress: ${progress}%`);
    },
    onCompleteItem: (item, response) => {
      // console.log(`File ${item.file.name} uploaded successfully`, response.data);
    },
    allowedMimeType: videoMimeTypes,
    hintText: 'Custom Upload Text',
    maxFileSize: 200 * 1024 * 1024,
    // uploadZone: true,
  }

  public calendarPayload: ICalendarPayload = {
    // type: 'subject',
    tutorId: '641d95329cb5a85fc460ef66',
  }

  public selected: { startDate: Dayjs | string, endDate: Dayjs | string } = {
    startDate: '2025-06-02T17:00:00.000Z',
    endDate: '2025-06-18T17:00:00.000Z'
  };

  public datePickerOptions: IDatePickerOptions = {
    singleDatePicker: false,
    onSelectedDate: this.onSelectedDate.bind(this),
    autoApply: false,
    closeOnApply: true,
  }

  constructor() {
  }

  onSelectedDate(event: {
    startDate: Dayjs;
    endDate: Dayjs;
  }) {
    // console.log('Selected date range:', event.startDate.toDate(), event.endDate.toDate());
  }
}
