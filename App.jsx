import { useState, useEffect } from 'react'
import { load, persist, uid, dt, ago } from './store'

const ini = (n) => (n || '؟').trim()[0]  


function Avatar({ name, lg }) {
  return <span className={'av' + (lg ? ' lg' : '')}>{ini(name)}</span>
}

function Confirm({ label = 'حذف', onConfirm, className = 'lnk d' }) {
  const [ask, setAsk] = useState(false)
  return ask ? (
    <button className={className} style={{ color: 'var(--err)', fontWeight: 600 }} onClick={onConfirm}>
      تأكيد الحذف
    </button>
  ) : (
    <button className={className} onClick={() => setAsk(true)}>{label}</button>
  )
}

const formData = (e) => {
  e.preventDefault()
  return Object.fromEntries(new FormData(e.target))
}


function Auth({ db, update, say }) {
  const [mode, setMode] = useState('login')
  const [err, setErr] = useState('')
  const login = mode === 'login'

  const submit = (e) => {
    const d = formData(e)
    const em = d.email.trim().toLowerCase()
    if (login) {
      const x = db.users.find((u) => u.email === em && u.pass === d.pass)
      if (!x) return setErr('البريد الإلكتروني أو كلمة المرور غير صحيحة.')
      return update((s) => { s.session = x.id })
    }
    if (d.name.trim().length < 2) return setErr('اكتب اسمك الكامل.')
    if (!/^\S+@\S+\.\S+$/.test(em)) return setErr('اكتب بريدًا إلكترونيًا صحيحًا.')
    if (db.users.some((u) => u.email === em)) return setErr('هذا البريد مسجّل بالفعل. سجّل الدخول بدلًا من ذلك.')
    if (d.pass.length < 8) return setErr('كلمة المرور يجب ألا تقل عن 8 أحرف.')
    if (d.pass !== d.pass2) return setErr('كلمتا المرور غير متطابقتين.')
    const x = { id: uid(), name: d.name.trim(), email: em, pass: d.pass, bio: '' }
    update((s) => { s.users.push(x); s.session = x.id })
    say('تم إنشاء حسابك')
  }

  return (
    <div className="auth">
      <section className="brand">
        <h1>Social<br />Media</h1>
        <small>اكتب، اقرأ، وعلّق.</small>
      </section>
      <section className="formside">
        <form className="card" onSubmit={submit} noValidate key={mode}>
          <h2>{login ? 'تسجيل الدخول' : 'إنشاء حساب'}</h2>
          <p className="sub">{login ? 'أهلًا بعودتك.' : 'انضم وابدأ بالكتابة في دقيقة.'}</p>
          {!login && (<><label htmlFor="n">الاسم</label><input id="n" name="name" autoComplete="name" /></>)}
          <label htmlFor="e">البريد الإلكتروني</label>
          <input id="e" name="email" type="email" dir="ltr" autoComplete="email" />
          <label htmlFor="p">كلمة المرور</label>
          <input id="p" name="pass" type="password" dir="ltr" autoComplete={login ? 'current-password' : 'new-password'} />
          {!login && (<><label htmlFor="p2">تأكيد كلمة المرور</label><input id="p2" name="pass2" type="password" dir="ltr" autoComplete="new-password" /></>)}
          <div className="err" role="alert">{err}</div>
          <button className="btn" style={{ width: '100%', marginTop: '.6rem' }}>{login ? 'دخول' : 'إنشاء الحساب'}</button>
          <p className="swap">
            {login ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
            <button type="button" className="lnk" onClick={() => { setErr(''); setMode(login ? 'signup' : 'login') }}>
              {login ? 'أنشئ حسابًا' : 'سجّل الدخول'}
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}


function PostCard({ p, ctx }) {
  const { db, user, go, update, say } = ctx
  const a = db.users.find((u) => u.id === p.uid) || { name: 'مستخدم محذوف' }
  const n = db.comments.filter((c) => c.pid === p.id).length
  const mine = p.uid === user.id
  return (
    <div className="post">
      <div className="by"><Avatar name={a.name} /><span><b>{a.name}</b> — {ago(p.at)}</span></div>
      <h3><a role="link" tabIndex={0} onClick={() => go('post', p.id)} onKeyDown={(e) => e.key === 'Enter' && go('post', p.id)}>{p.title}</a></h3>
      <p>{p.body.length > 170 ? p.body.slice(0, 170).trim() + '…' : p.body}</p>
      <div className="meta">
        <button className="lnk" onClick={() => go('post', p.id)}>{n ? n + ' تعليق' : 'لا تعليقات'}</button>
        {mine && (<>
          <button className="lnk" onClick={() => go('edit', p.id)}>تعديل</button>
          <Confirm onConfirm={() => { update((s) => { s.posts = s.posts.filter((x) => x.id !== p.id); s.comments = s.comments.filter((c) => c.pid !== p.id) }); say('تم حذف المقال') }} />
        </>)}
      </div>
    </div>
  )
}

function Feed({ ctx }) {
  const { db, user, go } = ctx
  const ps = [...db.posts].sort((a, b) => b.at - a.at)
  return (<>
    <section>
      <div className="feedhead"><h2>أحدث المقالات</h2><span style={{ color: 'var(--mut)' }}>{ps.length} مقال</span></div>
      {ps.length ? ps.map((p) => <PostCard key={p.id} p={p} ctx={ctx} />) : <div className="empty">لا توجد مقالات بعد. اكتب أول مقال.</div>}
    </section>
    <aside className="side">
      <h3>{user.name}</h3>
      <p>{user.bio || 'أضف نبذة عنك من صفحة ملفك.'}</p>
      <button className="btn sm" onClick={() => go('edit')}>مقال جديد</button>
      <div className="st">
        <div><b>{db.posts.filter((p) => p.uid === user.id).length}</b>مقالاتي</div>
        <div><b>{db.comments.filter((c) => c.uid === user.id).length}</b>تعليقاتي</div>
      </div>
    </aside>
  </>)
}

function Comment({ c, ctx }) {
  const { db, user, update, say } = ctx
  const [editing, setEditing] = useState(false)
  const [err, setErr] = useState('')
  const a = db.users.find((u) => u.id === c.uid) || { name: 'مستخدم محذوف' }
  const mine = c.uid === user.id

  if (editing) {
    const save = (e) => {
      const d = formData(e)
      if (!d.body.trim()) return setErr('التعليق لا يمكن أن يكون فارغًا.')
      update((s) => { const x = s.comments.find((k) => k.id === c.id); x.body = d.body.trim(); x.edited = 1 })
      setEditing(false); say('تم تعديل التعليق')
    }
    return (
      <form className="c" onSubmit={save}>
        <textarea name="body" defaultValue={c.body} style={{ minHeight: 80 }} />
        <div className="err">{err}</div>
        <button className="btn sm">حفظ</button>{' '}
        <button type="button" className="btn ghost sm" onClick={() => setEditing(false)}>إلغاء</button>
      </form>
    )
  }
  return (
    <div className="c">
      <div className="by"><Avatar name={a.name} /><span><b>{a.name}</b> — {ago(c.at)}{c.edited ? ' (معدّل)' : ''}</span></div>
      <p>{c.body}</p>
      {mine && (
        <div className="tl">
          <button className="lnk" onClick={() => setEditing(true)}>تعديل</button>
          <Confirm onConfirm={() => { update((s) => { s.comments = s.comments.filter((k) => k.id !== c.id) }); say('تم حذف التعليق') }} />
        </div>
      )}
    </div>
  )
}

function PostPage({ id, ctx }) {
  const { db, user, go, update, say } = ctx
  const [err, setErr] = useState('')
  const p = db.posts.find((x) => x.id === id)
  if (!p) return (
    <div className="empty">هذا المقال غير موجود.<br />
      <button className="btn sm" style={{ marginTop: '1rem' }} onClick={() => go('feed')}>العودة للرئيسية</button>
    </div>
  )
  const a = db.users.find((u) => u.id === p.uid) || { name: 'مستخدم محذوف' }
  const cs = db.comments.filter((c) => c.pid === p.id).sort((x, y) => x.at - y.at)

  const add = (e) => {
    const form = e.target
    const d = formData(e)
    if (!d.body.trim()) return setErr('اكتب نص التعليق أولًا.')
    update((s) => { s.comments.push({ id: uid(), pid: p.id, uid: user.id, body: d.body.trim(), at: Date.now() }) })
    form.reset(); setErr(''); say('تم نشر التعليق')
  }

  return (
    <article>
      <button className="lnk" onClick={() => go('feed')}>رجوع إلى المقالات</button>
      <h1>{p.title}</h1>
      <div className="by"><Avatar name={a.name} /><span><b>{a.name}</b> — {dt(p.at)}{p.edited ? ' (معدّل)' : ''}</span></div>
      <div className="body" style={{ marginTop: '1.6rem' }}>{p.body}</div>
      {p.uid === user.id && (
        <div className="tools">
          <button className="btn ghost sm" onClick={() => go('edit', p.id)}>تعديل المقال</button>
          <Confirm className="btn danger sm" label="حذف المقال" onConfirm={() => { update((s) => { s.posts = s.posts.filter((x) => x.id !== p.id); s.comments = s.comments.filter((c) => c.pid !== p.id) }); go('feed'); say('تم حذف المقال') }} />
        </div>
      )}
      <section className="cm">
        <h2>التعليقات ({cs.length})</h2>
        {cs.length ? cs.map((c) => <Comment key={c.id} c={c} ctx={ctx} />) : <div className="empty" style={{ padding: '1.6rem 0' }}>لا تعليقات بعد. كن أول من يعلّق.</div>}
        <form className="add" onSubmit={add}>
          <label htmlFor="cb">أضف تعليقًا</label>
          <textarea id="cb" name="body" />
          <div className="err" role="alert">{err}</div>
          <button className="btn">انشر التعليق</button>
        </form>
      </section>
    </article>
  )
}

function Editor({ id, ctx }) {
  const { db, user, go, update, say } = ctx
  const [err, setErr] = useState('')
  const p = id ? db.posts.find((x) => x.id === id && x.uid === user.id) : null

  const submit = (e) => {
    const d = formData(e)
    if (!d.title.trim() || !d.body.trim()) return setErr('العنوان والنص مطلوبان.')
    if (p) {
      update((s) => { const x = s.posts.find((k) => k.id === p.id); x.title = d.title.trim(); x.body = d.body.trim(); x.edited = 1 })
      go('post', p.id); say('تم حفظ التعديلات')
    } else {
      const np = { id: uid(), uid: user.id, title: d.title.trim(), body: d.body.trim(), at: Date.now() }
      update((s) => { s.posts.push(np) })
      go('post', np.id); say('تم نشر المقال')
    }
  }

  return (
    <form className="card" style={{ maxWidth: 'none' }} onSubmit={submit}>
      <h2>{p ? 'تعديل المقال' : 'مقال جديد'}</h2>
      <p className="sub">{p ? 'عدّل ما تريد ثم احفظ.' : 'اختر عنوانًا واضحًا واكتب بهدوء.'}</p>
      <label htmlFor="t">العنوان</label>
      <input id="t" name="title" defaultValue={p?.title || ''} />
      <label htmlFor="b">النص</label>
      <textarea id="b" name="body" defaultValue={p?.body || ''} style={{ minHeight: 320, fontFamily: 'Amiri, serif', fontSize: '1.2rem', lineHeight: 2 }} />
      <div className="err" role="alert">{err}</div>
      <button className="btn">{p ? 'حفظ التعديلات' : 'نشر المقال'}</button>{' '}
      <button type="button" className="btn ghost" onClick={() => (p ? go('post', p.id) : go('feed'))}>إلغاء</button>
    </form>
  )
}


function Profile({ ctx }) {
  const { db, user, update, say } = ctx
  const [err, setErr] = useState('')
  const ps = db.posts.filter((p) => p.uid === user.id).sort((a, b) => b.at - a.at)

  const save = (e) => {
    const d = formData(e)
    if (d.name.trim().length < 2) return setErr('اكتب اسمك الكامل.')
    update((s) => { const u = s.users.find((k) => k.id === user.id); u.name = d.name.trim(); u.bio = d.bio.trim() })
    setErr(''); say('تم حفظ الملف الشخصي')
  }

  return (
    <section>
      <div className="pf">
        <Avatar name={user.name} lg />
        <div>
          <h1>{user.name}</h1>
          <p dir="ltr" style={{ textAlign: 'right' }}>{user.email}</p>
          <p>{user.bio}</p>
        </div>
      </div>
      <div className="sect">
        <h2>تعديل الملف الشخصي</h2>
        <form className="two" onSubmit={save}>
          <div><label htmlFor="pn">الاسم</label><input id="pn" name="name" defaultValue={user.name} /></div>
          <div><label htmlFor="pb">نبذة</label><input id="pb" name="bio" defaultValue={user.bio || ''} /></div>
          <div style={{ gridColumn: '1/-1' }}>
            <div className="err" role="alert">{err}</div>
            <button className="btn sm">حفظ</button>
          </div>
        </form>
      </div>
      <div className="sect">
        <h2>مقالاتي ({ps.length})</h2>
        {ps.length ? ps.map((p) => <PostCard key={p.id} p={p} ctx={ctx} />) : <div className="empty">لم تنشر شيئًا بعد.</div>}
      </div>
    </section>
  )
}

function Password({ ctx }) {
  const { user, update } = ctx
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const submit = (e) => {
    const form = e.target
    const d = formData(e)
    setOk('')
    if (d.old !== user.pass) return setErr('كلمة المرور الحالية غير صحيحة.')
    if (d.n1.length < 8) return setErr('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.')
    if (d.n1 !== d.n2) return setErr('كلمتا المرور غير متطابقتين.')
    update((s) => { s.users.find((k) => k.id === user.id).pass = d.n1 })
    form.reset(); setErr(''); setOk('تم تحديث كلمة المرور.')
  }

  return (
    <form className="card" style={{ maxWidth: 440 }} onSubmit={submit}>
      <h2>تغيير كلمة المرور</h2>
      <p className="sub">استخدم ثمانية أحرف على الأقل.</p>
      <label htmlFor="o">كلمة المرور الحالية</label>
      <input id="o" name="old" type="password" dir="ltr" autoComplete="current-password" />
      <label htmlFor="n1">كلمة المرور الجديدة</label>
      <input id="n1" name="n1" type="password" dir="ltr" autoComplete="new-password" />
      <label htmlFor="n2">تأكيد كلمة المرور الجديدة</label>
      <input id="n2" name="n2" type="password" dir="ltr" autoComplete="new-password" />
      <div className="err" role="alert">{err}</div>
      <div className="ok">{ok}</div>
      <button className="btn" style={{ marginTop: '.8rem' }}>تحديث كلمة المرور</button>
    </form>
  )
}


export default function App() {
  const [db, setDb] = useState(load)
  const [route, setRoute] = useState({ view: 'feed', arg: null })
  const [toast, setToast] = useState('')

  useEffect(() => persist(db), [db])

  const update = (fn) => setDb((d) => { const s = structuredClone(d); fn(s); return s })
  const go = (view, arg = null) => { setRoute({ view, arg }); window.scrollTo(0, 0) }
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2200) }
  const user = db.users.find((u) => u.id === db.session)

  if (!user) return (<><Auth db={db} update={update} say={say} />{toast && <div className="toast" role="status">{toast}</div>}</>)

  const ctx = { db, user, update, go, say }
  const { view, arg } = route
  const tab = (v, t) => <button className={view === v ? 'on' : ''} onClick={() => go(v)}>{t}</button>

  return (
    <>
      <header className="top">
        <div className="in">
          <button className="logo" onClick={() => go('feed')}>Social Media</button>
          <nav>{tab('feed', 'الرئيسية')}{tab('profile', 'ملفي')}{tab('password', 'كلمة المرور')}</nav>
          <button className="btn gold sm" onClick={() => go('edit')}>اكتب مقالًا</button>
          <button className="btn ghost sm" style={{ color: 'var(--on-deep)', borderColor: '#ffffff40' }}
            onClick={() => { update((s) => { s.session = null }); go('feed') }}>خروج</button>
        </div>
      </header>
      <main className={view === 'feed' ? '' : 'one'}>
        {view === 'feed' && <Feed ctx={ctx} />}
        {view === 'post' && <PostPage key={arg} id={arg} ctx={ctx} />}
        {view === 'edit' && <Editor key={arg || 'new'} id={arg} ctx={ctx} />}
        {view === 'profile' && <Profile ctx={ctx} />}
        {view === 'password' && <Password ctx={ctx} />}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  )
}
