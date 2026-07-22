/**
 * ADDITIVE, IDEMPOTENT curriculum seed — CBSE Grade 10.
 *
 * Unlike src/seed.ts (which TRUNCATES everything), this script only upserts
 * curriculum rows. It NEVER deletes anything, so it is safe to run against a
 * real database with existing organizations/users. Run it as many times as you
 * like; it converges to the same state.
 *
 *   pnpm db:seed:curriculum
 *
 * Scope now: CBSE → 2026-27 → Grade 10 → {Maths, Science, Social Science,
 * English, Hindi}. Chapter *titles* are factual curriculum structure. Maths
 * demonstrates the optional Unit level; Social Science demonstrates the optional
 * Book level. Science's first chapter is fully expanded (topics + subtopics +
 * original learning objectives) as the pilot. No copyrighted prose is copied.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PUB = 'PUBLISHED' as const

function slugCode(s: string): string {
  return s
    .toUpperCase()
    .replace(/&/g, 'AND')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
}

async function main() {
  console.warn('🌱 Seeding CBSE Grade 10 curriculum (additive, non-destructive)…')

  const board = await prisma.curriculumBoard.upsert({
    where: { code: 'CBSE' },
    update: { name: 'CBSE', status: PUB },
    create: { code: 'CBSE', name: 'CBSE', description: 'Central Board of Secondary Education', order: 1, status: PUB },
  })

  const year = await prisma.curriculumYear.upsert({
    where: { boardId_label: { boardId: board.id, label: '2026-27' } },
    update: { isCurrent: true, status: PUB },
    create: { boardId: board.id, label: '2026-27', isCurrent: true, order: 1, status: PUB },
  })

  const grade = await prisma.curriculumGrade.upsert({
    where: { yearId_code: { yearId: year.id, code: 'GRADE_10' } },
    update: { name: 'Grade 10', level: 10, status: PUB },
    create: { yearId: year.id, code: 'GRADE_10', name: 'Grade 10', level: 10, order: 10, status: PUB },
  })

  const subject = async (code: string, title: string, order: number) =>
    prisma.curriculumSubject.upsert({
      where: { gradeId_code: { gradeId: grade.id, code } },
      update: { title, status: PUB },
      create: { gradeId: grade.id, code, title, order, status: PUB },
    })

  // find-or-create helpers for models without a natural unique key
  const findOrCreateUnit = async (subjectId: string, code: string, title: string, order: number) => {
    const found = await prisma.curriculumUnit.findFirst({ where: { subjectId, code } })
    return found ?? prisma.curriculumUnit.create({ data: { subjectId, code, title, order, status: PUB } })
  }
  const findOrCreateBook = async (subjectId: string, title: string, order: number) => {
    const found = await prisma.curriculumBook.findFirst({ where: { subjectId, title } })
    return found ?? prisma.curriculumBook.create({ data: { subjectId, title, order, status: PUB } })
  }
  const chapter = async (
    subjectId: string,
    title: string,
    order: number,
    extra?: { unitId?: string; bookId?: string },
  ) => {
    // Non-Latin titles (e.g. Hindi/Devanagari) slugify to empty — fall back to
    // an order-based code so chapters don't collide on the unique key.
    const code = slugCode(title) || `CH_${order}`
    return prisma.curriculumChapter.upsert({
      where: { subjectId_code: { subjectId, code } },
      update: { title, status: PUB, ...(extra?.unitId ? { unitId: extra.unitId } : {}), ...(extra?.bookId ? { bookId: extra.bookId } : {}) },
      create: { subjectId, code, title, order, status: PUB, ...(extra ?? {}) },
    })
  }
  const topic = async (chapterId: string, title: string, order: number) => {
    const code = slugCode(title) || `T_${order}`
    return prisma.curriculumTopic.upsert({
      where: { chapterId_code: { chapterId, code } },
      update: { title, status: PUB },
      create: { chapterId, code, title, order, status: PUB },
    })
  }
  const subtopic = async (topicId: string, title: string, order: number) => {
    const code = slugCode(title) || `ST_${order}`
    const found = await prisma.curriculumSubtopic.findFirst({ where: { topicId, code } })
    return found ?? prisma.curriculumSubtopic.create({ data: { topicId, code, title, order, status: PUB } })
  }
  const objective = async (topicId: string, code: string, statement: string, order: number) => {
    const found = await prisma.learningObjective.findFirst({ where: { topicId, code } })
    if (found) return found
    return prisma.learningObjective.create({ data: { topicId, code, statement, order, status: PUB } })
  }

  // ── Mathematics — demonstrates the optional Unit level ──
  const maths = await subject('MATHEMATICS', 'Mathematics', 1)
  const mathUnits: [string, string[]][] = [
    ['Number Systems', ['Real Numbers']],
    ['Algebra', ['Polynomials', 'Pair of Linear Equations in Two Variables', 'Quadratic Equations', 'Arithmetic Progressions']],
    ['Coordinate Geometry', ['Coordinate Geometry']],
    ['Geometry', ['Triangles', 'Circles']],
    ['Trigonometry', ['Introduction to Trigonometry', 'Some Applications of Trigonometry']],
    ['Mensuration', ['Areas Related to Circles', 'Surface Areas and Volumes']],
    ['Statistics & Probability', ['Statistics', 'Probability']],
  ]
  let mo = 0
  for (const [unitTitle, chapters] of mathUnits) {
    const unit = await findOrCreateUnit(maths.id, slugCode(unitTitle), unitTitle, mo++)
    let co = 0
    for (const ch of chapters) await chapter(maths.id, ch, co++, { unitId: unit.id })
  }

  // ── Science — plain chapters; first chapter is the pilot ──
  const science = await subject('SCIENCE', 'Science', 2)
  const scienceChapters = [
    'Chemical Reactions and Equations',
    'Acids, Bases and Salts',
    'Metals and Non-metals',
    'Carbon and its Compounds',
    'Life Processes',
    'Control and Coordination',
    'How do Organisms Reproduce?',
    'Heredity',
    'Light – Reflection and Refraction',
    'The Human Eye and the Colourful World',
    'Electricity',
    'Magnetic Effects of Electric Current',
    'Our Environment',
  ]
  let sc = 0
  const scienceChapterRows = []
  for (const ch of scienceChapters) scienceChapterRows.push(await chapter(science.id, ch, sc++))

  // Pilot: full expansion of "Chemical Reactions and Equations"
  const pilot = scienceChapterRows[0]!
  const tEq = await topic(pilot.id, 'Chemical Equations', 0)
  await subtopic(tEq.id, 'Writing a Chemical Equation', 0)
  await subtopic(tEq.id, 'Balancing a Chemical Equation', 1)
  await objective(tEq.id, 'CRE_EQ_1', 'Write a word equation and its balanced chemical equation for a given reaction.', 0)
  await objective(tEq.id, 'CRE_EQ_2', 'Apply the law of conservation of mass to balance a chemical equation.', 1)

  const tTypes = await topic(pilot.id, 'Types of Chemical Reactions', 1)
  for (const [i, st] of ['Combination', 'Decomposition', 'Displacement', 'Double Displacement', 'Oxidation and Reduction'].entries()) {
    await subtopic(tTypes.id, `${st} Reactions`, i)
  }
  await objective(tTypes.id, 'CRE_TY_1', 'Classify a given reaction as combination, decomposition, displacement or double-displacement.', 0)
  await objective(tTypes.id, 'CRE_TY_2', 'Identify the substance oxidised and the substance reduced in a redox reaction.', 1)

  const tEffects = await topic(pilot.id, 'Effects of Oxidation Reactions in Everyday Life', 2)
  await subtopic(tEffects.id, 'Corrosion', 0)
  await subtopic(tEffects.id, 'Rancidity', 1)
  await objective(tEffects.id, 'CRE_EF_1', 'Explain corrosion and rancidity with everyday examples and suggest ways to prevent them.', 0)

  // ── Social Science — demonstrates the optional Book level ──
  const social = await subject('SOCIAL_SCIENCE', 'Social Science', 3)
  const socialBooks: [string, string[]][] = [
    ['History — India and the Contemporary World II', ['The Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of a Global World', 'The Age of Industrialisation', 'Print Culture and the Modern World']],
    ['Geography — Contemporary India II', ['Resources and Development', 'Forest and Wildlife Resources', 'Water Resources', 'Agriculture', 'Minerals and Energy Resources', 'Manufacturing Industries', 'Lifelines of National Economy']],
    ['Political Science — Democratic Politics II', ['Power-sharing', 'Federalism', 'Gender, Religion and Caste', 'Political Parties', 'Outcomes of Democracy']],
    ['Economics — Understanding Economic Development', ['Development', 'Sectors of the Indian Economy', 'Money and Credit', 'Globalisation and the Indian Economy', 'Consumer Rights']],
  ]
  let bo = 0
  for (const [bookTitle, chapters] of socialBooks) {
    const book = await findOrCreateBook(social.id, bookTitle, bo++)
    let co = 0
    for (const ch of chapters) await chapter(social.id, ch, co++, { bookId: book.id })
  }

  // ── English & Hindi — light structure (books + a few chapters) ──
  const english = await subject('ENGLISH', 'English', 4)
  const engBook = await findOrCreateBook(english.id, 'First Flight', 0)
  for (const [i, ch] of ['A Letter to God', 'Nelson Mandela: Long Walk to Freedom', 'Two Stories about Flying', 'From the Diary of Anne Frank'].entries()) {
    await chapter(english.id, ch, i, { bookId: engBook.id })
  }

  const hindi = await subject('HINDI', 'Hindi', 5)
  const hindiBook = await findOrCreateBook(hindi.id, 'Kshitij (क्षितिज)', 0)
  for (const [i, ch] of ['पद (सूरदास)', 'राम-लक्ष्मण-परशुराम संवाद', 'आत्मकथ्य', 'नेताजी का चश्मा'].entries()) {
    await chapter(hindi.id, ch, i, { bookId: hindiBook.id })
  }

  const counts = await prisma.$transaction([
    prisma.curriculumSubject.count({ where: { gradeId: grade.id } }),
    prisma.curriculumChapter.count({ where: { subject: { gradeId: grade.id } } }),
    prisma.curriculumTopic.count(),
    prisma.learningObjective.count(),
  ])
  console.warn(
    `✅ CBSE Grade 10 ready: ${counts[0]} subjects, ${counts[1]} chapters, ${counts[2]} topics, ${counts[3]} learning objectives.`,
  )
  console.warn('   (No existing data was deleted.)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
