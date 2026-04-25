import { Injectable } from '@nestjs/common';

import { DrizzleService } from '../drizzle.service';
import { appSettings } from '../schemas/app/app-settings';

const TERMS_EN = `TERMS AND CONDITIONS

Last updated: 25 April 2026

1. INTRODUCTION
These Terms and Conditions ("Terms") govern your access to and use of the Sakkan mobile application and related services (the "Service"), operated by us. By creating an account, listing a property, or otherwise using the Service, you agree to be bound by these Terms. If you do not agree, you must not use the Service.

2. ELIGIBILITY AND ACCOUNTS
You must be at least 18 years old and legally able to enter into a contract. You are responsible for the accuracy of information you provide, including your name, contact details, and verification materials. You must keep your login credentials secure and notify us immediately of any unauthorized use.

3. PROPERTY LISTINGS
3.1 You may only list properties that you are lawfully entitled to advertise (e.g. as owner, licensed agent, or with written authorization).
3.2 Listings must describe the property truthfully, including area, price, status (for sale, rent, etc.), and any material facts. Misleading, duplicate, or fraudulent listings are prohibited.
3.3 We may review, remove, or refuse any listing that violates these Terms, applicable law, or our community guidelines, without prior notice where permitted by law.
3.4 Maps, images, and descriptions are provided by users. We do not warrant the accuracy of third-party or user-generated content on the map or in search results.

4. USER CONDUCT
You agree not to: (a) harass, defame, or defraud other users; (b) scrape, overload, or disrupt the Service; (c) use the Service for money laundering, spam, or illegal activities; (d) post discriminatory or offensive content. We may suspend or terminate accounts that breach these rules.

5. SUBSCRIPTIONS, CREDITS, AND PAYMENTS
Certain features (e.g. serious requests, featured ads, or subscriptions) may require payment. Fees, billing cycles, and refund rules are shown at the time of purchase. Unless stated otherwise, fees are in Egyptian Pounds (EGP) and may change with notice for future periods. You authorize us and our payment partners to charge the payment method you provide.

6. INTELLECTUAL PROPERTY
The Service, including its design, logos, and software, is protected by copyright and other laws. You retain ownership of content you upload but grant us a non-exclusive, worldwide license to host, display, and distribute that content in connection with the Service.

7. DISCLAIMERS
The Service is provided "as is." We are a platform that connects property seekers and listers. We are not a party to any transaction between users, and we do not guarantee that any listing will result in a sale, lease, or investment. You are solely responsible for verifying property details, legal title, and compliance with local regulations before entering into any agreement.

8. LIMITATION OF LIABILITY
To the maximum extent permitted by law, we shall not be liable for indirect, incidental, special, or consequential damages, or for loss of profits, data, or goodwill. Our total liability for any claim arising from these Terms or the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim, or one hundred EGP (EGP 100) if you have not paid us, whichever is greater.

9. CHANGES
We may update these Terms from time to time. We will post the revised Terms in the app or on our website and update the "Last updated" date. Continued use after changes constitutes your acceptance, except where we are required to obtain your explicit consent.

10. CONTACT
For questions about these Terms, contact us using the support phone number and email shown in the app settings.

By using Sakkan, you acknowledge that you have read and understood these Terms and agree to be bound by them.`;

const TERMS_AR = `الشروط والأحكام

آخر تحديث: 25 أبريل 2026

1. مقدمة
تُنظِّم هذه الشروط والأحكام ("الشروط") وصولك إلى تطبيق سكن للهاتف المحمول والخدمات ذات الصلة ("الخدمة") واستخدامك لها. بإنشاء حساب أو إدراج عقار أو استخدام الخدمة بأي شكلٍ آخر، فإنك توافق على الالتزام بهذه الشروط. وإن لم تكن موافقاً، يتعيّن عليك عدم استخدام الخدمة.

2. الأهلية والحسابات
يجب أن تكون قد بلغت الثامنة عشرة من العمر على الأقل وقادراً قانونياً على إبرام عقد. أنت مسؤول عن دقة المعلومات التي تقدّمها، بمن في ذلك اسمك وبيانات الاتصال ومواد التحقق. يجب الحفاظ على أمان بيانات تسجيل الدخول وإشعارنا فوراً بأي استخدام غير مصرّح به.

3. قوائم العقارات
3.1 لا يجوز لك إدراج إلا عقارات تملك أحقية الإعلان عنها بشكل قانوني (مثلاً كمالك، أو وكيل مرخّص، أو بتفويض كتابي).
3.2 يجب أن تصف القوائم العقار بصدق، بما في ذلك المساحة والسعر والحالة (للبيع، للإيجار، إلخ) وأي حقائق جوهرية. يُحظَر القوائم المضلِّلة أو المكرّرة أو الاحتيالية.
3.3 قد نراجع أو نزيل أو نرفض أي إدراج يخالف هذه الشروط أو القانون أو إرشادات مجتمعنا، دون إشعارٍ مسبق حيث يسمح القانون بذلك.
3.4 الخرائط والصور والوصف مقدّمة من المستخدمين. لا نضمن دقة محتوى أطراف ثالثة أو مُولَّد من المستخدمين على الخريطة أو في نتائج البحث.

4. سلوك المستخدم
توافق على عدم: (أ) مضايقة أو تشهير أو تضليل مستخدمين آخرين؛ (ب) سحب البيانات بشكلٍ مفرط أو عرقلة أو الإخلال بالخدمة؛ (ج) استخدام الخدمة لغسل الأموال أو الرسائل غير المرغوب فيها أو أنشطة غير قانونية؛ (د) نشر محتوى تمييزياً أو مسيئاً. قد نعلّق الحسابات أو نُنهيها عند مخالفة هذه القواعد.

5. الاشتراكات والرصيد والمدفوعات
قد تتطلب ميزات معيّنة (مثل الطلبات الجدية، أو الإعلانات المميّزة، أو الاشتراكات) دفعاً. تُعرَض الرسوم ودورات الفوترة وقواعد الاسترداد عند الشراء. ما لم يُنصّ على خلاف ذلك، تكون الرسوم بالجنيه المصري (ج.م) وقد تتغيّر بإشعارٍ للفترات المستقبلية. تفوّضنا وشركاء الدفع لدينا بخصم طريقة الدفع التي تقدّمها.

6. الملكية الفكرية
الخدمة، بما فيها التصميم والشعارات والبرمجيات، محميّة بموجب حقوق الملكية وغيرها. تحتفظ بملكية المحتوى الذي ترفعونه، ولا نمنحك إلا ترخيصاً غير حصري وعالمياً لاستضافته وعرضه وتوزيعه في إطار الخدمة.

7. إخلاء المسؤولية
تُقدَّم الخدمة "كما هي". نحن منصة تربط الباحثين عن العقارات والمعلنين. لسنا طرفاً في أي تعاملٍ بين المستخدمين ولا نضمن أن يؤدي أي إدراجٍ إلى بيع أو إيجار أو استثمار. تتحمّل وحدك التحقق من تفاصيل العقار والملكية والامتثال للوائح المحلية قبل إبرام أي اتفاق.

8. حدود المسؤولية
وبقدرٍ يسمح به القانون، لا نتحمّل الأضرار غير المباشرة أو العارضة أو الخاصة أو التبعية، أو فقدان الأرباح أو البيانات أو السمعة. لا تتجاوز مسؤوليتنا الإجمالية عن أي مطالبة ناشئة عن هذه الشروط أو الخدمة المبلغ الذي دفعته لنا في الاثني عشر (12) شهراً السابقة للمطالبة، أو مائة جنيه (100 ج.م) إن لم تدفع لنا، أيهما أكبر.

9. التعديلات
قد نُحدِّث هذه الشروط من حينٍ لآخر. سنوافيك بالشروط المُراجعة داخل التطبيق أو على موقعنا ونُحدِّث تاريخ "آخر تحديث". الاستمرار في الاستخدام بعد التغييرات يُعَدّ قبولاً، إلا إذا اقتضى القانون موافقة صريحة.

10. الاتصال
للاستفسار حول هذه الشروط، يرجى الاتصال بنا باستخدام رقم الدعم والبريد الإلكتروني المعروضان في إعدادات التطبيق.

باستخدامك لتطبيق سكن، تُقرّ بأنك قرأت هذه الشروط وفهمتها وتوافق على الالتزام بها.`;

@Injectable()
export class AppSettingsSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('Seeding app settings...');

    await db.delete(appSettings);

    await db.insert(appSettings).values({
      id: 1,
      phones: ['+201559005418'],
      email: 'Sakan.Offical7@gmail.com',
      termsAndConditionsEn: TERMS_EN,
      termsAndConditionsAr: TERMS_AR,
    });

    console.log('App settings seeded');
  }
}
