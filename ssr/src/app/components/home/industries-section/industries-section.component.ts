import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { register } from 'swiper/element/bundle';
import { StaticPageService } from 'src/app/services';

@Component({
  selector: 'app-industries-section',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, RouterModule],
  templateUrl: './industries-section.component.html',
  styleUrls: ['./industries-section.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class IndustriesCarouselComponent implements OnInit {
  industries: any[] = [];
  isBrowser = false;

  @ViewChild('swiperRef') swiperRef!: ElementRef;

  constructor(
    private pageService: StaticPageService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) register();
  }

  ngOnInit(): void {
    this.pageService
      .search({ type: 'industry', take: 12, sort: 'createdAt', sortType: 'desc' })
      .then((resp) => {
        this.industries = resp?.data?.items || [];
        if (this.isBrowser && this.industries.length) {
          this.cdr.detectChanges();
          setTimeout(() => this.initSwiper(), 0);
        }
      })
      .catch(() => {});
  }

  initSwiper() {
    if (!this.swiperRef?.nativeElement) return;
    const swiperEl = this.swiperRef.nativeElement;

    const swiperParams = {
      slidesPerView: 4,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 4000, disableOnInteraction: false },
      pagination: { clickable: true },
      breakpoints: {
        1200: { slidesPerView: 4, spaceBetween: 24 },
        992:  { slidesPerView: 3, spaceBetween: 20 },
        768:  { slidesPerView: 2, spaceBetween: 18 },
        0:    { slidesPerView: 1.1, spaceBetween: 12 },
      },
    };

    Object.assign(swiperEl, swiperParams);
    swiperEl.initialize();
  }

  // Navigation Logic
  onPrev() {
    const swiperEl = this.swiperRef?.nativeElement as any;
    if (!swiperEl) return;
    if (!swiperEl.swiper) this.initSwiper();
    swiperEl.swiper?.slidePrev();
  }

  onNext() {
    const swiperEl = this.swiperRef?.nativeElement as any;
    if (!swiperEl) return;
    if (!swiperEl.swiper) this.initSwiper();
    swiperEl.swiper?.slideNext();
  }

  getImage(item: any): string {
    return item?.meta?.imageUrl || '';
  }

  getDescription(item: any): string {
    const content = item?.content || '';
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 130 ? text.slice(0, 130) + '…' : text;
  }
}