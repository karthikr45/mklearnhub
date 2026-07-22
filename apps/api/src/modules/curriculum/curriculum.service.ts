import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

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
