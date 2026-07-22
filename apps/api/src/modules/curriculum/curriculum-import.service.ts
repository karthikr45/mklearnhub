import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

const PUB = 'PUBLISHED' as const

/** RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, and commas/
 *  newlines inside quotes (needed for titles like "Gender, Religion and Caste"). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') field += c
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

function code(s: string, fallback: string): string {
  const c = s
    .toUpperCase()
    .replace(/&/g, 'AND')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
  return c || fallback
}

export interface ImportResult {
  rows: number
  boards: number
  subjects: number
  chapters: number
  topics: number
  errors: { line: number; message: string }[]
}

/**
 * Idempotent CSV curriculum import — the authoritative way to load a VERIFIED
 * syllabus (rather than trusting generated data). Columns (header row required,
 * case-insensitive): board, board_name, year, grade, grade_name, subject,
 * subject_title, unit, book, chapter, topic. Required per row: board, year,
 * grade, subject, chapter. Everything upserts by natural key, so re-importing
 * the same file is a no-op.
 */
@Injectable()
export class CurriculumImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importCsv(text: string): Promise<ImportResult> {
    const grid = parseCsv(text)
    const result: ImportResult = {
      rows: 0,
      boards: 0,
      subjects: 0,
      chapters: 0,
      topics: 0,
      errors: [],
    }
    if (grid.length < 2) {
      result.errors.push({ line: 0, message: 'CSV has no data rows.' })
      return result
    }
    const header = grid[0]!.map((h) => h.trim().toLowerCase())
    const idx = (name: string) => header.indexOf(name)
    const col = {
      board: idx('board'),
      boardName: idx('board_name'),
      year: idx('year'),
      grade: idx('grade'),
      gradeName: idx('grade_name'),
      subject: idx('subject'),
      subjectTitle: idx('subject_title'),
      unit: idx('unit'),
      book: idx('book'),
      chapter: idx('chapter'),
      topic: idx('topic'),
    }
    for (const req of ['board', 'year', 'grade', 'subject', 'chapter'] as const) {
      if (col[req] < 0) {
        result.errors.push({ line: 1, message: `Missing required column: ${req}` })
        return result
      }
    }

    // caches so we don't re-query the same nodes each row
    const boardIds = new Map<string, string>()
    const yearIds = new Map<string, string>()
    const gradeIds = new Map<string, string>()
    const subjectIds = new Map<string, string>()
    const unitIds = new Map<string, string>()
    const bookIds = new Map<string, string>()
    const chapterIds = new Map<string, string>()
    const boardCodes = new Set<string>()
    const subjectKeys = new Set<string>()

    for (let r = 1; r < grid.length; r++) {
      const cells = grid[r]!
      const get = (i: number) => (i >= 0 ? (cells[i] ?? '').trim() : '')
      const boardCode = get(col.board)
      const yearLabel = get(col.year)
      const gradeName = get(col.grade)
      const subjectName = get(col.subject)
      const chapterTitle = get(col.chapter)
      if (!boardCode || !yearLabel || !gradeName || !subjectName || !chapterTitle) {
        result.errors.push({ line: r + 1, message: 'Missing a required value.' })
        continue
      }
      try {
        // Board
        let boardId = boardIds.get(boardCode)
        if (!boardId) {
          const b = await this.prisma.curriculumBoard.upsert({
            where: { code: boardCode },
            update: {},
            create: { code: boardCode, name: get(col.boardName) || boardCode, status: PUB },
          })
          boardId = b.id
          boardIds.set(boardCode, boardId)
          boardCodes.add(boardCode)
        }
        // Year
        const yKey = `${boardId}:${yearLabel}`
        let yearId = yearIds.get(yKey)
        if (!yearId) {
          const y = await this.prisma.curriculumYear.upsert({
            where: { boardId_label: { boardId, label: yearLabel } },
            update: {},
            create: { boardId, label: yearLabel, status: PUB },
          })
          yearId = y.id
          yearIds.set(yKey, yearId)
        }
        // Grade
        const gCode = code(gradeName, 'GRADE')
        const gKey = `${yearId}:${gCode}`
        let gradeId = gradeIds.get(gKey)
        if (!gradeId) {
          const g = await this.prisma.curriculumGrade.upsert({
            where: { yearId_code: { yearId, code: gCode } },
            update: { name: get(col.gradeName) || gradeName },
            create: { yearId, code: gCode, name: get(col.gradeName) || gradeName, status: PUB },
          })
          gradeId = g.id
          gradeIds.set(gKey, gradeId)
        }
        // Subject
        const sCode = code(subjectName, 'SUBJECT')
        const sKey = `${gradeId}:${sCode}`
        let subjectId = subjectIds.get(sKey)
        if (!subjectId) {
          const s = await this.prisma.curriculumSubject.upsert({
            where: { gradeId_code: { gradeId, code: sCode } },
            update: { title: get(col.subjectTitle) || subjectName },
            create: { gradeId, code: sCode, title: get(col.subjectTitle) || subjectName, status: PUB },
          })
          subjectId = s.id
          subjectIds.set(sKey, subjectId)
          subjectKeys.add(sKey)
        }
        // optional Unit / Book
        let unitId: string | undefined
        const unitTitle = get(col.unit)
        if (unitTitle) {
          const uKey = `${subjectId}:${code(unitTitle, 'U')}`
          unitId = unitIds.get(uKey)
          if (!unitId) {
            const existing = await this.prisma.curriculumUnit.findFirst({
              where: { subjectId, code: code(unitTitle, 'U') },
            })
            const u = existing ?? (await this.prisma.curriculumUnit.create({
              data: { subjectId, code: code(unitTitle, 'U'), title: unitTitle, status: PUB },
            }))
            unitId = u.id
            unitIds.set(uKey, unitId)
          }
        }
        let bookId: string | undefined
        const bookTitle = get(col.book)
        if (bookTitle) {
          const bKey = `${subjectId}:${bookTitle}`
          bookId = bookIds.get(bKey)
          if (!bookId) {
            const existing = await this.prisma.curriculumBook.findFirst({
              where: { subjectId, title: bookTitle },
            })
            const bk = existing ?? (await this.prisma.curriculumBook.create({
              data: { subjectId, title: bookTitle, status: PUB },
            }))
            bookId = bk.id
            bookIds.set(bKey, bookId)
          }
        }
        // Chapter
        const chCode = code(chapterTitle, `CH_${r}`)
        const chKey = `${subjectId}:${chCode}`
        let chapterId = chapterIds.get(chKey)
        if (!chapterId) {
          const ch = await this.prisma.curriculumChapter.upsert({
            where: { subjectId_code: { subjectId, code: chCode } },
            update: {
              title: chapterTitle,
              ...(unitId ? { unitId } : {}),
              ...(bookId ? { bookId } : {}),
            },
            create: {
              subjectId,
              code: chCode,
              title: chapterTitle,
              status: PUB,
              ...(unitId ? { unitId } : {}),
              ...(bookId ? { bookId } : {}),
            },
          })
          chapterId = ch.id
          chapterIds.set(chKey, chapterId)
          result.chapters++
        }
        // optional Topic
        const topicTitle = get(col.topic)
        if (topicTitle) {
          const tCode = code(topicTitle, `T_${r}`)
          await this.prisma.curriculumTopic.upsert({
            where: { chapterId_code: { chapterId, code: tCode } },
            update: { title: topicTitle },
            create: { chapterId, code: tCode, title: topicTitle, status: PUB },
          })
          result.topics++
        }
        result.rows++
      } catch (err) {
        result.errors.push({
          line: r + 1,
          message: err instanceof Error ? err.message : 'Row failed',
        })
      }
    }
    result.boards = boardCodes.size
    result.subjects = subjectKeys.size
    return result
  }
}
