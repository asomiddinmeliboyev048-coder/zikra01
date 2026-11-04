import { BookOpen, Gamepad2, ShieldCheck } from "lucide-react";

export type TrackId = "english" | "coding" | "cyber";
export type Question = { prompt:string; choices:string[]; answer:number; explanation:string };
export type Lesson = { id:number; title:string; subtitle:string; questions:Question[] };
export const tracks:{id:TrackId;name:string;icon:typeof BookOpen;summary:string;color:string}[]=[
 {id:"english",name:"Ingliz tili",icon:BookOpen,summary:"Lug‘at va grammatika",color:"bg-sky-500"},
 {id:"coding",name:"Dasturlash",icon:Gamepad2,summary:"JavaScript va mantiq",color:"bg-violet-600"},
 {id:"cyber",name:"Kiberxavfsizlik",icon:ShieldCheck,summary:"Xavfsiz fikrlash",color:"bg-emerald-600"},
];
export const bank:Record<TrackId,Lesson[]> = {
 english:[
  {id:1,title:"Birinchi so‘zlar",subtitle:"Asosiy lug‘at",questions:[
   {prompt:"“Improve” so‘zining ma’nosi?",choices:["Yaxshilamoq","Unutmoq","Kutmoq"],answer:0,explanation:"Improve — yaxshilamoq yoki takomillashtirmoq."},
   {prompt:"“Reliable” nimani anglatadi?",choices:["Shovqinli","Ishonchli","Qimmat"],answer:1,explanation:"Reliable — ishonchli, suyanish mumkin bo‘lgan."},
   {prompt:"“Achieve a goal” tarjimasi?",choices:["Maqsadni unutmoq","Savol bermoq","Maqsadga erishmoq"],answer:2,explanation:"Achieve a goal — maqsadga erishmoq."}]},
  {id:2,title:"Present Simple",subtitle:"Oddiy hozirgi zamon",questions:[
   {prompt:"Choose the correct sentence.",choices:["She go to class.","She goes to class.","She going to class."],answer:1,explanation:"He/she/it bilan odatda fe’lga -s yoki -es qo‘shiladi."},
   {prompt:"I ___ English every day.",choices:["practices","practice","practicing"],answer:1,explanation:"I bilan Present Simple’da asosiy fe’l shakli ishlatiladi."},
   {prompt:"Which is a question?",choices:["You ready are?","Are you ready?","You are ready?"],answer:1,explanation:"Yes/no savolda to be egadan oldin keladi."}]},
  {id:3,title:"So‘z birikmalari",subtitle:"Tabiiy inglizcha",questions:[
   {prompt:"Choose the natural phrase.",choices:["Do a decision","Make a decision","Made decisioning"],answer:1,explanation:"Make a decision — odatiy inglizcha birikma."},
   {prompt:"Opposite of “increase”?",choices:["Reduce","Include","Repeat"],answer:0,explanation:"Reduce — kamaytirmoq; increase — oshirmoq."},
   {prompt:"“Carefully” ma’nosi?",choices:["Birdaniga","Kamdan-kam","Ehtiyotkorlik bilan"],answer:2,explanation:"Carefully — diqqat bilan, ehtiyotkorlik bilan."}]},
  {id:4,title:"Past Simple",subtitle:"O‘tgan zamon",questions:[
   {prompt:"I ___ my homework yesterday.",choices:["finish","finished","finishes"],answer:1,explanation:"Yesterday o‘tgan vaqtni bildiradi: finished."},
   {prompt:"“Went” qaysi fe’l shakli?",choices:["Go — Past Simple","Get — Present","Want — Past"],answer:0,explanation:"Went — go fe’lining Past Simple shakli."},
   {prompt:"We ___ a film last night.",choices:["watch","watched","watches"],answer:1,explanation:"Last night bilan o‘tgan zamon: watched."}]},
  {id:5,title:"Bilim sinovi",subtitle:"Bo‘lim yakuni",questions:[
   {prompt:"I have lived here ___ 2022.",choices:["for","since","during"],answer:1,explanation:"Since aniq boshlanish nuqtasi bilan ishlatiladi."},
   {prompt:"Choose the correct form.",choices:["He has finished.","He have finished.","He finishing."],answer:0,explanation:"He bilan Present Perfect’da has ishlatiladi."},
   {prompt:"“Although” nimani bog‘laydi?",choices:["Joyni","Qarama-qarshi fikrlarni","Buyruqni"],answer:1,explanation:"Although — garchi ma’nosida zid fikrlarni bog‘laydi."}]}
 ],
 coding:[
  {id:1,title:"JavaScript asoslari",subtitle:"Operator va qiymatlar",questions:[
   {prompt:"Qat’iy tenglik operatori?",choices:["=","==","==="],answer:2,explanation:"=== qiymat va ma’lumot turini tekshiradi."},
   {prompt:"Boolean(0) natijasi?",choices:["true","false","undefined"],answer:1,explanation:"0 falsy qiymat, Boolean(0) false."},
   {prompt:"Boolean qiymatlar jufti?",choices:["yes/no","true/false","1/2"],answer:1,explanation:"Boolean true yoki false qiymatini oladi."}]},
  {id:2,title:"Massivlar",subtitle:"Array amallari",questions:[
   {prompt:"Massiv oxiriga element qo‘shish?",choices:["shift()","push()","slice()"],answer:1,explanation:"push() oxiriga yangi element qo‘shadi."},
   {prompt:"Array uzunligi?",choices:["count","size","length"],answer:2,explanation:"Elementlar soni array.length bilan olinadi."},
   {prompt:"Yangi massiv qaytaradigan metod?",choices:["map()","pop()","alert()"],answer:0,explanation:"map() callback asosida yangi massiv qaytaradi."}]},
  {id:3,title:"Funksiyalar",subtitle:"Qaytarish va async",questions:[
   {prompt:"Natijani qaytarish kalit so‘zi?",choices:["break","return","send"],answer:1,explanation:"return natijani chaqiruvchiga qaytaradi."},
   {prompt:"Promise natijasini kutish?",choices:["await","defer","hold"],answer:0,explanation:"await Promise yakunlanishini kutadi."},
   {prompt:"Shartni tekshirish?",choices:["if","import","export"],answer:0,explanation:"if shart bajarilishini tekshiradi."}]},
  {id:4,title:"DOM va brauzer",subtitle:"Interfeys bilan ishlash",questions:[
   {prompt:"DOM nimani anglatadi?",choices:["Document Object Model","Data Order Method","Digital Output Mode"],answer:0,explanation:"DOM hujjatni obyektlar daraxti sifatida ifodalaydi."},
   {prompt:"Obyekt xususiyatiga nuqtali murojaat?",choices:["user->name","user.name","user/name"],answer:1,explanation:"Nuqtali yozuv: user.name."},
   {prompt:"O‘zgarmas binding e’lon qilish?",choices:["const","let","var"],answer:0,explanation:"const qayta tayinlashga yo‘l qo‘ymaydi."}]},
  {id:5,title:"Dasturchi sinovi",subtitle:"Bilimlar yakuni",questions:[
   {prompt:"const massiv elementlari o‘zgaradimi?",choices:["Ha, mutatsiya qilish mumkin","Yo‘q, umuman","Faqat raqamlar"],answer:0,explanation:"const binding qayta tayinlanmaydi, ichki elementlar esa mutatsiya bo‘lishi mumkin."},
   {prompt:"Asinxron funksiya odatda nima qaytaradi?",choices:["Promise","CSS","Array shart"],answer:0,explanation:"async funksiya Promise qaytaradi."},
   {prompt:"Turlarni ham tekshiradigan operator?",choices:["==","===","="],answer:1,explanation:"=== tipni va qiymatni tekshiradi."}]}
 ],
 cyber:[
  {id:1,title:"Raqamli gigiyena",subtitle:"Akkauntni asrash",questions:[
   {prompt:"Kuchli parol xususiyati?",choices:["Tug‘ilgan sana","Uzun va noyob","Har yerda bir xil"],answer:1,explanation:"Uzun, noyob parol ishlating; parol menejeri yordam beradi."},
   {prompt:"MFA nima beradi?",choices:["Qo‘shimcha kirish himoyasi","Internet tezligi","Fayl siqish"],answer:0,explanation:"MFA paroldan tashqari qo‘shimcha tasdiq talab qiladi."},
   {prompt:"Bir martalik kodni kimga berish mumkin?",choices:["Hech kimga","Do‘stga","Yordam xizmatiga"],answer:0,explanation:"Bir martalik kodlarni hech kim bilan bo‘lishmang."}]},
  {id:2,title:"Fishingni aniqlash",subtitle:"Shubhali xabarlar",questions:[
   {prompt:"Xat parolni shoshilinch linkda so‘raydi. Nima qilasiz?",choices:["Parolni yuboraman","Mustaqil kanal orqali tekshiraman","Linkni ochaman"],answer:1,explanation:"Rasmiy saytga o‘zingiz kirib tekshiring."},
   {prompt:"Fishing xabar belgisi?",choices:["Kutilmagan shoshiltirish","Siz boshlagan aloqa","Odatiy ish oqimi"],answer:0,explanation:"Shoshiltirish va shubhali domen ogohlantiruvchi belgi."},
   {prompt:"Kutilmagan ilova keldi. Nima qilasiz?",choices:["Ishga tushiraman","Boshqalarga yuboraman","Yuboruvchini boshqa kanal orqali tekshiraman"],answer:2,explanation:"Kutilmagan faylni ochmang; yuboruvchini tasdiqlang."}]},
  {id:3,title:"Tarmoq xavfsizligi",subtitle:"Xavfsiz ulanish",questions:[
   {prompt:"Umumiy Wi-Fi’da to‘g‘ri odat?",choices:["Har sertifikatni qabul qilish","Nozik amallarda ehtiyot bo‘lish","Fayl almashishni yoqish"],answer:1,explanation:"Tarmoqda ehtiyot bo‘ling va HTTPS’dan foydalaning."},
   {prompt:"Brauzer sertifikat xatosida?",choices:["Ogohlantirishni chetlab o‘tmaslik","Baribir davom etish","Parolni sinash"],answer:0,explanation:"Ogohlantirishni chetlab o‘tmang, manzilni tekshiring."},
   {prompt:"Dastur qayerdan olinadi?",choices:["Noma’lum chat","Tasodifiy link","Rasmiy manba"],answer:2,explanation:"Rasmiy manba yoki ishonchli do‘kondan foydalaning."}]},
  {id:4,title:"Ma’lumotlarni himoya qilish",subtitle:"Maxfiylik asoslari",questions:[
   {prompt:"Bir xil parolni ishlatish xavfi?",choices:["Bir sizish ko‘p akkauntni xavfga qo‘yadi","MFA yoqadi","Himoya oshadi"],answer:0,explanation:"Bitta xizmatdagi parol sizishi boshqa hisoblarni ham xavfga qo‘yadi."},
   {prompt:"Yangilanishlar nima uchun kerak?",choices:["Zaifliklarni tuzatishi mumkin","Faqat rang almashtiradi","Parolni bekor qiladi"],answer:0,explanation:"Yangilanishlar xavfsizlik tuzatishlarini olib kelishi mumkin."},
   {prompt:"Shubhali fayl bilan nima qilish kerak?",choices:["Darhol ishga tushirish","Xavfsizlikka xabar berish","Himoyani o‘chirish"],answer:1,explanation:"Faylni ishga tushirmang, xabar bering."}]},
  {id:5,title:"Cyber sinovi",subtitle:"Bo‘lim yakuni",questions:[
   {prompt:"Hash odatda nima uchun ishlatiladi?",choices:["Bir yo‘nalishli xesh qiymati hisoblash","Faylni parol bilan tiklash","Wi-Fi tezlatish"],answer:0,explanation:"Xeshlash ma’lumotdan xesh qiymati hisoblaydi; bu shifrlash bilan bir xil emas."},
   {prompt:"Least privilege nimani anglatadi?",choices:["Hammaga admin","Zarur minimal ruxsat","Parolni ulashish"],answer:1,explanation:"Foydalanuvchiga vazifa uchun kerakli eng kam ruxsat beriladi."},
   {prompt:"Maxfiy kalit qayerda saqlanadi?",choices:["Ochiq repoda","Client bundle’da","Himoyalangan secret store’da"],answer:2,explanation:"Maxfiy kalitlarni frontend yoki ochiq repositoryga joylamang."}]}
 ]
};
