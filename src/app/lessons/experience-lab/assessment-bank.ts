export type AssessmentTrack = "english" | "russian" | "coding" | "cyber";
export type AssessmentQuestion = { id: string; prompt: string; choices: string[]; answer: number; explanation: string };

export const assessmentTracks: Record<AssessmentTrack, { title: string; levels: string[]; description: string }> = {
  english: { title: "Ingliz tili", levels: ["A1 · Beginner", "A2 · Elementary", "B1 · Intermediate", "B2 · Upper-intermediate", "C1 · Advanced", "C2 · Proficient"], description: "CEFR yo‘nalishidagi boshlang‘ich diagnostika" },
  russian: { title: "Rus tili", levels: ["A1 · Начальный", "A2 · Элементарный", "B1 · Средний", "B2 · Выше среднего", "C1 · Продвинутый", "C2 · В совершенстве"], description: "Rus tili bo‘yicha boshlang‘ich diagnostika" },
  coding: { title: "Dasturlash", levels: ["Boshlang‘ich", "Asosiy", "O‘rta", "Yaxshi", "Ilg‘or", "Ekspert"], description: "Dasturlash mantiqi va JavaScript asoslari" },
  cyber: { title: "Kiberxavfsizlik", levels: ["Boshlang‘ich", "Asosiy", "O‘rta", "Yaxshi", "Ilg‘or", "Ekspert"], description: "Axborot xavfsizligi bo‘yicha bilimlar" },
};

export const assessmentBank: Record<AssessmentTrack, AssessmentQuestion[]> = {
  english: [
    { id:"en1", prompt:"Choose the correct sentence.", choices:["She go to school every day.","She goes to school every day.","She going to school every day.","She gone to school every day."], answer:1, explanation:"He/she/it bilan Present Simple’da fe’lga odatda -s qo‘shiladi." },
    { id:"en2", prompt:"“Reliable” so‘zining ma’nosi qaysi?", choices:["Ishonchli","Qimmat","Shovqinli","Xavfli"], answer:0, explanation:"Reliable — ishonchli, suyanish mumkin bo‘lgan." },
    { id:"en3", prompt:"I have lived here ___ 2021.", choices:["for","since","during","from"], answer:1, explanation:"Since aniq boshlanish vaqtini bildiradi." },
    { id:"en4", prompt:"Choose the closest meaning of “although”.", choices:["Shuning uchun","Masalan","Garchi","Shuningdek"], answer:2, explanation:"Although — garchi, zid fikrni bog‘laydi." },
    { id:"en5", prompt:"If I ___ more time, I would learn another language.", choices:["have","had","will have","am having"], answer:1, explanation:"Second conditional: If + Past Simple, would + verb." },
    { id:"en6", prompt:"“The report was written yesterday.” Qaysi grammatik shakl?", choices:["Present Perfect","Past Continuous","Passive Voice","Future Simple"], answer:2, explanation:"Was written — Past Simple Passive." },
    { id:"en7", prompt:"Choose the correct collocation.", choices:["Do a decision","Make a decision","Take a homework","Put an effort"], answer:1, explanation:"Make a decision — to‘g‘ri va tabiiy birikma." },
    { id:"en8", prompt:"Had I known about the delay, I ___ earlier.", choices:["would leave","will leave","would have left","left"], answer:2, explanation:"Inversion bilan third conditional: would have + V3." },
    { id:"en9", prompt:"“Notwithstanding” so‘ziga eng yaqin ma’no?", choices:["Because of","Despite","Before","Instead"], answer:1, explanation:"Notwithstanding — despite, ...ga qaramasdan." },
    { id:"en10", prompt:"Which sentence is grammatically correct?", choices:["No sooner I arrived than it rained.","No sooner had I arrived than it started raining.","No sooner I had arrive when it rained.","No sooner did I arrived than it rained."], answer:1, explanation:"No sooner bilan inversion va Past Perfect ishlatiladi." },
  ],
  russian: [
    { id:"ru1", prompt:"Выберите правильное предложение.", choices:["Я изучать русский язык.","Я изучаю русский язык.","Я изучает русский язык.","Я изучал русский язык каждый день сейчас."], answer:1, explanation:"С местоимением «я» в настоящем времени: я изучаю." },
    { id:"ru2", prompt:"«Здравствуйте» so‘zining ma’nosi?", choices:["Xayr","Rahmat","Assalomu alaykum / Salom","Iltimos"], answer:2, explanation:"Здравствуйте — rasmiy salomlashish shakli." },
    { id:"ru3", prompt:"У меня ___ книга.", choices:["новая","новый","новое","новые"], answer:0, explanation:"Книга — женский род, поэтому новая." },
    { id:"ru4", prompt:"«Вчера» qaysi vaqtni bildiradi?", choices:["Bugun","Ertaga","Kecha","Hozir"], answer:2, explanation:"Вчера — kecha." },
    { id:"ru5", prompt:"Выберите правильный вариант: Я живу ___ Ташкенте.", choices:["на","в","к","из"], answer:1, explanation:"Shahar ichida yashash: жить в Ташкенте." },
    { id:"ru6", prompt:"«Я прочитал книгу» qaysi zamon?", choices:["Hozirgi","Kelasi","O‘tgan","Buyruq"], answer:2, explanation:"Прочитал — o‘tgan zamon, совершенный вид." },
    { id:"ru7", prompt:"Как правильно спросить имя?", choices:["Как тебя зовут?","Где тебя зовут?","Что тебя имя?","Кто твой зовут?"], answer:0, explanation:"Как тебя зовут? — Isming nima?" },
    { id:"ru8", prompt:"Выберите правильное окончание: Мы говорим по-русск__.", choices:["ий","ому","и","ому языку"], answer:2, explanation:"To‘g‘ri shakl: говорить по-русски." },
    { id:"ru9", prompt:"«Несмотря на» ma’nosi qaysi?", choices:["Sababli","...ga qaramasdan","Oldin","O‘rniga"], answer:1, explanation:"Несмотря на — ...ga qaramasdan." },
    { id:"ru10", prompt:"Выберите грамматически правильное предложение.", choices:["Если бы я знал, я бы помог.","Если я знал бы вчера, помогу.","Если бы я знаю, помог.","Если я бы знал, помогал бы завтра."], answer:0, explanation:"Нереальное условие: если бы + прошедшее время, я бы + infinitive." },
  ],
  coding: [
    { id:"co1", prompt:"JavaScript’da o‘zgarmas bog‘lanish e’lon qilish?", choices:["var","let","const","static"], answer:2, explanation:"const qayta qiymat biriktirishni taqiqlaydi." },
    { id:"co2", prompt:"[1,2,3].map(x => x * 2) natijasi?", choices:["[1,2,3]","[2,4,6]","[1,4,9]","6"], answer:1, explanation:"map har bir elementni o‘zgartirib yangi massiv qaytaradi." },
    { id:"co3", prompt:"Qaysi operator qiymat va turini birga tekshiradi?", choices:["=","==","===","!="], answer:2, explanation:"=== strict equality operatoridir." },
    { id:"co4", prompt:"Promise holatlari qaysi javobda to‘g‘ri?", choices:["start/stop","pending/fulfilled/rejected","true/false/null","open/close"], answer:1, explanation:"Promise pending, fulfilled yoki rejected holatida bo‘ladi." },
    { id:"co5", prompt:"O(n) vaqt murakkabligi nimani bildiradi?", choices:["Doimiy vaqt","Kirish hajmiga chiziqli bog‘liqlik","Kvadratik o‘sish","Logarifmik o‘sish"], answer:1, explanation:"O(n) amallar soni kirish hajmiga proporsional o‘sishini bildiradi." },
    { id:"co6", prompt:"React’da state yangilanganda odatda nima sodir bo‘ladi?", choices:["Komponent qayta render bo‘ladi","Brauzer yopiladi","CSS o‘chadi","Server qayta ishga tushadi"], answer:0, explanation:"State o‘zgarishi komponent renderini yangilaydi." },
    { id:"co7", prompt:"XSS hujumining asosiy mohiyati?", choices:["SQL jadvalini o‘chirish","Brauzerda zararli script ishlatish","Parolni shifrlash","Tarmoq kabelini uzish"], answer:1, explanation:"XSS foydalanuvchi brauzerida ishonchsiz script bajarilishiga olib keladi." },
    { id:"co8", prompt:"Binary search uchun massiv qanday bo‘lishi kerak?", choices:["Tartiblangan","Faqat juft sonlardan iborat","Bo‘sh","Ikki o‘lchamli"], answer:0, explanation:"Binary search qidiruv oralig‘ini yarmiga qisqartirish uchun tartiblangan ma’lumot talab qiladi." },
    { id:"co9", prompt:"SQL tranzaksiyasida ACID'dagi atomicity nimani anglatadi?", choices:["Har bir so‘rov tez ishlaydi","Hammasi bajariladi yoki hech biri bajarilmaydi","Ma’lumot doim ochiq","Faqat bitta jadval ishlatiladi"], answer:1, explanation:"Atomicity — tranzaksiya yaxlit bajariladi yoki rollback qilinadi." },
    { id:"co10", prompt:"O‘rtacha O(1) lookup qaysi tuzilmaga xos?", choices:["Linked list","Hash table","Binary tree har doim","Stack"], answer:1, explanation:"Hash table o‘rtacha holatda kalit bo‘yicha O(1) qidiruv beradi." },
  ],
  cyber: [
    { id:"cy1", prompt:"Kuchli parol uchun eng to‘g‘ri yondashuv?", choices:["Ism va tug‘ilgan sana","Har joyda bir xil parol","Uzun, noyob passphrase va MFA","Faqat 4 raqam"], answer:2, explanation:"Uzun noyob parol va MFA hisob xavfsizligini oshiradi." },
    { id:"cy2", prompt:"Phishing nima?", choices:["Tarmoq tezligini oshirish","Soxta xabar/sayt bilan maxfiy ma’lumotni qo‘lga kiritish","Diskni formatlash","Faylni siqish"], answer:1, explanation:"Phishing — aldov orqali login, parol yoki to‘lov ma’lumotini olish." },
    { id:"cy3", prompt:"HTTPS nimani ta’minlaydi?", choices:["Har qanday sayt xavfsizligini kafolatlaydi","TLS orqali aloqa maxfiyligi va yaxlitligini himoyalaydi","Viruslarni o‘chiradi","Saytni reklamasiz qiladi"], answer:1, explanation:"HTTPS transport qatlamida TLS himoyasini beradi, saytning o‘zi mutlaq xavfsiz degani emas." },
    { id:"cy4", prompt:"MFA nimani anglatadi?", choices:["Bir nechta mustaqil autentifikatsiya omili","Faqat parol","Fayl zaxiralash","Tarmoq manzili"], answer:0, explanation:"MFA — bilish, egalik yoki biometrik omillardan kamida ikkitasini qo‘llash." },
    { id:"cy5", prompt:"Least privilege prinsipi?", choices:["Barchaga administrator huquqi","Foydalanuvchiga vazifasi uchun zarur eng kam huquq","Parolni hammaga berish","Loglarni o‘chirish"], answer:1, explanation:"Least privilege hujum yuzasini va zarar ko‘lamini kamaytiradi." },
    { id:"cy6", prompt:"SQL injection’dan himoyalanishning asosiy usuli?", choices:["Inputni HTML ranglash","Parameterized query/prepared statement","DB portini o‘zgartirishning o‘zi","Xatolarni yashirishning o‘zi"], answer:1, explanation:"Parametrli so‘rov foydalanuvchi kiritmasini SQL kodidan ajratadi." },
    { id:"cy7", prompt:"Hash va encryption o‘rtasidagi asosiy farq?", choices:["Ikkalasi ham qaytariladi","Hash odatda bir tomonlama, encryption kalit bilan qaytarilishi mumkin","Encryption kalitsiz ishlaydi","Hash faqat rasm uchun"], answer:1, explanation:"Kriptografik hash bir tomonlama; shifrlash esa kalit bilan deshifrlanishi mumkin." },
    { id:"cy8", prompt:"3-2-1 backup qoidasi?", choices:["3 parol, 2 login, 1 email","3 nusxa, 2 xil media, 1 nusxa off-site","3 server, 2 admin, 1 firewall","3 kun, 2 soat, 1 daqiqa"], answer:1, explanation:"3 nusxa, 2 xil saqlash muhiti, 1 nusxa boshqa joyda." },
    { id:"cy9", prompt:"Zero-day zaiflik nima?", choices:["Faqat nol parolli tizim","Vendor tuzatishi mavjud bo‘lmagan yoki hali ulgurilmagan zaiflik","Eski antivirus","Har kuni yangilanadigan patch"], answer:1, explanation:"Zero-day — himoyachi/vendor uchun tuzatish vaqti yetmagan zaiflik." },
    { id:"cy10", prompt:"Incident response’da containment bosqichining maqsadi?", choices:["Hodisani yashirish","Zarar tarqalishini cheklash","Serverni reklama qilish","Parollarni ommaga chiqarish"], answer:1, explanation:"Containment zararlanish tarqalishini cheklashga qaratiladi." },
  ],
};

export const practicalTasks: Record<AssessmentTrack, { title: string; prompt: string; hint: string; accepted: string[] }> = {
  english: { title: "English in action", prompt: "“Men har kuni ingliz tilini o‘rganaman” gapini ingliz tiliga tarjima qiling.", hint: "Present Simple zamonidan foydalaning.", accepted: ["i learn english every day", "i study english every day", "i am learning english every day"] },
  russian: { title: "Русский на практике", prompt: "“Men har kuni rus tilini o‘rganaman” gapini rus tiliga tarjima qiling.", hint: "“Я” bilan boshlang va “изучаю” fe’lidan foydalaning.", accepted: ["я изучаю русский язык каждый день", "каждый день я изучаю русский язык", "я каждый день учу русский язык"] },
  coding: { title: "JavaScript amaliyoti", prompt: "[1, 2, 3] massivining har bir elementini 2 ga ko‘paytirib, yangi massiv qaytaradigan map ifodasini yozing.", hint: "Array.map() va arrow function’dan foydalaning.", accepted: ["[1,2,3].map(n=>n*2)", "[1, 2, 3].map(n => n * 2)", "[1,2,3].map(x=>x*2)", "[1, 2, 3].map(x => x * 2)"] },
  cyber: { title: "Xavfsizlik vaziyati", prompt: "Notanish odam yuborgan email ilovasini ochishdan oldin birinchi navbatda nima qilasiz? Qisqa javob yozing.", hint: "Yuboruvchini mustaqil kanal orqali tekshirish va faylni ochmaslik haqida yozing.", accepted: ["yuboruvchini mustaqil kanal orqali tekshiraman va faylni ochmayman", "faylni ochmayman va yuboruvchini tekshiraman", "avval yuboruvchini tekshiraman, ilovani ochmayman"] },
};

export function checkPracticalAnswer(track: AssessmentTrack, answer: string) {
  const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFKC").replace(/[.,!?;:'"`]/g, "").replace(/\s+/g, " ").trim();
  const candidate = normalize(answer);
  return practicalTasks[track].accepted.some((item) => normalize(item) === candidate);
}

export function getAssessmentLevel(track: AssessmentTrack, score: number) {
  const index = Math.min(5, Math.floor(score / 2));
  return assessmentTracks[track].levels[index];
}
