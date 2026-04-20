-- ─────────────────────────────────────────────────────────────────────────────
-- MIRAR — Seed Translations: Hindi + Gujarati
-- Adds translated content for Days 1–12 questions and options
-- Run after 003_multilingual.sql migration
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Day 1 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगर कल सब कुछ आपसे माँगना बंद हो जाए...',
  prompt_text_gu = 'જો આવતી કાલ બધું તમારી પાસેથી માંગવાનું બંધ થઈ જાય...',
  mirror_glimmer_hi = 'यहाँ रुके। बस इतना काफी है।',
  mirror_glimmer_gu = 'અહીં અટક્યા. એ પૂરતું છે.'
WHERE day_number = 1;

UPDATE options SET
  option_text_hi = 'राहत मिलती। आखिरकार थोड़ी जगह।',
  option_text_gu = 'રાહત થઈ હોત. આખરે થોડી જગ્યા.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 1);

UPDATE options SET
  option_text_hi = 'खुद के साथ क्या करूँ — नहीं पता होता।',
  option_text_gu = 'ખ્yal na hot ke potāni sāthe shun karvun.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 1);

UPDATE options SET
  option_text_hi = 'शायद चलता रहता — धीमा होना नहीं आता।',
  option_text_gu = 'કદાચ ચAli rakhat — dhīmā tha-vun āvadtun nathi.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 1);

UPDATE options SET
  option_text_hi = 'इस व्यस्तता के बिना मैं कौन हूँ — वो समझना चाहता।',
  option_text_gu = 'આ ભાગ-દોડ વગર હું કોણ છું — તે સmajhavun chhe.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 1);

UPDATE options SET
  option_text_hi = 'सच में नहीं जानता। ज़रूरी होना ही मेरी पहचान बन गई है।',
  option_text_gu = 'સાચ કહું તો ખ્yal nathi. ઉpayogi hovun ja mārī olakh bani gai che.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 1);

-- ── Day 2 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अभी, अंदर से, मुझे महसूस हो रहा है...',
  prompt_text_gu = 'અત્યારે, અંદરથી, મને લાગે છે...',
  mirror_glimmer_hi = 'आज कुछ नाम मिला जो कल तक अनकहा था।',
  mirror_glimmer_gu = 'આજે કંઈ નામ અpāyun jo kalje sudi anam hatun.'
WHERE day_number = 2;

UPDATE options SET
  option_text_hi = 'कुछ फिट नहीं लग रहा, और यह काफी समय से पता है।',
  option_text_gu = 'kunchhe fit nathi lagtu, ane aa kāphī samayathi khabara che.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 2);

UPDATE options SET
  option_text_hi = 'जो नहीं हूँ वो बनने का नाटक करते-करते थक गया हूँ।',
  option_text_gu = 'Jo nathi teno dekh-āvo karatā-karatā thākī gayō chun.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 2);

UPDATE options SET
  option_text_hi = 'जीवन बदलने का इंतज़ार है, लेकिन कुछ कर नहीं रहा।',
  option_text_gu = 'Jīvana badale-vānī rāha che, pana kunchhe karī nathī rahyo.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 2);

UPDATE options SET
  option_text_hi = 'क्या महसूस हो रहा है नहीं पता — एक सुन्नता-सी है।',
  option_text_gu = 'Shun anubhavāī rahyun che khabara nathī — ek pratakāra nun stambhana che.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 2);

UPDATE options SET
  option_text_hi = 'लगता है कुछ बदलना चाहिए, चाहे अभी पता न हो क्या।',
  option_text_gu = 'Lāge che kuncha-k badal-vun joīe, bhalene atyāre khabara na hoy.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 2);

-- ── Day 3 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'कौन सा विचार बार-बार आता रहता है?',
  prompt_text_gu = 'કયો વિचार bar-bar āvyā karé che?',
  mirror_glimmer_hi = 'बार-बार आने वाले विचार संकेत हैं — पढ़े जाने का इंतज़ार करते।',
  mirror_glimmer_gu = 'Bar-bar āvatā vichāro sanketa che — vānchāvā-nī rāha joī rahyā che.'
WHERE day_number = 3;

UPDATE options SET
  option_text_hi = 'एक फैसला जो मैंने किया और जिसे बार-बार सोचता हूँ।',
  option_text_gu = 'Ek nirṇaya je mein karyo che ane je viṣhe bar-bar vichārun chun.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 3);

UPDATE options SET
  option_text_hi = 'कुछ जो हो जाएगा इसका डर।',
  option_text_gu = 'Kunchhe thaī jashe teno darā.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 3);

UPDATE options SET
  option_text_hi = 'जो सोचा था उससे खुद को कितना अलग पाता हूँ।',
  option_text_gu = 'Je socha-yun hatun tenāthī potāne ketlun alag anubhavun chun.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 3);

UPDATE options SET
  option_text_hi = 'एक बदलाव जो चाहता हूँ पर कैसे करूँ नहीं जानता।',
  option_text_gu = 'Ek parivar-tana je ichhu chun pana kaivī rīte karavun khabara nathī.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 3);

UPDATE options SET
  option_text_hi = 'सच कहूँ तो इन दिनों मन शांत है।',
  option_text_gu = 'Sācha kahun to ā divo-samān mana shānta che.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 3);

-- ── Day 4 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अभी मेरी ज़िंदगी में, मैं ज़्यादातर...',
  prompt_text_gu = 'અત્યારે મારી જiṃdagīmāṃ, hū moṭābhāge...',
  mirror_glimmer_hi = 'पैटर्न तब दिखते हैं जब हम इतने धीरे चलें कि देख सकें।',
  mirror_glimmer_gu = 'Paiṭarna tyāre dekhāy jyāre āpaṇe eṭalā dhīrā chalīe ke joī shakīe.'
WHERE day_number = 4;

UPDATE options SET
  option_text_hi = 'उन लक्ष्यों के पीछे भाग रहा हूँ जो शायद मेरे हैं ही नहीं।',
  option_text_gu = 'Evā lakṣyō pachhi dauvī rahyo chun je kadācha māra nathī.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 4);

UPDATE options SET
  option_text_hi = 'लोगों को निराश न करने के लिए हाँ कह रहा हूँ।',
  option_text_gu = 'Logone nirāsha na karavā ha kahyā karū chun.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 4);

UPDATE options SET
  option_text_hi = 'पुरानी आदतों में बना हूँ क्योंकि वो सुरक्षित लगती हैं।',
  option_text_gu = 'Purānī ādatōmāṃ aṭakyo chun kāraṇa surakṣita lāge che.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 4);

UPDATE options SET
  option_text_hi = 'एक पुरानी योजना पर चल रहा हूँ जो अब फिट नहीं होती।',
  option_text_gu = 'Varo-nī ek yojanā utara chālī rahyo chun je havē ṭhīka nathī basetī.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 4);

UPDATE options SET
  option_text_hi = 'सब पर सवाल कर रहा हूँ। पता नहीं क्या सच में मेरा है।',
  option_text_gu = 'Badhe para savāla karī rahyo chun. Khabara nathī ke shun sāchekha mārun che.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 4);

-- ── Day 5 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अंदर से क्या बदल रहा लग रहा है?',
  prompt_text_gu = 'Aṃdarathī shun badalī rahyun lāge che?',
  mirror_glimmer_hi = 'बदलाव को नोटिस करना ही पहला संकेत है।',
  mirror_glimmer_gu = 'Parivar-tanane noṃdhavun e pahelo saṃketa che.'
WHERE day_number = 5;

UPDATE options SET
  option_text_hi = 'कुछ जिसे मैंने मान लिया था पर अब यकीन नहीं।',
  option_text_gu = 'Kunchhe je svīkārī lidhun hatun pana havē viśvāsa nathī.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 5);

UPDATE options SET
  option_text_hi = 'एक रिश्ता जिसकी परवाह है पर उसमें वही नहीं लगता।',
  option_text_gu = 'Ek sambandha jēnī cintā che pana temāṃ e ja anubhava nathī.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 5);

UPDATE options SET
  option_text_hi = 'लोगों के सामने ठीक दिखता हूँ पर अंदर से सच नहीं लगता।',
  option_text_gu = 'Logō sāmane ṭhīka dekhāun chun pana aṃdarathī sāchun nathī lāgatun.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 5);

UPDATE options SET
  option_text_hi = 'मेरा रूटीन — चलाए रखता है पर बढ़ नहीं रहा।',
  option_text_gu = 'Merō rūṭīna — chalāvī rākhē che pana vadhī nathī rahyo.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 5);

UPDATE options SET
  option_text_hi = 'कुछ छोटी-छोटी बातें। बड़ा कुछ नहीं, बस बदलाव दिख रहे हैं।',
  option_text_gu = 'Nānī-nānī vatō. Moṭun kunchhe nahi, faqata parivar-tanō noṃdhāī rahyā che.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 5);

-- ── Day 6 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगर आपका अंदरूनी हाल बोल सकता, तो क्या कहता?',
  prompt_text_gu = 'Jo tamārī aṃdarunī sthiti bolī shakatī, to shun kahetī?',
  mirror_glimmer_hi = 'अंदरूनी हाल को समझे बिना भी वो असली है।',
  mirror_glimmer_gu = 'Aṃdarunī sthiti samajyā vagara paṇa sāchī che.'
WHERE day_number = 6;

UPDATE options SET
  option_text_hi = 'धकेलना बंद करो — मैं खाली हो चुका हूँ।',
  option_text_gu = 'Dhakelvānun baṃda karo — hū khālī thaī gayō chun.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 6);

UPDATE options SET
  option_text_hi = 'धीमे चलो। मैं तुम्हारी रफ्तार से नहीं चल सकता।',
  option_text_gu = 'Dhīmā chalō. Hū tamārī rapatāra sāthe nathī chalī shakatō.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 6);

UPDATE options SET
  option_text_hi = 'तुम सुन नहीं रहे। मैं कुछ बताने की कोशिश कर रहा हूँ।',
  option_text_gu = 'Tame sāṃbhaḷatā nathī. Hū kunchhe kahe-vānī koṣiṣa karī rahyo chun.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 6);

UPDATE options SET
  option_text_hi = 'बंद होकर तुम्हें बचा रहा हूँ।',
  option_text_gu = 'Baṃda thaīne tamane bachāvī rahyo chun.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 6);

UPDATE options SET
  option_text_hi = 'जाग रहा हूँ। कुछ बदल रहा है।',
  option_text_gu = 'Jāgī rahyo chun. Kunchhe badalāī rahyun che.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 6);

-- ── Day 7 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'पहला हफ्ता खत्म होते हुए, अभी सबसे सच क्या है?',
  prompt_text_gu = 'Pahelun aṭhavāḍiyun pūrṇa thaī rahyun che — atyāre sauthe sāchun shun che?',
  mirror_glimmer_hi = 'एक हफ्ते के संकेत। पैटर्न बनने लगा है।',
  mirror_glimmer_gu = 'Ek aṭhavāḍiyānā saṃketō. Paiṭarna banavā māṃḍyo che.'
WHERE day_number = 7;

UPDATE options SET
  option_text_hi = 'खुद के बारे में वो बातें दिख रही हैं जिनसे बचता आया था।',
  option_text_gu = 'Pote viṣe e vatō dekhāī rahī che jēnāthī bachyō āvyo hatō.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 7);

UPDATE options SET
  option_text_hi = 'यह उतना मुश्किल है जितना सोचा नहीं था।',
  option_text_gu = 'Ā etlun aghrun che jeTlun dhāryun na hatun.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 7);

UPDATE options SET
  option_text_hi = 'समझ आ रहा है कि मैं चाहता क्या हूँ।',
  option_text_gu = 'Samaja āvī rahī che ke hū shun ichhu chun.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 7);

UPDATE options SET
  option_text_hi = 'एहसास हुआ कि किसी चीज़ से भागता रहा हूँ।',
  option_text_gu = 'Khabar paḍī ke koī vatthīthī bhāgatō rahyo chun.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 7);

UPDATE options SET
  option_text_hi = 'अभी कुछ नहीं बदला, पर कुछ हिल रहा है।',
  option_text_gu = 'Havē haju kunchhe nathī badalyun, pana kunchhe hālatun che.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 7);

-- ── Day 8 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'आपके अंदर क्या है जो किसी बदलाव की माँग कर रहा है?',
  prompt_text_gu = 'Tamārī aṃdar shun che je koī parivar-tanānī māṃga karī rahyun che?',
  mirror_glimmer_hi = 'जो हिस्सा माँग कर रहा है, वही सबसे सच्चा है।',
  mirror_glimmer_gu = 'Je bhāga māṃga karī rahyo che, te sauthe prāmāṇika che.'
WHERE day_number = 8;

UPDATE options SET
  option_text_hi = 'मेरा वो हिस्सा जो इस ज़िंदगी में फिट नहीं होता।',
  option_text_gu = 'Merō e bhāga je ā jīvanamāṃ ṭhīka nathī basetō.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 8);

UPDATE options SET
  option_text_hi = 'सब ठीक है का नाटक करते-करते की थकान।',
  option_text_gu = 'Badhu ṭhīka che nō dekh-āvo karatā-karatā nī thāka.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 8);

UPDATE options SET
  option_text_hi = 'एक सच्चाई जिससे बचता रहा हूँ।',
  option_text_gu = 'Ek satya jēnāthī bachyō rahyo chun.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 8);

UPDATE options SET
  option_text_hi = 'किसी चीज़ की चाहत जिसे नाम भी नहीं दे पा रहा।',
  option_text_gu = 'Koī vatthī māṭe icchā je māṭe nāma paṇa nathī āpī shakatō.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 8);

UPDATE options SET
  option_text_hi = 'पता नहीं। सब कुछ उलझा हुआ लग रहा है अभी।',
  option_text_gu = 'Khabara nathī. Badhu atyāre garbaḍ lāge che.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 8);

-- ── Day 9 ─────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'अगर एक दिन के लिए ज़िंदगी के हर "चाहिए" को रोक दें, तो क्या बचेगा?',
  prompt_text_gu = 'Jo ek divas māṭe jīvanamāṃ nā darekha "joīe" ne rokī devo, to shun bachase?',
  mirror_glimmer_hi = 'जब ज़िम्मेदारी थमती है, तब जो बचता है — वो देखने लायक है।',
  mirror_glimmer_gu = 'Jyāre zimmedārī thamae, tyāre je bache — te jovā layaka che.'
WHERE day_number = 9;

UPDATE options SET
  option_text_hi = 'खामोशी — बिना शोर के क्या चाहता हूँ, पता नहीं।',
  option_text_gu = 'Shāntī — shore vagara shun joīe che te khabara nathī.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 9);

UPDATE options SET
  option_text_hi = 'अपराध बोध — जैसे अपनी जिम्मेदारियाँ छोड़ रहा हूँ।',
  option_text_gu = 'Aparādha-bhāva — jāṇe potānī zimmedārīo chōḍī rahyo chun.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 9);

UPDATE options SET
  option_text_hi = 'राहत — फिर आज़ादी से क्या करूँ, इसकी उलझन।',
  option_text_gu = 'Rāhata — pachhi āzādīthī shun karavun tenī garbaḍa.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 9);

UPDATE options SET
  option_text_hi = 'कुछ चीजें जो सच में पसंद हैं — जिम्मेदारियों तले दबी हुई।',
  option_text_gu = 'Kuchha vatō je sācha-māṃ game che — zimmedārīō nīche dabāyelī.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 9);

UPDATE options SET
  option_text_hi = 'मेरा एक साफ रूप — जो जानता है क्या मायने रखता है।',
  option_text_gu = 'Merō ek spaṣṭa rūpa — je jāṇe che ke shun mahattva rākhe che.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 9);

-- ── Day 10 ────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'जो अब फिट नहीं होता उसे जाने देने से क्या होने का डर है?',
  prompt_text_gu = 'Je havē ṭhīka nathī basetun tene jatun kara-vāthī shun thaase tenō ḍara che?',
  mirror_glimmer_hi = 'जाने देने का डर एक संकेत है — कि हम अभी भी थामे हुए हैं।',
  mirror_glimmer_gu = 'Jatun karavānō ḍara ek saṃketa che — ke āpaṇe haju paṇa pakḍī rākhyun che.'
WHERE day_number = 10;

UPDATE options SET
  option_text_hi = 'खो जाऊँगा — उसके बिना खुद को नहीं जानता।',
  option_text_gu = 'Khoī jāīsha — tenā vagara potāne nathī jāṇatō.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 10);

UPDATE options SET
  option_text_hi = 'लोग निराश होंगे या समझेंगे नहीं।',
  option_text_gu = 'Logō nirāsha thashe athavā samajashe nahi.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 10);

UPDATE options SET
  option_text_hi = 'फिर से शुरू करना होगा — और यह डराता है।',
  option_text_gu = 'Pharīthī śarū karavun paḍashe — ane ā ḍarāve che.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 10);

UPDATE options SET
  option_text_hi = 'एहसास होगा कि बहुत देर तक थामे रखा — और वो दुखद है।',
  option_text_gu = 'Khabara paḍashe ke bahushe vāra laḍī pakḍī rākhyun — ane te dukhada che.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 10);

UPDATE options SET
  option_text_hi = 'लगता है हल्का लगेगा — डर के साथ, पर हल्का।',
  option_text_gu = 'Lāge che halakun lāgashe — ḍara sāthe, pana halakun.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 10);

-- ── Day 11 ────────────────────────────────────────────────────────────────────
UPDATE questions SET
  prompt_text_hi = 'वो कौन सा अनकहा नियम है जिसने आपकी ज़िंदगी को आकार दिया?',
  prompt_text_gu = 'Te kauno anakahyo niyama che je tamārī jīndagīne ākāra āpyo che?',
  mirror_glimmer_hi = 'अनकहे नियम सबसे गहरे होते हैं।',
  mirror_glimmer_gu = 'Anakahyā niyamō sauthe gahirā hōya che.'
WHERE day_number = 11;

UPDATE options SET
  option_text_hi = 'हमेशा मजबूत रहना होगा — चाहे टूट ही क्यों न जाऊँ।',
  option_text_gu = 'Hamesha majabutā rākhavī paḍashe — bhale tūṭī ja-vātha.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 11);

UPDATE options SET
  option_text_hi = 'सफलता मतलब पसंद किया जाना, स्वीकार होना, सराहा जाना।',
  option_text_gu = 'Saphalatā māṭlaba game-vun, svīkāra-vun, saṃrāha-vun.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 11);

UPDATE options SET
  option_text_hi = 'खुद को पहले रखना स्वार्थ है।',
  option_text_gu = 'Potāne pahele rākhavun svārtha che.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 11);

UPDATE options SET
  option_text_hi = 'किसी पर निर्भर होने से बेहतर है अकेले सुलझाना।',
  option_text_gu = 'Koī para nirabhara thavalā karatāṃ akhelā sulajavun sārun.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 11);

UPDATE options SET
  option_text_hi = 'इन नियमों पर सवाल उठाने लगा हूँ — डरावना भी, आज़ाद भी लग रहा है।',
  option_text_gu = 'Ā niyamō para savāla uṭhāva māṃḍyo chun — ḍarāmāṇa pana, mukta pana lāge che.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 11);

-- ── Day 12 (LOCKED — translations only, do not modify English content) ─────────
UPDATE questions SET
  prompt_text_hi = 'पिछली बार जब आपकी सच्चाई किसी को नहीं लगी — आपने आगे क्या किया?',
  prompt_text_gu = 'Chhelī vāra jyāre tamārī sācchāī koīne nahi lagī — tamē āgaḷa shun karyun?',
  mirror_glimmer_hi = 'टकराव के बाद हम कैसे प्रतिक्रिया देते हैं — वो दिखाता है हम कहाँ खड़े हैं।',
  mirror_glimmer_gu = 'Ṭakrāva pachī āpaṇe kaivī rīte pratikriyā āpīe — te daraṣāve che ke āpaṇe kyāṃ ūbhā chīe.'
WHERE day_number = 12;

UPDATE options SET
  option_text_hi = 'मैंने खुद को छोटा किया, लहजा बदला, सच्चाई को नरम किया।',
  option_text_gu = 'Maine pota-ne nāno karyo, lahajavā badalyo, sacchaī-ne narma karayī.'
WHERE option_number = 1 AND question_id = (SELECT id FROM questions WHERE day_number = 12);

UPDATE options SET
  option_text_hi = 'बंद हो गया और कुछ समय तक दोबारा कोशिश नहीं की।',
  option_text_gu = 'Baṃda thaī gayō ane kēṭlāka samaya sudhi pharīthī koṣiṣa nā karī.'
WHERE option_number = 2 AND question_id = (SELECT id FROM questions WHERE day_number = 12);

UPDATE options SET
  option_text_hi = 'रक्षात्मक हो गया, हालाँकि अंदर से चोट लगी थी।',
  option_text_gu = 'Rakhṣātmaka thaī gayō, jabake aṃdarathī chōṭa lagī hatī.'
WHERE option_number = 3 AND question_id = (SELECT id FROM questions WHERE day_number = 12);

UPDATE options SET
  option_text_hi = 'स्थिर रहा पर दिनों तक उसी पर विचार करता रहा।',
  option_text_gu = 'Sthira rahyo pana divasō sudī tē ja para vicāra karatō rahyo.'
WHERE option_number = 4 AND question_id = (SELECT id FROM questions WHERE day_number = 12);

UPDATE options SET
  option_text_hi = 'अपनी बात पर टिका रहा — धीरे से, हालाँकि असहज था।',
  option_text_gu = 'Potānī vāta para ṭikyo rahyo — dhīre, jabake asahaja hatun.'
WHERE option_number = 5 AND question_id = (SELECT id FROM questions WHERE day_number = 12);
