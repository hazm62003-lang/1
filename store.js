const KEY = 'social_media_v1'

export const uid = () => Math.random().toString(36).slice(2, 10)

export const dt = (t) =>
  new Date(t).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

export const ago = (t) => {
  const m = (Date.now() - t) / 6e4
  if (m < 1) return 'الآن'
  if (m < 60) return 'منذ ' + Math.floor(m) + ' دقيقة'
  if (m < 1440) return 'منذ ' + Math.floor(m / 60) + ' ساعة'
  return dt(t)
}

function seed() {
  const n = Date.now(), H = 36e5
  return {
    users: [
      { id: 'u1', name: 'ليلى منصور', email: 'laila@social.app', pass: uid() + uid(), bio: 'أكتب عن المدن والعمارة.' },
      { id: 'u2', name: 'كريم الجندي', email: 'karim@social.app', pass: uid() + uid(), bio: 'مهندس برمجيات يحب القراءة.' },
    ],
    posts: [
      { id: 'p1', uid: 'u1', title: 'لماذا نحب المباني القديمة؟', at: n - 30 * H,
        body: 'في كل مدينة قديمة شارع يعرفه أهلها بصوته قبل أن يعرفوه باسمه. الحجر الذي لمسته أيدٍ كثيرة يحمل دفئًا لا تصنعه الخرسانة الجديدة.\n\nحين نرمّم مبنى قديمًا فنحن لا نحفظ جدرانًا فقط، بل نحفظ طريقة الناس في العيش والجلوس والانتظار.' },
      { id: 'p2', uid: 'u2', title: 'ثلاث عادات غيّرت طريقتي في القراءة', at: n - 8 * H,
        body: 'أولًا: كتاب واحد على الطاولة وآخر في الحقيبة. ثانيًا: عشر صفحات قبل النوم بدل التصفح. ثالثًا: أكتب سطرًا واحدًا عن كل فصل أنهيه.\n\nلم أقرأ أكثر، لكنني صرت أتذكر أكثر.' },
      { id: 'p3', uid: 'u1', title: 'ملاحظات من رحلة قصيرة إلى الإسكندرية', at: n - 3 * H,
        body: 'البحر في الشتاء أصدق منه في الصيف. المقاهي شبه فارغة، والكورنيش يعود لأهله.' },
    ],
    comments: [
      { id: 'c1', pid: 'p1', uid: 'u2', body: 'مقال جميل. أتفق أن للمكان ذاكرة.', at: n - 20 * H },
      { id: 'c2', pid: 'p2', uid: 'u1', body: 'فكرة تلخيص كل فصل في سطر عملية جدًا، سأجربها.', at: n - 5 * H },
    ],
    session: null,
  }
}

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (d) return d
  } catch {}
  return seed()
}

export function persist(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch {}
}
