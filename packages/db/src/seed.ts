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

  for (const batchName of ['Grade 10 - A', 'Grade 10 - B', 'Grade 11 - A']) {
    const batch = await prisma.batch.create({
      data: {
        name: batchName,
        organizationId: sunrise.id,
        academicYearId: academicYear.id,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2026-04-30'),
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

  console.warn('✅ Seed complete.')
  console.warn('   Super Admin: admin@learnhub.com / Admin@123')
  console.warn('   Org Admin:   admin@acmecorp.com / Admin@123')
  console.warn('   Instructor:  instructor1@acmecorp.com / Admin@123')
  console.warn('   Learner:     learner1@acmecorp.com / Admin@123 (has a certificate)')
  console.warn('   Student:     student1@sunrise.edu / Admin@123')
  console.warn('   Parent:      parent@sunrise.edu / Admin@123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
