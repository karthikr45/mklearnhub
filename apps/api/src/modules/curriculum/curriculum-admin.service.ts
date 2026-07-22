import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

export type NodeType =
  | 'board' | 'year' | 'grade' | 'subject' | 'unit' | 'book'
  | 'chapter' | 'topic' | 'subtopic' | 'objective'

interface NodeCfg {
  model: string
  /** The model's display-text field (differs: name/label/title/statement). */
  titleField: string
  hasCode: boolean
  /** FK column of the parent, or null for a root (board). */
  parent: string | null
}

const NODES: Record<NodeType, NodeCfg> = {
  board: { model: 'curriculumBoard', titleField: 'name', hasCode: true, parent: null },
  year: { model: 'curriculumYear', titleField: 'label', hasCode: false, parent: 'boardId' },
  grade: { model: 'curriculumGrade', titleField: 'name', hasCode: true, parent: 'yearId' },
  subject: { model: 'curriculumSubject', titleField: 'title', hasCode: true, parent: 'gradeId' },
  unit: { model: 'curriculumUnit', titleField: 'title', hasCode: true, parent: 'subjectId' },
  book: { model: 'curriculumBook', titleField: 'title', hasCode: false, parent: 'subjectId' },
  chapter: { model: 'curriculumChapter', titleField: 'title', hasCode: true, parent: 'subjectId' },
  topic: { model: 'curriculumTopic', titleField: 'title', hasCode: true, parent: 'chapterId' },
  subtopic: { model: 'curriculumSubtopic', titleField: 'title', hasCode: true, parent: 'topicId' },
  objective: { model: 'learningObjective', titleField: 'statement', hasCode: false, parent: 'topicId' },
}

function slugCode(s: string, fallback: string): string {
  const c = s
    .toUpperCase()
    .replace(/&/g, 'AND')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
  return c || fallback
}

interface NodeBody {
  parentId?: string
  title?: string
  code?: string
  order?: number
  status?: string
  unitId?: string | null
  bookId?: string | null
}

/**
 * Generic create/update/delete for every curriculum level, so the admin can
 * fully manage the tree from the UI. Field naming differs per model
 * (name/label/title/statement), handled by the NODES config. All mutations are
 * audit-logged. Deletes cascade (Prisma) to children.
 */
@Injectable()
export class CurriculumAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private cfg(type: string): NodeCfg {
    const c = NODES[type as NodeType]
    if (!c) throw new BadRequestException(`Unknown curriculum node type: ${type}`)
    return c
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model(type: string): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any)[this.cfg(type).model]
  }

  async create(userId: string, type: string, body: NodeBody) {
    const cfg = this.cfg(type)
    if (!body.title?.trim()) throw new BadRequestException('title is required')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      [cfg.titleField]: body.title.trim(),
      order: body.order ?? 0,
      status: 'PUBLISHED',
    }
    if (cfg.parent) {
      if (!body.parentId) throw new BadRequestException(`${type} requires a parent`)
      data[cfg.parent] = body.parentId
    }
    if (cfg.hasCode) data.code = body.code?.trim() || slugCode(body.title, type.toUpperCase())
    if (type === 'chapter') {
      if (body.unitId) data.unitId = body.unitId
      if (body.bookId) data.bookId = body.bookId
    }
    const row = await this.model(type).create({ data })
    await this.audit.log({
      userId,
      action: `curriculum.${type}.created`,
      resource: 'Curriculum',
      resourceId: row.id,
      newValues: { title: body.title },
    })
    return row
  }

  async update(userId: string, type: string, id: string, body: NodeBody) {
    const cfg = this.cfg(type)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (body.title !== undefined) data[cfg.titleField] = body.title.trim()
    if (body.order !== undefined) data.order = body.order
    if (body.status !== undefined) data.status = body.status
    if (cfg.hasCode && body.code !== undefined) data.code = body.code.trim()
    if (type === 'chapter') {
      if (body.unitId !== undefined) data.unitId = body.unitId || null
      if (body.bookId !== undefined) data.bookId = body.bookId || null
    }
    const row = await this.model(type)
      .update({ where: { id }, data })
      .catch(() => {
        throw new NotFoundException(`${type} not found`)
      })
    await this.audit.log({
      userId,
      action: `curriculum.${type}.updated`,
      resource: 'Curriculum',
      resourceId: id,
    })
    return row
  }

  async remove(userId: string, type: string, id: string) {
    await this.model(type)
      .delete({ where: { id } })
      .catch(() => {
        throw new NotFoundException(`${type} not found`)
      })
    await this.audit.log({
      userId,
      action: `curriculum.${type}.deleted`,
      resource: 'Curriculum',
      resourceId: id,
    })
    return { deleted: true, type, id }
  }
}
