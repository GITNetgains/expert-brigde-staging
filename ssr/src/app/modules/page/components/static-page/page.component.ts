import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IStaticPage } from 'src/app/interface';
import { SeoService, StaticPageService } from 'src/app/services';

@Component({
  selector: 'app-static-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class StaticPageComponent implements OnInit, AfterViewInit {

  public page!: IStaticPage;
  private alias: any;
  public posts: any[] = [];
  public isBlogList = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pageService: StaticPageService,
    private seoService: SeoService
  ) {
    this.route.params.subscribe((params) => {
      this.alias = params.alias;

      if (!this.alias && this.router.url.startsWith('/blogs')) {
        this.isBlogList = true;
        this.pageService
          .search({ type: 'blog', take: 100, sort: 'createdAt', sortType: 'desc' })
          .then((resp) => {
            this.posts = resp?.data?.items || [];
            this.seoService.setMetaTitle('Blogs');
          });
        return;
      }

      if (this.alias) {
        this.pageService.findOne(this.alias).then((resp) => {
          this.page = resp.data;
          this.seoService.setMetaTitle(this.page.title);
        });
      }
    });
  }

  ngOnInit() {}

  // ✅ SINGLE ngAfterViewInit
ngAfterViewInit() {
  document.addEventListener('click', (event: any) => {
    const question = event.target.closest('.faq-question');
    if (!question) return;

    const item = question.closest('.faq-item') as HTMLElement;
    const answer = item.querySelector('.faq-answer') as HTMLElement;
    if (!answer) return;

    const isOpen = item.classList.contains('open');

    // Close other open items smoothly
    document.querySelectorAll('.faq-item.open').forEach((openItem: any) => {
      if (openItem !== item) {
        const openAnswer = openItem.querySelector('.faq-answer') as HTMLElement;
        openAnswer.style.height = openAnswer.scrollHeight + 'px';
        requestAnimationFrame(() => {
          openAnswer.style.height = '0px';
        });
        openItem.classList.remove('open');
      }
    });

    // Toggle current item
    if (!isOpen) {
      item.classList.add('open');
      answer.style.height = answer.scrollHeight + 'px';
    } else {
      answer.style.height = answer.scrollHeight + 'px';
      requestAnimationFrame(() => {
        answer.style.height = '0px';
      });
      item.classList.remove('open');
    }
  });
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

  decodeHtml(html?: string): string {
    if (!html) return '';
    return html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }
}
