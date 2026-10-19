import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { PhotoCarousel } from '../photo-carousel/photo-carousel';
import { SiteFooter } from '../../site-footer/site-footer';
import { SiteHeader } from '../../site-header/site-header';
import { projectBySlug, statusLabel } from '../project-data';

@Component({
  selector: 'app-project-page',
  imports: [RouterLink, PhotoCarousel, SiteHeader, SiteFooter],
  templateUrl: './project-page.html',
  styleUrl: './project-page.scss',
})
export class ProjectPage {
  private readonly route = inject(ActivatedRoute);
  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))), {
    initialValue: this.route.snapshot.paramMap.get('slug'),
  });

  protected readonly project = computed(() => projectBySlug(this.slug()));
  protected readonly statusLabel = statusLabel;
}
