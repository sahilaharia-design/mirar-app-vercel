-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Seed v3 Translations: Hindi + Gujarati for the v3 simplified questions
-- Covers Days 9–28, including Day 12 (unlocked — see seed_v3_simplified_questions.sql).
-- Run AFTER seed_v3_simplified_questions.sql. Native script only — no
-- Latin-transliteration bleed. Idempotent — safe to run repeatedly.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Day 9 ────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगर आज हर ''चाहिए'' हटा दूँ, तो क्या बचेगा?',
  prompt_text_gu = 'જો આજે દરેક ''જોઈએ'' હટાવી દઉં, તો શું બચે?',
  mirror_glimmer_hi = 'ज़िम्मेदारी रुकने पर जो बचता है, वो ध्यान देने लायक है।',
  mirror_glimmer_gu = 'જવાબદારી અટકે ત્યારે જે બચે છે, એ નોંધવા જેવું છે.',
  tomorrow_tease_hi = 'कल: छोड़ने से आपको किस बात का डर लगता है।',
  tomorrow_tease_gu = 'આવતી કાલે: છોડવાથી તમને શાનો ડર લાગે છે.'
WHERE day_number = 9;

UPDATE options SET option_text_hi = 'सन्नाटा। पक्का नहीं कि मैं असल में क्या चाहता हूँ।', option_text_gu = 'શાંતિ. ખાતરી નથી કે હું ખરેખર શું ઇચ્છું છું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 9);
UPDATE options SET option_text_hi = 'अपराधबोध। जैसे मैं लोगों को निराश कर रहा हूँ।', option_text_gu = 'અપરાધભાવ. જાણે હું લોકોને નિરાશ કરું છું.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 9);
UPDATE options SET option_text_hi = 'राहत, फिर समझ नहीं आता क्या करूँ उसका।', option_text_gu = 'રાહત, પછી ખબર ન પડે એનું શું કરવું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 9);
UPDATE options SET option_text_hi = 'कुछ चीज़ें जो मुझे सच में पसंद हैं, ज़िम्मेदारियों में दबी हुई।', option_text_gu = 'થોડી વસ્તુઓ જે મને ખરેખર ગમે છે, જવાબદારીઓ નીચે દબાયેલી.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 9);
UPDATE options SET option_text_hi = 'एक साफ़ मैं — मुझे पहले से पता है क्या मायने रखता है।', option_text_gu = 'એક સ્પષ્ટ હું — મને પહેલેથી ખબર છે શું મહત્વનું છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 9);

-- ── Day 10 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'जो अब फ़िट नहीं बैठता, उसे छोड़ने से किस बात का डर लगता है?',
  prompt_text_gu = 'જે હવે બંધબેસતું નથી, એને છોડવાનો શાનો ડર લાગે છે?',
  mirror_glimmer_hi = 'छोड़ने का डर बताता है कि हम अभी भी क्या थामे हुए हैं।',
  mirror_glimmer_gu = 'છોડવાનો ડર બતાવે છે કે આપણે હજુ શું પકડી રાખ્યું છે.',
  tomorrow_tease_hi = 'कल: एक अनकहा नियम जिसने आपकी ज़िंदगी को आकार दिया है।',
  tomorrow_tease_gu = 'આવતી કાલે: એક અણકહ્યો નિયમ જેણે તમારી જિંદગી ઘડી છે.'
WHERE day_number = 10;

UPDATE options SET option_text_hi = 'खो जाऊँगा जैसा लगेगा। बिना उसके पता नहीं कौन हूँ।', option_text_gu = 'ખોવાયેલો લાગીશ. એના વગર કોણ છું ખબર નહીં પડે.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 10);
UPDATE options SET option_text_hi = 'लोग निराश हो जाएँगे।', option_text_gu = 'લોકો નિરાશ થશે.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 10);
UPDATE options SET option_text_hi = 'फिर से शुरू करना पड़ेगा। यही डराता है।', option_text_gu = 'ફરી શરૂઆત કરવી પડશે. એ જ ડરાવે છે.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 10);
UPDATE options SET option_text_hi = 'समझ आएगा कि बहुत देर तक थामे रखा।', option_text_gu = 'સમજાશે કે બહુ લાંબુ પકડી રાખ્યું.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 10);
UPDATE options SET option_text_hi = 'हल्का। डरा हुआ, पर हल्का।', option_text_gu = 'હલકું. ડરેલું, પણ હલકું.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 10);

-- ── Day 11 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'कौन-सा अनकहा नियम आपकी ज़िंदगी को चलाता है?',
  prompt_text_gu = 'કયો અણકહ્યો નિયમ તમારી જિંદગી ચલાવે છે?',
  mirror_glimmer_hi = 'अनकहे नियम सबसे गहरे बैठते हैं।',
  mirror_glimmer_gu = 'અણકહ્યા નિયમો સૌથી ઊંડે બેસે છે.',
  tomorrow_tease_hi = 'कल: जब आपकी सच्चाई किसी को समझ न आए, तब क्या होता है।',
  tomorrow_tease_gu = 'આવતી કાલે: તમારી સચ્ચાઈ કોઈને ન સમજાય ત્યારે શું થાય છે.'
WHERE day_number = 11;

UPDATE options SET option_text_hi = 'मुझे हमेशा मज़बूत रहना चाहिए।', option_text_gu = 'મારે હંમેશા મજબૂત રહેવું જોઈએ.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 11);
UPDATE options SET option_text_hi = 'सफलता मतलब सबका पसंदीदा बनना।', option_text_gu = 'સફળતા એટલે બધાનું ગમતું બનવું.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 11);
UPDATE options SET option_text_hi = 'खुद को पहले रखना स्वार्थ है।', option_text_gu = 'પોતાને પહેલા રાખવું સ્વાર્થ છે.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 11);
UPDATE options SET option_text_hi = 'अकेले सँभालना ज़्यादा सुरक्षित है।', option_text_gu = 'એકલા સંભાળવું વધુ સલામત છે.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 11);
UPDATE options SET option_text_hi = 'मैं इन नियमों पर सवाल उठाने लगा हूँ।', option_text_gu = 'હું આ નિયમો પર સવાલ ઉઠાવવા લાગ્યો છું.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 11);

-- ── Day 12 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'जब आपकी सच्चाई किसी को समझ नहीं आई, तो आपने आगे क्या किया?',
  prompt_text_gu = 'તમારી સચ્ચાઈ કોઈને ન સમજાય ત્યારે, તમે આગળ શું કર્યું?',
  mirror_glimmer_hi = 'टकराव के बाद हम कैसे प्रतिक्रिया देते हैं, वही बताता है कि हम कहाँ खड़े हैं।',
  mirror_glimmer_gu = 'ટકરાવ પછી આપણે કેવો પ્રતિભાવ આપીએ છીએ, એ જ બતાવે છે કે આપણે ક્યાં ઊભા છીએ.',
  tomorrow_tease_hi = 'कल: आपका कौन-सा हिस्सा धीरे-धीरे मद्धम पड़ता जा रहा है।',
  tomorrow_tease_gu = 'આવતી કાલે: તમારો કયો ભાગ ધીરે ધીરે ઝાંખો પડી રહ્યો છે.'
WHERE day_number = 12;

UPDATE options SET option_text_hi = 'मैं खुद को छोटा दिखाने लगा। अपनी सच्चाई नरम कर दी।', option_text_gu = 'હું પોતાને નાનો બતાવવા લાગ્યો. મારી સચ્ચાઈ નરમ કરી.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 12);
UPDATE options SET option_text_hi = 'मैं चुप हो गया और कुछ समय दोबारा कोशिश नहीं की।', option_text_gu = 'હું ચૂપ થઈ ગયો અને થોડો સમય ફરી પ્રયત્ન ન કર્યો.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 12);
UPDATE options SET option_text_hi = 'अंदर से आहत होकर भी मैं बचाव में अड़ गया।', option_text_gu = 'અંદરથી દુભાયેલો હોવા છતાં હું બચાવમાં અડગ રહ્યો.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 12);
UPDATE options SET option_text_hi = 'शांत रहा, पर दिनों तक उसे दोहराता रहा दिमाग में।', option_text_gu = 'શાંત રહ્યો, પણ દિવસો સુધી મનમાં એ વાગોળતો રહ્યો.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 12);
UPDATE options SET option_text_hi = 'नरमी से अपनी बात पर टिका रहा, भले असहज लगा।', option_text_gu = 'નમ્રતાથી મારી વાત પર ટકી રહ્યો, ભલે અસ્વસ્થ લાગ્યું.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 12);


-- ── Day 13 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'आपका कौन-सा हिस्सा धीरे-धीरे मद्धम पड़ता जा रहा है?',
  prompt_text_gu = 'તમારો કયો ભાગ ધીરે ધીરે ઝાંખો પડી રહ્યો છે?',
  mirror_glimmer_hi = 'मद्धम पड़ना एक संकेत है, फैसला नहीं।',
  mirror_glimmer_gu = 'ઝાંખું પડવું એ સંકેત છે, ચુકાદો નહીં.',
  tomorrow_tease_hi = 'कल: सिर्फ़ जीने की जद्दोजहद छोड़ें तो क्या उभर सकता है?',
  tomorrow_tease_gu = 'આવતી કાલે: ફક્ત ટકી રહેવાનું છોડો તો શું ઉભરી શકે?'
WHERE day_number = 13;

UPDATE options SET option_text_hi = 'मेरी ऊर्जा। आराम करने पर भी थका रहता हूँ।', option_text_gu = 'મારી ઊર્જા. આરામ કરું તોય થાકેલો રહું છું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 13);
UPDATE options SET option_text_hi = 'मेरी जिज्ञासा। पहले ज़्यादा चीज़ों की परवाह होती थी।', option_text_gu = 'મારી જિજ્ઞાસા. પહેલા વધુ વસ્તુઓની પરવા હતી.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 13);
UPDATE options SET option_text_hi = 'खुद पर भरोसा। जवाब के लिए दूसरों से पूछता रहता हूँ।', option_text_gu = 'મારો સ્વ-વિશ્વાસ. જવાબ માટે બીજાને પૂછતો રહું છું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 13);
UPDATE options SET option_text_hi = 'मेरी भावनाएँ। खुद को बचाने के लिए सुन्न हो गया हूँ।', option_text_gu = 'મારી લાગણીઓ. પોતાને બચાવવા સુન્ન થઈ ગયો છું.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 13);
UPDATE options SET option_text_hi = 'कुछ छोटा-सा लौट रहा है। महसूस हो रहा है।', option_text_gu = 'કંઈક નાનું પાછું આવી રહ્યું છે. મને લાગે છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 13);

-- ── Day 14 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'बस जीवित रहने की जद्दोजहद छोड़ें तो कौन सामने आता है?',
  prompt_text_gu = 'ફક્ત ટકી રહેવાનું છોડો તો કોણ સામે આવે?',
  mirror_glimmer_hi = 'सर्वाइवल मोड तब तक काम का है, जब तक ज़रूरत हो।',
  mirror_glimmer_gu = 'સર્વાઇવલ મોડ જરૂર હોય ત્યાં સુધી જ કામનું છે.',
  tomorrow_tease_hi = 'कल से स्टेज 3 शुरू। आप कहाँ पहले से बदलना शुरू कर चुके हैं?',
  tomorrow_tease_gu = 'આવતી કાલથી સ્ટેજ 3 શરૂ. તમે ક્યાં પહેલેથી બદલાવા લાગ્યા છો?'
WHERE day_number = 14;

UPDATE options SET option_text_hi = 'कोई ज़्यादा नरम। कम कवच, ज़्यादा खुला हुआ।', option_text_gu = 'કોઈ વધુ નરમ. ઓછું બખ્તર, વધુ ખુલ્લું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 14);
UPDATE options SET option_text_hi = 'कोई ज़्यादा बहादुर। मैं खुद को छोटा दिखाता रहा हूँ।', option_text_gu = 'કોઈ વધુ બહાદુર. હું પોતાને નાનો બતાવતો રહ્યો છું.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 14);
UPDATE options SET option_text_hi = 'कोई साफ़ सोच वाला। दूसरों की उम्मीदों में दबा हुआ हूँ।', option_text_gu = 'કોઈ સ્પષ્ટ. બીજાની અપેક્ષાઓ નીચે દબાયેલો છું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 14);
UPDATE options SET option_text_hi = 'अभी पक्का नहीं। कुछ बदल रहा है।', option_text_gu = 'હજુ ખાતરી નથી. કંઈક બદલાઈ રહ્યું છે.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 14);
UPDATE options SET option_text_hi = 'कोई जो हमेशा से मैं था — उसके करीब।', option_text_gu = 'કોઈ જે હંમેશા હું હતો — એની નજીક.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 14);

-- ── Day 15 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'कहाँ आप पहले ही बदलना शुरू कर चुके हैं, पर उसे ''कोई बड़ी बात नहीं'' कहते हैं?',
  prompt_text_gu = 'તમે ક્યાં પહેલેથી બદલાવા લાગ્યા છો, પણ એને ''મોટી વાત નથી'' કહો છો?',
  mirror_glimmer_hi = 'जिन बदलावों को हम छोटा समझते हैं, वो अक्सर सबसे असली होते हैं।',
  mirror_glimmer_gu = 'જે બદલાવોને આપણે નાના ગણીએ, એ ઘણીવાર સૌથી સાચા હોય છે.',
  tomorrow_tease_hi = 'कल: जब कुछ ज़्यादा सच लगे, तो क्या आपको रोकता है।',
  tomorrow_tease_gu = 'આવતી કાલે: કંઈક વધુ સાચું લાગે ત્યારે તમને શું અટકાવે છે.'
WHERE day_number = 15;

UPDATE options SET option_text_hi = 'ज़्यादा ''ना'' कहना, भले अजीब लगे।', option_text_gu = 'વધુ ''ના'' કહેવું, ભલે અજુગતું લાગે.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 15);
UPDATE options SET option_text_hi = 'कुछ लोगों में दिलचस्पी दिखाना बंद कर दिया है।', option_text_gu = 'અમુક લોકોમાં રસ બતાવવાનું બંધ કરી દીધું છે.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 15);
UPDATE options SET option_text_hi = 'जो लोगों के लिए दिखावा करता था, अब वो थका देता है।', option_text_gu = 'લોકો માટે દેખાડો કરતો હતો, હવે એ થકવે છે.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 15);
UPDATE options SET option_text_hi = 'अपने फ़ैसलों की सफ़ाई देना बंद कर दिया है।', option_text_gu = 'મારા નિર્ણયોની સફાઈ આપવાનું બંધ કરી દીધું છે.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 15);
UPDATE options SET option_text_hi = 'अचानक कभी-कभी हल्का महसूस होता है, बिना किसी वजह।', option_text_gu = 'અચાનક ક્યારેક હલકું લાગે છે, કોઈ કારણ વગર.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 15);

-- ── Day 16 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'जब कुछ आपके लिए ज़्यादा सच लगे, तो क्या आपको रोकता है?',
  prompt_text_gu = 'તમારા માટે કંઈક વધુ સાચું લાગે ત્યારે તમને શું અટકાવે છે?',
  mirror_glimmer_hi = 'हिचक और तैयारी अक्सर साथ आते हैं।',
  mirror_glimmer_gu = 'ખચકાટ અને તૈયારી ઘણીવાર સાથે આવે છે.',
  tomorrow_tease_hi = 'कल: पूरी तरह जीने की सोचते ही जो चुपचाप आवाज़ बजती है।',
  tomorrow_tease_gu = 'આવતી કાલે: પૂરેપૂરું જીવવાનું વિચારો ત્યારે અંદર જે શાંત અવાજ વાગે છે.'
WHERE day_number = 16;

UPDATE options SET option_text_hi = 'क्या पता ये बेचैनी भर है, असली बदलाव नहीं?', option_text_gu = 'શું ખબર આ ફક્ત બેચેની હોય, ખરો બદલાવ ન હોય?'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 16);
UPDATE options SET option_text_hi = 'पहले जो कमिटमेंट किया है, वो पूरा करना चाहिए।', option_text_gu = 'પહેલા જે વચન આપ્યું છે એ પૂરું કરવું જોઈએ.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 16);
UPDATE options SET option_text_hi = 'लोग मुझ पर निर्भर हैं। यूँ ही नहीं बदल सकता।', option_text_gu = 'લોકો મારા પર આધાર રાખે છે. એમ જ ન બદલાઈ શકું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 16);
UPDATE options SET option_text_hi = 'शायद अभी सही समय नहीं है।', option_text_gu = 'કદાચ હમણાં યોગ્ય સમય નથી.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 16);
UPDATE options SET option_text_hi = 'अभी भी है, पर अब कम आवाज़ में।', option_text_gu = 'હજુ છે, પણ હવે ધીમા અવાજમાં.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 16);

-- ── Day 17 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'ज़्यादा सच्चाई से जीने की सोचते ही, दिमाग में कौन-सी आवाज़ बजती है?',
  prompt_text_gu = 'વધુ સાચી રીતે જીવવાનું વિચારો ત્યારે મનમાં કયો સંદેશ વાગે છે?',
  mirror_glimmer_hi = 'विरासत में मिले पिछले संदेश जाँचने लायक हैं।',
  mirror_glimmer_gu = 'વારસામાં મળેલા આ સંદેશા તપાસવા લાયક છે.',
  tomorrow_tease_hi = 'कल: भीतर से अलाइनमेंट कैसा महसूस होता है।',
  tomorrow_tease_gu = 'આવતી કાલે: અંદરથી અલાઇનમેન્ટ કેવું લાગે છે.'
WHERE day_number = 17;

UPDATE options SET option_text_hi = 'सावधान रहो। जो बनाया है उसे दांव पर मत लगाओ।', option_text_gu = 'સાવધાન રહો. જે બનાવ્યું છે એને દાવ પર ન લગાવો.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 17);
UPDATE options SET option_text_hi = 'तुम स्वार्थी हो रहे हो। लोगों को तुम्हारी स्थिरता चाहिए।', option_text_gu = 'તમે સ્વાર્થી થઈ રહ્યા છો. લોકોને તમારી સ્થિરતા જોઈએ છે.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 17);
UPDATE options SET option_text_hi = 'इससे ज़्यादा चाहने का हक़ तुम्हें नहीं।', option_text_gu = 'આનાથી વધુ ઇચ્છવાનો તમને હક નથી.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 17);
UPDATE options SET option_text_hi = 'बाद में देखेंगे। पहले ये दौर निकाल लो।', option_text_gu = 'પછી જોઈશું. પહેલા આ તબક્કો પાર કરો.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 17);
UPDATE options SET option_text_hi = 'वो आवाज़ें अभी भी हैं, पर मेरी अपनी आवाज़ तेज़ हो रही है।', option_text_gu = 'એ અવાજો હજુ છે, પણ મારો પોતાનો અવાજ મોટો થઈ રહ્યો છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 17);

-- ── Day 18 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगर पूर्ण नहीं, पर ईमानदारी से जीते, तो कैसा महसूस होता?',
  prompt_text_gu = 'જો સંપૂર્ણ નહીં, પણ પ્રામાણિકતાથી જીવો, તો કેવું લાગે?',
  mirror_glimmer_hi = 'अलाइनमेंट की कल्पना करना भी अपने आप में एक संकेत है।',
  mirror_glimmer_gu = 'અલાઇનમેન્ટની કલ્પના કરવી પણ પોતે એક સંકેત છે.',
  tomorrow_tease_hi = 'कल: वो चुपचाप बोझ जो आप उठाए फिर रहे हैं।',
  tomorrow_tease_gu = 'આવતી કાલે: તમે જે શાંત ભાર ઉપાડી રહ્યા છો.'
WHERE day_number = 18;

UPDATE options SET option_text_hi = 'हल्का। अदृश्य बोझ अब नहीं।', option_text_gu = 'હલકું. અદ્રશ્ય ભાર હવે નહીં.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 18);
UPDATE options SET option_text_hi = 'शांत। दिमाग में कम शोर।', option_text_gu = 'શાંત. મનમાં ઓછો ઘોંઘાટ.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 18);
UPDATE options SET option_text_hi = 'ज़्यादा ज़िंदा। ऊर्जा खुद-ब-खुद लौट आती।', option_text_gu = 'વધુ જીવંત. ઊર્જા આપોઆપ પાછી આવે.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 18);
UPDATE options SET option_text_hi = 'साफ़। फ़ैसले आसान लगते।', option_text_gu = 'સ્પષ્ટ. નિર્ણયો સહેલા લાગે.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 18);
UPDATE options SET option_text_hi = 'शांति और अनिश्चितता। अब कोई दिखावा नहीं।', option_text_gu = 'શાંતિ અને અનિશ્ચિતતા. હવે કોઈ દેખાડો નહીં.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 18);

-- ── Day 19 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'सिर्फ़ जाना-पहचाना होने की वजह से कौन-सा बोझ ढो रहे हैं?',
  prompt_text_gu = 'ફક્ત જાણીતું હોવાને કારણે તમે કયો ભાર ઉપાડી રહ્યા છો?',
  mirror_glimmer_hi = 'जानी-पहचानी चीज़ें बोझ को अदृश्य बना देती हैं।',
  mirror_glimmer_gu = 'જાણીતી વસ્તુઓ ભારને અદ્રશ્ય બનાવે છે.',
  tomorrow_tease_hi = 'कल: कहाँ आपको कुछ करने की हल्की-सी खींच महसूस होती है।',
  tomorrow_tease_gu = 'આવતી કાલે: ક્યાં તમને કંઈક કરવાનું હળવું ખેંચાણ લાગે છે.'
WHERE day_number = 19;

UPDATE options SET option_text_hi = 'दूसरों की भावनाएँ। जो मेरी नहीं, वो भी सोख लेता हूँ।', option_text_gu = 'બીજાની લાગણીઓ. જે મારી નથી એ પણ શોષી લઉં છું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 19);
UPDATE options SET option_text_hi = 'पुराना अपराधबोध, जब कम समझ थी तब लिए फ़ैसलों का।', option_text_gu = 'જૂનો અપરાધભાવ, જ્યારે ઓછી સમજ હતી ત્યારના નિર્ણયોનો.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 19);
UPDATE options SET option_text_hi = 'खुद को बार-बार साबित करने का दबाव।', option_text_gu = 'વારંવાર પોતાને સાબિત કરવાનું દબાણ.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 19);
UPDATE options SET option_text_hi = 'एक छवि जो अब मेरी जैसी नहीं लगती।', option_text_gu = 'એક છબી જે હવે મારા જેવી લાગતી નથી.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 19);
UPDATE options SET option_text_hi = 'मैं धीरे-धीरे इसे उतार रहा हूँ।', option_text_gu = 'હું ધીરે ધીરે એને ઉતારી રહ્યો છું.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 19);

-- ── Day 20 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'कहाँ कुछ करने की खींच महसूस होती है, पर आप उसे टालते रहते हैं?',
  prompt_text_gu = 'ક્યાં કંઈક કરવાનું ખેંચાણ લાગે છે, પણ તમે એને ટાળતા રહો છો?',
  mirror_glimmer_hi = 'खींच एक संकेत है। आदेश नहीं, संकेत।',
  mirror_glimmer_gu = 'ખેંચાણ એ સંકેત છે. હુકમ નહીં, સંકેત.',
  tomorrow_tease_hi = 'कल: नतीजे पक्के न होने पर क्या डगमगाता है।',
  tomorrow_tease_gu = 'આવતી કાલે: પરિણામ ખાતરીપૂર્વક ન હોય ત્યારે શું ડગમગે છે.'
WHERE day_number = 20;

UPDATE options SET option_text_hi = 'एक बातचीत जिसे मैं टालता रहता हूँ।', option_text_gu = 'એક વાતચીત જે હું ટાળતો રહું છું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 20);
UPDATE options SET option_text_hi = 'एक फ़ैसला जो कर चुका हूँ, पर अमल नहीं किया।', option_text_gu = 'એક નિર્ણય જે લીધો છે, પણ અમલમાં નથી મૂક્યો.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 20);
UPDATE options SET option_text_hi = 'एक सीमा जिसे आख़िरी वक़्त पर नरम कर देता हूँ।', option_text_gu = 'એક હદ જેને છેલ્લી ઘડીએ નરમ કરી દઉં છું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 20);
UPDATE options SET option_text_hi = 'कुछ जो चाहता हूँ, पर ज़ोर से कहा नहीं।', option_text_gu = 'કંઈક જે ઇચ્છું છું, પણ મોટેથી કહ્યું નથી.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 20);
UPDATE options SET option_text_hi = 'कुछ जो पहले ही शुरू हो चुका है। बस अपनाया नहीं अभी।', option_text_gu = 'કંઈક જે પહેલેથી શરૂ થઈ ગયું છે. બસ હજુ અપનાવ્યું નથી.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 20);

-- ── Day 21 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'जब नतीजे पक्के न हों, तो आपका कौन-सा हिस्सा अभी भी डगमगाता है?',
  prompt_text_gu = 'પરિણામ ખાતરીપૂર્વક ન હોય ત્યારે તમારો કયો ભાગ હજુ ડગમગે છે?',
  mirror_glimmer_hi = 'डगमगाना नाकामी नहीं। ये हलचल का संकेत है।',
  mirror_glimmer_gu = 'ડગમગવું નિષ્ફળતા નથી. એ હલચલનો સંકેત છે.',
  tomorrow_tease_hi = 'कल से स्टेज 4 शुरू। आप जो बन रहे हैं, उसमें क्या चुपचाप हैरान करेगा?',
  tomorrow_tease_gu = 'આવતી કાલથી સ્ટેજ 4 શરૂ. તમે જે બની રહ્યા છો એમાં શું શાંતિથી નવાઈ પમાડશે?'
WHERE day_number = 21;

UPDATE options SET option_text_hi = 'वो हिस्सा जो हिलने से पहले पक्का होना चाहता है।', option_text_gu = 'એ ભાગ જે હલવા પહેલા ખાતરી ઇચ્છે છે.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 21);
UPDATE options SET option_text_hi = 'वो हिस्सा जो सोचता है सुरक्षा मतलब छोटा बने रहना।', option_text_gu = 'એ ભાગ જે માને છે સલામતી એટલે નાના રહેવું.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 21);
UPDATE options SET option_text_hi = 'बाहर से आत्मविश्वासी दिखता हूँ, अंदर से हिला हुआ।', option_text_gu = 'બહારથી આત્મવિશ્વાસુ દેખાઉં છું, અંદરથી ડગમગું છું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 21);
UPDATE options SET option_text_hi = 'महसूस होता है, पर अब उतना नहीं रोकता।', option_text_gu = 'લાગે છે, પણ હવે એટલું અટકાવતું નથી.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 21);
UPDATE options SET option_text_hi = 'अभी भी है, पर मैं इसके साथ चलना सीख रहा हूँ।', option_text_gu = 'હજુ છે, પણ હું એની સાથે ચાલવાનું શીખી રહ્યો છું.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 21);

-- ── Day 22 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगर रुककर भीतर झाँकें, तो आप जो बन रहे हैं उसमें क्या हैरान करेगा?',
  prompt_text_gu = 'જો અટકીને અંદર જુઓ, તો તમે જે બની રહ્યા છો એમાં શું નવાઈ પમાડશે?',
  mirror_glimmer_hi = 'बनना अक्सर हमारी सोच से ज़्यादा शांत होता है।',
  mirror_glimmer_gu = 'બનવું ઘણીવાર આપણી ધારણા કરતાં વધુ શાંત હોય છે.',
  tomorrow_tease_hi = 'कल: आगे बढ़ते वक़्त अब भी क्या रोकता है।',
  tomorrow_tease_gu = 'આવતી કાલે: આગળ વધતી વખતે હજુ શું અટકાવે છે.'
WHERE day_number = 22;

UPDATE options SET option_text_hi = 'मुझे अब दूसरों की सोच की उतनी परवाह नहीं रहती।', option_text_gu = 'મને હવે બીજા શું વિચારે છે એની એટલી પરવા નથી.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 22);
UPDATE options SET option_text_hi = 'जिससे पहले डरता था, अब वो जिज्ञासा जैसा लगता है।', option_text_gu = 'જેનાથી પહેલા ડરતો હતો, હવે એ જિજ્ઞાસા જેવું લાગે છે.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 22);
UPDATE options SET option_text_hi = 'बिना जाने ही बदलना शुरू कर चुका हूँ।', option_text_gu = 'ખબર પડ્યા વગર જ બદલાવાનું શરૂ કરી દીધું છે.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 22);
UPDATE options SET option_text_hi = 'दूसरों से पूछने से पहले अपनी आवाज़ सुनता हूँ।', option_text_gu = 'બીજાને પૂછતા પહેલા મારો પોતાનો અવાજ સાંભળું છું.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 22);
UPDATE options SET option_text_hi = 'खुद के कुछ हिस्से पहचान नहीं पाता, और ये अच्छा लगता है।', option_text_gu = 'પોતાના અમુક ભાગ ઓળખાતા નથી, અને એ સારું લાગે છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 22);

-- ── Day 23 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'क्या आपका कोई हिस्सा है जो आपको रोकना चाहता है?',
  prompt_text_gu = 'શું તમારો કોઈ ભાગ છે જે તમને રોકવા માંગે છે?',
  mirror_glimmer_hi = 'जो हिस्सा रोकता है, वो अक्सर कुछ जानता है।',
  mirror_glimmer_gu = 'જે ભાગ રોકે છે, એ ઘણીવાર કંઈક જાણે છે.',
  tomorrow_tease_hi = 'कल: रुककर देखने पर क्या चुपचाप अलग लगता है।',
  tomorrow_tease_gu = 'આવતી કાલે: અટકીને જુઓ ત્યારે શું શાંતિથી અલગ લાગે છે.'
WHERE day_number = 23;

UPDATE options SET option_text_hi = 'डर कि जो चाहता हूँ, वो दूसरों को निराश करेगा।', option_text_gu = 'ડર કે હું જે ઇચ્છું છું એ બીજાને નિરાશ કરશે.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 23);
UPDATE options SET option_text_hi = 'जब बात असली होने लगे, तो छिपने की सहज इच्छा।', option_text_gu = 'વાત સાચી થવા લાગે ત્યારે છુપાઈ જવાની સહજ ઇચ્છા.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 23);
UPDATE options SET option_text_hi = 'पता होते हुए भी बार-बार खुद पर शक करना।', option_text_gu = 'ખબર હોવા છતાં વારંવાર પોતાના પર શંકા કરવી.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 23);
UPDATE options SET option_text_hi = 'एक आवाज़ जो कहती है: क्या पता इतना ही काफ़ी है?', option_text_gu = 'એક અવાજ જે કહે છે: શું ખબર આટલું જ પૂરતું છે?'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 23);
UPDATE options SET option_text_hi = 'अभी भी है, पर अब डर नहीं, सावधानी है।', option_text_gu = 'હજુ છે, પણ હવે ડર નહીં, સાવધાની છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 23);

-- ── Day 24 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'पिछले कुछ समय में आपकी ज़िंदगी में चुपचाप क्या अलग महसूस हो रहा है?',
  prompt_text_gu = 'તાજેતરમાં તમારી જિંદગીમાં શાંતિથી શું અલગ લાગે છે?',
  mirror_glimmer_hi = 'शांत बदलाव अक्सर सबसे टिकाऊ होते हैं।',
  mirror_glimmer_gu = 'શાંત બદલાવો ઘણીવાર સૌથી ટકાઉ હોય છે.',
  tomorrow_tease_hi = 'कल: भीतर से देखा जाए तो तरक्की कैसी दिखती है।',
  tomorrow_tease_gu = 'આવતી કાલે: અંદરથી જોઈએ તો પ્રગતિ કેવી દેખાય છે.'
WHERE day_number = 24;

UPDATE options SET option_text_hi = 'जिन पैटर्न को नज़रअंदाज़ करता था, अब नोटिस करता हूँ।', option_text_gu = 'જે પેટર્ન અવગણતો હતો, હવે નોંધું છું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 24);
UPDATE options SET option_text_hi = 'दिखावे की परवाह कम, ईमानदारी की ज़्यादा हो गई है।', option_text_gu = 'દેખાડાની પરવા ઓછી, પ્રામાણિકતાની વધુ થઈ ગઈ છે.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 24);
UPDATE options SET option_text_hi = 'अलग लोगों की तरफ़ खिंचाव महसूस होता है, वजह पता नहीं।', option_text_gu = 'અલગ લોકો તરફ ખેંચાણ લાગે છે, કારણ ખબર નથી.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 24);
UPDATE options SET option_text_hi = 'अंदर से ज़्यादा स्थिर महसूस करता हूँ, बाहर कुछ नहीं बदला फिर भी।', option_text_gu = 'અંદરથી વધુ સ્થિર લાગું છું, બહાર કંઈ બદલાયું ન હોવા છતાં.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 24);
UPDATE options SET option_text_hi = 'अभी कुछ बदला नहीं, पर देखने को ज़्यादा तैयार हूँ।', option_text_gu = 'હજુ કંઈ બદલાયું નથી, પણ જોવા વધુ તૈયાર છું.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 24);

-- ── Day 25 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगर तरक्की सिर्फ़ भीतर के सच से नापी जाए, बाहरी नतीजों से नहीं, तो आज कैसा दिखता?',
  prompt_text_gu = 'જો પ્રગતિ ફક્ત અંદરના સાચાપણાથી માપીએ, બહારના પરિણામોથી નહીં, તો આજ કેવો દેખાય?',
  mirror_glimmer_hi = 'भीतर का सच भी एक असली पैमाना है।',
  mirror_glimmer_gu = 'અંદરનું સાચાપણું પણ એક સાચું માપ છે.',
  tomorrow_tease_hi = 'कल: एक छोटी-सी चिंगारी, या एक शांत ठहराव।',
  tomorrow_tease_gu = 'આવતી કાલે: એક નાની ચિનગારી, અથવા એક શાંત સ્થિરતા.'
WHERE day_number = 25;

UPDATE options SET option_text_hi = 'एक ईमानदार बातचीत जो आख़िरकार कर ली।', option_text_gu = 'એક પ્રામાણિક વાતચીત જે આખરે કરી લીધી.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 25);
UPDATE options SET option_text_hi = 'एक पल की ख़ामोशी जो खुद को दी।', option_text_gu = 'એક ક્ષણની શાંતિ જે પોતાને આપી.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 25);
UPDATE options SET option_text_hi = 'एक छोटा-सा सही फ़ैसला, भले किसी ने न देखा हो।', option_text_gu = 'એક નાનો સાચો નિર્ણય, ભલે કોઈએ ન જોયો હોય.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 25);
UPDATE options SET option_text_hi = 'एक पैटर्न नोटिस किया, बिना उसे तुरंत ठीक करने की जल्दी के।', option_text_gu = 'એક પેટર્ન નોંધ્યું, તરત સુધારવાની ઉતાવળ વગર.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 25);
UPDATE options SET option_text_hi = 'बस मौजूद रहना, कुछ साबित किए बिना।', option_text_gu = 'બસ હાજર રહેવું, કંઈ સાબિત કર્યા વગર.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 25);

-- ── Day 26 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'आज भीतर झाँकें: एक छोटी-सी चिंगारी, या शांत ठहराव?',
  prompt_text_gu = 'આજે અંદર જુઓ: એક નાની ચિનગારી, કે શાંત સ્થિરતા?',
  mirror_glimmer_hi = 'चिंगारी और ठहराव, दोनों असली संकेत हैं।',
  mirror_glimmer_gu = 'ચિનગારી અને સ્થિરતા, બંને સાચા સંકેત છે.',
  tomorrow_tease_hi = 'कल: वो छोटा-सा अगला कदम जो शरीर या दिल माँग रहा है।',
  tomorrow_tease_gu = 'આવતી કાલે: એ નાનું આગલું પગલું જે શરીર કે દિલ માંગી રહ્યું છે.'
WHERE day_number = 26;

UPDATE options SET option_text_hi = 'ज़्यादातर ठहराव। खाली नहीं, बस इंतज़ार में।', option_text_gu = 'મોટે ભાગે સ્થિર. ખાલી નહીં, બસ રાહ જોવાનું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 26);
UPDATE options SET option_text_hi = 'हल्की थकान — थकावट से ज़्यादा आराम जैसी।', option_text_gu = 'હળવો થાક — થાક કરતાં આરામ જેવો વધુ.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 26);
UPDATE options SET option_text_hi = 'एक शांत ऊर्जा जिसकी उम्मीद नहीं थी।', option_text_gu = 'એક શાંત ઊર્જા જેની અપેક્ષા નહોતી.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 26);
UPDATE options SET option_text_hi = 'कुछ जमता जा रहा है। कम अफ़रा-तफ़री, हल नहीं हुआ अभी।', option_text_gu = 'કંઈક ઠરી રહ્યું છે. ઓછી ધમાલ, ઉકેલાયું નથી હજુ.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 26);
UPDATE options SET option_text_hi = 'साफ़गी और धुंध का मेल। किसी को ज़बरदस्ती नहीं कर रहा।', option_text_gu = 'સ્પષ્ટતા અને ધુમ્મસનું મિશ્રણ. કોઈને દબાણ નથી કરી રહ્યો.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 26);

-- ── Day 27 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'क्या शरीर या दिल चुपचाप कोई छोटा-सा अगला कदम माँग रहा है?',
  prompt_text_gu = 'શું શરીર કે દિલ શાંતિથી કોઈ નાનું આગલું પગલું માંગી રહ્યું છે?',
  mirror_glimmer_hi = 'शांत माँग पर ध्यान देना ज़रूरी है।',
  mirror_glimmer_gu = 'શાંત માંગ પર ધ્યાન આપવું જરૂરી છે.',
  tomorrow_tease_hi = 'कल: आपका आख़िरी चेक-इन। अगले अध्याय में क्या साथ ले जाएँगे?',
  tomorrow_tease_gu = 'આવતી કાલે: તમારો છેલ્લો ચેક-ઇન. આગલા પ્રકરણમાં શું સાથે લઈ જશો?'
WHERE day_number = 27;

UPDATE options SET option_text_hi = 'एक बातचीत जिसे मैं टालता आया हूँ।', option_text_gu = 'એક વાતચીત જે હું ટાળતો આવ્યો છું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 27);
UPDATE options SET option_text_hi = 'बिना अपराधबोध के आराम करने की इजाज़त।', option_text_gu = 'અપરાધભાવ વગર આરામ કરવાની પરવાનગી.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 27);
UPDATE options SET option_text_hi = 'कुछ करने से पहले रोज़ रुककर सच जाँचना।', option_text_gu = 'કંઈક કરતા પહેલા રોજ અટકીને સાચું તપાસવું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 27);
UPDATE options SET option_text_hi = 'अभी न जानने की गुंजाइश, और उसे ठीक मानना।', option_text_gu = 'હજુ ન જાણવાની જગ્યા, અને એને બરાબર માનવું.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 27);
UPDATE options SET option_text_hi = 'कुछ जिसे नाम नहीं दे सकता, पर शरीर को पहले से पता है।', option_text_gu = 'કંઈક જેને નામ ન આપી શકું, પણ શરીરને પહેલેથી ખબર છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 27);

-- ── Day 28 ───────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगले अध्याय में जाते हुए, क्या पकड़े रखना ज़रूरी लगता है?',
  prompt_text_gu = 'આગલા પ્રકરણમાં જતાં, શું પકડી રાખવું જરૂરી લાગે છે?',
  mirror_glimmer_hi = 'आपने यह चक्र पूरा कर लिया। अलाइनमेंट मिरर तैयार हो रहा है।',
  mirror_glimmer_gu = 'તમે આ ચક્ર પૂરું કર્યું. અલાઇનમેન્ટ મિરર તૈયાર થઈ રહ્યું છે.',
  tomorrow_tease_hi = NULL,
  tomorrow_tease_gu = NULL
WHERE day_number = 28;

UPDATE options SET option_text_hi = 'असहज होने पर भी ईमानदार बने रहने का साहस।', option_text_gu = 'અસ્વસ્થતા હોવા છતાં પ્રામાણિક રહેવાની હિંમત.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 28);
UPDATE options SET option_text_hi = 'साफ़गी को ज़बरदस्ती के बिना आने देने का धैर्य।', option_text_gu = 'સ્પષ્ટતાને દબાણ વગર આવવા દેવાની ધીરજ.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 28);
UPDATE options SET option_text_hi = 'यह भरोसा कि मुझे खुद से ज़्यादा समझ है, जितना मैं मानता हूँ।', option_text_gu = 'એ ભરોસો કે મને પોતાના કરતાં વધુ સમજ છે.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 28);
UPDATE options SET option_text_hi = 'खुलापन, और उसके साथ आने वाली अनिश्चितता।', option_text_gu = 'ખુલ્લાપણું, અને એની સાથે આવતી અનિશ્ચિતતા.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 28);
UPDATE options SET option_text_hi = 'सब कुछ — उलझन, साफ़गी, शक। सब असली है।', option_text_gu = 'બધું જ — ગૂંચવણ, સ્પષ્ટતા, શંકા. બધું જ સાચું છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 28);
