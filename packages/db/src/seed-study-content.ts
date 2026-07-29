/**
 * Original in-app study material for CBSE Grade 10 — starting with Science.
 *
 * This is LearnHub's OWN content (concise revision notes + practice MCQs),
 * authored for the platform. It is not copied from any textbook, so it can be
 * self-hosted and rendered INSIDE the app (no NCERT embedding needed). Notes
 * render via the content viewer; MCQs feed the per-chapter Practice flow.
 *
 * Idempotent: re-running deletes the previously-seeded notes/questions (by
 * marker) and recreates them, so it never duplicates.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const NOTES_SOURCE = 'LearnHub Study Notes'
const QUESTION_MARK = 'SEED_STUDY'

interface Mcq {
  text: string
  options: { id: string; text: string }[]
  correct: string
  explanation: string
}
interface ChapterContent {
  chapter: string
  notes: string
  mcqs: Mcq[]
}

const opt = (a: string, b: string, c: string, d: string) => [
  { id: 'A', text: a },
  { id: 'B', text: b },
  { id: 'C', text: c },
  { id: 'D', text: d },
]

const SCIENCE: ChapterContent[] = [
  {
    chapter: 'Chemical Reactions and Equations',
    notes: `Key points
• A chemical reaction turns reactants into new products and is written as a balanced chemical equation.
• Law of conservation of mass: atoms are neither created nor destroyed, so each element must have equal atoms on both sides.
• Types of reactions:
   – Combination: $A + B \\rightarrow AB$ (e.g. $CaO + H_2O \\rightarrow Ca(OH)_2$).
   – Decomposition: $AB \\rightarrow A + B$ (thermal, electrolytic or by light).
   – Displacement: a more reactive metal displaces a less reactive one.
   – Double displacement: ions are exchanged (precipitation, neutralisation).
• Oxidation = gain of oxygen / loss of hydrogen; Reduction = loss of oxygen / gain of hydrogen. Both happen together in a redox reaction.
• Everyday effects of oxidation: corrosion (rusting of iron) and rancidity (oxidation of fats and oils in food).`,
    mcqs: [
      {
        text: 'The digestion of food in the body is an example of a:',
        options: opt('Combination reaction', 'Decomposition reaction', 'Displacement reaction', 'Double displacement reaction'),
        correct: 'B',
        explanation: 'Large food molecules break down into smaller ones — a decomposition reaction.',
      },
      {
        text: 'Adding a small amount of dilute acid to correct the colour of a rusted iron gate relates to which process?',
        options: opt('Reduction', 'Corrosion', 'Rancidity', 'Neutralisation'),
        correct: 'B',
        explanation: 'Rusting of iron is corrosion — the slow oxidation of a metal in air and moisture.',
      },
    ],
  },
  {
    chapter: 'Acids, Bases and Salts',
    notes: `Key points
• Acids release $H^+$ (as $H_3O^+$) in water; bases release $OH^-$.
• Indicators show acidity/basicity: litmus, methyl orange, phenolphthalein, and natural ones like turmeric.
• Neutralisation: acid + base $\\rightarrow$ salt + water (e.g. $HCl + NaOH \\rightarrow NaCl + H_2O$).
• pH scale runs 0–14: below 7 acidic, 7 neutral, above 7 basic. Lower pH = more acidic.
• Strong acids/bases ionise completely; weak ones ionise partially.
• Important salts: common salt $NaCl$, sodium hydroxide (chlor-alkali process), bleaching powder $CaOCl_2$, baking soda $NaHCO_3$, washing soda $Na_2CO_3\\cdot 10H_2O$, plaster of Paris $CaSO_4\\cdot\\tfrac{1}{2}H_2O$.`,
    mcqs: [
      {
        text: 'A solution turns red litmus blue. Its pH is likely to be:',
        options: opt('1', '4', '7', '10'),
        correct: 'D',
        explanation: 'Red litmus turning blue means the solution is basic, so pH is above 7.',
      },
      {
        text: 'Which of these is used in the manufacture of glass, soap and paper?',
        options: opt('Baking soda', 'Washing soda', 'Bleaching powder', 'Plaster of Paris'),
        correct: 'B',
        explanation: 'Washing soda ($Na_2CO_3$) is used in glass, soap and paper industries.',
      },
    ],
  },
  {
    chapter: 'Metals and Non-metals',
    notes: `Key points
• Metals are generally lustrous, malleable, ductile, sonorous and good conductors of heat and electricity.
• Non-metals are mostly dull, brittle and poor conductors (exception: graphite conducts).
• Reactivity series ranks metals by reactivity: K > Na > Ca > Mg > Al > Zn > Fe > Pb > (H) > Cu > Ag > Au.
• Ionic (electrovalent) compounds form when a metal transfers electrons to a non-metal (e.g. $NaCl$); they have high melting points and conduct when molten/aqueous.
• Extraction depends on reactivity: highly reactive metals by electrolysis; moderately reactive by reduction of their oxides; least reactive found free/native.
• Corrosion of metals (e.g. rusting of iron) is prevented by painting, oiling, galvanisation and alloying.`,
    mcqs: [
      {
        text: 'Which metal is stored under kerosene because it reacts vigorously with air and water?',
        options: opt('Copper', 'Sodium', 'Gold', 'Iron'),
        correct: 'B',
        explanation: 'Sodium is very reactive, so it is kept under kerosene to keep out air and moisture.',
      },
      {
        text: 'Galvanisation protects iron from rusting by coating it with:',
        options: opt('Zinc', 'Copper', 'Tin', 'Aluminium'),
        correct: 'A',
        explanation: 'Galvanisation is coating iron/steel with a layer of zinc.',
      },
    ],
  },
  {
    chapter: 'Carbon and its Compounds',
    notes: `Key points
• Carbon shows catenation (self-linking) and tetravalency, so it forms a huge number of compounds.
• Covalent bonds form by sharing electrons; carbon compounds are usually poor conductors with low melting/boiling points.
• Saturated hydrocarbons (alkanes) have single bonds; unsaturated ones have double (alkenes) or triple (alkynes) bonds.
• Functional groups decide properties: –OH (alcohol), –COOH (carboxylic acid), –CHO (aldehyde), >C=O (ketone).
• Homologous series: members differ by $-CH_2-$; they share the same functional group and show a gradual change in properties.
• Ethanol and ethanoic acid are key compounds; esterification: acid + alcohol $\\rightarrow$ ester + water. Soaps are sodium salts of long-chain fatty acids and clean by forming micelles.`,
    mcqs: [
      {
        text: 'The functional group present in ethanoic acid (acetic acid) is:',
        options: opt('–OH', '–CHO', '–COOH', '>C=O'),
        correct: 'C',
        explanation: 'Ethanoic acid ($CH_3COOH$) contains the carboxylic acid group, –COOH.',
      },
      {
        text: 'Two consecutive members of a homologous series differ by:',
        options: opt('$CH_2$', '$CH_3$', '$C_2H_2$', '$CH_4$'),
        correct: 'A',
        explanation: 'Successive members of a homologous series differ by a $-CH_2-$ unit.',
      },
    ],
  },
  {
    chapter: 'Life Processes',
    notes: `Key points
• Life processes: nutrition, respiration, transportation and excretion keep an organism alive.
• Autotrophic nutrition (photosynthesis) in plants: $6CO_2 + 6H_2O \\xrightarrow{light} C_6H_{12}O_6 + 6O_2$, in chloroplasts using chlorophyll.
• Human digestion: mouth (salivary amylase) → stomach (HCl, pepsin) → small intestine (bile, pancreatic and intestinal juices) where absorption occurs.
• Respiration releases energy (ATP); aerobic in mitochondria gives more energy than anaerobic. In muscles, anaerobic respiration forms lactic acid.
• Human transport: double circulation; the heart has four chambers; arteries carry blood away from the heart, veins towards it.
• Excretion removes wastes: kidneys form urine (nephron is the functional unit); plants lose water/gases via stomata and shed some wastes.`,
    mcqs: [
      {
        text: 'The functional unit of the human kidney is the:',
        options: opt('Neuron', 'Nephron', 'Alveolus', 'Villus'),
        correct: 'B',
        explanation: 'The nephron is the basic filtering unit of the kidney.',
      },
      {
        text: 'During heavy exercise, muscles may respire anaerobically to form:',
        options: opt('Ethanol', 'Carbon dioxide only', 'Lactic acid', 'Glucose'),
        correct: 'C',
        explanation: 'In human muscles, anaerobic respiration produces lactic acid, causing cramps.',
      },
    ],
  },
  {
    chapter: 'Control and Coordination',
    notes: `Key points
• In animals, control and coordination are done by the nervous system and hormones (endocrine system).
• Neuron is the structural/functional unit; a nerve impulse travels dendrite → cell body → axon → synapse.
• Reflex action is a quick, automatic response via the spinal cord (reflex arc), not needing the brain to decide.
• Brain parts: cerebrum (thinking/voluntary actions), cerebellum (balance and posture), medulla (involuntary actions like heartbeat, breathing).
• Hormones are chemical messengers: e.g. adrenaline (emergency), insulin (blood sugar), thyroxine (metabolism, needs iodine), growth hormone.
• Plant movements: tropic (directional, e.g. phototropism, geotropism) and nastic (non-directional); coordinated by hormones like auxin.`,
    mcqs: [
      {
        text: 'Which part of the brain controls balance and posture of the body?',
        options: opt('Cerebrum', 'Cerebellum', 'Medulla', 'Hypothalamus'),
        correct: 'B',
        explanation: 'The cerebellum maintains balance, posture and coordination of movements.',
      },
      {
        text: 'The bending of a plant shoot towards light is called:',
        options: opt('Geotropism', 'Hydrotropism', 'Phototropism', 'Chemotropism'),
        correct: 'C',
        explanation: 'Growth of a shoot towards light is positive phototropism (auxin-driven).',
      },
    ],
  },
  {
    chapter: 'How do Organisms Reproduce?',
    notes: `Key points
• Reproduction makes more of the same kind and passes on DNA; variations help species survive changing environments.
• Asexual methods (one parent, identical offspring): fission (Amoeba), budding (yeast, Hydra), spore formation (Rhizopus), regeneration (Planaria), vegetative propagation and tissue culture in plants.
• Sexual reproduction (two parents) creates variation through the fusion of gametes.
• Flower parts: stamen (anther + filament, male) and carpel/pistil (stigma, style, ovary, female). Pollination → fertilisation → seed and fruit.
• Human male system: testes make sperm and testosterone. Female system: ovaries release eggs; fertilisation in the oviduct; embryo develops in the uterus via the placenta.
• Reproductive health includes contraception and prevention of STDs (e.g. HIV-AIDS).`,
    mcqs: [
      {
        text: 'Budding as a method of asexual reproduction is seen in:',
        options: opt('Amoeba', 'Yeast', 'Planaria', 'Rhizopus'),
        correct: 'B',
        explanation: 'Yeast (and Hydra) reproduce by budding.',
      },
      {
        text: 'In humans, fertilisation normally takes place in the:',
        options: opt('Ovary', 'Uterus', 'Oviduct (fallopian tube)', 'Vagina'),
        correct: 'C',
        explanation: 'The egg and sperm fuse in the oviduct/fallopian tube.',
      },
    ],
  },
  {
    chapter: 'Heredity',
    notes: `Key points
• Heredity is the passing of traits from parents to offspring through genes (segments of DNA on chromosomes).
• Mendel’s experiments on pea plants gave the laws of inheritance; traits can be dominant or recessive.
• A monohybrid cross of $Tt \\times Tt$ gives a phenotypic ratio of 3:1 and genotypic ratio 1:2:1.
• Humans have 23 pairs of chromosomes; one pair is the sex chromosomes.
• Sex determination in humans: females are XX, males are XY. The father’s sperm (X or Y) decides the sex of the child.
• Variations accumulate over generations and are the raw material for evolution by natural selection.`,
    mcqs: [
      {
        text: 'In a cross between two hybrid tall pea plants ($Tt \\times Tt$), the phenotypic ratio of tall to short is:',
        options: opt('1:1', '3:1', '1:2:1', '9:3:3:1'),
        correct: 'B',
        explanation: 'A monohybrid cross gives a 3:1 phenotypic ratio (3 tall : 1 short).',
      },
      {
        text: 'The sex of a human child is determined by:',
        options: opt('The mother’s egg', 'The chromosome from the father', 'Temperature', 'The number of eggs'),
        correct: 'B',
        explanation: 'The mother always gives X; the father’s X or Y sperm decides the sex.',
      },
    ],
  },
  {
    chapter: 'Light – Reflection and Refraction',
    notes: `Key points
• Laws of reflection: angle of incidence = angle of reflection; incident ray, reflected ray and normal lie in one plane.
• Spherical mirrors: concave (converging) and convex (diverging). Mirror formula: $\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f}$, and magnification $m = \\frac{-v}{u} = \\frac{h'}{h}$.
• Focal length $f = R/2$. Sign convention (New Cartesian) is used for all distances.
• Refraction: light bends when it changes medium; refractive index $n = \\frac{c}{v}$ (speed in vacuum ÷ speed in medium).
• Lenses: convex (converging) and concave (diverging). Lens formula: $\\frac{1}{v} - \\frac{1}{u} = \\frac{1}{f}$.
• Power of a lens $P = \\frac{1}{f\\,(\\text{in metres})}$, measured in dioptres (D); convex is +ve, concave is –ve.`,
    mcqs: [
      {
        text: 'The power of a convex lens of focal length 50 cm is:',
        options: opt('+0.5 D', '+2 D', '−2 D', '+50 D'),
        correct: 'B',
        explanation: '$P = 1/f = 1/0.5\\,m = +2\\,D$ (convex lens is positive).',
      },
      {
        text: 'A concave mirror is used as a shaving/makeup mirror because it can form a:',
        options: opt('Real, inverted, diminished image', 'Virtual, erect, magnified image', 'Real, erect image', 'Virtual, inverted image'),
        correct: 'B',
        explanation: 'When the face is within the focus, a concave mirror gives a virtual, erect, enlarged image.',
      },
    ],
  },
  {
    chapter: 'The Human Eye and the Colourful World',
    notes: `Key points
• The eye focuses light on the retina; the ciliary muscles change the lens shape (accommodation).
• Least distance of distinct vision for a normal eye is about 25 cm; the far point is infinity.
• Defects and corrections: myopia (near-sight) — concave lens; hypermetropia (far-sight) — convex lens; presbyopia — bifocal lenses; cataract — surgery.
• Dispersion: a prism splits white light into its colours (VIBGYOR) because different colours bend by different amounts.
• Atmospheric refraction causes the twinkling of stars and the advanced sunrise/delayed sunset.
• Scattering of light (Tyndall effect): the sky is blue and the sun looks reddish at sunrise/sunset because shorter wavelengths scatter more.`,
    mcqs: [
      {
        text: 'A person cannot see distant objects clearly. The defect and its correction are:',
        options: opt('Myopia – convex lens', 'Myopia – concave lens', 'Hypermetropia – concave lens', 'Presbyopia – convex lens'),
        correct: 'B',
        explanation: 'Myopia (short-sightedness) is corrected using a concave (diverging) lens.',
      },
      {
        text: 'The blue colour of the clear sky is due to:',
        options: opt('Reflection', 'Dispersion', 'Scattering of light', 'Total internal reflection'),
        correct: 'C',
        explanation: 'Shorter (blue) wavelengths scatter more than red, so the sky appears blue.',
      },
    ],
  },
  {
    chapter: 'Electricity',
    notes: `Key points
• Electric current $I = \\frac{Q}{t}$ (ampere); it flows from + to − in a circuit (conventional current).
• Ohm’s law: $V = IR$, where $R$ is resistance (ohm, $\\Omega$). Resistance depends on length, area and material: $R = \\rho\\frac{l}{A}$.
• Resistors in series: $R = R_1 + R_2 + \\dots$ (same current). In parallel: $\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\dots$ (same voltage).
• Electrical energy $E = VIt$; electric power $P = VI = I^2R = \\frac{V^2}{R}$ (watt).
• Heating effect of current: $H = I^2Rt$ (Joule’s law) — used in heaters, irons, bulbs and fuses.
• 1 unit of electricity = 1 kilowatt-hour (kWh) = $3.6\\times10^6\\,J$.`,
    mcqs: [
      {
        text: 'The resistance of a wire is 10 Ω and a current of 2 A flows through it. The potential difference across it is:',
        options: opt('5 V', '12 V', '20 V', '0.2 V'),
        correct: 'C',
        explanation: '$V = IR = 2 \\times 10 = 20\\,V$.',
      },
      {
        text: 'Two resistors of 6 Ω each are connected in parallel. Their effective resistance is:',
        options: opt('12 Ω', '6 Ω', '3 Ω', '2 Ω'),
        correct: 'C',
        explanation: 'For two equal resistors in parallel, $R = 6/2 = 3\\,\\Omega$.',
      },
    ],
  },
  {
    chapter: 'Magnetic Effects of Electric Current',
    notes: `Key points
• A current-carrying conductor produces a magnetic field (Oersted). Field lines are concentric circles around a straight wire.
• Right-hand thumb rule gives the direction of the field around a wire; a solenoid acts like a bar magnet.
• A current-carrying conductor in a magnetic field experiences a force; Fleming’s left-hand rule gives its direction — basis of the electric motor.
• Electromagnetic induction: a changing magnetic field induces a current (Faraday). Fleming’s right-hand rule gives its direction — basis of the generator.
• AC (alternating current) reverses direction periodically (50 Hz in India); DC flows in one direction.
• Safety: use fuses, earthing and correct wiring; overloading/short-circuit can cause fire.`,
    mcqs: [
      {
        text: 'The direction of force on a current-carrying conductor in a magnetic field is given by:',
        options: opt('Right-hand thumb rule', 'Fleming’s left-hand rule', 'Fleming’s right-hand rule', 'Ohm’s law'),
        correct: 'B',
        explanation: 'Fleming’s left-hand rule gives the force direction (used in motors).',
      },
      {
        text: 'The device that converts mechanical energy into electrical energy is the:',
        options: opt('Electric motor', 'Electric generator', 'Transformer', 'Ammeter'),
        correct: 'B',
        explanation: 'A generator converts mechanical energy to electrical energy by induction.',
      },
    ],
  },
  {
    chapter: 'Our Environment',
    notes: `Key points
• An ecosystem has biotic (living) and abiotic (non-living) components interacting together.
• Food chains transfer energy: producers → herbivores → carnivores; a food web is many interlinked chains.
• Trophic levels and the 10% law: only about 10% of energy passes to the next level, so chains are usually short.
• Decomposers (bacteria, fungi) break down dead matter and recycle nutrients.
• Biodegradable wastes are broken down by microbes; non-biodegradable ones (plastics, DDT) persist and cause biomagnification.
• Environmental problems: ozone layer depletion (by CFCs) increases harmful UV; proper waste management and reducing pollution protect the environment.`,
    mcqs: [
      {
        text: 'In a food chain, the amount of energy transferred to the next trophic level is about:',
        options: opt('1%', '10%', '50%', '90%'),
        correct: 'B',
        explanation: 'Only about 10% of energy passes to the next trophic level (10% law).',
      },
      {
        text: 'Depletion of the ozone layer is mainly caused by:',
        options: opt('Carbon dioxide', 'Chlorofluorocarbons (CFCs)', 'Methane', 'Sulphur dioxide'),
        correct: 'B',
        explanation: 'CFCs release chlorine that destroys ozone molecules in the stratosphere.',
      },
    ],
  },
]

async function main() {
  console.warn('📚 Seeding original Science study notes + practice (CBSE Grade 10)…')

  const subject = await prisma.curriculumSubject.findFirst({
    where: { code: 'SCIENCE', grade: { name: 'Grade 10' } },
    include: { chapters: true },
  })
  if (!subject) {
    console.error('✗ Science subject not found. Run `pnpm db:seed:curriculum` first.')
    return
  }

  // Idempotent cleanup of previously-seeded study content.
  const oldNotes = await prisma.contentAsset.findMany({
    where: { sourceName: NOTES_SOURCE },
    select: { id: true },
  })
  if (oldNotes.length) {
    await prisma.curriculumContentMapping.deleteMany({
      where: { assetId: { in: oldNotes.map((a) => a.id) } },
    })
    await prisma.contentAsset.deleteMany({ where: { sourceName: NOTES_SOURCE } })
  }
  await prisma.assessmentQuestion.deleteMany({ where: { createdById: QUESTION_MARK } })

  const byTitle = new Map(subject.chapters.map((c) => [c.title, c.id]))
  let notesCount = 0
  let qCount = 0

  for (const item of SCIENCE) {
    const chapterId = byTitle.get(item.chapter)
    if (!chapterId) {
      console.warn(`  – skipped (chapter not found): ${item.chapter}`)
      continue
    }

    // Revision notes → content asset mapped to the chapter (STUDY section).
    const note = await prisma.contentAsset.create({
      data: {
        title: `${item.chapter} — Revision Notes`,
        contentType: 'REVISION_NOTES',
        sourceType: 'ORIGINAL',
        licenseType: 'OWNED',
        sourceName: NOTES_SOURCE,
        copyrightOwner: 'LearnHub',
        selfHostingAllowed: true,
        commercialUseAllowed: true,
        redistributionAllowed: true,
        licenseVerified: true,
        generationType: 'HUMAN',
        status: 'PUBLISHED',
        body: { text: item.notes },
      },
    })
    await prisma.curriculumContentMapping.create({
      data: {
        assetId: note.id,
        nodeType: 'CHAPTER',
        nodeId: chapterId,
        section: 'STUDY',
        role: 'REVISION_NOTES',
      },
    })
    notesCount++

    // Practice MCQs → question bank + curriculum mapping (chapter-level).
    for (const m of item.mcqs) {
      await prisma.assessmentQuestion.create({
        data: {
          type: 'MCQ',
          difficulty: 'MEDIUM',
          text: m.text,
          options: m.options,
          correctAnswer: m.correct,
          explanation: m.explanation,
          marks: 1,
          createdById: QUESTION_MARK,
          curriculumLinks: { create: { nodeType: 'CHAPTER', nodeId: chapterId } },
        },
      })
      qCount++
    }
  }

  console.warn(`✅ Seeded ${notesCount} chapters of Science notes + ${qCount} practice questions.`)
  console.warn('   Students see these on My Syllabus → Science → any chapter (Study + Practice).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
