interface QuizAnswers {
  budget: 'murah' | 'sedang' | 'mahal';
  guests: number;
  need_ac: boolean;
  need_wifi: boolean;
  beach_priority: 'dekat' | 'sedang' | 'jauh';
  need_breakfast: boolean;
  need_motor_rental: boolean;
}

interface HomestayData {
  id: number;
  title: string;
  base_price: number;
  max_guests: number;
  has_ac: boolean;
  has_wifi: boolean;
  has_breakfast: boolean;
  has_motor_rental: boolean;
  distance_to_beach: number;
  primary_image: string | null;
}

interface RecommendationResult {
  id: number;
  title: string;
  total_score: number;
  category: string;
  base_price: number;
  max_guests: number;
  has_ac: boolean;
  has_wifi: boolean;
  has_breakfast: boolean;
  has_motor_rental: boolean;
  distance_to_beach: number;
  primary_image: string | null;
}

// Salience = bobot kepentingan atribut (dari Tabel 3 proposal)
const SALIENCE = {
  harga: 3,
  lokasi: 3,
  ac: 2,
  wifi: 2,
  sarapan: 1,
  motor: 1,
  kapasitas: 3,
};

export function calculateScore(
  homestay: HomestayData,
  answers: QuizAnswers
): number {
  let totalScore = 0;
  let maxPossibleScore = 0;

  // 1. HARGA — selalu dihitung
  let valenceHarga = 0;
  if (answers.budget === 'murah') {
    valenceHarga = homestay.base_price < 300000 ? 3
      : homestay.base_price <= 600000 ? -1
      : -2;
  } else if (answers.budget === 'sedang') {
    valenceHarga = (homestay.base_price >= 300000 && homestay.base_price <= 600000) ? 3
      : homestay.base_price < 300000 ? 1
      : -1;
  } else {
    // mahal
    valenceHarga = homestay.base_price > 600000 ? 3 : 1;
  }
  totalScore += SALIENCE.harga * valenceHarga;
  maxPossibleScore += SALIENCE.harga * 3;

  // 2. LOKASI — selalu dihitung
  let valenceLokasi = 0;
  if (answers.beach_priority === 'dekat') {
    valenceLokasi = homestay.distance_to_beach < 200 ? 3
      : homestay.distance_to_beach <= 400 ? -1
      : -3;
  } else if (answers.beach_priority === 'sedang') {
    valenceLokasi = (homestay.distance_to_beach >= 200 && homestay.distance_to_beach <= 400) ? 3
      : homestay.distance_to_beach < 200 ? 2
      : 1;
  } else {
    // jauh — tidak peduli jarak
    valenceLokasi = 3;
  }
  totalScore += SALIENCE.lokasi * valenceLokasi;
  maxPossibleScore += SALIENCE.lokasi * 3;

  // 3. AC — hanya dihitung kalau user butuh
  if (answers.need_ac) {
    const valenceAC = homestay.has_ac ? 3 : -3;
    totalScore += SALIENCE.ac * valenceAC;
    maxPossibleScore += SALIENCE.ac * 3;
  }

  // 4. WIFI — hanya dihitung kalau user butuh
  if (answers.need_wifi) {
    const valenceWifi = homestay.has_wifi ? 3 : -3;
    totalScore += SALIENCE.wifi * valenceWifi;
    maxPossibleScore += SALIENCE.wifi * 3;
  }

  // 5. SARAPAN — hanya dihitung kalau user butuh
  if (answers.need_breakfast) {
    const valenceSarapan = homestay.has_breakfast ? 3 : -3;
    totalScore += SALIENCE.sarapan * valenceSarapan;
    maxPossibleScore += SALIENCE.sarapan * 3;
  }

  // 6. SEWA MOTOR — hanya dihitung kalau user butuh
  if (answers.need_motor_rental) {
    const valenceMotor = homestay.has_motor_rental ? 3 : -3;
    totalScore += SALIENCE.motor * valenceMotor;
    maxPossibleScore += SALIENCE.motor * 3;
  }

  // 7. KAPASITAS — selalu dihitung
  const valenceKapasitas = homestay.max_guests >= answers.guests ? 3 : -3;
  totalScore += SALIENCE.kapasitas * valenceKapasitas;
  maxPossibleScore += SALIENCE.kapasitas * 3;

  // Normalisasi ke range 0-1 lalu kalikan 2 agar range jadi 0-2
  // supaya kategori "Sangat Direkomendasikan" (>=1.50) bisa tercapai
  if (maxPossibleScore === 0) return 0;
  const normalizedScore = (totalScore / maxPossibleScore) * 2;

  // Clamp ke minimum 0
  return Math.round(Math.max(0, normalizedScore) * 100) / 100;
}

export function getCategory(score: number): string {
  if (score >= 1.50) return 'Sangat Direkomendasikan';
  if (score >= 0.80) return 'Direkomendasikan';
  if (score >= 0.30) return 'Cukup Direkomendasikan';
  return 'Tidak Direkomendasikan';
}

export function rankHomestays(
  homestays: HomestayData[],
  answers: QuizAnswers
): RecommendationResult[] {
  const results = homestays.map((homestay) => {
    const score = calculateScore(homestay, answers);
    return {
      ...homestay,
      total_score: score,
      category: getCategory(score),
    };
  });
  return results.sort((a, b) => b.total_score - a.total_score);
}