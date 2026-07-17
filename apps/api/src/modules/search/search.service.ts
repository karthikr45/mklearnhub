import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from '../../prisma/prisma.service'

export interface SearchFilters {
  type?: 'course' | 'article'
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private esEnabled(): boolean {
    return Boolean(this.config.get<string>('ELASTICSEARCH_URL'))
  }

  // The index-mutating methods are no-ops until an Elasticsearch cluster is
  // wired in; search falls back to Prisma `contains` queries in the meantime.

  async indexArticle(article: { id: string }): Promise<void> {
    if (!this.esEnabled()) return
    void article
  }

  async indexCourse(course: { id: string }): Promise<void> {
    if (!this.esEnabled()) return
    void course
  }

  async deleteFromIndex(type: string, id: string): Promise<void> {
    if (!this.esEnabled()) return
    void type
    void id
  }

  async search(orgId: string, query: string, filters?: SearchFilters) {
    const wantCourses = !filters?.type || filters.type === 'course'
    const wantArticles = !filters?.type || filters.type === 'article'

    const courses = wantCourses
      ? await this.prisma.course.findMany({
          where: {
            organizationId: orgId,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: 20,
        })
      : []

    const articles = wantArticles
      ? await this.prisma.article.findMany({
          where: {
            manual: { space: { organizationId: orgId } },
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { excerpt: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: 20,
        })
      : []

    return { query, courses, articles, total: courses.length + articles.length }
  }

  async reindexAll(orgId: string): Promise<{ indexed: number }> {
    // No-op without Elasticsearch; report how many docs would be indexed.
    const [courses, articles] = await this.prisma.$transaction([
      this.prisma.course.count({ where: { organizationId: orgId } }),
      this.prisma.article.count({
        where: { manual: { space: { organizationId: orgId } } },
      }),
    ])
    return { indexed: courses + articles }
  }
}
