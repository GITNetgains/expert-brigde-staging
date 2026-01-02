
import {
  Component,
  OnInit,
  HostListener
} from '@angular/core';import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { ISubject, ITopic, IUser } from 'src/app/interface';
import {
  AppService,
  CalendarService,
  CountryService,
  GradeService,
  STATE,
  SeoService,
  StateService,
  SubjectService,
  TopicService,
  SkillService,
  IndustryService
} from 'src/app/services';
import { TutorService } from 'src/app/services/tutor.service';
const time_format = 'HH:mm:ss';
declare let $: any;
import { AiQueryBarComponent } from '../../page/components/ai-query-bar/ai-query-bar.component';

@Component({
  selector: 'app-tutor-list',
  templateUrl: './tutor-list.component.html',
  styleUrls: ['./tutor-list.component.scss'],
})
export class TutorListComponent implements OnInit {
  public page = 1;
  public pageSize = 12;
  public tutors: IUser[] = [];
  public subjects: ISubject[] = [];
  public skills: any[] = [];
  public industries: any[] = [];
  public total: any = 0;
  public sort: any = '';
  public sortType: any = '';
  public sortValue: string = '';
  public countries: any;
  public showMoreFilter = false;

  public searchFields: any = {
    subjectIds: '',
    grade: '',
    categoryIds: '',
    industryIds: '',
    countryCode: '',
    state: '',
    topicIds: '',
    skillIds: '',
    rating: '',
    yearsExperience: '',
    minConsultationFee: '',
    maxConsultationFee: ''
  };
  public grades: any = [];
  public loading = false;
  public timeout: any;
  public categories: any = [];
  public dateChange: any = {};
  public topics: ITopic[] = [];

  public activeTutor: IUser | null;

  private _schedule$ = new Subject();
  public scheduleByTutor = [];
  public loadingSchedule = false;
  calendar: any = {};

  public valid_time = {
    morning: {
      start: moment('06:00:00', time_format),
      to: moment('12:00:00', time_format)
    },
    afternoon: {
      start: moment('12:00:00', time_format),
      to: moment('18:00:00', time_format)
    },
    evening: {
      start: moment('18:00:00', time_format),
      to: moment('24:00:00', time_format)
    },
    night: {
      start: moment('00:00:00', time_format),
      to: moment('06:00:00', time_format)
    }
  };
  public currentUser: IUser;
  public config: any;

  openFilter = {
  skill: true,
  expertise: false,
  technology: false,
  category: false,
  industry: false,
  fee: true,
  recent: false,
  rating: false,
  location: false,
  experience: false
};

toggleFilter(key: keyof typeof this.openFilter) {
  this.openFilter[key] = !this.openFilter[key];
}


  public isHoverTutor: boolean;
  public states: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
    private tutorService: TutorService,
    private router: Router,
    private gradeService: GradeService,
    private countryService: CountryService,
    private subjectService: SubjectService,
    private topicService: TopicService,
    private skillService: SkillService,
    private industryService: IndustryService,
    private translate: TranslateService,
    private calendarService: CalendarService,
    public stateService: StateService,
    private appService: AppService
  ) {
    this.seoService.setMetaTitle('List Tutor');
    this.seoService.setMetaDescription(
      "If you're looking for someone to help make calculus sound sensical , you've come to the right place.Below you'll find some of our top calculus tutors."
    );
    const data = this.route.snapshot.data['search'];
    if (data) {
      this.tutors = data.items;
      this.total = data.count;
    }
    this.categories = this.route.snapshot.data['categories'];
    this.route.queryParams.subscribe((params: any) => {
      let filter = { ...params };
      if (params.category) {
        const category = this.categories.find(
          (item: any) => item.alias === params.category
        );
        filter = {
          categoryIds: category ? category._id : ''
        };
      }
      this.searchFields = { ...this.searchFields, ...filter };
      if (this.searchFields.categoryIds) this.querySubjects();
      this.page = params.page ? parseInt(params.page, 10) : 1;
      this.query();
    });
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  @HostListener('window:scroll', ['$event']) scrollHandler() {
    if (this.activeTutor && !this.isHoverTutor) {
      this.activeTutor = null;
    }
  }

  onHoverTutor({ top, tutor }: { top: number; tutor: IUser }) {
    this.isHoverTutor = !!tutor;
    if (tutor && (!this.activeTutor || tutor._id !== this.activeTutor?._id)) {
      this.activeTutor = tutor;
      $('.floatind_videobx').css({ top: `${top}px` });
      this.loadingSchedule = true;
      this.calendarService
        .all({
          tutorId: this.activeTutor._id,
          startTime: moment().startOf('week').toDate().toISOString(),
          toTime: moment().endOf('week').toDate().toISOString(),
          take: 10000,
          type: 'subject',
          sort: 'startTime',
          sortType: 'asc'
        })
        .then((resp: any) => {
          if (resp.data && resp.data.items) {
            this.scheduleByTutor = resp.data.items;
            this.mappingDataInTime(resp.data.items);
          }
          this.loadingSchedule = false;
        });
    }
  }

  ngOnInit(): void {
    this.countries = this.countryService.getCountry();
    this.updateStatesFilter();
    this.gradeService
      .search({
        take: 100,
        sort: 'ordering',
        sortType: 'asc'
      })
      .then((resp) => {
        this.grades = resp.data.items;
      });

    this.skillService
      .search({ take: 1000, sort: 'ordering', sortType: 'asc' })
      .then((resp) => {
        this.skills = resp.data.items || [];
      })
      .catch(() => this.appService.toastError());

    this.industryService
      .search({ take: 1000, sort: 'ordering', sortType: 'asc' })
      .then((resp) => {
        this.industries = resp.data.items || [];
      })
      .catch(() => this.appService.toastError());
  }

  showMore() {
    this.showMoreFilter = !this.showMoreFilter;
  }

  query() {
    if (!this.loading) {
      this.loading = true;
      const params: any = {
        page: this.page,
        take: this.pageSize,
        sort: this.sort,
        sortType: this.sortType,
        ...this.searchFields,
        ...this.dateChange
      };
      params.rejected = false;
      params.pendingApprove = false;
      if (!params.minConsultationFee) delete params.minConsultationFee;
      if (!params.maxConsultationFee) delete params.maxConsultationFee;
      this.tutorService
        .search(params)
        .then((resp) => {
          this.total = resp.data.count;
          this.tutors = resp.data.items;
          if (this.tutors.length) {
            this.activeTutor = this.tutors[0];
            this.loadingSchedule = true;
            this.calendarService
              .all({
                tutorId: this.activeTutor._id,
                startTime: moment().startOf('week').toDate().toISOString(),
                toTime: moment().endOf('week').toDate().toISOString(),
                take: 10000,
                type: 'subject',
                sort: 'startTime',
                sortType: 'asc'
              })
              .then((res: any) => {
                if (res.data && res.data.items) {
                  this.scheduleByTutor = res.data.items;
                  this.mappingDataInTime(res.data.items);
                  this.loadingSchedule = false;
                }
              });
          } else {
            this.activeTutor = null as any;
          }
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
          this.appService.toastError(null);
        });
    }
  }

  apply() {
    this.showMore();
    this.query();
  }
  gradeChange() {
    this.page = 1;
    this.router.navigate(['/experts'], {
      queryParams: {
        subjectId: this.searchFields.subjectId,
        grade: this.searchFields.grade,
        countryCode: this.searchFields.countryCode,
        state: this.searchFields.state
      }
    });
    this.query();
  }
  subjectChange() {
    this.page = 1;
    // this.query();
    this.router.navigate(['/experts'], {
      queryParams: {
        subjectId: this.searchFields.subjectId,
        grade: this.searchFields.grade,
        countryCode: this.searchFields.countryCode,
        state: this.searchFields.state
      }
    });
    this.query();
  }

  dateChangeEvent(dateChange: any) {
    if (!dateChange) {
      if (this.dateChange.startTime && this.dateChange.toTime) {
        delete this.dateChange.startTime;
        delete this.dateChange.toTime;
        this.query();
      }
    } else {
      this.dateChange = {
        startTime: dateChange.from,
        toTime: dateChange.to
      };
      this.query();
    }
  }

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.router.navigate([], {
      queryParams: { page: this.page },
      queryParamsHandling: 'merge'
    });
  }

  selectCategory() {
    if (this.searchFields.categoryIds) {
      this.querySubjects();
      this.searchFields.topicIds = [];
    } else {
      this.searchFields.subjectIds = [];
      this.searchFields.topicIds = [];
      this.subjects = [];
      this.topics = [];
    }
    this.query();
  }

  querySubjects() {
    this.subjectService
      .search({
        categoryIds: this.searchFields.categoryIds,
        take: 1000,
        isActive: true
      })
      .then((resp) => {
        if (resp.data && resp.data.items && resp.data.items.length > 0) {
          this.subjects = resp.data.items;
        } else {
          this.subjects = [];
        }
      });
  }

  selectSubject() {
    if (this.searchFields.subjectIds) {
      this.queryTopic();
    } else {
      this.searchFields.topicIds = [];
      this.topics = [];
    }
    this.query();
  }

  selectSkill() {
    this.page = 1;
    this.query();
  }

  selectIndustry() {
    this.page = 1;
    this.query();
  }

  onSortChange(value: string) {
    if (value === 'recent') {
      this.sort = 'createdAt';
      this.sortType = 'desc';
    } else if (value === 'rating') {
      this.sort = 'ratingAvg';
      this.sortType = 'desc';
    } else {
      this.sort = '';
      this.sortType = '';
    }
    this.page = 1;
    this.query();
  }

  onMinRatingChange() {
    this.page = 1;
    this.query();
  }

  onMinYearsChange() {
    this.page = 1;
    this.query();
  }

  onFeeRangeChange() {
    this.page = 1;
    this.query();
  }

  queryTopic() {
    this.topicService
      .search({
        subjectIds: this.searchFields.subjectIds,
        take: 1000,
        isActive: true
      })
      .then((resp) => {
        if (resp.data && resp.data.items && resp.data.items.length > 0) {
          this.topics = resp.data.items;
        } else {
          this.topics = [];
        }
      });
  }

  updateStatesFilter() {
    const code = this.searchFields.countryCode || '';
    this.states = this.countryService.getStates(code);
    if (!this.states.includes(this.searchFields.state)) {
      this.searchFields.state = '';
    }
  }

  onCountryFilterChange(code: string) {
    this.searchFields.countryCode = code || '';
    this.updateStatesFilter();
    this.page = 1;
    this.query();
  }

  mappingDataInTime(items: any) {
    this.calendar = {
      Sunday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Monday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Tuesday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Wednesday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Thursday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Friday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      Saturday: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      }
    };
    if (items.length !== 0) {
      items.map((item: any) => {
        const item_day = moment(item.startTime).format('dddd');
        const item_time = moment(
          moment(item.startTime).format(time_format),
          time_format
        );

        if (
          item_time.isBetween(
            this.valid_time.morning.start,
            this.valid_time.morning.to,
            null,
            '[)'
          )
        ) {
          this.calendar[item_day]['morning'] = true;
        } else if (
          item_time.isBetween(
            this.valid_time.afternoon.start,
            this.valid_time.afternoon.to,
            null,
            '[)'
          )
        ) {
          this.calendar[item_day]['afternoon'] = true;
        } else if (
          item_time.isBetween(
            this.valid_time.evening.start,
            this.valid_time.evening.to,
            null,
            '[)'
          )
        ) {
          this.calendar[item_day]['evening'] = true;
        } else if (
          item_time.isBetween(
            this.valid_time.night.start,
            this.valid_time.night.to,
            null,
            '[)'
          )
        ) {
          this.calendar[item_day]['night'] = true;
        }
      });
    }
  }
}
    
