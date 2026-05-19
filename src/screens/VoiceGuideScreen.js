import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import * as Speech from 'expo-speech';

const TOPICS = [
  {
    id: 'welcome',
    icon: '👋',
    title: 'Welcome to HANARAD Farmer-Companion',
    category: 'Getting Started',
    scripts: {
      en: 'Welcome to HANARAD Farmer-Companion. This app helps you manage your farm, check weather forecasts, identify crop diseases, and get the latest market prices. Tap any feature on the home screen to get started.',
      hi: 'फार्मरएप में आपका स्वागत है। यह ऐप आपको अपने खेत का प्रबंधन करने, मौसम पूर्वानुमान देखने, फसल रोगों की पहचान करने और बाजार भाव देखने में मदद करता है।',
      gu: 'ફાર્મરએપમાં આપનું સ્વાગત છે. આ એપ તમને ખેત વ્યવસ્થાપન, હવામાન આગાહી, પાક રોગ ઓળખ અને બજાર ભાવ જોવામાં મદદ કરે છે.',
    },
  },
  {
    id: 'weather',
    icon: '⛅',
    title: 'Checking Weather',
    category: 'Getting Started',
    scripts: {
      en: 'To check the weather, tap the Weather tab at the bottom of your screen. You can see today\'s forecast, hourly updates, and a 7-day outlook. We also give farming advice based on the weather.',
      hi: 'मौसम जांचने के लिए, स्क्रीन के नीचे मौसम टैब दबाएं। आप आज का पूर्वानुमान, प्रति घंटे का अपडेट और 7 दिन का आउटलुक देख सकते हैं।',
      gu: 'હવામાન જોવા માટે, સ્ક્રીનના તળિયે હવામાન ટૅબ દબાવો. આજ ભવિષ્ય, કલાક દ્વારા અપડેટ અને 7 દિવસ આઉટલૂક જોઈ શકો.',
    },
  },
  {
    id: 'farmmap',
    icon: '🗺️',
    title: 'Mapping Your Farm',
    category: 'Farm Tools',
    scripts: {
      en: 'To map your farm, go to the Farm tab and tap Map My Farm. You can draw your farm boundary by tapping points on the map, or walk around your farm border with your phone and we will record the GPS path automatically.',
      hi: 'अपने खेत का नक्शा बनाने के लिए, फार्म टैब पर जाएं और मेरे खेत का नक्शा बनाएं दबाएं। आप नक्शे पर बिंदु टैप करके सीमा खींच सकते हैं, या अपने खेत के चारों ओर चलें।',
      gu: 'ખેત મેપ બનાવવા, ફાર્મ ટૅબ પર જઈ ખેત મેપ કરો દબાવો. નક્શા પર બિંદુ ટૅપ કરી સીમા દોરો, અથવા ખેત ફરતે ચાલો.',
    },
  },
  {
    id: 'disease',
    icon: '🔬',
    title: 'Disease Detection',
    category: 'Crop Tools',
    scripts: {
      en: 'To check for crop disease, go to the Crops tab and tap Disease Scan. Take a photo of the affected crop leaf or stem. Our AI will analyze the image and tell you the disease name, severity, and treatment steps.',
      hi: 'फसल रोग जांचने के लिए, फसल टैब पर जाएं और रोग स्कैन दबाएं। प्रभावित पत्ती या तने की फोटो लें। हमारी AI बीमारी का नाम, गंभीरता और उपचार बताएगी।',
      gu: 'પાક રોગ જોવા, પાક ટૅબ પર જઈ રોગ સ્કૅન દબાવો. પ્રભાવિત પાંદડા કે દાંડીનો ફોટો લો. AI રોગ, ગંભીરતા અને સારવાર બતાવશે.',
    },
  },
  {
    id: 'mandi',
    icon: '📊',
    title: 'Mandi Prices',
    category: 'Market',
    scripts: {
      en: 'To check today\'s crop market prices, go to the Crops tab and tap Mandi Prices. You can see prices for all major crops at your nearest mandi. Prices are updated daily.',
      hi: 'आज के बाजार भाव देखने के लिए, फसल टैब पर जाएं और मंडी भाव दबाएं। आप अपने नजदीकी मंडी में सभी प्रमुख फसलों के भाव देख सकते हैं।',
      gu: 'આજ ના ભાવ જોવા, પાક ટૅબ પર જઈ મંડી ભાવ દબાવો. નજીકની મંડીમાં તમામ મુખ્ય પાકના ભાવ જોઈ શકો. ભાવ રોજ અપડેટ.',
    },
  },
  {
    id: 'govtschemes',
    icon: '🏛️',
    title: 'Government Schemes',
    category: 'Benefits',
    scripts: {
      en: 'To find government schemes you are eligible for, tap Government Schemes on the home screen. We show you PM Kisan, crop insurance, soil health cards, and other subsidies based on your state and crop type.',
      hi: 'सरकारी योजनाएं खोजने के लिए, होम स्क्रीन पर सरकारी योजनाएं दबाएं। हम आपको PM किसान, फसल बीमा, मृदा स्वास्थ्य कार्ड और अन्य सब्सिडी दिखाते हैं।',
      gu: 'સરકારી યોજનાઓ માટે, હોમ સ્ક્રીન પર સરકારી યોજનાઓ દબાવો. PM કિસાન, પાક વીમો, માટી સ્વાસ્થ્ય કાર્ડ અને અન્ય સબ્સિડી બતાવીએ.',
    },
  },
  {
    id: 'irrigation',
    icon: '💧',
    title: 'Irrigation Schedule',
    category: 'Crop Tools',
    scripts: {
      en: 'To plan irrigation, go to the Crops tab and tap Irrigation Schedule. Enter your crop type and field size, and we will calculate how much water your crop needs and when to irrigate based on weather data.',
      hi: 'सिंचाई की योजना बनाने के लिए, फसल टैब पर जाएं और सिंचाई कार्यक्रम दबाएं। अपनी फसल और खेत का आकार दर्ज करें, हम बताएंगे कि कब और कितना पानी चाहिए।',
      gu: 'સિંચાઈ આયોજન, પાક ટૅબ પર જઈ સિંચાઈ સૂચિ દબાવો. પાક અને ખેત નાખો, હવામાન ડેટા આધારે ક્યારે અને કેટલું પાણી જોઈએ.',
    },
  },
  {
    id: 'experthelp',
    icon: '👨‍💼',
    title: 'Expert Help',
    category: 'Support',
    scripts: {
      en: 'Need expert advice? Tap Expert Help on the home screen to connect with agricultural experts. You can ask questions about your crops, soil problems, or pest management and get answers from qualified agronomists.',
      hi: 'विशेषज्ञ सलाह चाहिए? होम स्क्रीन पर विशेषज्ञ सहायता दबाएं। फसल, मिट्टी की समस्याओं या कीट प्रबंधन के बारे में सवाल पूछें और योग्य कृषि विशेषज्ञों से उत्तर पाएं।',
      gu: 'નિષ્ણાત સલાહ? હોમ સ્ક્રીન પર નિષ્ણાત સહાય દબાવો. પાક, માટી સમસ્યા કે જીવાત વ્યવસ્થા વિશે પ્રશ્ન પૂછો.',
    },
  },
];

const CATEGORIES = [...new Set(TOPICS.map(t => t.category))];

export default function VoiceGuideScreen({ navigation }) {
  const insets        = useSafeAreaInsets();
  const { theme }     = useTheme();
  const { language }  = useLanguage();

  const [playing, setPlaying]   = useState(null);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  function togglePlay(topic) {
    if (playing === topic.id) {
      Speech.stop();
      setPlaying(null);
      return;
    }
    Speech.stop();
    const script = topic.scripts[language] ?? topic.scripts.en;
    const langCode = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';
    Speech.speak(script, {
      language: langCode,
      rate: 0.88,
      onDone: () => setPlaying(null),
      onStopped: () => setPlaying(null),
      onError: () => setPlaying(null),
    });
    setPlaying(topic.id);
  }

  const filtered = category === 'All' ? TOPICS : TOPICS.filter(t => t.category === category);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#7C3AED' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { Speech.stop(); navigation.goBack(); }}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🎙️ Voice Guide</Text>
            <Text style={styles.headerSub}>Tap any topic to listen</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {['All', ...CATEGORIES].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              {
                backgroundColor: category === cat ? '#7C3AED' : theme.card,
                borderColor:     category === cat ? '#7C3AED' : theme.border,
              },
            ]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.filterText, { color: category === cat ? '#fff' : theme.subtext }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filtered.map(topic => {
          const isPlaying = playing === topic.id;
          return (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.card,
                {
                  backgroundColor: isPlaying ? '#7C3AED14' : theme.card,
                  borderColor:     isPlaying ? '#7C3AED' : theme.border,
                  borderWidth:     isPlaying ? 2 : 1.5,
                },
              ]}
              onPress={() => togglePlay(topic)}
              activeOpacity={0.82}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isPlaying ? '#7C3AED' : '#7C3AED18' }]}>
                  <Text style={styles.topicIcon}>{topic.icon}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.catLabel, { color: '#7C3AED' }]}>{topic.category}</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{topic.title}</Text>
                  {isPlaying && (
                    <Text style={[styles.playingLabel, { color: '#7C3AED' }]}>▶ Playing…</Text>
                  )}
                </View>
              </View>
              <View style={[styles.playBtn, { backgroundColor: isPlaying ? '#7C3AED' : '#7C3AED18' }]}>
                <Text style={[styles.playIcon, { color: isPlaying ? '#fff' : '#7C3AED' }]}>
                  {isPlaying ? '⏹' : '▶'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={[styles.infoCard, { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' }]}>
          <Text style={styles.infoText}>
            🌐 Voice will play in your selected language: <Text style={{ fontWeight: '900' }}>
              {{ en: 'English', hi: 'हिंदी', gu: 'ગુજરાતી' }[language] ?? language}
            </Text>
          </Text>
          <Text style={[styles.infoText, { marginTop: 6 }]}>
            Change language in Settings → Language.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },

  header:      { paddingBottom: 12 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn:     { width: 36, alignItems: 'flex-start' },
  backText:    { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 8 },
  filterText: { fontSize: 13, fontWeight: '700' },

  card:      { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, marginBottom: 10 },
  cardLeft:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle:{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topicIcon: { fontSize: 26 },
  cardBody:  { flex: 1 },
  catLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  playingLabel: { fontSize: 12, fontWeight: '700', marginTop: 3 },

  playBtn:  { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  playIcon: { fontSize: 18, fontWeight: '900' },

  infoCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginTop: 8 },
  infoText: { fontSize: 13, color: '#5B21B6', lineHeight: 18 },
});
