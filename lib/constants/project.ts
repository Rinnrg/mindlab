export type SintaksKey =
  | "sintaks_1"
  | "sintaks_2"
  | "sintaks_3"
  | "sintaks_4"
  | "sintaks_5"

export interface SintaksInfo {
  key: SintaksKey
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  order: number
  icon: string
}

export const SINTAKS_MAP: Record<SintaksKey, SintaksInfo> = {
  sintaks_1: {
    key: "sintaks_1",
    title: "Orientasi PBL",
    titleEn: "Problem Orientation",
    description: "Mengorientasikan siswa pada masalah nyata yang akan menjadi dasar proyek",
    descriptionEn: "Orienting students to real-world problems as the basis of the project",
    order: 1,
    icon: "🔍",
  },
  sintaks_2: {
    key: "sintaks_2",
    title: "Mengorganisasi",
    titleEn: "Organizing",
    description: "Mengorganisasi siswa untuk belajar dan membagi tugas dalam kelompok",
    descriptionEn: "Organizing students for learning and dividing tasks in groups",
    order: 2,
    icon: "📋",
  },
  sintaks_3: {
    key: "sintaks_3",
    title: "Membimbing Penyelidikan",
    titleEn: "Guiding Investigation",
    description: "Membimbing penyelidikan individu maupun kelompok untuk mengumpulkan data dan informasi",
    descriptionEn: "Guiding individual and group investigation to collect data and information",
    order: 3,
    icon: "🔬",
  },
  sintaks_4: {
    key: "sintaks_4",
    title: "Mengembangkan dan Menyajikan Hasil Karya",
    titleEn: "Developing and Presenting Results",
    description: "Mengembangkan dan menyajikan hasil karya berupa laporan, model, atau produk",
    descriptionEn: "Developing and presenting results in the form of reports, models, or products",
    order: 4,
    icon: "🎨",
  },
  sintaks_5: {
    key: "sintaks_5",
    title: "Menganalisis dan Mengevaluasi Proses Pemecahan PBL",
    titleEn: "Analyzing and Evaluating Problem Solving Process",
    description: "Menganalisis dan mengevaluasi proses pemecahan masalah yang telah dilakukan",
    descriptionEn: "Analyzing and evaluating the problem-solving process that has been carried out",
    order: 5,
    icon: "📊",
  },
}

export const SINTAKS_KEYS = Object.keys(SINTAKS_MAP) as SintaksKey[]

function normalizeSintaksKey(key: string): SintaksKey | null {
  // If already in correct format
  if (key in SINTAKS_MAP) {
    return key as SintaksKey
  }

  // Try adding underscore: "sintaks1" -> "sintaks_1"
  const withUnderscore = key.replace(/^(sintaks)(\d+)$/i, "$1_$2")
  if (withUnderscore in SINTAKS_MAP) {
    return withUnderscore as SintaksKey
  }

  return null
}

export function getSintaksInfo(key: string): SintaksInfo | null {
  const normalizedKey = normalizeSintaksKey(key)
  if (!normalizedKey) return null
  return SINTAKS_MAP[normalizedKey] || null
}

export function getNextSintaks(currentKey: SintaksKey): SintaksKey | null {
  const currentOrder = SINTAKS_MAP[currentKey]?.order || 0
  const nextEntry = Object.entries(SINTAKS_MAP).find(([_, info]) => info.order === currentOrder + 1)
  return nextEntry ? (nextEntry[0] as SintaksKey) : null
}

export function getPreviousSintaks(currentKey: SintaksKey): SintaksKey | null {
  const currentOrder = SINTAKS_MAP[currentKey]?.order || 0
  const prevEntry = Object.entries(SINTAKS_MAP).find(([_, info]) => info.order === currentOrder - 1)
  return prevEntry ? (prevEntry[0] as SintaksKey) : null
}
