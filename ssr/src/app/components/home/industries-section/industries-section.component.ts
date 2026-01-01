import {
  Component,
  OnInit,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { register } from 'swiper/element/bundle';
import { StaticPageService } from 'src/app/services';
import { isPlatformBrowser } from '@angular/common';

const SWIPER_REGISTER_FLAG = '__expert_bridge_swiper_registered__';

function ensureSwiperRegistered() {
  const g = globalThis as any;
  if (g?.[SWIPER_REGISTER_FLAG]) return;
  register();
  if (g) g[SWIPER_REGISTER_FLAG] = true;
}

interface IndustryItem {
  title: string;
  alias?: string;
  _id?: string;
  content?: string;
  meta?: { imageUrl?: string; tagline?: string };
}

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
  industries: IndustryItem[] = [];
  isBrowser = false;

  @ViewChild('swiperRef') swiperRef!: ElementRef;

  constructor(
    private pageService: StaticPageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) ensureSwiperRegistered();
  }

  ngOnInit(): void {
    this.pageService
      .search({ type: 'industry', take: 12, sort: 'createdAt', sortType: 'desc' })
      .then((resp) => {
        this.industries = resp?.data?.items || [];
        if (this.isBrowser && this.industries.length) {
          setTimeout(() => this.initSwiper(), 50);
        }
      })
      .catch(() => {});
  }

  initSwiper() {
    if (!this.isBrowser) return;
    if (!this.swiperRef?.nativeElement) return;

    const swiperEl: any = this.swiperRef.nativeElement;

    swiperEl.breakpoints = {
      1400: { slidesPerView: 4, spaceBetween: 28 },
      1200: { slidesPerView: 4, spaceBetween: 24 },
      992:  { slidesPerView: 3, spaceBetween: 20 },
      768:  { slidesPerView: 2, spaceBetween: 18 },
      576:  { slidesPerView: 1.2, spaceBetween: 14 },
      0:    { slidesPerView: 1, spaceBetween: 12 },
    };

    swiperEl.initialize();

    setTimeout(() => {
      if (swiperEl.swiper) swiperEl.swiper.update();
    }, 150);
  }

  getImage(item: any): string {
    const url = item?.meta?.imageUrl;
    if (url) return url;
    const content = item?.content || '';
    const match = content.match(/<img[^>]*src=["']([^"']+)["']/i);
    return match ? match[1] : '';
  }

  getDescription(item: any): string {
    const content = item?.content || '';
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 140 ? text.slice(0, 140) + '…' : text;
  }
}
