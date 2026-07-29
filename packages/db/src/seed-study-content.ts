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

const MATHS: ChapterContent[] = [
  {
    chapter: 'Real Numbers',
    notes: `Key points
• Fundamental Theorem of Arithmetic: every composite number can be written as a product of primes, and this factorisation is unique (except for order).
• Use prime factorisation to find HCF (product of smallest powers of common primes) and LCM (product of greatest powers of all primes).
• For two positive integers: $\\text{HCF}(a,b) \\times \\text{LCM}(a,b) = a \\times b$.
• Numbers like $\\sqrt{2},\\ \\sqrt{3},\\ \\sqrt{5}$ are irrational (proved by contradiction).
• A rational number $\\frac{p}{q}$ (in lowest terms) has a terminating decimal only when $q$ is of the form $2^m 5^n$; otherwise it is non-terminating recurring.`,
    mcqs: [
      {
        text: 'The HCF of 96 and 404 is (given $96 = 2^5\\times3$, $404 = 2^2\\times101$):',
        options: opt('2', '4', '8', '12'),
        correct: 'B',
        explanation: 'Common prime factor is $2^2 = 4$, so HCF = 4.',
      },
      {
        text: 'If HCF of two numbers is 9 and their LCM is 360, and one number is 45, the other is:',
        options: opt('72', '80', '360', '405'),
        correct: 'A',
        explanation: 'Other $= \\frac{HCF\\times LCM}{45} = \\frac{9\\times360}{45} = 72$.',
      },
    ],
  },
  {
    chapter: 'Polynomials',
    notes: `Key points
• Degree decides the type: linear (1), quadratic (2), cubic (3).
• A zero (root) of a polynomial $p(x)$ is a value where $p(x)=0$; geometrically these are the points where the graph meets the x-axis.
• A quadratic has at most 2 zeroes, a cubic at most 3.
• For a quadratic $ax^2+bx+c$ with zeroes $\\alpha,\\beta$: sum $\\alpha+\\beta = -\\frac{b}{a}$ and product $\\alpha\\beta = \\frac{c}{a}$.
• A quadratic with given zeroes: $x^2 - (\\text{sum})x + (\\text{product})$.`,
    mcqs: [
      {
        text: 'The sum of the zeroes of the polynomial $x^2 - 5x + 6$ is:',
        options: opt('−5', '5', '6', '1'),
        correct: 'B',
        explanation: 'Sum of zeroes $= -\\frac{b}{a} = -\\frac{-5}{1} = 5$.',
      },
      {
        text: 'If the graph of a polynomial cuts the x-axis at 3 points, the number of zeroes is:',
        options: opt('1', '2', '3', '0'),
        correct: 'C',
        explanation: 'The number of zeroes equals the number of points where the graph meets the x-axis.',
      },
    ],
  },
  {
    chapter: 'Pair of Linear Equations in Two Variables',
    notes: `Key points
• A pair of linear equations: $a_1x+b_1y+c_1=0$ and $a_2x+b_2y+c_2=0$.
• Nature of solutions (compare ratios):
   – Unique solution (intersecting lines): $\\frac{a_1}{a_2} \\ne \\frac{b_1}{b_2}$.
   – Infinitely many solutions (coincident lines): $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} = \\frac{c_1}{c_2}$.
   – No solution (parallel lines): $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} \\ne \\frac{c_1}{c_2}$.
• Algebraic methods: substitution, elimination, and cross-multiplication.`,
    mcqs: [
      {
        text: 'The pair $2x+3y=5$ and $4x+6y=15$ has:',
        options: opt('A unique solution', 'Infinitely many solutions', 'No solution', 'Exactly two solutions'),
        correct: 'C',
        explanation: '$\\frac{2}{4}=\\frac{3}{6}\\ne\\frac{5}{15}$, so the lines are parallel — no solution.',
      },
      {
        text: 'For a consistent pair with a unique solution, the lines are:',
        options: opt('Parallel', 'Coincident', 'Intersecting', 'Perpendicular only'),
        correct: 'C',
        explanation: 'A unique solution means the lines intersect at exactly one point.',
      },
    ],
  },
  {
    chapter: 'Quadratic Equations',
    notes: `Key points
• Standard form: $ax^2+bx+c=0$, where $a\\ne0$.
• Solve by factorisation, completing the square, or the quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$.
• Discriminant $D = b^2 - 4ac$ decides the nature of roots:
   – $D>0$: two distinct real roots.
   – $D=0$: two equal (real) roots.
   – $D<0$: no real roots.`,
    mcqs: [
      {
        text: 'The nature of the roots of $x^2 + 4x + 4 = 0$ is:',
        options: opt('Two distinct real roots', 'Two equal real roots', 'No real roots', 'Cannot be determined'),
        correct: 'B',
        explanation: '$D = 4^2 - 4(1)(4) = 0$, so the roots are real and equal.',
      },
      {
        text: 'For $2x^2 - 3x + 5 = 0$, the discriminant is $D = -31$. The roots are:',
        options: opt('Real and distinct', 'Real and equal', 'Not real', 'Both zero'),
        correct: 'C',
        explanation: 'Since $D<0$, the equation has no real roots.',
      },
    ],
  },
  {
    chapter: 'Arithmetic Progressions',
    notes: `Key points
• An AP has a constant common difference $d$ between consecutive terms.
• nth term: $a_n = a + (n-1)d$, where $a$ is the first term.
• Sum of first $n$ terms: $S_n = \\frac{n}{2}\\,[2a + (n-1)d]$, or $S_n = \\frac{n}{2}(a + l)$ where $l$ is the last term.
• These formulas solve most problems on term-finding and sums.`,
    mcqs: [
      {
        text: 'The 10th term of the AP $2, 5, 8, \\dots$ is:',
        options: opt('27', '29', '30', '32'),
        correct: 'B',
        explanation: '$a=2,\\ d=3$; $a_{10} = 2 + 9\\times3 = 29$.',
      },
      {
        text: 'The sum of the first 20 terms of the AP $1, 2, 3, \\dots$ is:',
        options: opt('190', '200', '210', '400'),
        correct: 'C',
        explanation: '$S_{20} = \\frac{20}{2}(1+20) = 10\\times21 = 210$.',
      },
    ],
  },
  {
    chapter: 'Triangles',
    notes: `Key points
• Two triangles are similar if their corresponding angles are equal and corresponding sides are in the same ratio.
• Basic Proportionality Theorem (Thales): a line drawn parallel to one side of a triangle divides the other two sides in the same ratio.
• Similarity criteria: AA (or AAA), SSS, and SAS.
• The ratio of areas of two similar triangles equals the square of the ratio of their corresponding sides.`,
    mcqs: [
      {
        text: 'Two similar triangles have corresponding sides in the ratio 2:3. The ratio of their areas is:',
        options: opt('2:3', '4:9', '3:2', '8:27'),
        correct: 'B',
        explanation: 'Ratio of areas = square of ratio of sides $= 2^2 : 3^2 = 4:9$.',
      },
      {
        text: 'A line parallel to one side of a triangle divides the other two sides:',
        options: opt('Equally', 'In the same ratio', 'Perpendicularly', 'At their midpoints only'),
        correct: 'B',
        explanation: 'This is the Basic Proportionality (Thales) Theorem.',
      },
    ],
  },
  {
    chapter: 'Coordinate Geometry',
    notes: `Key points
• Distance between $(x_1,y_1)$ and $(x_2,y_2)$: $\\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$.
• Section formula — point dividing the join in ratio $m:n$: $\\left(\\frac{mx_2+nx_1}{m+n},\\ \\frac{my_2+ny_1}{m+n}\\right)$.
• Midpoint: $\\left(\\frac{x_1+x_2}{2},\\ \\frac{y_1+y_2}{2}\\right)$.`,
    mcqs: [
      {
        text: 'The distance between the points $(0,0)$ and $(3,4)$ is:',
        options: opt('5', '7', '1', '12'),
        correct: 'A',
        explanation: '$\\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$.',
      },
      {
        text: 'The midpoint of the segment joining $(2,3)$ and $(4,7)$ is:',
        options: opt('(3,5)', '(6,10)', '(2,4)', '(1,2)'),
        correct: 'A',
        explanation: 'Midpoint $= \\left(\\frac{2+4}{2}, \\frac{3+7}{2}\\right) = (3,5)$.',
      },
    ],
  },
  {
    chapter: 'Introduction to Trigonometry',
    notes: `Key points
• In a right triangle: $\\sin\\theta = \\frac{\\text{opp}}{\\text{hyp}}$, $\\cos\\theta = \\frac{\\text{adj}}{\\text{hyp}}$, $\\tan\\theta = \\frac{\\text{opp}}{\\text{adj}}$; and their reciprocals $\\csc,\\sec,\\cot$.
• Identities: $\\sin^2\\theta + \\cos^2\\theta = 1$; $1 + \\tan^2\\theta = \\sec^2\\theta$; $1 + \\cot^2\\theta = \\csc^2\\theta$.
• Standard values at $0^\\circ,30^\\circ,45^\\circ,60^\\circ,90^\\circ$ (e.g. $\\sin30^\\circ = \\tfrac12$, $\\cos60^\\circ = \\tfrac12$, $\\tan45^\\circ = 1$).`,
    mcqs: [
      {
        text: 'The value of $\\sin 30^\\circ + \\cos 60^\\circ$ is:',
        options: opt('0', '1', '$\\tfrac12$', '2'),
        correct: 'B',
        explanation: '$\\tfrac12 + \\tfrac12 = 1$.',
      },
      {
        text: 'The value of $\\sin^2 45^\\circ + \\cos^2 45^\\circ$ is:',
        options: opt('0', '$\\tfrac12$', '1', '2'),
        correct: 'C',
        explanation: 'By the identity $\\sin^2\\theta + \\cos^2\\theta = 1$.',
      },
    ],
  },
  {
    chapter: 'Some Applications of Trigonometry',
    notes: `Key points
• Trigonometry is used to find heights and distances that cannot be measured directly.
• Angle of elevation: the angle above the horizontal when you look up at an object.
• Angle of depression: the angle below the horizontal when you look down.
• Model the situation as a right triangle and use $\\sin,\\cos,\\tan$ of the known angle.`,
    mcqs: [
      {
        text: 'A tower casts a shadow such that the angle of elevation of the sun is $45^\\circ$. The height of the tower compared to the shadow length is:',
        options: opt('Half', 'Equal', 'Double', '$\\sqrt{3}$ times'),
        correct: 'B',
        explanation: '$\\tan45^\\circ = 1 = \\frac{\\text{height}}{\\text{shadow}}$, so they are equal.',
      },
      {
        text: 'The angle formed below the horizontal while looking down at an object is called the angle of:',
        options: opt('Elevation', 'Depression', 'Incidence', 'Reflection'),
        correct: 'B',
        explanation: 'Looking downward gives the angle of depression.',
      },
    ],
  },
  {
    chapter: 'Circles',
    notes: `Key points
• A tangent to a circle touches it at exactly one point.
• The tangent at any point of a circle is perpendicular to the radius through the point of contact.
• The lengths of the two tangents drawn from an external point to a circle are equal.
• From a point inside the circle no tangent can be drawn; from a point on the circle exactly one; from an external point exactly two.`,
    mcqs: [
      {
        text: 'The number of tangents that can be drawn to a circle from an external point is:',
        options: opt('0', '1', '2', 'Infinite'),
        correct: 'C',
        explanation: 'Exactly two tangents can be drawn from an external point.',
      },
      {
        text: 'The angle between a tangent to a circle and the radius at the point of contact is:',
        options: opt('$45^\\circ$', '$60^\\circ$', '$90^\\circ$', '$180^\\circ$'),
        correct: 'C',
        explanation: 'The tangent is perpendicular to the radius at the point of contact.',
      },
    ],
  },
  {
    chapter: 'Areas Related to Circles',
    notes: `Key points
• Circumference of a circle $= 2\\pi r$; area $= \\pi r^2$.
• Length of an arc of angle $\\theta$: $\\frac{\\theta}{360^\\circ}\\times 2\\pi r$.
• Area of a sector of angle $\\theta$: $\\frac{\\theta}{360^\\circ}\\times \\pi r^2$.
• Area of a segment = area of sector − area of the corresponding triangle.
• Use $\\pi = \\frac{22}{7}$ or $3.14$ as directed.`,
    mcqs: [
      {
        text: 'The area of a circle of radius 7 cm (take $\\pi=\\tfrac{22}{7}$) is:',
        options: opt('44 cm²', '77 cm²', '154 cm²', '308 cm²'),
        correct: 'C',
        explanation: '$\\pi r^2 = \\frac{22}{7}\\times7\\times7 = 154\\ \\text{cm}^2$.',
      },
      {
        text: 'The area of a sector of angle $90^\\circ$ of a circle is what fraction of the whole circle?',
        options: opt('$\\tfrac12$', '$\\tfrac14$', '$\\tfrac13$', '$\\tfrac18$'),
        correct: 'B',
        explanation: '$\\frac{90}{360} = \\frac14$ of the circle.',
      },
    ],
  },
  {
    chapter: 'Surface Areas and Volumes',
    notes: `Key points
• Cuboid: volume $= lbh$; cube: volume $= a^3$.
• Cylinder: volume $= \\pi r^2 h$; curved surface area $= 2\\pi r h$.
• Cone: volume $= \\frac13\\pi r^2 h$; curved surface area $= \\pi r l$ (slant height $l=\\sqrt{r^2+h^2}$).
• Sphere: volume $= \\frac43\\pi r^3$; surface area $= 4\\pi r^2$. Hemisphere volume $= \\frac23\\pi r^3$.
• For combined solids, add the relevant surface areas / volumes; when one shape is recast into another, volume stays the same.`,
    mcqs: [
      {
        text: 'The volume of a sphere of radius $r$ is:',
        options: opt('$\\tfrac43\\pi r^3$', '$4\\pi r^2$', '$\\tfrac13\\pi r^2 h$', '$\\pi r^2 h$'),
        correct: 'A',
        explanation: 'Volume of a sphere $= \\frac43\\pi r^3$.',
      },
      {
        text: 'A cone and a cylinder have the same radius and height. The ratio of their volumes is:',
        options: opt('1:1', '1:2', '1:3', '3:1'),
        correct: 'C',
        explanation: 'Cone volume $=\\frac13\\pi r^2h$, cylinder $=\\pi r^2h$, so ratio $1:3$.',
      },
    ],
  },
  {
    chapter: 'Statistics',
    notes: `Key points
• Mean of grouped data by the direct method: $\\bar{x} = \\frac{\\sum f_i x_i}{\\sum f_i}$ (also assumed-mean and step-deviation methods).
• Median of grouped data: $l + \\frac{\\frac{n}{2} - cf}{f}\\times h$.
• Mode of grouped data: $l + \\frac{f_1 - f_0}{2f_1 - f_0 - f_2}\\times h$.
• Empirical relationship: $\\text{Mode} = 3\\,\\text{Median} - 2\\,\\text{Mean}$.`,
    mcqs: [
      {
        text: 'If the mean is 30 and the median is 32, the mode (by the empirical relation) is:',
        options: opt('34', '36', '30', '28'),
        correct: 'B',
        explanation: 'Mode $= 3(32) - 2(30) = 96 - 60 = 36$.',
      },
      {
        text: 'The mean of the first five natural numbers $1,2,3,4,5$ is:',
        options: opt('2', '3', '4', '5'),
        correct: 'B',
        explanation: 'Mean $= \\frac{1+2+3+4+5}{5} = \\frac{15}{5} = 3$.',
      },
    ],
  },
  {
    chapter: 'Probability',
    notes: `Key points
• Theoretical probability: $P(E) = \\frac{\\text{number of favourable outcomes}}{\\text{total number of outcomes}}$.
• Probability always lies between 0 and 1: $0 \\le P(E) \\le 1$. A sure event has probability 1, an impossible event 0.
• The complement rule: $P(\\text{not } E) = 1 - P(E)$.
• Sum of probabilities of all elementary outcomes of an experiment is 1.`,
    mcqs: [
      {
        text: 'A die is thrown once. The probability of getting an even number is:',
        options: opt('$\\tfrac16$', '$\\tfrac13$', '$\\tfrac12$', '$\\tfrac23$'),
        correct: 'C',
        explanation: 'Even numbers $\\{2,4,6\\}$ give $\\frac{3}{6} = \\frac12$.',
      },
      {
        text: 'If $P(E) = 0.35$, then $P(\\text{not } E)$ is:',
        options: opt('0.35', '0.65', '1.35', '0'),
        correct: 'B',
        explanation: '$P(\\text{not }E) = 1 - 0.35 = 0.65$.',
      },
    ],
  },
]

const SUBJECTS: { code: string; label: string; data: ChapterContent[] }[] = [
  { code: 'SCIENCE', label: 'Science', data: SCIENCE },
  { code: 'MATHEMATICS', label: 'Mathematics', data: MATHS },
]

async function seedSubject(code: string, label: string, data: ChapterContent[]) {
  const subject = await prisma.curriculumSubject.findFirst({
    where: { code, grade: { name: 'Grade 10' } },
    include: { chapters: true },
  })
  if (!subject) {
    console.warn(`  – ${label}: subject not found (run db:seed:curriculum first) — skipped`)
    return { notes: 0, q: 0 }
  }
  const byTitle = new Map(subject.chapters.map((c) => [c.title, c.id]))
  let notesCount = 0
  let qCount = 0

  for (const item of data) {
    const chapterId = byTitle.get(item.chapter)
    if (!chapterId) {
      console.warn(`  – ${label}: chapter not found — ${item.chapter}`)
      continue
    }
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
      data: { assetId: note.id, nodeType: 'CHAPTER', nodeId: chapterId, section: 'STUDY', role: 'REVISION_NOTES' },
    })
    notesCount++

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
  console.warn(`  ✓ ${label}: ${notesCount} chapters of notes + ${qCount} practice questions`)
  return { notes: notesCount, q: qCount }
}

async function main() {
  console.warn('📚 Seeding original study notes + practice (CBSE Grade 10)…')

  // Idempotent cleanup of previously-seeded study content (all subjects).
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

  let totalN = 0
  let totalQ = 0
  for (const s of SUBJECTS) {
    const r = await seedSubject(s.code, s.label, s.data)
    totalN += r.notes
    totalQ += r.q
  }
  console.warn(`✅ Done: ${totalN} chapters of notes + ${totalQ} practice questions across ${SUBJECTS.length} subjects.`)
  console.warn('   Students see these on My Syllabus → subject → any chapter (Study + Practice).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
