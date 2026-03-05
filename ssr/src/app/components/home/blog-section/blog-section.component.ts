import { AfterViewInit, Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { StaticPageService } from 'src/app/services';
import { isPlatformBrowser } from '@angular/common';
import { register } from 'swiper/element/bundle';

@Component({
  selector: 'app-blog-section',
  templateUrl: './blog-section.component.html',
  styleUrls: ['./blog-section.component.scss']
})
export class BlogSectionComponent implements OnInit {
  posts: any[] = [];
  isBrowser = false;

  @ViewChild('blogSwiper', { static: false }) blogSwiper!: ElementRef;

  constructor(
    private pageService: StaticPageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) register();
  }

  ngOnInit(): void {
    this.pageService
      .search({ type: 'blog', take: 12, sort: 'createdAt', sortType: 'desc' })
      .then((resp) => {
        this.posts = resp?.data?.items || [];
        if (this.isBrowser && this.posts.length) {
          setTimeout(() => this.initSwiper(), 100);
        }
      });
  }

  initSwiper() {
    if (!this.blogSwiper?.nativeElement) return;
    const swiperEl = this.blogSwiper.nativeElement;

    const swiperParams = {
      slidesPerView: 3,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 4000, disableOnInteraction: false },
      pagination: { clickable: true },
      breakpoints: {
        1200: { slidesPerView: 3, spaceBetween: 24 },
        992:  { slidesPerView: 2, spaceBetween: 20 },
        0:    { slidesPerView: 1.1, spaceBetween: 12 }
      },
    };

    Object.assign(swiperEl, swiperParams);
    swiperEl.initialize();
  }

  // Navigation Logic
  onPrev() {
    const swiperEl = this.blogSwiper?.nativeElement as any;
    if (swiperEl?.swiper) swiperEl.swiper.slidePrev();
  }

  onNext() {
    const swiperEl = this.blogSwiper?.nativeElement as any;
    if (swiperEl?.swiper) swiperEl.swiper.slideNext();
  }

  getImage(item: any): string {
    return item?.meta?.imageUrl || '';
  }
  getTagline(item: any): string {
    return item?.meta?.tagline || '';
  }
  getAuthor(item: any): string {
    return item?.meta?.author || item?.createdBy?.name || 'Admin';
  }
}