import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { StaticPageService } from 'src/app/services';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { register } from 'swiper/element/bundle';

const SWIPER_REGISTER_FLAG = '__expert_bridge_swiper_registered__';

function ensureSwiperRegistered() {
  const g = globalThis as any;
  if (g?.[SWIPER_REGISTER_FLAG]) return;
  register();
  if (g) g[SWIPER_REGISTER_FLAG] = true;
}

@Component({
  selector: 'app-blog-section',
  templateUrl: './blog-section.component.html',
  styleUrls: ['./blog-section.component.scss']
})
export class BlogSectionComponent implements OnInit, AfterViewInit {
  posts: any[] = [];
  isBrowser = false;

  @ViewChild('blogSwiper', { static: false }) blogSwiper!: ElementRef;

  constructor(
    private pageService: StaticPageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) ensureSwiperRegistered();
  }

  ngOnInit(): void {
    this.pageService
      .search({ type: 'blog', take: 12, sort: 'createdAt', sortType: 'desc' })
      .then((resp) => {
        this.posts = resp?.data?.items || [];

        if (this.isBrowser && this.posts.length) {
          setTimeout(() => this.initSwiper(), 50);
        }
      })
      .catch(() => {});
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && this.posts.length) {
      this.initSwiper();
    }
  }

  initSwiper() {
    if (!this.blogSwiper?.nativeElement) return;

    const swiperEl = this.blogSwiper.nativeElement;

    swiperEl.breakpoints = {
      1200: { slidesPerView: 3, spaceBetween: 24 },
      992:  { slidesPerView: 2, spaceBetween: 20 },
      0:    { slidesPerView: 1, spaceBetween: 12 }
    };

    swiperEl.initialize();
  }

  getImage(item: any): string {
    const url = item?.meta?.imageUrl;
    if (url) return url;
    const content = item?.content || '';
    const match = content.match(/<img[^>]*src=["']([^"']+)["']/i);
    return match ? match[1] : '';
  }

  getTagline(item: any): string {
    return item?.meta?.tagline || '';
  }

  getAuthor(item: any): string {
    return item?.meta?.author || item?.createdBy?.name || 'Admin';
  }
}
