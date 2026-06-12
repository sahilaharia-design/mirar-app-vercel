-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Seed v2 Translations: Hindi + Gujarati for the v2 question bank
-- Restores translations that seed_v2.sql wiped (it DELETEd and re-inserted
-- options for Days 1–8 without _hi/_gu columns, and changed the English stems
-- so the old translated prompts no longer matched).
-- Run after seed_v2.sql. Idempotent — safe to run repeatedly.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Day 1 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगर कल से सब कुछ आपसे कुछ माँगना बंद कर दे...',
  prompt_text_gu = 'જો આવતી કાલથી બધું તમારી પાસેથી માંગવાનું બંધ કરી દે...',
  mirror_glimmer_hi = 'आप यहाँ रुके। इतना ही काफ़ी है।',
  mirror_glimmer_gu = 'તમે અહીં અટક્યા. એટલું જ પૂરતું છે.',
  tomorrow_tease_hi = 'कल: कुछ ऐसा जो आप अंदर महसूस कर रहे हैं।',
  tomorrow_tease_gu = 'આવતી કાલે: કંઈક જે તમે અંદર અનુભવી રહ્યા છો.'
WHERE day_number = 1;

UPDATE options SET option_text_hi = 'राहत मिलेगी। आख़िरकार थोड़ी जगह।', option_text_gu = 'રાહત થશે. આખરે થોડી જગ્યા.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 1);
UPDATE options SET option_text_hi = 'समझ नहीं आएगा कि खुद के साथ क्या करूँ।', option_text_gu = 'સમજાશે નહીં કે પોતાની સાથે શું કરું.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 1);
UPDATE options SET option_text_hi = 'शायद मैं चलता ही रहूँगा — धीमा होना मुझे आता नहीं।', option_text_gu = 'કદાચ હું ચાલતો જ રહીશ — ધીમા પડવું મને આવડતું નથી.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 1);
UPDATE options SET option_text_hi = 'मैं जानना चाहूँगा कि इस भागदौड़ के बिना मैं कौन हूँ।', option_text_gu = 'હું જાણવા માંગીશ કે આ દોડધામ વિના હું કોણ છું.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 1);
UPDATE options SET option_text_hi = 'सच कहूँ तो पता नहीं। मैंने पूरी ज़िंदगी ज़रूरत बनकर जीने में लगाई है।', option_text_gu = 'સાચું કહું તો ખબર નથી. મેં આખી જિંદગી જરૂરી હોવાની આસપાસ બાંધી છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 1);

-- ── Day 2 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'इस वक़्त, अंदर, मैं महसूस करता हूँ...',
  prompt_text_gu = 'આ ક્ષણે, અંદર, હું અનુભવું છું...',
  mirror_glimmer_hi = 'आज कुछ ऐसा कहा गया जो कल तक अनकहा था।',
  mirror_glimmer_gu = 'આજે કંઈક એવું કહેવાયું જે ગઈકાલ સુધી અણકહ્યું હતું.',
  tomorrow_tease_hi = 'कल: आपका ध्यान बार-बार कहाँ लौटता है।',
  tomorrow_tease_gu = 'આવતી કાલે: તમારું ધ્યાન વારંવાર ક્યાં પાછું ફરે છે.'
WHERE day_number = 2;

UPDATE options SET option_text_hi = 'कुछ अब फिट नहीं बैठता, और मुझे यह काफ़ी समय से पता है।', option_text_gu = 'કંઈક હવે બંધબેસતું નથી, અને મને એ ઘણા સમયથી ખબર છે.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 2);
UPDATE options SET option_text_hi = 'जो मैं नहीं हूँ, वह बनने का दिखावा करते-करते थक गया हूँ।', option_text_gu = 'જે હું નથી, એ હોવાનો દેખાવ કરીને થાકી ગયો છું.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 2);
UPDATE options SET option_text_hi = 'मैं ज़िंदगी बदलने का इंतज़ार कर रहा हूँ, पर कुछ कर नहीं रहा।', option_text_gu = 'હું જિંદગી બદલાય એની રાહ જોઉં છું, પણ કંઈ કરતો નથી.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 2);
UPDATE options SET option_text_hi = 'पता नहीं क्या महसूस होता है — जैसे कुछ सुन्न-सा है।', option_text_gu = 'ખબર નથી શું અનુભવાય છે — જાણે કંઈક સુન્ન છે.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 2);
UPDATE options SET option_text_hi = 'लगता है कुछ बदलना चाहिए, भले अभी पता नहीं क्या।', option_text_gu = 'લાગે છે કંઈક બદલાવું જોઈએ, ભલે હજી ખબર નથી શું.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 2);

-- ── Day 3 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'कौन-सा ख़याल बार-बार आपके पास लौट आता है?',
  prompt_text_gu = 'કયો વિચાર વારંવાર તમારી પાસે પાછો આવે છે?',
  mirror_glimmer_hi = 'बार-बार आते ख़याल ऐसे संकेत हैं जो पढ़े जाने का इंतज़ार कर रहे हैं।',
  mirror_glimmer_gu = 'વારંવાર આવતા વિચારો એવા સંકેત છે જે વંચાવાની રાહ જુએ છે.',
  tomorrow_tease_hi = 'कल: कुछ ऐसा जो आप दूसरों के लिए उठाए चल रहे हैं।',
  tomorrow_tease_gu = 'આવતી કાલે: કંઈક જે તમે બીજાઓ માટે ઉપાડીને ચાલો છો.'
WHERE day_number = 3;

UPDATE options SET option_text_hi = 'एक फ़ैसला जो मैंने लिया, पर बार-बार उस पर शक करता हूँ।', option_text_gu = 'એક નિર્ણય જે મેં લીધો, પણ વારંવાર એના પર શંકા કરું છું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 3);
UPDATE options SET option_text_hi = 'कुछ ऐसा जिसके होने की चिंता है।', option_text_gu = 'કંઈક એવું જે થવાની ચિંતા છે.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 3);
UPDATE options SET option_text_hi = 'मैं जैसा सोचा था, उससे कितना अलग महसूस करता हूँ।', option_text_gu = 'મેં જેવું વિચાર્યું હતું, એનાથી હું કેટલો અલગ અનુભવું છું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 3);
UPDATE options SET option_text_hi = 'एक बदलाव जो चाहता हूँ, पर करना नहीं आता।', option_text_gu = 'એક બદલાવ જે જોઈએ છે, પણ કેવી રીતે કરવો ખબર નથી.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 3);
UPDATE options SET option_text_hi = 'सच कहूँ, इन दिनों मन कुछ शांत है।', option_text_gu = 'સાચું કહું, આ દિવસોમાં મન થોડું શાંત છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 3);

-- ── Day 4 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'इस वक़्त अपनी ज़िंदगी में, मैं ज़्यादातर...',
  prompt_text_gu = 'અત્યારે મારી જિંદગીમાં, હું મોટેભાગે...',
  mirror_glimmer_hi = 'पैटर्न तब दिखते हैं जब हम इतना थमते हैं कि उन्हें देख सकें।',
  mirror_glimmer_gu = 'પેટર્ન ત્યારે દેખાય છે જ્યારે આપણે એને જોઈ શકાય એટલા થોભીએ.',
  tomorrow_tease_hi = 'कल: आपके अंदर क्या बदल रहा है।',
  tomorrow_tease_gu = 'આવતી કાલે: તમારી અંદર શું બદલાઈ રહ્યું છે.'
WHERE day_number = 4;

UPDATE options SET option_text_hi = 'ऐसे लक्ष्यों के पीछे भाग रहा हूँ जो शायद मेरे हैं ही नहीं।', option_text_gu = 'એવા લક્ષ્યો પાછળ દોડું છું જે કદાચ મારા છે જ નહીં.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 4);
UPDATE options SET option_text_hi = 'लोगों को निराश न करने के लिए हर बात में हाँ कह रहा हूँ।', option_text_gu = 'લોકોને નિરાશ ન કરવા માટે દરેક વાતમાં હા કહું છું.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 4);
UPDATE options SET option_text_hi = 'पुराने ढर्रों में हूँ क्योंकि वे सुरक्षित लगते हैं।', option_text_gu = 'જૂની રીતોમાં છું કારણ કે એ સલામત લાગે છે.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 4);
UPDATE options SET option_text_hi = 'बरसों पहले बनाया प्लान निभा रहा हूँ जो अब मुझ पर फिट नहीं बैठता।', option_text_gu = 'વર્ષો પહેલાં બનાવેલો પ્લાન અનુસરું છું જે હવે મને બંધબેસતો નથી.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 4);
UPDATE options SET option_text_hi = 'हर चीज़ पर सवाल कर रहा हूँ। पता नहीं असल में मेरा क्या है।', option_text_gu = 'દરેક વસ્તુ પર સવાલ કરું છું. ખબર નથી ખરેખર મારું શું છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 4);

-- ── Day 5 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'मेरे अंदर क्या बदलता हुआ महसूस होता है?',
  prompt_text_gu = 'મારી અંદર શું બદલાતું હોય એવું લાગે છે?',
  mirror_glimmer_hi = 'बदलाव को महसूस करना ही पहला संकेत है।',
  mirror_glimmer_gu = 'બદલાવને અનુભવવો એ જ પહેલો સંકેત છે.',
  tomorrow_tease_hi = 'कल: अगर आपका भीतरी मन बोल पाता, तो क्या कहता।',
  tomorrow_tease_gu = 'આવતી કાલે: જો તમારું અંદરનું મન બોલી શકત, તો શું કહેત.'
WHERE day_number = 5;

UPDATE options SET option_text_hi = 'कुछ जो मैंने स्वीकार कर लिया है, पर अब उसमें यक़ीन नहीं।', option_text_gu = 'કંઈક જે મેં સ્વીકાર્યું છે, પણ હવે એમાં વિશ્વાસ નથી.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 5);
UPDATE options SET option_text_hi = 'एक रिश्ता जिसकी परवाह है, पर अब उसमें वैसा महसूस नहीं होता।', option_text_gu = 'એક સંબંધ જેની પરવા છે, પણ હવે એમાં એવું અનુભવાતું નથી.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 5);
UPDATE options SET option_text_hi = 'लोगों के सामने मैं जैसा दिखता हूँ — बाहर से ठीक, अंदर से सच नहीं लगता।', option_text_gu = 'લોકો સામે હું જેવો દેખાઉં છું — બહારથી બરાબર, અંદરથી સાચું નથી લાગતું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 5);
UPDATE options SET option_text_hi = 'मेरी दिनचर्या — चलाती तो है, पर बढ़ा नहीं रही।', option_text_gu = 'મારી દિનચર્યા — ચલાવે તો છે, પણ હું આગળ વધતો નથી.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 5);
UPDATE options SET option_text_hi = 'कुछ छोटी-छोटी बातें। कुछ बड़ा नहीं, बस बदलाव महसूस हो रहे हैं।', option_text_gu = 'થોડી નાની-નાની વાતો. કંઈ મોટું નહીં, બસ બદલાવ અનુભવાય છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 5);

-- ── Day 6 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगर आपका भीतरी मन आपसे बोल पाता, तो क्या कहता?',
  prompt_text_gu = 'જો તમારું અંદરનું મન તમારી સાથે બોલી શકત, તો શું કહેત?',
  mirror_glimmer_hi = 'भीतरी मन को सच होने के लिए समझा जाना ज़रूरी नहीं।',
  mirror_glimmer_gu = 'અંદરના મનને સાચું હોવા માટે સમજાવું જરૂરી નથી.',
  tomorrow_tease_hi = 'कल: पहला हफ़्ता पूरा करते हुए, सबसे सच क्या है।',
  tomorrow_tease_gu = 'આવતી કાલે: પહેલું અઠવાડિયું પૂરું કરતાં, સૌથી સાચું શું છે.'
WHERE day_number = 6;

UPDATE options SET option_text_hi = 'अब और मत धकेलो — मैं ख़ाली हो चुका हूँ।', option_text_gu = 'હવે વધુ ધક્કો ન માર — હું ખાલી થઈ ગયો છું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 6);
UPDATE options SET option_text_hi = 'धीमे चलो। तुम्हारी रफ़्तार से नहीं चल पा रहा।', option_text_gu = 'ધીમો પડ. તારી ઝડપ સાથે હું ચાલી શકતો નથી.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 6);
UPDATE options SET option_text_hi = 'तुम सुन नहीं रहे। मैं कुछ कहने की कोशिश कर रहा हूँ।', option_text_gu = 'તું સાંભળતો નથી. હું કંઈક કહેવાનો પ્રયત્ન કરું છું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 6);
UPDATE options SET option_text_hi = 'मैं बंद होकर तुम्हें बचा रहा हूँ।', option_text_gu = 'હું બંધ થઈને તને બચાવી રહ્યો છું.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 6);
UPDATE options SET option_text_hi = 'मैं जाग रहा हूँ। कुछ बदल रहा है।', option_text_gu = 'હું જાગી રહ્યો છું. કંઈક બદલાઈ રહ્યું છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 6);

-- ── Day 7 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'पहला हफ़्ता पूरा करते हुए, इस वक़्त सबसे सच क्या है?',
  prompt_text_gu = 'પહેલું અઠવાડિયું પૂરું કરતાં, અત્યારે સૌથી સાચું શું છે?',
  mirror_glimmer_hi = 'संकेतों का एक हफ़्ता। पैटर्न बनना शुरू हो गया है।',
  mirror_glimmer_gu = 'સંકેતોનું એક અઠવાડિયું. પેટર્ન બનવાની શરૂઆત થઈ ગઈ છે.',
  tomorrow_tease_hi = 'कल: दूसरा हफ़्ता शुरू। क्या बदलाव माँग रहा है?',
  tomorrow_tease_gu = 'આવતી કાલે: બીજું અઠવાડિયું શરૂ. શું બદલાવ માંગે છે?'
WHERE day_number = 7;

UPDATE options SET option_text_hi = 'खुद की वे बातें दिख रही हैं जिनसे मैं बचता आया हूँ।', option_text_gu = 'મારી એ વાતો દેખાય છે જેનાથી હું બચતો આવ્યો છું.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 7);
UPDATE options SET option_text_hi = 'यह मेरी उम्मीद से ज़्यादा मुश्किल है।', option_text_gu = 'આ મારી ધારણા કરતાં વધુ અઘરું છે.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 7);
UPDATE options SET option_text_hi = 'समझ आने लगा है कि मैं क्या चाहता हूँ।', option_text_gu = 'સમજાવા લાગ્યું છે કે મારે શું જોઈએ છે.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 7);
UPDATE options SET option_text_hi = 'एहसास हुआ कि मैं किसी चीज़ से भागता रहा हूँ।', option_text_gu = 'અહેસાસ થયો કે હું કોઈ વસ્તુથી ભાગતો રહ્યો છું.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 7);
UPDATE options SET option_text_hi = 'अभी कुछ बदला नहीं, पर कुछ हिल रहा है।', option_text_gu = 'હજી કંઈ બદલાયું નથી, પણ કંઈક હલી રહ્યું છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 7);

-- ── Day 8 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'आपके अंदर क्या है जो बदलाव माँग रहा है?',
  prompt_text_gu = 'તમારી અંદર શું છે જે બદલાવ માંગી રહ્યું છે?',
  mirror_glimmer_hi = 'जो हिस्सा माँग रहा है, वही सबसे ईमानदार हिस्सा है।',
  mirror_glimmer_gu = 'જે ભાગ માંગી રહ્યો છે, એ જ સૌથી પ્રામાણિક ભાગ છે.',
  tomorrow_tease_hi = 'कल: एक सच जो आप चुपचाप उठाए चल रहे हैं।',
  tomorrow_tease_gu = 'આવતી કાલે: એક સત્ય જે તમે ચૂપચાપ ઉપાડીને ચાલો છો.'
WHERE day_number = 8;

UPDATE options SET option_text_hi = 'मेरा एक हिस्सा जो अब इस ज़िंदगी में फिट नहीं बैठता।', option_text_gu = 'મારો એક ભાગ જે હવે આ જિંદગીમાં બંધબેસતો નથી.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 8);
UPDATE options SET option_text_hi = 'सब ठीक है — यह दिखावा करते रहने की थकान।', option_text_gu = 'બધું બરાબર છે — એ દેખાવ કરતા રહેવાનો થાક.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 8);
UPDATE options SET option_text_hi = 'एक ईमानदारी जिससे मैं बचता आया हूँ।', option_text_gu = 'એક પ્રામાણિકતા જેનાથી હું બચતો આવ્યો છું.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 8);
UPDATE options SET option_text_hi = 'किसी ऐसी चीज़ की चाह जिसका नाम भी नहीं ले पाता।', option_text_gu = 'કોઈ એવી વસ્તુની ઇચ્છા જેનું નામ પણ આપી શકતો નથી.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 8);
UPDATE options SET option_text_hi = 'पक्का नहीं पता। अभी सब उलझा हुआ लगता है।', option_text_gu = 'ચોક્કસ ખબર નથી. અત્યારે બધું ગૂંચવાયેલું લાગે છે.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 8);
