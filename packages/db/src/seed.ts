/**
 * LearnHub seed data.
 * Run with: pnpm --filter @learnhub/db seed
 */
import bcrypt from 'bcryptjs'

import { prisma } from './client'

const PASSWORD_HASH = bcrypt.hashSync('Admin@123', 12)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.warn('🌱 Seeding LearnHub database...')

  // Clean slate: TRUNCATE every table with CASCADE so the reset is independent
  // of the foreign-key graph (and stays correct as the schema grows).
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `
  if (tables.length > 0) {
    const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ')
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
    )
  }

  // ─── Super admin ─────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'admin@learnhub.com',
      name: 'Platform Admin',
      role: 'SUPER_ADMIN',
      passwordHash: PASSWORD_HASH,
      emailVerified: true,
      onboarded: true,
    },
  })

  // ─── Acme Corp (BUSINESS) ────────────────────────
  const acme = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      type: 'BUSINESS',
      plan: 'TEAMS',
      maxUsers: 50,
      maxCourses: 50,
    },
  })

  const acmeAdmin = await prisma.user.create({
    data: {
      email: 'admin@acmecorp.com',
      name: 'Acme Admin',
      role: 'ORG_ADMIN',
      organizationId: acme.id,
      passwordHash: PASSWORD_HASH,
      emailVerified: true,
      onboarded: true,
    },
  })

  const acmeInstructors = await Promise.all(
    [1, 2].map((n) =>
      prisma.user.create({
        data: {
          email: `instructor${n}@acmecorp.com`,
          name: `Acme Instructor ${n}`,
          role: 'INSTRUCTOR',
          organizationId: acme.id,
          passwordHash: PASSWORD_HASH,
          emailVerified: true,
          onboarded: true,
        },
      }),
    ),
  )

  const acmeLearners = await Promise.all(
    [1, 2, 3, 4, 5].map((n) =>
      prisma.user.create({
        data: {
          email: `learner${n}@acmecorp.com`,
          name: `Acme Learner ${n}`,
          role: 'LEARNER',
          organizationId: acme.id,
          passwordHash: PASSWORD_HASH,
          emailVerified: true,
          onboarded: true,
        },
      }),
    ),
  )

  // Knowledge base: 2 spaces, 4 manuals, 10 articles
  for (const spaceName of ['Engineering Handbook', 'Company Policies']) {
    const space = await prisma.space.create({
      data: {
        name: spaceName,
        slug: slugify(spaceName),
        organizationId: acme.id,
        iconEmoji: '📘',
      },
    })
    for (const manualName of [`${spaceName} — Getting Started`, `${spaceName} — Advanced`]) {
      const manual = await prisma.manual.create({
        data: {
          name: manualName,
          slug: slugify(manualName),
          spaceId: space.id,
        },
      })
      for (let a = 1; a <= 3; a++) {
        const title = `${manualName} · Article ${a}`
        await prisma.article.create({
          data: {
            title,
            slug: slugify(title),
            manualId: manual.id,
            authorId: acmeAdmin.id,
            status: 'PUBLISHED',
            publishedAt: new Date('2026-01-01'),
            excerpt: 'A sample knowledge base article.',
            tags: ['guide', 'reference'],
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: `Welcome to ${title}.` }],
                },
              ],
            },
          },
        })
      }
    }
  }

  // ─── Sunrise Academy (SCHOOL) ────────────────────
  const sunrise = await prisma.organization.create({
    data: {
      name: 'Sunrise Academy',
      slug: 'sunrise-academy',
      type: 'SCHOOL',
      plan: 'INSTITUTE',
      maxUsers: 500,
      maxCourses: 200,
      // Listed in the public school directory so students can self-register.
      state: 'TELANGANA',
      board: 'TELANGANA_STATE',
      city: 'Hyderabad',
      listedInDirectory: true,
    },
  })

  const sunriseInstructor = await prisma.user.create({
    data: {
      email: 'teacher@sunrise.edu',
      name: 'Sunrise Teacher',
      role: 'INSTRUCTOR',
      organizationId: sunrise.id,
      passwordHash: PASSWORD_HASH,
      emailVerified: true,
      onboarded: true,
    },
  })

  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2025-2026',
      organizationId: sunrise.id,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-04-30'),
      isCurrent: true,
    },
  })

  const students = await Promise.all(
    [1, 2, 3, 4, 5].map((n) =>
      prisma.user.create({
        data: {
          email: `student${n}@sunrise.edu`,
          name: `Sunrise Student ${n}`,
          role: 'STUDENT',
          organizationId: sunrise.id,
          passwordHash: PASSWORD_HASH,
          emailVerified: true,
          onboarded: true,
        },
      }),
    ),
  )

  // ─── Parent linked to the first two students ─────
  const sunriseParent = await prisma.user.create({
    data: {
      email: 'parent@sunrise.edu',
      name: 'Sunrise Parent',
      role: 'PARENT',
      organizationId: sunrise.id,
      passwordHash: PASSWORD_HASH,
      emailVerified: true,
      onboarded: true,
    },
  })
  await Promise.all(
    students.slice(0, 2).map((s) =>
      prisma.parentStudentLink.create({
        data: { parentId: sunriseParent.id, studentId: s.id, relation: 'parent' },
      }),
    ),
  )

  // grade/section/joinCode per class; codes are what students enter to
  // self-register into the right class (Google Classroom style).
  const batchMeta: Record<
    string,
    { grade: string; section: string; joinCode: string; tracks: string[] }
  > = {
    'Grade 10 - A': { grade: 'Class 10', section: 'A', joinCode: 'TS-10A-DEMO', tracks: ['BOARD_SSC'] },
    'Grade 10 - B': { grade: 'Class 10', section: 'B', joinCode: 'TS-10B-DEMO', tracks: ['BOARD_SSC'] },
    'Grade 11 - A': {
      grade: 'Intermediate 1st Year',
      section: 'A',
      joinCode: 'TS-11A-DEMO',
      tracks: ['BOARD_INTER', 'JEE_MAIN', 'EAPCET_ENGINEERING'],
    },
  }
  for (const batchName of ['Grade 10 - A', 'Grade 10 - B', 'Grade 11 - A']) {
    const meta = batchMeta[batchName]!
    const batch = await prisma.batch.create({
      data: {
        name: batchName,
        organizationId: sunrise.id,
        academicYearId: academicYear.id,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2026-04-30'),
        grade: meta.grade,
        section: meta.section,
        board: 'TELANGANA_STATE',
        joinCode: meta.joinCode,
        examTracks: {
          create: meta.tracks.map((t) => ({ examTrack: t as never })),
        },
      },
    })
    await prisma.timetableSlot.createMany({
      data: [
        { batchId: batch.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', subject: 'Mathematics' },
        { batchId: batch.id, dayOfWeek: 1, startTime: '10:00', endTime: '11:00', subject: 'Science' },
        { batchId: batch.id, dayOfWeek: 2, startTime: '09:00', endTime: '10:00', subject: 'English' },
      ],
    })
    // Enroll first two students into the first batch, record sample grades
    if (batchName === 'Grade 10 - A') {
      for (const s of students.slice(0, 2)) {
        await prisma.batchStudent.create({ data: { batchId: batch.id, userId: s.id } })
        await prisma.grade.create({
          data: {
            userId: s.id,
            organizationId: sunrise.id,
            academicYearId: academicYear.id,
            subject: 'Mathematics',
            score: 85,
            maxScore: 100,
            gradeLabel: 'A',
            term: 'Term 1',
          },
        })
        // A week of attendance so the student/parent overview has data
        await prisma.attendanceRecord.createMany({
          data: [
            { batchId: batch.id, userId: s.id, date: new Date('2026-07-13'), status: 'PRESENT' },
            { batchId: batch.id, userId: s.id, date: new Date('2026-07-14'), status: 'PRESENT' },
            { batchId: batch.id, userId: s.id, date: new Date('2026-07-15'), status: 'ABSENT' },
            { batchId: batch.id, userId: s.id, date: new Date('2026-07-16'), status: 'PRESENT' },
            { batchId: batch.id, userId: s.id, date: new Date('2026-07-17'), status: 'PRESENT' },
          ],
        })
      }
    }
  }

  // ─── Courses (3 with chapters/lessons) ───────────
  const instructors = [acmeInstructors[0]!, acmeInstructors[1]!, sunriseInstructor]
  const orgs = [acme.id, acme.id, sunrise.id]
  const courseTitles = ['Intro to TypeScript', 'Advanced React', 'Physics 101']
  const acmeCourses: { id: string; title: string; firstLessonId: string; lessonIds: string[] }[] = []

  for (let c = 0; c < courseTitles.length; c++) {
    const title = courseTitles[c]!
    const lessonIds: string[] = []
    const course = await prisma.course.create({
      data: {
        title,
        slug: slugify(title),
        organizationId: orgs[c]!,
        instructorId: instructors[c]!.id,
        status: 'PUBLISHED',
        isPublic: true,
        publishedAt: new Date('2026-01-15'),
        description: `${title} — a hands-on course.`,
        level: 'BEGINNER',
        totalLessons: 4,
        durationMins: 120,
      },
    })
    for (let ch = 1; ch <= 2; ch++) {
      const chapter = await prisma.chapter.create({
        data: { title: `Chapter ${ch}`, courseId: course.id, order: ch },
      })
      for (let l = 1; l <= 2; l++) {
        const lesson = await prisma.lesson.create({
          data: {
            title: `Lesson ${ch}.${l}`,
            chapterId: chapter.id,
            type: 'VIDEO',
            order: l,
            isPublished: true,
            videoDurationSecs: 600,
          },
        })
        lessonIds.push(lesson.id)
        // Attach a quiz with 10 questions to the first lesson of each course
        if (ch === 1 && l === 1) {
          const quiz = await prisma.quiz.create({
            data: {
              title: `${title} — Knowledge Check`,
              lessonId: lesson.id,
              organizationId: orgs[c]!,
              isPublished: true,
            },
          })
          await prisma.question.createMany({
            data: Array.from({ length: 10 }, (_, i) => ({
              quizId: quiz.id,
              type: 'MCQ' as const,
              text: `Question ${i + 1} for ${title}?`,
              order: i,
              options: [
                { id: 'a', text: 'Option A', isCorrect: i % 2 === 0 },
                { id: 'b', text: 'Option B', isCorrect: i % 2 !== 0 },
                { id: 'c', text: 'Option C', isCorrect: false },
                { id: 'd', text: 'Option D', isCorrect: false },
              ],
            })),
          })
        }
      }
    }
    if (orgs[c] === acme.id) {
      acmeCourses.push({ id: course.id, title, firstLessonId: lessonIds[0]!, lessonIds })
    }
  }

  // ─── Enrollments so learners (and the admin dashboard) have data ──
  // learner1 → fully completes the first course (earns a certificate)
  // learner2 → half-way through the first course
  // learner3 → just started the second course
  const [tsCourse, reactCourse] = acmeCourses
  const [learner1, learner2, learner3] = acmeLearners
  if (tsCourse && learner1) {
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: learner1.id,
        courseId: tsCourse.id,
        status: 'COMPLETED',
        progressPct: 100,
        completedAt: new Date('2026-07-10'),
        lastAccessAt: new Date('2026-07-10'),
      },
    })
    await prisma.lessonProgress.createMany({
      data: tsCourse.lessonIds.map((lessonId) => ({
        enrollmentId: enrollment.id,
        lessonId,
        userId: learner1.id,
        isCompleted: true,
        watchedSecs: 600,
        completedAt: new Date('2026-07-10'),
      })),
    })
    await prisma.certificate.create({
      data: {
        userId: learner1.id,
        courseId: tsCourse.id,
        enrollmentId: enrollment.id,
        certificateNo: 'LH-2026-000001',
      },
    })
  }
  if (tsCourse && learner2) {
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: learner2.id,
        courseId: tsCourse.id,
        status: 'IN_PROGRESS',
        progressPct: 50,
        lastAccessAt: new Date('2026-07-15'),
      },
    })
    await prisma.lessonProgress.createMany({
      data: tsCourse.lessonIds.slice(0, 2).map((lessonId) => ({
        enrollmentId: enrollment.id,
        lessonId,
        userId: learner2.id,
        isCompleted: true,
        watchedSecs: 600,
        completedAt: new Date('2026-07-15'),
      })),
    })
  }
  if (reactCourse && learner3) {
    await prisma.enrollment.create({
      data: {
        userId: learner3.id,
        courseId: reactCourse.id,
        status: 'IN_PROGRESS',
        progressPct: 10,
        lastAccessAt: new Date('2026-07-18'),
      },
    })
  }

  // ─── Curriculum + question bank (Sunrise Academy) ────
  // Real TS/AP-flavoured content: Class 10 SSC board + Intermediate MPC
  // (JEE / EAPCET). Compact but genuine so practice + tests work end-to-end.
  interface SeedQ {
    text: string
    options: { id: string; text: string }[]
    correct: string
    explanation: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    examTrack: string
  }
  interface SeedSubject {
    name: string
    grade: string
    examTrack: string
    color: string
    chapters: { name: string; topics: { name: string; questions: SeedQ[] }[] }[]
  }

  const opt = (a: string, b: string, c: string, d: string) => [
    { id: 'a', text: a },
    { id: 'b', text: b },
    { id: 'c', text: c },
    { id: 'd', text: d },
  ]

  const curriculum: SeedSubject[] = [
    {
      name: 'Mathematics',
      grade: 'Class 10',
      examTrack: 'BOARD_SSC',
      color: '#6366f1',
      chapters: [
        {
          name: 'Real Numbers',
          topics: [
            {
              name: 'Euclid’s Division Lemma & HCF',
              questions: [
                {
                  text: 'The HCF of 96 and 404 is:',
                  options: opt('2', '4', '8', '12'),
                  correct: 'b',
                  explanation: '404 = 96×4 + 20; 96 = 20×4 + 16; 20 = 16×1 + 4; 16 = 4×4. HCF = 4.',
                  difficulty: 'EASY',
                  examTrack: 'BOARD_SSC',
                },
                {
                  text: 'For any positive integer n, n² − n is always divisible by:',
                  options: opt('2', '3', '5', '7'),
                  correct: 'a',
                  explanation: 'n²−n = n(n−1), a product of two consecutive integers, hence even.',
                  difficulty: 'MEDIUM',
                  examTrack: 'BOARD_SSC',
                },
              ],
            },
            {
              name: 'Rational & Irrational Numbers',
              questions: [
                {
                  text: 'The decimal expansion of 7/80 will terminate after how many places?',
                  options: opt('2', '3', '4', 'non-terminating'),
                  correct: 'c',
                  explanation: '80 = 2⁴×5; highest power is 4, so it terminates after 4 places.',
                  difficulty: 'MEDIUM',
                  examTrack: 'BOARD_SSC',
                },
              ],
            },
          ],
        },
        {
          name: 'Trigonometry',
          topics: [
            {
              name: 'Trigonometric Ratios',
              questions: [
                {
                  text: 'If sin θ = 3/5, then cos θ (θ acute) is:',
                  options: opt('4/5', '5/4', '3/4', '5/3'),
                  correct: 'a',
                  explanation: 'cos θ = √(1 − 9/25) = √(16/25) = 4/5.',
                  difficulty: 'EASY',
                  examTrack: 'BOARD_SSC',
                },
                {
                  text: 'The value of sin²30° + cos²30° is:',
                  options: opt('0', '1/2', '1', '2'),
                  correct: 'c',
                  explanation: 'sin²θ + cos²θ = 1 for every θ.',
                  difficulty: 'EASY',
                  examTrack: 'BOARD_SSC',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'Physical Science',
      grade: 'Class 10',
      examTrack: 'BOARD_SSC',
      color: '#0ea5e9',
      chapters: [
        {
          name: 'Acids, Bases and Salts',
          topics: [
            {
              name: 'pH Scale',
              questions: [
                {
                  text: 'A solution with pH = 2 is:',
                  options: opt('Strongly basic', 'Neutral', 'Strongly acidic', 'Weakly basic'),
                  correct: 'c',
                  explanation: 'Low pH (<7) means acidic; pH 2 is strongly acidic.',
                  difficulty: 'EASY',
                  examTrack: 'BOARD_SSC',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'Physics',
      grade: 'Intermediate 1st Year',
      examTrack: 'JEE_MAIN',
      color: '#8b5cf6',
      chapters: [
        {
          name: 'Units and Measurements',
          topics: [
            {
              name: 'Dimensional Analysis',
              questions: [
                {
                  text: 'The dimensional formula of force is:',
                  options: opt('[MLT⁻¹]', '[MLT⁻²]', '[ML²T⁻²]', '[M L⁻¹ T⁻²]'),
                  correct: 'b',
                  explanation: 'Force = mass × acceleration = M × LT⁻² = [MLT⁻²].',
                  difficulty: 'EASY',
                  examTrack: 'JEE_MAIN',
                },
                {
                  text: 'Which pair has the same dimensions?',
                  options: opt('Work & Power', 'Impulse & Momentum', 'Force & Energy', 'Pressure & Force'),
                  correct: 'b',
                  explanation: 'Impulse = F·t and momentum = m·v both have [MLT⁻¹].',
                  difficulty: 'MEDIUM',
                  examTrack: 'JEE_MAIN',
                },
              ],
            },
          ],
        },
        {
          name: 'Motion in a Straight Line',
          topics: [
            {
              name: 'Kinematic Equations',
              questions: [
                {
                  text: 'A body starts from rest with acceleration 2 m/s². Its velocity after 5 s is:',
                  options: opt('5 m/s', '10 m/s', '15 m/s', '20 m/s'),
                  correct: 'b',
                  explanation: 'v = u + at = 0 + 2×5 = 10 m/s.',
                  difficulty: 'EASY',
                  examTrack: 'EAPCET_ENGINEERING',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'Mathematics',
      grade: 'Intermediate 1st Year',
      examTrack: 'JEE_MAIN',
      color: '#f59e0b',
      chapters: [
        {
          name: 'Matrices',
          topics: [
            {
              name: 'Determinants',
              questions: [
                {
                  text: 'The determinant of [[2,3],[1,4]] is:',
                  options: opt('5', '8', '11', '2'),
                  correct: 'a',
                  explanation: '(2×4) − (3×1) = 8 − 3 = 5.',
                  difficulty: 'EASY',
                  examTrack: 'JEE_MAIN',
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  const class10MathsQ: string[] = []
  for (const [si, subj] of curriculum.entries()) {
    const subject = await prisma.subject.create({
      data: {
        name: subj.name,
        organizationId: sunrise.id,
        grade: subj.grade,
        examTrack: subj.examTrack as never,
        color: subj.color,
        order: si,
      },
    })
    for (const [ci, ch] of subj.chapters.entries()) {
      const chapter = await prisma.syllabusChapter.create({
        data: { subjectId: subject.id, name: ch.name, order: ci },
      })
      for (const [ti, top] of ch.topics.entries()) {
        const topic = await prisma.topic.create({
          data: { chapterId: chapter.id, name: top.name, order: ti },
        })
        for (const q of top.questions) {
          const created = await prisma.assessmentQuestion.create({
            data: {
              organizationId: sunrise.id,
              subjectId: subject.id,
              chapterId: chapter.id,
              topicId: topic.id,
              examTrack: q.examTrack as never,
              type: 'MCQ',
              difficulty: q.difficulty,
              text: q.text,
              options: q.options,
              correctAnswer: q.correct,
              explanation: q.explanation,
              marks: 1,
            },
          })
          if (subj.name === 'Mathematics' && subj.grade === 'Class 10') {
            class10MathsQ.push(created.id)
          }
        }
      }
    }
  }

  // A fixed chapter test (Class 10 Maths) built from the bank.
  if (class10MathsQ.length > 0) {
    const mathsSubject = await prisma.subject.findFirst({
      where: { organizationId: sunrise.id, name: 'Mathematics', grade: 'Class 10' },
    })
    const test = await prisma.assessment.create({
      data: {
        title: 'Class 10 Maths — Chapter Test',
        type: 'CHAPTER_TEST',
        organizationId: sunrise.id,
        ...(mathsSubject ? { subjectId: mathsSubject.id } : {}),
        examTrack: 'BOARD_SSC',
        durationMins: 20,
        isPublished: true,
      },
    })
    await prisma.assessmentItem.createMany({
      data: class10MathsQ.map((qid, i) => ({
        assessmentId: test.id,
        questionId: qid,
        order: i,
      })),
    })
  }

  console.warn('✅ Seed complete.')
  console.warn('   Super Admin: admin@learnhub.com / Admin@123')
  console.warn('   Org Admin:   admin@acmecorp.com / Admin@123')
  console.warn('   Instructor:  instructor1@acmecorp.com / Admin@123')
  console.warn('   Learner:     learner1@acmecorp.com / Admin@123 (has a certificate)')
  console.warn('   Student:     student1@sunrise.edu / Admin@123')
  console.warn('   Parent:      parent@sunrise.edu / Admin@123')
  console.warn('   Student self-signup join codes (Sunrise Academy, Telangana):')
  console.warn('     Class 10-A: TS-10A-DEMO   Class 10-B: TS-10B-DEMO   Inter 1st-A: TS-11A-DEMO')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
