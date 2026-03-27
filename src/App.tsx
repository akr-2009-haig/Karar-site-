/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

type Language = {
  code: string;
  label: string;
  dir: 'rtl' | 'ltr';
};

const languages: Language[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'fa', label: 'فارسي', dir: 'rtl' },
  { code: 'zh-CN', label: '普通话(Chinese Simplified)', dir: 'ltr' },
  { code: 'ru', label: 'Русский (Russian)', dir: 'ltr' },
  { code: 'es', label: 'Español (Spanish)', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी (Hindi)', dir: 'ltr' },
  { code: 'pt', label: 'Português (Portuguese)', dir: 'ltr' },
  { code: 'bn', label: 'বাংলা (Bengali)', dir: 'ltr' },
  { code: 'fr', label: 'Français (French)', dir: 'ltr' },
  { code: 'de', label: 'Deutsch (German)', dir: 'ltr' },
  { code: 'ja', label: '日本語 (Japanese)', dir: 'ltr' },
  { code: 'ko', label: '한국어 (Korean)', dir: 'ltr' },
  { code: 'tr', label: 'Türkçe (Turkish)', dir: 'ltr' },
  { code: 'vi', label: 'Tiếng Việt (Vietnamese)', dir: 'ltr' },
  { code: 'it', label: 'Italiano (Italian)', dir: 'ltr' },
  { code: 'pl', label: 'Polski (Polish)', dir: 'ltr' }
];

const translateText = async (text: string, targetLanguage: string) => {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetLanguage,
    dt: 't',
    q: text
  });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Translation request failed');
  }
  const data = await response.json();
  return (data?.[0] ?? []).map((chunk: [string]) => chunk[0]).join('');
};

export default function App() {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('ar');
  const [translationError, setTranslationError] = useState('');
  const translatableRef = useRef<HTMLDivElement>(null);
  const originalTextsRef = useRef<string[]>([]);
  const textNodesRef = useRef<Text[]>([]);
  const translatedCacheRef = useRef<Record<string, string[]>>({});

  const selectedLanguage = useMemo(
    () => languages.find((language) => language.code === currentLang) ?? languages[1],
    [currentLang]
  );

  useEffect(() => {
    if (!translatableRef.current || textNodesRef.current.length > 0) {
      return;
    }

    const walker = document.createTreeWalker(translatableRef.current, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    const originalTexts: string[] = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      const textNode = currentNode as Text;
      const content = textNode.textContent ?? '';
      const trimmed = content.trim();
      if (trimmed && /[\p{L}\p{N}]/u.test(trimmed)) {
        textNodes.push(textNode);
        originalTexts.push(content);
      }
      currentNode = walker.nextNode();
    }

    textNodesRef.current = textNodes;
    originalTextsRef.current = originalTexts;
  }, []);

  useEffect(() => {
    const applyLanguage = async () => {
      const dir = selectedLanguage.dir;
      document.documentElement.lang = currentLang;
      document.documentElement.dir = dir;

      if (currentLang === 'ar') {
        textNodesRef.current.forEach((node, index) => {
          node.textContent = originalTextsRef.current[index];
        });
        setTranslationError('');
        return;
      }

      if (!originalTextsRef.current.length) {
        return;
      }

      setTranslationError('');

      try {
        if (!translatedCacheRef.current[currentLang]) {
          const translated = await Promise.all(
            originalTextsRef.current.map((originalText) => translateText(originalText, currentLang))
          );
          translatedCacheRef.current[currentLang] = translated;
        }

        const cachedTranslation = translatedCacheRef.current[currentLang];
        textNodesRef.current.forEach((node, index) => {
          node.textContent = cachedTranslation[index] ?? originalTextsRef.current[index];
        });
      } catch {
        setTranslationError('تعذر تحميل الترجمة الآن، حاول مرة أخرى.');
      }
    };

    void applyLanguage();
  }, [currentLang, selectedLanguage.dir]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans" dir={selectedLanguage.dir}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">MakeronBot</span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium max-w-40 truncate">{selectedLanguage.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-y-auto">
                <div className="py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang(lang.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`block w-full text-right px-4 py-2 text-sm ${currentLang === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main ref={translatableRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {translationError && (
          <p className="mb-4 rounded-md bg-red-50 text-red-700 px-4 py-2 text-sm">
            {translationError}
          </p>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100">
            📜 شروط الخدمة لخدمات MakeronBot
          </h1>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            
            <section>
              <p className="mb-4">
                نؤمن في خدمات Maker On بأهمية حماية بيانات المستخدمين وخصوصيتهم. لهذا السبب، نلتزم بجمع البيانات العامة فقط، مثل معرف الحساب واسم الحساب واسم المستخدم، ونستخدم هذه المعلومات فقط لأغراض تقديم الخدمة دون مشاركتها مع أي طرف ثالث، ودون استخدامها في الإعلانات أو التسويق بأي شكل من الأشكال.
              </p>
              <p className="mb-4">
                تشفير البيانات يمثل جزءًا أساسيًا من التزامنا بحماية المعلومات. يتم تشفير جميع البيانات التي نتعامل معها لضمان أمانها وسريتها. نسعى جاهدين لحماية معلوماتك من أي وصول غير مصرح به، ونعمل باستمرار على تحسين نظم الأمان لضمان أعلى مستويات الحماية.
              </p>
              <p className="mb-4">
                خصوصية بيانات البوت تحظى بأولوية لدينا؛ فنحن لا نطلب ولا نصل إلى بيانات البوت الخاص بك بأي شكل من الأشكال. نلتزم بالخصوصية الكاملة والامتثال للقوانين المتعلقة بحماية البيانات.
              </p>
              <p className="mb-4">
                لأجل الاستخدام الآمن والمسؤول لخدماتنا، يُمنع استخدام البوتات في نشر أي محتوى غير لائق، أو الترويج لأنشطة غير قانونية، أو محاولة جمع بيانات شخصية من المستخدمين دون إذنهم الصريح. نحتفظ بحق حظر أو تجميد أي بوت ينتهك شروط الاستخدام بهدف الحفاظ على بيئة آمنة لجميع المستخدمين.
              </p>
              <p>
                نحن لا نشارك بياناتك مع أطراف ثالثة، ولكن بعض البوتات قد تستخدم خدمات خارجية، مثل تحسين التجارب التفاعلية أو تحسين الصور، ويتم ذلك مع مراعاة عدم نقل أي معلومات شخصية حساسة. ومع ذلك، نوصيك بمراجعة سياسات الخصوصية الخاصة بهذه الأطراف الثالثة لضمان فهمك لكيفية تعاملهم مع البيانات.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔄</span> التعديلات
              </h2>
              <p>
                نحتفظ بالحق في تعديل هذه السياسة حسب الحاجة لضمان تحسين حماية الخصوصية. سيتم إشعارك بأي تغييرات مهمة لضمان أنك على علم بتحديثات سياساتنا.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📊</span> جمع البيانات واستخدامها
              </h2>
              <p className="mb-2">لا نقوم بجمع أو تخزين أي بيانات حساسة. البيانات التي نجمعها تقتصر فقط على البيانات العامة مثل:</p>
              <ul className="list-disc list-inside mb-2 space-y-1 text-gray-600 pr-4">
                <li>معرف الحساب (ID)</li>
                <li>اسم الحساب</li>
                <li>اسم المستخدم</li>
              </ul>
              <p>
                هذه البيانات العامة تُستخدم فقط لأغراض تقديم الخدمة ولا يتم مشاركتها مع أي طرف ثالث. كما أننا لا نستخدم بيانات المستخدم في أي إعلانات أو أغراض تسويقية.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔐</span> تشفير البيانات
              </h2>
              <p>
                نحن نلتزم بحماية بيانات المستخدمين، ويتم تشفير جميع البيانات التي نقوم بمعالجتها لضمان الأمان والخصوصية. نسعى دائمًا للحفاظ على سرية بيانات المستخدمين وحمايتها من أي وصول غير مصرح به.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>⚠️</span> مسؤولية الاستخدام
              </h2>
              <p>
                نحن غير مسؤولين عن أي سوء استخدام للبوتات التي يتم إنشاؤها عبر خدماتنا. كل مسؤولية تقع على عاتقك كمستخدم في الالتزام بجميع القوانين المعمول بها أثناء استخدام البوتات.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔒</span> الخصوصية وحماية بيانات البوت
              </h2>
              <p>
                نحن لا نطلب أو نصل إلى بيانات البوت الخاص بك بأي شكل من الأشكال. نحن نلتزم بحماية الخصوصية والأمان، والامتثال للقوانين المتعلقة بحماية البيانات.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>⚖️</span> الاستخدام القانوني للبوتات
              </h2>
              <p className="mb-2">
                عند استخدام خدماتنا لإنشاء أو إدارة بوتات على تيليجرام، يجب عليك الالتزام بجميع القوانين المحلية والدولية ذات الصلة. يُمنع استخدام البوتات للأغراض التالية:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 pr-4">
                <li>نشر المحتوى غير اللائق أو المسيء</li>
                <li>الترويج لأنشطة غير قانونية أو توجيه تهديدات</li>
                <li>جمع أو طلب معلومات شخصية من المستخدمين دون الحصول على موافقتهم الصريحة</li>
                <li>نشر أو توزيع أي محتوى إباحي أو مسيء</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🌐</span> الطرف الثالث
              </h2>
              <p className="mb-4">
                بعض البوتات التي يتم إنشاؤها باستخدام خدماتنا قد تستخدم خدمات مقدمة من طرف ثالث مثل ChatGPT لتحسين التجارب التفاعلية أو خدمات تحسين الصور. في هذه الحالات، من الممكن أن يقوم الطرف الثالث بمعالجة البيانات التي تقدمها إلى البوت.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-blue-500">🔹</span> المشاركة مع الطرف الثالث
              </h3>
              <p className="mb-4">
                نحن لا نشارك أي بيانات شخصية متعلقة بك مع الطرف الثالث. أي معلومات ترسلها إلى الطرف الثالث عبر البوت، مثل الرسائل أو الصور، تُرسل دون ربطها ببيانات شخصية مثل معرف الحساب أو اسم المستخدم أو أي معلومات خاصة أخرى.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-blue-500">🔹</span> مسؤولية الطرف الثالث
              </h3>
              <p className="mb-4">
                على الرغم من أننا نحرص على التعامل مع خدمات موثوقة، قد يقوم الطرف الثالث باستخدام البيانات المرسلة بطرق تختلف عن سياساتنا. نحن لسنا مسؤولين عن أي سوء استخدام للبيانات من قبل الأطراف الثالثة. يجب عليك مراجعة شروط الخدمة وسياسات الخصوصية الخاصة بالأطراف الثالثة.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-blue-500">🔹</span> البيانات المرسلة
              </h3>
              <p>
                البيانات التي يتم إرسالها إلى الطرف الثالث تقتصر على المحتوى الذي تقدمه بشكل مباشر، مثل الرسائل أو الصور. لا يتم إرسال معلومات حسابك مثل الاسم أو معرف الحساب أو أي بيانات شخصية أخرى.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🚫</span> الحق في الحظر أو التجميد
              </h2>
              <p>
                نحتفظ بالحق في حظر أو تجميد أي بوت تم إنشاؤه باستخدام خدمات Maker On إذا كان ينتهك شروط الاستخدام الخاصة بنا.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📜</span> الالتزام بشروط تيليجرام
              </h2>
              <p>
                إن استخدامك لخدماتنا يتطلب الالتزام أيضًا بشروط خدمة تيليجرام. أي انتهاك لشروط خدمة تيليجرام سيؤدي إلى تعليق أو إلغاء الوصول إلى الخدمة. يمكنك الاطلاع على شروط خدمة تيليجرام من خلال الرابط التالي: <a href="https://telegram.org/tos" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">رابط إلى شروط الخدمة</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔄</span> تعديل الشروط
              </h2>
              <p>
                نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسيتم إعلامك بأي تغييرات مهمة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>⚠️</span> إخلاء المسؤولية
              </h2>
              <p>
                نقدم الخدمة "كما هي" دون أي ضمانات. نحن غير مسؤولين عن أي أضرار ناتجة عن استخدامك للخدمة أو البوتات.
              </p>
            </section>

            <div className="my-10 border-t border-gray-200"></div>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>💰</span> سياسة التسعير والإعلانات لخدمات Maker On
              </h2>
              <p className="mb-4">
                تقدم خدمات Maker On إمكانية إنشاء وإدارة بوتات مجانية بالكامل، حيث يتم عرض إعلانات عشوائية داخل البوتات لدعم استمرار الخدمة وتطويرها. نحن ملتزمون بعدم مشاركة أي بيانات شخصية مع المعلنين.
              </p>
              <p className="mb-8">
                للحصول على تجربة بدون إعلانات، يمكنك الاشتراك في الخدمة المدفوعة مقابل 2 دولار شهريًا عبر بوت خدمات <a href="https://t.me/MakSLOnBot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Maker On</a>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📢</span> الإعلانات
                  </h3>
                  <p className="mb-2">
                    تُعتبر الإعلانات جزءًا أساسيًا في منظومة بوتات Maker On، حيث تساعد في تشغيل واستمرارية الخدمة.
                  </p>
                  <p className="mb-4">
                    بفضل الإعلانات، نستطيع تقديم الخدمة مجانًا مع الحفاظ على جودة الأداء.
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6 flex items-center gap-2">
                    <span>⚙️</span> كيف تعمل الإعلانات
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 pr-4">
                    <li>تظهر أثناء الاستخدام بشكل غير مزعج</li>
                    <li>قد يُطلب الاشتراك في قناة معينة</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>🚫</span> البوتات المستثناة من الإعلانات
                  </h3>
                  <ul className="list-disc list-inside mb-2 space-y-1 text-gray-600 pr-4">
                    <li>بوت التواصل</li>
                    <li>بوت الأزرار</li>
                    <li>بوت إدارة الحساب</li>
                    <li>البوتات الخفيفة</li>
                  </ul>
                  <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    نلتزم بعدم تغيير هذا القرار.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📏</span> ضوابط الإعلانات
                </h3>
                <p>
                  نلتزم بعدم عرض أي محتوى مخالف أو غير لائق، وعدم الترويج لبوتات منافسة.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span>💳</span> الاشتراكات المدفوعة
                  </h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      السعر: يبدأ من 2 دولار شهريًا
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      غير قابل للاسترداد
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      يمكن الإلغاء في أي وقت
                    </li>
                  </ul>
                  <p className="mt-4 text-sm font-medium text-blue-700 flex items-start gap-2">
                    <span>📌</span>
                    <span>ملاحظة: صانع البوتات لا يدعم الاشتراك المدفوع حاليًا.</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>🔄</span> سياسة الاسترداد
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 pr-4">
                      <li>لا يوجد استرداد</li>
                      <li>جميع المدفوعات نهائية</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>❌</span> إلغاء الاشتراك
                    </h3>
                    <p className="text-gray-600">
                      يمكنك الإلغاء في أي وقت، مع الاستمرار حتى نهاية الفترة المدفوعة.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📌</span> ملاحظات نهائية
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 pr-4">
                  <li>هذه الصفحة قابلة للتحديث في أي وقت.</li>
                  <li>يحق لفريق Maker On اتخاذ قرار الحظر عند إساءة الاستخدام.</li>
                </ul>
              </div>

            </section>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} MakeronBot. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
