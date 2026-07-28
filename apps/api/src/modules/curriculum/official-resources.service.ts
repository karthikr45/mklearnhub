import { BadRequestException, Injectable, Logger } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { parseCsv } from './curriculum-import.service'

const PUB = 'PUBLISHED' as const
const DRAFT = 'DRAFT' as const

/** One official external resource to attach to a curriculum node. */
export interface OfficialEntry {
  /** Curriculum board code, e.g. "CBSE". */
  boardCode: string
  /** Match a subject by code OR title (case-insensitive). Empty → grade-level. */
  subject?: string
  /** Match a chapter by title within the subject (optional). */
  chapter?: string
  title: string
  url: string
  /** ContentType enum value — PDF for files, HTML for portal pages. */
  contentType?: string
  /** Provider name, e.g. "NCERT", "CBSE", "ePathshala". */
  sourceName?: string
  copyrightOwner?: string
  /** Skip the network check and publish immediately (stable govt portals). */
  trusted?: boolean
}

export interface IngestOptions {
  /** HEAD/GET-check each non-trusted URL; only 2xx/3xx get PUBLISHED. */
  verify?: boolean
}

export interface IngestSummary {
  created: number
  published: number
  drafts: number
  skipped: { title: string; reason: string }[]
  /** Per-book resolved-chapter tally (NCERT chapter ingest only). */
  coverage?: { book: string; published: number }[]
}

/**
 * NCERT Class 10 books and their textbook-PDF codes. Chapter PDFs follow
 * `https://ncert.nic.in/textbook/pdf/<code><NN>.pdf` (NN = 2-digit chapter).
 * We over-probe up to `maxChapters` and the verifier keeps only URLs that
 * actually resolve — so an unknown chapter count or a wrong code never yields a
 * broken link (those stay DRAFT and show up as 0 coverage for that book).
 */
const NCERT_CLASS10_BOOKS: {
  subject: string
  code: string
  book: string
  maxChapters: number
}[] = [
  { subject: 'Mathematics', code: 'jemh1', book: 'Mathematics', maxChapters: 16 },
  { subject: 'Science', code: 'jesc1', book: 'Science', maxChapters: 16 },
  { subject: 'Social Science', code: 'jess3', book: 'History — India and the Contemporary World II', maxChapters: 8 },
  { subject: 'Social Science', code: 'jess4', book: 'Geography — Contemporary India II', maxChapters: 10 },
  { subject: 'Social Science', code: 'jess2', book: 'Political Science — Democratic Politics II', maxChapters: 10 },
  { subject: 'Social Science', code: 'jess1', book: 'Economics — Understanding Economic Development', maxChapters: 8 },
  { subject: 'English', code: 'jeff1', book: 'First Flight', maxChapters: 14 },
  { subject: 'English', code: 'jefp1', book: 'Footprints Without Feet', maxChapters: 12 },
  { subject: 'Hindi', code: 'jhks1', book: 'Kshitij (क्षितिज)', maxChapters: 20 },
  { subject: 'Hindi', code: 'jhkr1', book: 'Kritika (कृतिका)', maxChapters: 8 },
  { subject: 'Hindi', code: 'jhsp1', book: 'Sparsh (स्पर्श)', maxChapters: 20 },
  { subject: 'Hindi', code: 'jhsn1', book: 'Sanchayan (संचयन)', maxChapters: 8 },
]

const pad2 = (n: number) => String(n).padStart(2, '0')

interface ResolvedNode {
  nodeType: 'SUBJECT' | 'GRADE' | 'CHAPTER'
  nodeId: string
}

/**
 * Automates attaching OFFICIAL, copyright-safe external resources (NCERT/CBSE/
 * ePathshala/DIKSHA) to the curriculum. These are LINKED, never self-hosted:
 * every asset is OFFICIAL_EXTERNAL / EXTERNAL_ONLY with selfHostingAllowed=false,
 * so we redistribute nothing — students click through to the official source.
 *
 * URLs can be verified over the network (in the deployment env, where the govt
 * sites are reachable): reachable links are PUBLISHED, unreachable ones stay
 * DRAFT so a broken link never reaches a student. This makes the NCERT
 * candidate-URL flow self-correcting.
 */
@Injectable()
export class OfficialResourcesService {
  private readonly logger = new Logger(OfficialResourcesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── URL verification ────────────────────────────────────
  /** True if the URL is reachable (2xx/3xx). Never throws; false on error. */
  private async verifyUrl(url: string): Promise<boolean> {
    const check = async (method: 'HEAD' | 'GET') => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      try {
        const res = await fetch(url, {
          method,
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (LearnHub content bot)' },
        })
        return res.status < 400
      } catch {
        return false
      } finally {
        clearTimeout(timer)
      }
    }
    // Some servers reject HEAD — fall back to a GET.
    return (await check('HEAD')) || (await check('GET'))
  }

  // ── Node resolution (read-only; never creates curriculum nodes) ──
  private async resolveNode(entry: OfficialEntry): Promise<ResolvedNode | null> {
    const board = await this.prisma.curriculumBoard.findUnique({
      where: { code: entry.boardCode },
    })
    if (!board) return null
    // Newest year for the board → its grades → subjects.
    const year = await this.prisma.curriculumYear.findFirst({
      where: { boardId: board.id },
      orderBy: { label: 'desc' },
    })
    if (!year) return null
    const grade = await this.prisma.curriculumGrade.findFirst({
      where: { yearId: year.id },
      orderBy: { createdAt: 'asc' },
    })
    if (!grade) return null

    if (!entry.subject) return { nodeType: 'GRADE', nodeId: grade.id }

    const needle = entry.subject.trim().toLowerCase()
    const subjects = await this.prisma.curriculumSubject.findMany({
      where: { gradeId: grade.id },
    })
    const subject = subjects.find(
      (s) => s.code.toLowerCase() === needle || s.title.toLowerCase() === needle,
    )
    if (!subject) return null
    if (!entry.chapter) return { nodeType: 'SUBJECT', nodeId: subject.id }

    const chNeedle = entry.chapter.trim().toLowerCase()
    const chapters = await this.prisma.curriculumChapter.findMany({
      where: { subjectId: subject.id },
    })
    const chapter =
      chapters.find((c) => c.title.toLowerCase() === chNeedle) ??
      chapters.find((c) => c.title.toLowerCase().includes(chNeedle))
    if (!chapter) return null
    return { nodeType: 'CHAPTER', nodeId: chapter.id }
  }

  // ── Ingest ──────────────────────────────────────────────
  async ingest(
    userId: string,
    entries: OfficialEntry[],
    opts: IngestOptions = {},
  ): Promise<IngestSummary> {
    const summary: IngestSummary = { created: 0, published: 0, drafts: 0, skipped: [] }
    const sourceCache = new Map<string, string>()

    // Pre-verify every distinct non-trusted URL in parallel (bounded pool) so a
    // catalog with 100+ chapter PDFs still resolves in seconds, not minutes.
    const verdict = new Map<string, boolean>()
    if (opts.verify) {
      const urls = [
        ...new Set(entries.filter((e) => !e.trusted && e.url?.trim()).map((e) => e.url)),
      ]
      const CONCURRENCY = 12
      for (let i = 0; i < urls.length; i += CONCURRENCY) {
        const batch = urls.slice(i, i + CONCURRENCY)
        const oks = await Promise.all(batch.map((u) => this.verifyUrl(u)))
        batch.forEach((u, j) => verdict.set(u, oks[j]!))
      }
    }

    for (const entry of entries) {
      if (!entry.url?.trim() || !entry.title?.trim()) {
        summary.skipped.push({ title: entry.title || entry.url, reason: 'missing title/url' })
        continue
      }
      const node = await this.resolveNode(entry)
      if (!node) {
        summary.skipped.push({
          title: entry.title,
          reason: `curriculum node not found (${entry.boardCode}/${entry.subject ?? 'grade'}${entry.chapter ? '/' + entry.chapter : ''})`,
        })
        continue
      }

      // Publish trusted portals as-is; use the precomputed verdict otherwise.
      const publish = entry.trusted || !opts.verify ? true : (verdict.get(entry.url) ?? false)
      const status = publish ? PUB : DRAFT

      // find-or-create the ContentSource for this provider
      const sourceName = entry.sourceName ?? 'Official source'
      let sourceId = sourceCache.get(sourceName)
      if (!sourceId) {
        const existing = await this.prisma.contentSource.findFirst({
          where: { name: sourceName, sourceType: 'OFFICIAL_EXTERNAL' },
        })
        const src =
          existing ??
          (await this.prisma.contentSource.create({
            data: {
              name: sourceName,
              sourceType: 'OFFICIAL_EXTERNAL',
              licenseType: 'EXTERNAL_ONLY',
              notes: 'Official external resource — linked, never self-hosted.',
            },
          }))
        sourceId = src.id
        sourceCache.set(sourceName, sourceId)
      }

      // dedupe asset by (sourceUrl, node) so re-runs don't pile up
      let asset = await this.prisma.contentAsset.findFirst({
        where: { sourceUrl: entry.url, sourceType: 'OFFICIAL_EXTERNAL' },
      })
      if (!asset) {
        asset = await this.prisma.contentAsset.create({
          data: {
            title: entry.title.trim(),
            contentType: (entry.contentType ?? 'PDF') as never,
            sourceType: 'OFFICIAL_EXTERNAL',
            licenseType: 'EXTERNAL_ONLY',
            copyrightOwner: entry.copyrightOwner ?? sourceName,
            sourceId,
            sourceName,
            sourceUrl: entry.url.trim(),
            commercialUseAllowed: false,
            redistributionAllowed: false,
            selfHostingAllowed: false,
            modificationAllowed: false,
            attributionRequired: true,
            attributionText: `${entry.copyrightOwner ?? sourceName} — official source`,
            generationType: 'HUMAN',
            status,
          },
        })
        summary.created++
      } else if (asset.status !== PUB && status === PUB) {
        // a previously-unverified link now resolves → publish it
        asset = await this.prisma.contentAsset.update({
          where: { id: asset.id },
          data: { status: PUB },
        })
      }
      if (asset.status === PUB) summary.published++
      else summary.drafts++

      // map to the resolved node under the OFFICIAL section (idempotent)
      const role =
        (entry.contentType ?? 'PDF') === 'PDF' ? 'OFFICIAL_TEXTBOOK' : 'OFFICIAL_LINK'
      await this.prisma.curriculumContentMapping.upsert({
        where: {
          assetId_nodeType_nodeId_section_role: {
            assetId: asset.id,
            nodeType: node.nodeType as never,
            nodeId: node.nodeId,
            section: 'OFFICIAL',
            role,
          },
        },
        update: {},
        create: {
          assetId: asset.id,
          nodeType: node.nodeType as never,
          nodeId: node.nodeId,
          section: 'OFFICIAL',
          role,
        },
      })
    }

    await this.audit.log({
      userId,
      action: 'curriculum.official.ingested',
      resource: 'Curriculum',
      newValues: {
        created: summary.created,
        published: summary.published,
        drafts: summary.drafts,
      },
    })
    return summary
  }

  // ── CSV bulk import ─────────────────────────────────────
  /**
   * Columns (header row, case-insensitive): board, subject, chapter, title,
   * url, type, source. Required: title, url. Missing board defaults to CBSE.
   * This is the authoritative way to load exact per-chapter official PDFs.
   */
  async importCsv(userId: string, csv: string, opts: IngestOptions = {}) {
    const grid = parseCsv(csv)
    if (grid.length < 2) throw new BadRequestException('CSV has no data rows.')
    const header = grid[0]!.map((h) => h.trim().toLowerCase())
    const idx = (n: string) => header.indexOf(n)
    const col = {
      board: idx('board'),
      subject: idx('subject'),
      chapter: idx('chapter'),
      title: idx('title'),
      url: idx('url'),
      type: idx('type'),
      source: idx('source'),
    }
    if (col.title < 0 || col.url < 0) {
      throw new BadRequestException('CSV must have at least: title, url')
    }
    const entries: OfficialEntry[] = []
    for (let r = 1; r < grid.length; r++) {
      const cells = grid[r]!
      const get = (i: number) => (i >= 0 ? (cells[i] ?? '').trim() : '')
      const url = get(col.url)
      const title = get(col.title)
      if (!url || !title) continue
      entries.push({
        boardCode: get(col.board) || 'CBSE',
        ...(get(col.subject) ? { subject: get(col.subject) } : {}),
        ...(get(col.chapter) ? { chapter: get(col.chapter) } : {}),
        title,
        url,
        contentType: (get(col.type) || 'PDF').toUpperCase(),
        sourceName: get(col.source) || 'NCERT',
      })
    }
    return this.ingest(userId, entries, opts)
  }

  // ── Single admin add ────────────────────────────────────
  async addOne(
    userId: string,
    nodeType: string,
    nodeId: string,
    body: { title: string; url: string; contentType?: string; sourceName?: string },
  ) {
    if (!body.url?.trim() || !body.title?.trim()) {
      throw new BadRequestException('title and url are required')
    }
    const sourceName = body.sourceName ?? 'Official source'
    const source = await this.prisma.contentSource.findFirst({
      where: { name: sourceName, sourceType: 'OFFICIAL_EXTERNAL' },
    })
    const sourceId =
      source?.id ??
      (
        await this.prisma.contentSource.create({
          data: {
            name: sourceName,
            sourceType: 'OFFICIAL_EXTERNAL',
            licenseType: 'EXTERNAL_ONLY',
          },
        })
      ).id
    const asset = await this.prisma.contentAsset.create({
      data: {
        title: body.title.trim(),
        contentType: (body.contentType ?? 'HTML') as never,
        sourceType: 'OFFICIAL_EXTERNAL',
        licenseType: 'EXTERNAL_ONLY',
        copyrightOwner: sourceName,
        sourceId,
        sourceName,
        sourceUrl: body.url.trim(),
        attributionRequired: true,
        attributionText: `${sourceName} — official source`,
        generationType: 'HUMAN',
        status: PUB,
      },
    })
    await this.prisma.curriculumContentMapping.create({
      data: {
        assetId: asset.id,
        nodeType: nodeType as never,
        nodeId,
        section: 'OFFICIAL',
        role: (body.contentType ?? 'HTML') === 'PDF' ? 'OFFICIAL_TEXTBOOK' : 'OFFICIAL_LINK',
      },
    })
    await this.audit.log({
      userId,
      action: 'curriculum.official.added',
      resource: 'ContentAsset',
      resourceId: asset.id,
    })
    return asset
  }

  // ── CBSE Grade 10 official catalog (subject-level; always correct) ──
  /**
   * Stable, official, top-level portals — no per-chapter URL guessing. Each is
   * mapped at the SUBJECT or GRADE level so students get one-click access to the
   * authoritative source. These `trusted` links publish without a network check.
   * Exact per-chapter PDFs are loaded separately via importCsv (authoritative).
   */
  private cbseGrade10Catalog(): OfficialEntry[] {
    const subjects = ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi']
    // These portals are ONE shared URL for every subject, so titles are generic
    // (the same asset is deduped and mapped under each subject).
    const perSubject: OfficialEntry[] = subjects.flatMap((subject) => [
      {
        boardCode: 'CBSE',
        subject,
        title: 'NCERT Textbooks (official) — Class 10, pick your subject',
        url: 'https://ncert.nic.in/textbook.php',
        contentType: 'HTML',
        sourceName: 'NCERT',
        copyrightOwner: 'NCERT',
        trusted: true,
      },
      {
        boardCode: 'CBSE',
        subject,
        title: 'ePathshala (official NCERT) — Class 10 e-books & audio',
        url: 'https://epathshala.nic.in/',
        contentType: 'HTML',
        sourceName: 'ePathshala',
        copyrightOwner: 'NCERT',
        trusted: true,
      },
    ])

    const gradeLevel: OfficialEntry[] = [
      {
        boardCode: 'CBSE',
        title: 'CBSE Academic — Class 10 curriculum & syllabus (official)',
        url: 'https://cbseacademic.nic.in/curriculum_2026.html',
        contentType: 'HTML',
        sourceName: 'CBSE',
        copyrightOwner: 'CBSE',
        trusted: true,
      },
      {
        boardCode: 'CBSE',
        title: 'CBSE Academic — Class 10 Sample Question Papers (official)',
        url: 'https://cbseacademic.nic.in/SQP_CLASSX_2025-26.html',
        contentType: 'HTML',
        sourceName: 'CBSE',
        copyrightOwner: 'CBSE',
        // not trusted-blind: SQP page name changes yearly → verify before publish
      },
      {
        boardCode: 'CBSE',
        title: 'CBSE — Previous Years Question Papers (official portal)',
        url: 'https://www.cbse.gov.in/cbsenew/question-paper.html',
        contentType: 'HTML',
        sourceName: 'CBSE',
        copyrightOwner: 'CBSE',
        trusted: true,
      },
      {
        boardCode: 'CBSE',
        title: 'DIKSHA (Govt. of India) — Class 10 energised textbooks & lessons',
        url: 'https://diksha.gov.in/',
        contentType: 'HTML',
        sourceName: 'DIKSHA',
        copyrightOwner: 'Ministry of Education, Govt. of India',
        trusted: true,
      },
    ]
    return [...perSubject, ...gradeLevel]
  }

  /**
   * Every NCERT Class 10 chapter PDF, generated from the official book-code
   * pattern and mapped at the SUBJECT level (generic "Chapter N" titles — no
   * claim about which seeded chapter it is, so there's zero mis-association).
   * The verifier keeps only URLs that resolve.
   */
  private ncertChapterCatalog(): OfficialEntry[] {
    const entries: OfficialEntry[] = []
    for (const b of NCERT_CLASS10_BOOKS) {
      for (let n = 1; n <= b.maxChapters; n++) {
        entries.push({
          boardCode: 'CBSE',
          subject: b.subject,
          title: `NCERT ${b.book} — Chapter ${n} (official PDF)`,
          url: `https://ncert.nic.in/textbook/pdf/${b.code}${pad2(n)}.pdf`,
          contentType: 'PDF',
          sourceName: 'NCERT',
          copyrightOwner: 'NCERT',
          // never trusted-blind — each is verified so non-existent chapters and
          // wrong codes stay DRAFT instead of 404ing for students.
        })
      }
    }
    return entries
  }

  /** Published NCERT chapter-PDF count per book (for the admin coverage report). */
  private async ncertCoverage(): Promise<{ book: string; published: number }[]> {
    const out: { book: string; published: number }[] = []
    for (const b of NCERT_CLASS10_BOOKS) {
      const published = await this.prisma.contentAsset.count({
        where: {
          sourceType: 'OFFICIAL_EXTERNAL',
          status: PUB,
          sourceUrl: { contains: `/${b.code}` },
        },
      })
      out.push({ book: b.book, published })
    }
    return out
  }

  /**
   * One-click: attach the WHOLE official CBSE Grade 10 set — stable portals
   * (published as-is) plus every NCERT chapter PDF (verified, only reachable
   * ones go live). Returns a per-book coverage report so a wrong book code is
   * visible (0 published) rather than silently missing.
   */
  async ingestCbseGrade10(userId: string, opts: IngestOptions = {}) {
    const entries = [...this.cbseGrade10Catalog(), ...this.ncertChapterCatalog()]
    const summary = await this.ingest(userId, entries, { verify: true, ...opts })
    summary.coverage = await this.ncertCoverage()
    return summary
  }
}
