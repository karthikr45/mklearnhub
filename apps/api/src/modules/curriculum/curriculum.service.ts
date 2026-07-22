import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class CurriculumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * The curriculum a learner should study, resolved from their saved profile
   * (board + class). Returns the published subjects → chapters → topics tree so
   * a student who set "CBSE, Grade 10" actually sees the CBSE Grade 10 syllabus.
   */
  async getForLearner(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { learnerBoard: true, learnerClass: true, learnerTrack: true },
    })
    if (!user?.learnerBoard) {
      return { available: false as const, reason: 'no-profile' }
    }

    const board = await this.prisma.curriculumBoard.findFirst({
      where: { code: user.learnerBoard as unknown as string, status: 'PUBLISHED' },
    })
    if (!board) {
      return { available: false as const, reason: 'board-not-loaded', board: user.learnerBoard }
    }

    const year =
      (await this.prisma.curriculumYear.findFirst({
        where: { boardId: board.id, isCurrent: true },
      })) ??
      (await this.prisma.curriculumYear.findFirst({
        where: { boardId: board.id },
        orderBy: { order: 'asc' },
      }))
    if (!year) return { available: false as const, reason: 'no-year', board: board.code }

    const level = user.learnerClass ? parseInt(user.learnerClass, 10) : NaN
    const grade =
      (!Number.isNaN(level)
        ? await this.prisma.curriculumGrade.findFirst({
            where: { yearId: year.id, level },
          })
        : null) ??
      (await this.prisma.curriculumGrade.findFirst({ where: { yearId: year.id }, orderBy: { order: 'asc' } }))
    if (!grade) {
      return { available: false as const, reason: 'grade-not-loaded', board: board.code, class: user.learnerClass }
    }

    const subjects = await this.prisma.curriculumSubject.findMany({
      where: { gradeId: grade.id, status: 'PUBLISHED' },
      orderBy: { order: 'asc' },
      include: {
        units: { orderBy: { order: 'asc' } },
        books: { orderBy: { order: 'asc' } },
        chapters: {
          where: { status: 'PUBLISHED' },
          orderBy: { order: 'asc' },
          include: { topics: { where: { status: 'PUBLISHED' }, orderBy: { order: 'asc' } } },
        },
      },
    })
    return {
      available: true as const,
      board: { id: board.id, code: board.code, name: board.name },
      year: { id: year.id, label: year.label },
      grade: { id: grade.id, name: grade.name },
      subjects,
    }
  }

  /**
   * A single PUBLISHED content asset with a ready-to-use delivery URL — for the
   * student content viewer. Never exposes unpublished/licensing-restricted files.
   */
  async getPublishedContent(id: string) {
    const asset = await this.prisma.contentAsset.findUnique({ where: { id } })
    if (!asset || asset.status !== 'PUBLISHED') {
      throw new NotFoundException('Content not found')
    }
    const deliveryUrl = asset.storageKey
      ? await this.storage.deliveryUrl(asset.storageKey, true)
      : asset.sourceUrl ?? null
    return {
      id: asset.id,
      title: asset.title,
      description: asset.description,
      contentType: asset.contentType,
      body: asset.body,
      sourceUrl: asset.sourceUrl,
      attributionRequired: asset.attributionRequired,
      attributionText: asset.attributionText,
      deliveryUrl,
    }
  }

  async getBoards() {
    return this.prisma.curriculumBoard.findMany({
      orderBy: { order: 'asc' },
      include: {
        years: {
          orderBy: { order: 'asc' },
          select: { id: true, label: true, isCurrent: true },
        },
      },
    })
  }

  /**
   * Nested curriculum tree for a board + year (defaults: first board, its
   * current year). Grades → subjects → {units, books, chapters → topics}. Small
   * enough to return whole for a grade; the UI lazy-expands visually.
   */
  async getTree(boardId?: string, yearId?: string) {
    const board = boardId
      ? await this.prisma.curriculumBoard.findUnique({ where: { id: boardId } })
      : await this.prisma.curriculumBoard.findFirst({ orderBy: { order: 'asc' } })
    if (!board) throw new NotFoundException('No board found')

    const year = yearId
      ? await this.prisma.curriculumYear.findUnique({ where: { id: yearId } })
      : (await this.prisma.curriculumYear.findFirst({
          where: { boardId: board.id, isCurrent: true },
        })) ??
        (await this.prisma.curriculumYear.findFirst({
          where: { boardId: board.id },
          orderBy: { order: 'asc' },
        }))
    if (!year) return { board, year: null, grades: [] }

    const grades = await this.prisma.curriculumGrade.findMany({
      where: { yearId: year.id },
      orderBy: { order: 'asc' },
      include: {
        subjects: {
          orderBy: { order: 'asc' },
          include: {
            units: { orderBy: { order: 'asc' } },
            books: { orderBy: { order: 'asc' } },
            chapters: {
              orderBy: { order: 'asc' },
              include: {
                topics: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
      },
    })
    return { board, year, grades }
  }

  async getSubject(id: string) {
    const subject = await this.prisma.curriculumSubject.findUnique({
      where: { id },
      include: {
        units: { orderBy: { order: 'asc' } },
        books: { orderBy: { order: 'asc' } },
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            topics: {
              orderBy: { order: 'asc' },
              include: { objectives: true, subtopics: true },
            },
          },
        },
      },
    })
    if (!subject) throw new NotFoundException('Subject not found')
    return subject
  }

  /** Content mapped to a curriculum node (published only, for students). */
  async getNodeContent(nodeType: string, nodeId: string, includeUnpublished = false) {
    const mappings = await this.prisma.curriculumContentMapping.findMany({
      where: { nodeType: nodeType as never, nodeId },
      orderBy: { order: 'asc' },
      include: { asset: true },
    })
    return mappings
      .filter((m) => includeUnpublished || m.asset.status === 'PUBLISHED')
      .map((m) => ({
        mappingId: m.id,
        section: m.section,
        role: m.role,
        asset: {
          id: m.asset.id,
          title: m.asset.title,
          contentType: m.asset.contentType,
          status: m.asset.status,
        },
      }))
  }
}
