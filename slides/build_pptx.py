#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Zikra taqdimotini .pptx (PowerPoint) formatida noldan generatsiya qiladi.
Tashqi kutubxonalar kerak emas — faqat standart zipfile + XML.
Ishlatish:  python3 build_pptx.py
Natija:     Zikra-taqdimot.pptx
"""
import zipfile
import xml.dom.minidom as minidom

# ---- Slayd o'lchami (16:9) EMU da ----
W = 12192000
H = 6858000
EMU = 914400  # 1 dyuym

# ---- Ranglar ----
BRAND = "534AB7"
GREEN = "1D9E75"
ACCENT = "D85A30"
INK = "16151F"
MUTED = "5F5D70"
WHITE = "FFFFFF"
LINE = "E7E6EF"
BRAND50 = "EEEDF8"
DARK1 = "14122B"
DARK2 = "3A3380"
SOL1 = "1A1740"
SOL2 = "463E9E"
GREENL = "7FE7C4"


def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def IN(v):
    return int(v * EMU)


_id = [10]


def nid():
    _id[0] += 1
    return _id[0]


def para(text, sz=1800, b=False, color=INK, i=False, algn="l", spc_bef=0):
    bef = ""
    if spc_bef:
        bef = '<a:spcBef><a:spcPts val="%d"/></a:spcBef>' % (spc_bef * 100)
    if text == "":
        return ('<a:p><a:pPr algn="%s">%s</a:pPr>'
                '<a:endParaRPr lang="uz-UZ" sz="%d"/></a:p>' % (algn, bef, sz))
    return ('<a:p><a:pPr algn="%s">%s</a:pPr>'
            '<a:r><a:rPr lang="uz-UZ" sz="%d" b="%d" i="%d" dirty="0">'
            '<a:solidFill><a:srgbClr val="%s"/></a:solidFill>'
            '<a:latin typeface="Inter"/><a:cs typeface="Inter"/></a:rPr>'
            '<a:t>%s</a:t></a:r></a:p>'
            % (algn, bef, sz, 1 if b else 0, 1 if i else 0, color, esc(text)))


def textbox(x, y, w, h, paras, fill=None, geom="rect", anchor="t",
            line=None, shadow=False):
    sp_fill = "<a:noFill/>"
    if fill:
        sp_fill = '<a:solidFill><a:srgbClr val="%s"/></a:solidFill>' % fill
    sp_line = "<a:ln><a:noFill/></a:ln>"
    if line:
        sp_line = ('<a:ln w="12700"><a:solidFill><a:srgbClr val="%s"/>'
                   '</a:solidFill></a:ln>' % line)
    eff = ""
    if shadow:
        eff = ('<a:effectLst><a:outerShdw blurRad="180000" dist="90000" '
               'dir="5400000" rotWithShape="0"><a:srgbClr val="100C2B">'
               '<a:alpha val="22000"/></a:srgbClr></a:outerShdw></a:effectLst>')
    body = "".join(paras)
    return ('<p:sp><p:nvSpPr><p:cNvPr id="%d" name="tb%d"/>'
            '<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
            '<p:spPr><a:xfrm><a:off x="%d" y="%d"/><a:ext cx="%d" cy="%d"/></a:xfrm>'
            '<a:prstGeom prst="%s"><a:avLst/></a:prstGeom>%s%s%s</p:spPr>'
            '<p:txBody><a:bodyPr wrap="square" lIns="118872" tIns="100584" '
            'rIns="118872" bIns="100584" anchor="%s"><a:normAutofit/></a:bodyPr>'
            '<a:lstStyle/>%s</p:txBody></p:sp>'
            % (nid(), nid(), x, y, w, h, geom, sp_fill, sp_line, eff,
               anchor, body))


def badge(x, y, size, letter):
    """Logo badge (rounded square, gradient-ish brand)."""
    paras = [para(letter, sz=3200, b=True, color=WHITE, algn="ctr")]
    grad = ('<a:gradFill><a:gsLst>'
            '<a:gs pos="0"><a:srgbClr val="%s"/></a:gs>'
            '<a:gs pos="100000"><a:srgbClr val="%s"/></a:gs></a:gsLst>'
            '<a:lin ang="2700000" scaled="1"/></a:gradFill>' % (BRAND, GREEN))
    return ('<p:sp><p:nvSpPr><p:cNvPr id="%d" name="badge"/><p:cNvSpPr/>'
            '<p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="%d" y="%d"/>'
            '<a:ext cx="%d" cy="%d"/></a:xfrm>'
            '<a:prstGeom prst="roundRect"><a:avLst>'
            '<a:gd name="adj" fmla="val 28000"/></a:avLst></a:prstGeom>%s'
            '<a:ln><a:noFill/></a:ln></p:spPr>'
            '<p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/>%s</p:txBody></p:sp>'
            % (nid(), x, y, size, size, grad, "".join(paras)))


def bg_fill(kind):
    if kind == "title":
        return ('<p:bg><p:bgPr><a:gradFill><a:gsLst>'
                '<a:gs pos="0"><a:srgbClr val="%s"/></a:gs>'
                '<a:gs pos="55000"><a:srgbClr val="221D49"/></a:gs>'
                '<a:gs pos="100000"><a:srgbClr val="%s"/></a:gs></a:gsLst>'
                '<a:lin ang="3000000" scaled="1"/></a:gradFill>'
                '<a:effectLst/></p:bgPr></p:bg>' % (DARK2, DARK1))
    if kind == "sol":
        return ('<p:bg><p:bgPr><a:gradFill><a:gsLst>'
                '<a:gs pos="0"><a:srgbClr val="%s"/></a:gs>'
                '<a:gs pos="100000"><a:srgbClr val="%s"/></a:gs></a:gsLst>'
                '<a:lin ang="2400000" scaled="1"/></a:gradFill>'
                '<a:effectLst/></p:bgPr></p:bg>' % (SOL2, SOL1))
    return ('<p:bg><p:bgPr><a:solidFill><a:srgbClr val="%s"/></a:solidFill>'
            '<a:effectLst/></p:bgPr></p:bg>' % WHITE)


def kicker(text, x, y, light=False):
    col = "B9B4E8" if light else BRAND
    return textbox(x, y, IN(8), IN(0.5),
                   [para(text.upper(), sz=1300, b=True, color=col)])


def title(text, x, y, w, light=False, sz=4000):
    col = WHITE if light else INK
    return textbox(x, y, w, IN(1.1), [para(text, sz=sz, b=True, color=col)])


def card(x, y, w, h, emoji, head, body, center=False, head_color=INK):
    algn = "ctr" if center else "l"
    paras = [
        para(emoji, sz=3200, algn=algn),
        para(head, sz=1700, b=True, color=head_color, algn=algn, spc_bef=6),
        para(body, sz=1200, color=MUTED, algn=algn, spc_bef=4),
    ]
    return textbox(x, y, w, h, paras, fill=WHITE, geom="roundRect",
                   line=LINE, shadow=True)


def slidetree(shapes):
    return ('<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/>'
            '<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
            '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            + "".join(shapes) + '</p:spTree>')


def slide_xml(bg_kind, shapes):
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            '<p:cSld>' + bg_fill(bg_kind) + slidetree(shapes) + '</p:cSld>'
            '<p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" '
            'tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" '
            'accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" '
            'folHlink="folHlink"/></p:clrMapOvr></p:sld>')


# ============================================================
#  SLAYDLAR
# ============================================================
ML = IN(0.92)        # chap margin
CW = W - 2 * ML      # kontent kengligi
slides = []

# ---- 1. TITLE ----
s = []
s.append(badge((W - IN(1.0)) // 2, IN(1.15), IN(1.0), "Z"))
s.append(textbox(0, IN(2.35), W, IN(0.5),
                 [para("O'ZBEKISTONDA BIRINCHI  ·  DUNYODA O'ZIGA XOS",
                       sz=1300, b=True, color="B9B4E8", algn="ctr")]))
s.append(textbox(0, IN(2.85), W, IN(1.7),
                 [para("Zikra", sz=8000, b=True, color=WHITE, algn="ctr")]))
s.append(textbox(0, IN(4.45), W, IN(0.7),
                 [para("Bilim qoldiring, tajriba oling",
                       sz=2600, b=True, color=WHITE, algn="ctr")]))
s.append(textbox(0, IN(5.15), W, IN(0.6),
                 [para("Bepul P2P ko'nikma almashish platformasi",
                       sz=1700, color="C9C5EA", algn="ctr")]))
s.append(textbox(0, IN(5.8), W, IN(0.6),
                 [para("Learn. Teach. Be remembered.",
                       sz=1600, b=True, i=True, color=GREENL, algn="ctr")]))
slides.append(("title", s))

# ---- 2. PROBLEM ----
s = []
s.append(kicker("Muammo", ML, IN(0.7)))
s.append(title("Bilim olish qimmat va qiyin", ML, IN(1.15), CW))
cw = (CW - IN(0.4)) / 2
ch = IN(1.85)
cards = [
    ("💸", "Kurslar qimmat", "Sifatli ta'lim va repetitorlar ko'pchilik uchun arzon emas."),
    ("⏳", "Vaqt va masofa", "O'quv markazlariga borish vaqt va resurs talab qiladi."),
    ("🧩", "Bilim sarflanmaydi", "Har kim nimanidir biladi, lekin uni ulashish platformasi yo'q."),
    ("🤷", "Motivatsiya yo'q", "O'z-o'zini o'rgatish zerikarli — natija va rag'bat ko'rinmaydi."),
]
for idx, (e, hd, bd) in enumerate(cards):
    col = idx % 2
    row = idx // 2
    x = ML + col * (cw + IN(0.4))
    y = IN(2.5) + row * (ch + IN(0.3))
    s.append(card(x, y, cw, ch, e, hd, bd))
slides.append(("plain", s))

# ---- 3. SOLUTION ----
s = []
s.append(kicker("Yechim", ML, IN(0.7), light=True))
s.append(title("Bilim — yangi valyuta", ML, IN(1.15), CW, light=True))
s.append(textbox(ML, IN(2.15), CW, IN(0.6),
                 [para("Zikra orqali odamlar pul to'lamasdan bir-biridan o'rganadi.",
                       sz=1700, color="E3E0F6")]))
exw = IN(4.0)
exh = IN(2.2)
ex_paras1 = [
    para("Madina", sz=2000, b=True, color=INK),
    para("O'rgatadi:  Ingliz tili", sz=1500, b=True, color=GREEN, spc_bef=8),
    para("O'rganmoqchi:  Python", sz=1500, b=True, color=BRAND, spc_bef=4),
]
ex_paras2 = [
    para("Jasur", sz=2000, b=True, color=INK),
    para("O'rgatadi:  Python", sz=1500, b=True, color=GREEN, spc_bef=8),
    para("O'rganmoqchi:  Ingliz tili", sz=1500, b=True, color=BRAND, spc_bef=4),
]
s.append(textbox(ML, IN(3.0), exw, exh, ex_paras1, fill=WHITE,
                 geom="roundRect", shadow=True))
s.append(textbox((W - IN(1.0)) / 2, IN(3.55), IN(1.0), IN(1.0),
                 [para("🔁", sz=4000, color=ACCENT, algn="ctr")]))
s.append(textbox(W - ML - exw, IN(3.0), exw, exh, ex_paras2, fill=WHITE,
                 geom="roundRect", shadow=True))
s.append(textbox(ML, IN(5.6), CW, IN(0.7),
                 [para("\u201CSen menga Python o'rgat, men senga Ingliz tili o'rgataman.\u201D",
                       sz=1800, b=True, i=True, color=WHITE, algn="ctr")]))
slides.append(("sol", s))

# ---- 4. HOW IT WORKS ----
s = []
s.append(kicker("Oddiy va tez", ML, IN(0.7)))
s.append(title("Qanday ishlaydi?", ML, IN(1.15), CW))
stepw = (CW - IN(0.8)) / 3
steph = IN(3.0)
steps = [
    ("1", BRAND, "📝", "Profil yarating",
     "Nimani o'rgata olishingiz va nimani o'rganmoqchi ekanligingizni belgilang."),
    ("2", GREEN, "🔍", "Mos hamkor toping",
     "Moslik algoritmi eng mos odamlarni ko'rsatadi — o'zaro almashinuv 100%."),
    ("3", ACCENT, "🚀", "O'rganing va o'rgating",
     "Chat orqali bog'laning, dars o'ting, baho oling va XP yig'ing."),
]
for i2, (n, c, e, hd, bd) in enumerate(steps):
    x = ML + i2 * (stepw + IN(0.4))
    y = IN(2.6)
    s.append(textbox(x, y, IN(0.7), IN(0.7),
                     [para(n, sz=2200, b=True, color=WHITE, algn="ctr")],
                     fill=c, geom="ellipse", anchor="ctr"))
    paras = [
        para(e, sz=2800),
        para(hd, sz=1800, b=True, color=INK, spc_bef=6),
        para(bd, sz=1250, color=MUTED, spc_bef=4),
    ]
    s.append(textbox(x, y + IN(0.95), stepw, steph - IN(0.95), paras,
                     fill=WHITE, geom="roundRect", line=LINE, shadow=True))
slides.append(("plain", s))

# ---- 5. FEATURES ----
s = []
s.append(kicker("Mahsulot", ML, IN(0.7)))
s.append(title("Asosiy imkoniyatlar", ML, IN(1.15), CW))
feats = [
    ("🔍", "Moslik algoritmi", "O'zaro almashinuv = 100% moslik, qidiruv va filtrlar."),
    ("💬", "Real-time chat", "Supabase Realtime, video havola ulashish."),
    ("📞", "Video/ovozli qo'ng'iroq", "WebRTC + TURN — turli tarmoqlar orasida."),
    ("🎬", "Video darslar", "Yuklash, like, izoh, ko'rishlar soni."),
    ("⭐", "Ikki tomonlama baho", "1–5 yulduz, ikkala tomon baholaganda ochiladi."),
    ("🏆", "Gamifikatsiya", "XP, 5 daraja, avtomatik nishonlar, streak."),
    ("📰", "Stories & obuna", "Hikoyalar, follow, yangiliklar tasmasi."),
    ("🔔", "Push bildirishnoma", "Ilova yopiq bo'lsa ham (Firebase FCM)."),
]
fw = (CW - IN(0.4)) / 2
fh = IN(1.0)
for i3, (e, hd, bd) in enumerate(feats):
    col = i3 % 2
    row = i3 // 2
    x = ML + col * (fw + IN(0.4))
    y = IN(2.35) + row * (fh + IN(0.18))
    paras = [
        para(e + "   " + hd, sz=1550, b=True, color=INK),
        para(bd, sz=1150, color=MUTED, spc_bef=3),
    ]
    s.append(textbox(x, y, fw, fh, paras, fill=BRAND50, geom="roundRect"))
slides.append(("plain", s))

# ---- 6. WHY UNIQUE ----
s = []
s.append(kicker("Farqimiz", ML, IN(0.7)))
s.append(title("Nega Zikra noyob?", ML, IN(1.15), CW))
uw = (CW - IN(1.2)) / 4
uh = IN(2.9)
uniq = [
    ("💸", "To'liq bepul", "To'lov, obuna yoki yashirin xarajat yo'q.", BRAND),
    ("🔁", "O'zaro almashinuv", "Pul emas, bilim valyuta. Sen o'rgat, sen o'rgan.", GREEN),
    ("🏆", "Gamifikatsiya", "XP, darajalar, nishonlar — qiziqarli.", ACCENT),
    ("🇺🇿", "O'zbekcha", "To'liq o'zbek tilida, mahalliy hamjamiyat uchun.", BRAND),
]
for i4, (e, hd, bd, c) in enumerate(uniq):
    x = ML + i4 * (uw + IN(0.4))
    s.append(card(x, IN(2.6), uw, uh, e, hd, bd, center=True, head_color=c))
slides.append(("plain", s))

# ---- 7. GAMIFICATION ----
s = []
s.append(kicker("Rag'bat", ML, IN(0.7)))
s.append(title("O'rganishni o'yinga aylantiramiz", ML, IN(1.15), CW))
gw = (CW - IN(1.2)) / 4
gh = IN(2.6)
game = [
    ("⚡", "XP ballari", "Har bir dars va baho uchun tajriba."),
    ("📈", "5 daraja", "XP ortishi bilan yangi darajalar."),
    ("🎖️", "Nishonlar", "Yutuqlarga avtomatik badge'lar."),
    ("🔥", "Streak", "Ketma-ket faollik hisoblanadi."),
]
for i5, (e, hd, bd) in enumerate(game):
    x = ML + i5 * (gw + IN(0.4))
    s.append(card(x, IN(2.6), gw, gh, e, hd, bd, center=True, head_color=INK))
s.append(textbox(ML, IN(5.55), CW, IN(0.5),
                 [para("Barchasi ma'lumotlar bazasi triggerlari orqali avtomatik ishlaydi.",
                       sz=1300, i=True, color=MUTED, algn="ctr")]))
slides.append(("plain", s))

# ---- 8. TECH STACK ----
s = []
s.append(kicker("Arxitektura", ML, IN(0.7)))
s.append(title("Texnologiyalar", ML, IN(1.15), CW))
tech = [
    ("Frontend + Backend", "Next.js 15 · App Router · Server Actions · React 19"),
    ("Dizayn", "Tailwind CSS"),
    ("DB / Auth / Realtime", "Supabase (PostgreSQL · RLS · Triggerlar)"),
    ("Rasm / Video", "Supabase Storage"),
    ("Push bildirishnoma", "Firebase Cloud Messaging (FCM)"),
    ("Qo'ng'iroq", "WebRTC · Metered TURN"),
    ("Deploy", "Vercel"),
]
rh = IN(0.58)
for i6, (layer, val) in enumerate(tech):
    y = IN(2.3) + i6 * (rh + IN(0.12))
    s.append(textbox(ML, y, IN(3.7), rh,
                     [para(layer, sz=1450, b=True, color=BRAND)],
                     fill="F4F3FB", geom="roundRect", anchor="ctr"))
    s.append(textbox(ML + IN(3.85), y, CW - IN(3.85), rh,
                     [para(val, sz=1400, color=INK)], anchor="ctr"))
slides.append(("plain", s))

# ---- 9. MARKET ----
s = []
s.append(kicker("Bozor va auditoriya", ML, IN(0.7), light=True))
s.append(title("Kim foydalanadi?", ML, IN(1.15), CW, light=True))
mw = (CW - IN(1.2)) / 4
mh = IN(2.3)
mkt = [
    ("🎓", "Talabalar", "va maktab o'quvchilari"),
    ("💻", "IT'ga kirayotganlar", "dasturlash, dizayn"),
    ("🗣️", "Til o'rganuvchilar", "ingliz, rus, arab..."),
    ("🤝", "Mutaxassislar", "tajriba almashuvchilar"),
]
for i7, (e, hd, bd) in enumerate(mkt):
    x = ML + i7 * (mw + IN(0.4))
    paras = [
        para(e, sz=3000, algn="ctr"),
        para(hd, sz=1600, b=True, color=INK, algn="ctr", spc_bef=6),
        para(bd, sz=1200, color=MUTED, algn="ctr", spc_bef=3),
    ]
    s.append(textbox(x, IN(2.55), mw, mh, paras, fill=WHITE,
                     geom="roundRect", shadow=True))
s.append(textbox(ML, IN(5.35), CW, IN(0.7),
                 [para("O'zbekistonda 10+ million yosh — o'rganishga tashna, raqamli avlod.",
                       sz=1700, b=True, color=WHITE, algn="ctr")]))
slides.append(("sol", s))

# ---- 10. ROADMAP ----
s = []
s.append(kicker("Kelajak", ML, IN(0.7)))
s.append(title("Rivojlanish yo'l xaritasi", ML, IN(1.15), CW))
rw = (CW - IN(1.2)) / 4
rhh = IN(3.0)
road = [
    ("Bosqich 1 — MVP ✅", "Web platforma: auth, discovery, chat, video, gamifikatsiya.", GREEN),
    ("Bosqich 2 — Mobil", "Android/iOS (PWA → native), to'liq push va qo'ng'iroqlar.", BRAND),
    ("Bosqich 3 — Hamjamiyat", "Guruh darslari, tadbirlar, mentorlik dasturlari.", BRAND),
    ("Bosqich 4 — Kengayish", "Mintaqaviy bozorlar va sheriklik dasturlari.", BRAND),
]
for i8, (hd, bd, c) in enumerate(road):
    x = ML + i8 * (rw + IN(0.4))
    s.append(textbox(x, IN(2.6), IN(0.42), IN(0.42), [para("", sz=800)],
                     fill=c, geom="ellipse"))
    paras = [
        para(hd, sz=1550, b=True, color=INK),
        para(bd, sz=1200, color=MUTED, spc_bef=5),
    ]
    s.append(textbox(x, IN(3.2), rw, rhh - IN(0.6), paras, fill=WHITE,
                     geom="roundRect", line=LINE, shadow=True))
slides.append(("plain", s))

# ---- 11. CTA / CONTACT ----
s = []
s.append(badge((W - IN(0.95)) // 2, IN(0.95), IN(0.95), "Z"))
s.append(textbox(0, IN(2.1), W, IN(1.2),
                 [para("Bugun boshlang", sz=6000, b=True, color=WHITE, algn="ctr")]))
s.append(textbox(0, IN(3.35), W, IN(0.6),
                 [para("Bepul. Cheksiz. Faqat bilim almashinuvi.",
                       sz=1900, color="C9C5EA", algn="ctr")]))
s.append(textbox(0, IN(4.0), W, IN(0.55),
                 [para("Learn. Teach. Be remembered.",
                       sz=1600, b=True, i=True, color=GREENL, algn="ctr")]))
s.append(textbox(IN(3.0), IN(4.95), IN(3.0), IN(0.75),
                 [para("📞  +998 91 891 70 07", sz=1600, b=True, color=BRAND,
                       algn="ctr")], fill=WHITE, geom="roundRect", anchor="ctr"))
s.append(textbox(IN(6.35), IN(4.95), IN(3.0), IN(0.75),
                 [para("✈️  @asomiddinmeliboyev", sz=1600, b=True, color=WHITE,
                       algn="ctr")], fill="229ED9", geom="roundRect", anchor="ctr"))
s.append(textbox(0, IN(6.1), W, IN(0.5),
                 [para("© Zikra — O'zbekistondagi birinchi bepul P2P ko'nikma almashish platformasi.",
                       sz=1100, color="8B86B8", algn="ctr")]))
slides.append(("title", s))


# ============================================================
#  OOXML PAKETINI YIG'ISH
# ============================================================
N = len(slides)

CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
    + "".join('<Override PartName="/ppt/slides/slide%d.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>' % (i + 1) for i in range(N))
    + '</Types>')

ROOT_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
    '</Relationships>')

# presentation.xml.rels: rId1 master, rId2.. slides, then theme
pres_rels = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>']
for i in range(N):
    pres_rels.append('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide%d.xml"/>' % (i + 2, i + 1))
theme_rid = N + 2
pres_rels.append('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>' % theme_rid)
PRES_RELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
             '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
             + "".join(pres_rels) + '</Relationships>')

sldid = "".join('<p:sldId id="%d" r:id="rId%d"/>' % (256 + i, i + 2) for i in range(N))
PRESENTATION = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">'
    '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
    '<p:sldIdLst>' + sldid + '</p:sldIdLst>'
    '<p:sldSz cx="%d" cy="%d" type="screen16x9"/>'
    '<p:notesSz cx="6858000" cy="9144000"/></p:presentation>' % (W, H))

THEME = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Zikra">'
    '<a:themeElements>'
    '<a:clrScheme name="Zikra">'
    '<a:dk1><a:srgbClr val="16151F"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>'
    '<a:dk2><a:srgbClr val="322C6E"/></a:dk2><a:lt2><a:srgbClr val="EEEDF8"/></a:lt2>'
    '<a:accent1><a:srgbClr val="534AB7"/></a:accent1><a:accent2><a:srgbClr val="1D9E75"/></a:accent2>'
    '<a:accent3><a:srgbClr val="D85A30"/></a:accent3><a:accent4><a:srgbClr val="6A5FD6"/></a:accent4>'
    '<a:accent5><a:srgbClr val="7FE7C4"/></a:accent5><a:accent6><a:srgbClr val="B9B4E8"/></a:accent6>'
    '<a:hlink><a:srgbClr val="534AB7"/></a:hlink><a:folHlink><a:srgbClr val="1D9E75"/></a:folHlink>'
    '</a:clrScheme>'
    '<a:fontScheme name="Zikra"><a:majorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>'
    '<a:minorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>'
    '<a:fmtScheme name="Zikra">'
    '<a:fillStyleLst>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '</a:fillStyleLst>'
    '<a:lnStyleLst>'
    '<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
    '<a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
    '<a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
    '</a:lnStyleLst>'
    '<a:effectStyleLst>'
    '<a:effectStyle><a:effectLst/></a:effectStyle>'
    '<a:effectStyle><a:effectLst/></a:effectStyle>'
    '<a:effectStyle><a:effectLst/></a:effectStyle>'
    '</a:effectStyleLst>'
    '<a:bgFillStyleLst>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '</a:bgFillStyleLst>'
    '</a:fmtScheme>'
    '</a:themeElements></a:theme>')

EMPTY_TREE = ('<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/>'
              '<p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
              '<a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/>'
              '</a:xfrm></p:grpSpPr></p:spTree>')

SLIDE_MASTER = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
    '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>'
    '<a:effectLst/></p:bgPr></p:bg>' + EMPTY_TREE + '</p:cSld>'
    '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" '
    'accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" '
    'accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
    '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
    '<p:txStyles>'
    '<p:titleStyle><a:lvl1pPr><a:defRPr sz="4400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="Inter"/></a:defRPr></a:lvl1pPr></p:titleStyle>'
    '<p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="Inter"/></a:defRPr></a:lvl1pPr></p:bodyStyle>'
    '<p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="Inter"/></a:defRPr></a:lvl1pPr></p:otherStyle>'
    '</p:txStyles></p:sldMaster>')

SLIDE_MASTER_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
    '</Relationships>')

SLIDE_LAYOUT = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
    'type="blank" preserve="1">'
    '<p:cSld name="Blank">' + EMPTY_TREE + '</p:cSld>'
    '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>')

SLIDE_LAYOUT_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
    '</Relationships>')

SLIDE_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
    '</Relationships>')

APP_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
    'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
    '<Application>Zikra Slide Builder</Application><Slides>%d</Slides>'
    '<Company>Zikra</Company></Properties>' % N)

CORE_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
    'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    '<dc:title>Zikra — Taqdimot</dc:title><dc:creator>Zikra</dc:creator>'
    '<cp:lastModifiedBy>Zikra</cp:lastModifiedBy></cp:coreProperties>')

CONTENT_TYPES = CONTENT_TYPES.replace(
    '</Types>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
    '</Types>')

ROOT_RELS = ROOT_RELS.replace(
    '</Relationships>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    '</Relationships>')

# ---- Yig'ish + XML to'g'riligini tekshirish ----
parts = {
    "[Content_Types].xml": CONTENT_TYPES,
    "_rels/.rels": ROOT_RELS,
    "docProps/app.xml": APP_XML,
    "docProps/core.xml": CORE_XML,
    "ppt/presentation.xml": PRESENTATION,
    "ppt/_rels/presentation.xml.rels": PRES_RELS,
    "ppt/theme/theme1.xml": THEME,
    "ppt/slideMasters/slideMaster1.xml": SLIDE_MASTER,
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": SLIDE_MASTER_RELS,
    "ppt/slideLayouts/slideLayout1.xml": SLIDE_LAYOUT,
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": SLIDE_LAYOUT_RELS,
}
for i, (kind, shapes) in enumerate(slides):
    parts["ppt/slides/slide%d.xml" % (i + 1)] = slide_xml(kind, shapes)
    parts["ppt/slides/_rels/slide%d.xml.rels" % (i + 1)] = SLIDE_RELS

# XML well-formed tekshiruvi
for name, content in parts.items():
    if name.endswith(".xml") or name.endswith(".rels"):
        minidom.parseString(content.encode("utf-8"))

OUT = "Zikra-taqdimot.pptx"
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    # [Content_Types].xml birinchi bo'lishi tavsiya etiladi
    z.writestr("[Content_Types].xml", parts.pop("[Content_Types].xml"))
    for name, content in parts.items():
        z.writestr(name, content)

print("OK:", OUT, "·", N, "slayd ·", "XML tekshiruvidan o'tdi")
