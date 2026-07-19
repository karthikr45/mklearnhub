import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@learnhub/db'
import { slugify } from '@learnhub/utils'
import { nanoid } from 'nanoid'

import { PrismaService } from '../../prisma/prisma.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { CreateManualDto } from './dto/create-manual.dto'
import { CreateSpaceDto } from './dto/create-space.dto'
import { UpdateArticleDto } from './dto/update-article.dto'

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async createSpace(orgId: string, dto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: {
        name: dto.name,
        slug: `${slugify(dto.name)}-${nanoid(6)}`,
        organizationId: orgId,
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.iconEmoji ? { iconEmoji: dto.iconEmoji } : {}),
      },
    })
  }

  async listSpaces(orgId: string) {
    return this.prisma.space.findMany({
      where: { organizationId: orgId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { manuals: true } } },
    })
  }

  async createManual(spaceId: string, dto: CreateManualDto) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } })
    if (!space) throw new NotFoundException('Space not found')
    return this.prisma.manual.create({
      data: {
        name: dto.name,
        slug: `${slugify(dto.name)}-${nanoid(6)}`,
        spaceId,
        ...(dto.description ? { description: dto.description } : {}),
      },
    })
  }

  async listManuals(spaceId: string) {
    return this.prisma.manual.findMany({
      where: { spaceId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { articles: true } } },
    })
  }

  async createArticle(manualId: string, authorId: string, dto: CreateArticleDto) {
    const manual = await this.prisma.manual.findUnique({ where: { id: manualId } })
    if (!manual) throw new NotFoundException('Manual not found')
    return this.prisma.article.create({
      data: {
        title: dto.title,
        slug: `${slugify(dto.title)}-${nanoid(6)}`,
        content: dto.content,
        manualId,
        authorId,
        status: 'DRAFT',
        ...(dto.excerpt ? { excerpt: dto.excerpt } : {}),
        ...(dto.tags ? { tags: dto.tags } : {}),
      },
    })
  }

  async updateArticle(id: string, dto: UpdateArticleDto, editorId: string) {
    const article = await this.prisma.article.findUnique({ where: { id } })
    if (!article) throw new NotFoundException('Article not found')

    // Snapshot the current content into version history before overwriting.
    await this.prisma.articleVersion.create({
      data: {
        articleId: id,
        content: article.content as Prisma.InputJsonValue,
        version: article.version,
        editedById: editorId,
      },
    })

    return this.prisma.article.update({
      where: { id },
      data: {
        version: article.version + 1,
        ...(dto.title
          ? { title: dto.title, slug: `${slugify(dto.title)}-${nanoid(6)}` }
          : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.excerpt ? { excerpt: dto.excerpt } : {}),
        ...(dto.tags ? { tags: dto.tags } : {}),
      },
    })
  }

  async publishArticle(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } })
    if (!article) throw new NotFoundException('Article not found')
    return this.prisma.article.update({
      where: { id },
      data: { status: 'PUBLISHED', isPublic: true, publishedAt: new Date() },
    })
  }

  async getArticleHistory(id: string) {
    return this.prisma.articleVersion.findMany({
      where: { articleId: id },
      orderBy: { version: 'desc' },
    })
  }

  async getArticleBySlug(
    spaceSlug: string,
    manualSlug: string,
    articleSlug: string,
  ) {
    const article = await this.prisma.article.findFirst({
      where: {
        slug: articleSlug,
        manual: { slug: manualSlug, space: { slug: spaceSlug } },
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        manual: { include: { space: true } },
      },
    })
    if (!article) throw new NotFoundException('Article not found')
    return article
  }

  async getSpace(spaceId: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: { manuals: { orderBy: { order: 'asc' } } },
    })
    if (!space) throw new NotFoundException('Space not found')
    return space
  }

  async getManual(manualId: string) {
    const manual = await this.prisma.manual.findUnique({
      where: { id: manualId },
      include: {
        articles: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            excerpt: true,
            updatedAt: true,
          },
        },
      },
    })
    if (!manual) throw new NotFoundException('Manual not found')
    return manual
  }

  async getArticleById(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } })
    if (!article) throw new NotFoundException('Article not found')
    return this.prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    })
  }

  async searchArticles(orgId: string, query: string) {
    return this.prisma.article.findMany({
      where: {
        manual: { space: { organizationId: orgId } },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    })
  }
}
