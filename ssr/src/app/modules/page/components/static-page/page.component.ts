import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IStaticPage } from 'src/app/interface';
import { SeoService, StaticPageService } from 'src/app/services';
@Component({
  selector: 'app-static-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class StaticPageComponent implements OnInit {
  public page: IStaticPage;
  private alias: any;
  public submitted: boolean = false;
  public posts: any[] = [];
  public isBlogList: boolean = false;

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
