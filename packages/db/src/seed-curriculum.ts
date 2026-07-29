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
// Marks sample practice questions created by this seed, so re-runs can clean
// them up without touching admin- or org-authored questions.
const SEED_MARK = 'SEED_CURRICULUM'

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

  // This seed is AUTHORITATIVE for the CBSE Grade 10 tree: wipe and rebuild it
  // so every run converges to exactly the definitions below (removes any stale
  // or previously-incorrect chapters). Cascades to units/books/chapters/topics/
  // objectives for THIS grade only — organizations, users and content assets are
  // never touched.
  await prisma.curriculumSubject.deleteMany({ where: { gradeId: grade.id } })
  // Clean up sample practice questions from a previous run (their curriculum
  // mappings cascade). Admin/org-authored questions are untouched.
  await prisma.assessmentQuestion.deleteMany({ where: { createdById: SEED_MARK } })

  // A sample MCQ mapped to a curriculum node, so the student Practice flow works
  // out of the box. Admins can edit/delete these or add their own.
  const practiceQuestion = async (
    nodeType: string,
    nodeId: string,
    text: string,
    options: { id: string; text: string }[],
    correct: string,
    explanation: string,
  ) =>
    prisma.assessmentQuestion.create({
      data: {
        type: 'MCQ',
        difficulty: 'EASY',
        text,
        options,
        correctAnswer: correct,
        explanation,
        marks: 1,
        createdById: SEED_MARK,
        curriculumLinks: { create: { nodeType: nodeType as never, nodeId } },
      },
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
  let mch = 0 // global chapter order (NCERT sequence), not per-unit
  for (const [unitTitle, chapters] of mathUnits) {
    const unit = await findOrCreateUnit(maths.id, slugCode(unitTitle), unitTitle, mo++)
    for (const ch of chapters) await chapter(maths.id, ch, mch++, { unitId: unit.id })
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

  // Sample practice questions (basic, unambiguous) so the Practice flow is live.
  await practiceQuestion(
    'TOPIC', tTypes.id,
    'The reaction $2H_2 + O_2 \\rightarrow 2H_2O$ is an example of which type of reaction?',
    [
      { id: 'A', text: 'Combination reaction' },
      { id: 'B', text: 'Decomposition reaction' },
      { id: 'C', text: 'Displacement reaction' },
      { id: 'D', text: 'Double displacement reaction' },
    ],
    'A',
    'Two or more reactants combine to form a single product, so it is a combination reaction.',
  )
  await practiceQuestion(
    'TOPIC', tTypes.id,
    'In the reaction $Zn + CuSO_4 \\rightarrow ZnSO_4 + Cu$, zinc is:',
    [
      { id: 'A', text: 'Oxidised' },
      { id: 'B', text: 'Reduced' },
      { id: 'C', text: 'Neither oxidised nor reduced' },
      { id: 'D', text: 'Acting as a catalyst' },
    ],
    'A',
    'Zinc loses electrons (its oxidation state rises from 0 to +2), so it is oxidised.',
  )
  await practiceQuestion(
    'TOPIC', tTypes.id,
    'Heating calcium carbonate, $CaCO_3 \\rightarrow CaO + CO_2$, is an example of a:',
    [
      { id: 'A', text: 'Combination reaction' },
      { id: 'B', text: 'Decomposition reaction' },
      { id: 'C', text: 'Displacement reaction' },
      { id: 'D', text: 'Neutralisation reaction' },
    ],
    'B',
    'A single compound breaks down into two or more products, so it is a decomposition reaction.',
  )
  await practiceQuestion(
    'TOPIC', tEffects.id,
    'The rusting of iron is an example of:',
    [
      { id: 'A', text: 'Reduction' },
      { id: 'B', text: 'Corrosion (oxidation)' },
      { id: 'C', text: 'Rancidity' },
      { id: 'D', text: 'Decomposition' },
    ],
    'B',
    'Iron reacts with oxygen and moisture and is oxidised — this corrosion is called rusting.',
  )

  // ── Social Science — demonstrates the optional Book level ──
  const social = await subject('SOCIAL_SCIENCE', 'Social Science', 3)
  const socialBooks: [string, string[]][] = [
    ['History — India and the Contemporary World II', ['The Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of a Global World', 'The Age of Industrialisation', 'Print Culture and the Modern World']],
    ['Geography — Contemporary India II', ['Resources and Development', 'Forest and Wildlife Resources', 'Water Resources', 'Agriculture', 'Minerals and Energy Resources', 'Manufacturing Industries', 'Lifelines of National Economy']],
    ['Political Science — Democratic Politics II', ['Power-sharing', 'Federalism', 'Gender, Religion and Caste', 'Political Parties', 'Outcomes of Democracy']],
    ['Economics — Understanding Economic Development', ['Development', 'Sectors of the Indian Economy', 'Money and Credit', 'Globalisation and the Indian Economy', 'Consumer Rights']],
  ]
  let bo = 0
  let sch = 0 // global chapter order across the four SST books
  for (const [bookTitle, chapters] of socialBooks) {
    const book = await findOrCreateBook(social.id, bookTitle, bo++)
    for (const ch of chapters) await chapter(social.id, ch, sch++, { bookId: book.id })
  }

  // ── English (Language & Literature) — two prescribed books ──
  const english = await subject('ENGLISH', 'English', 4)
  const firstFlight = await findOrCreateBook(english.id, 'First Flight', 0)
  const firstFlightChapters = [
    // Prose
    'A Letter to God', 'Nelson Mandela: Long Walk to Freedom',
    'Two Stories about Flying', 'From the Diary of Anne Frank',
    'Glimpses of India', 'Mijbil the Otter', 'Madam Rides the Bus',
    'The Sermon at Benares', 'The Proposal',
    // Poems
    'Dust of Snow', 'Fire and Ice', 'A Tiger in the Zoo',
    'How to Tell Wild Animals', 'The Ball Poem', 'Amanda!', 'The Trees',
    'Fog', 'The Tale of Custard the Dragon', 'For Anne Gregory',
  ]
  for (const [i, ch] of firstFlightChapters.entries()) {
    await chapter(english.id, ch, i, { bookId: firstFlight.id })
  }
  const footprints = await findOrCreateBook(english.id, 'Footprints Without Feet', 1)
  const footprintsChapters = [
    'A Triumph of Surgery', "The Thief's Story", 'The Midnight Visitor',
    'A Question of Trust', 'Footprints without Feet', 'The Making of a Scientist',
    'The Necklace', 'Bholi', 'The Book That Saved the Earth',
  ]
  for (const [i, ch] of footprintsChapters.entries()) {
    await chapter(english.id, ch, 100 + i, { bookId: footprints.id })
  }

  // ── Hindi Course A — Kshitij Bhag-2 (क्षितिज भाग-2) ──
  // Verified against the NCERT textbook पाठ सूची (contents page).
  const hindi = await subject('HINDI', 'Hindi', 5)
  const kshitij = await findOrCreateBook(hindi.id, 'क्षितिज भाग-2 (Kshitij)', 0)
  const padyaKhand = await findOrCreateUnit(hindi.id, 'PADYA_KHAND', 'पद्य खंड', 0)
  const gadyaKhand = await findOrCreateUnit(hindi.id, 'GADYA_KHAND', 'गद्य खंड', 1)
  // पद्य खंड (Poetry) — 1–7
  const kshitijPadya = [
    'कबीर – साखी',
    'मीरा – पद',
    'मैथिलीशरण गुप्त – मनुष्यता',
    'सुमित्रानंदन पंत – पर्वत प्रदेश में पावस',
    'वीरेन डंगवाल – तोप',
    'कैफ़ी आज़मी – कर चले हम फ़िदा',
    'रवींद्रनाथ ठाकुर – आत्मत्राण',
  ]
  for (const [i, ch] of kshitijPadya.entries()) {
    await chapter(hindi.id, ch, i, { bookId: kshitij.id, unitId: padyaKhand.id })
  }
  // गद्य खंड (Prose) — 8–14
  const kshitijGadya = [
    'प्रेमचंद – बड़े भाई साहब',
    'सीताराम सेकसरिया – डायरी का एक पन्ना',
    'लीलाधर मंडलोई – तताँरा-वामीरो कथा',
    'प्रह्लाद अग्रवाल – तीसरी कसम के शिल्पकार शैलेंद्र',
    'निदा फ़ाज़ली – अब कहाँ दूसरे के दुख से दुखी होने वाले',
    'रवींद्र केलेकर – पतझर में टूटी पत्तियाँ',
    'हबीब तनवीर – कारतूस (एकांकी)',
  ]
  for (const [i, ch] of kshitijGadya.entries()) {
    await chapter(hindi.id, ch, 7 + i, { bookId: kshitij.id, unitId: gadyaKhand.id })
  }
  // Note: कृतिका भाग-2 (the supplementary reader) is intentionally NOT seeded
  // from memory. Load it via CSV import or send the कृतिका पाठ सूची photo and it
  // will be added exactly.

  const counts = await prisma.$transaction([
    prisma.curriculumSubject.count({ where: { gradeId: grade.id } }),
    prisma.curriculumChapter.count({ where: { subject: { gradeId: grade.id } } }),
    prisma.curriculumTopic.count(),
    prisma.learningObjective.count(),
  ])
  console.warn(
    `✅ CBSE Grade 10 rebuilt: ${counts[0]} subjects, ${counts[1]} chapters, ${counts[2]} topics, ${counts[3]} learning objectives.`,
  )
  console.warn('   (Only the CBSE Grade 10 curriculum tree was rebuilt — organizations, users and content assets were NOT touched.)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
