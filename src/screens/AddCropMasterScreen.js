/**
 * AddCropMasterScreen — Submit a new crop to the community catalogue.
 *
 * Flow:
 *  1. User fills form (cropName + category + season are required)
 *  2. Client-side validation via validateCropMasterForm()
 *  3. Duplicate name check via checkCropNameExistsApi()
 *  4. Payload built via buildCropMasterPayload()
 *  5. POST to 'cropmaster' with approved: false, createdType: 'user'
 *  6. On success → offer to immediately select the new crop in AddCropScreen
 *
 * Business rules:
 *  - Submitted crop is PENDING until admin approves
 *  - Pending crop is visible only to the submitter (useCropSearch merges it)
 *  - After approval, visible to all farmers
 *  - cropId is set equal to docId (pre-generated) for consistency
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }  from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  addCropMasterApi,
  checkCropNameExistsApi,
} from '../api/cropApi';
import {
  CROP_CATEGORIES, WATER_REQUIREMENTS, CROP_STATES, SOIL_TYPES,
} from '../constants/cropMaster';
import {
  validateCropMasterForm,
  normalizeCropName,
  parseCommaSeparated,
  buildCropMasterPayload,
  generateCropDocId,
} from '../utils/cropValidator';

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const SEASON_OPTIONS = [
  { key: 'Kharif',    label: 'Kharif'    },
  { key: 'Rabi',      label: 'Rabi'      },
  { key: 'Zaid',      label: 'Zaid'      },
  { key: 'Perennial', label: 'Perennial' },
];

const CROP_EMOJIS = [
  '🌾', '🌽', '🍅', '🥦', '🧅', '🥔', '🍎', '🍋', '🥭', '🫘',
  '🫒', '🌶️', '🧄', '🌿', '🌱', '🍃', '🌻', '🌰', '🫚', '🍇',
  '🥜', '🌴', '🌵', '🥝', '🍓', '🫑', '🥕', '🌸', '🍈', '🥥',
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL LOCAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ emoji, title, theme }) {
  return (
    <View style={sh.row}>
      <Text style={sh.emoji}>{emoji}</Text>
      <Text style={[sh.title, { color: theme.text }]}>{title}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  emoji: { fontSize: 18, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});

function FieldLabel({ children, theme, required }) {
  return (
    <Text style={[fl.label, { color: theme.subtext }]}>
      {children}
      {required ? <Text style={{ color: '#EF4444' }}> *</Text> : null}
    </Text>
  );
}
const fl = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
});

function ChipGroup({ options, value, onChange, multi = false, theme, small = false }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const active = multi
          ? (value || []).includes(o.key)
          : value === o.key;
        return (
          <TouchableOpacity
            key={o.key}
            style={[
              cg.chip,
              small && cg.chipSmall,
              {
                borderColor:     active ? theme.primary : theme.border,
                backgroundColor: active ? theme.primary + '14' : theme.card,
              },
            ]}
            onPress={() => {
              if (multi) {
                const cur = value || [];
                onChange(active ? cur.filter(k => k !== o.key) : [...cur, o.key]);
              } else {
                onChange(active ? null : o.key);
              }
            }}
          >
            {o.icon ? <Text style={cg.icon}>{o.icon}</Text> : null}
            <Text style={[cg.txt, { color: active ? theme.primary : theme.subtext }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const cg = StyleSheet.create({
  chip:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  icon:      { fontSize: 14, marginRight: 5 },
  txt:       { fontSize: 13, fontWeight: '700' },
});

function RangePair({ minLabel, maxLabel, minVal, maxVal, onMin, onMax, unit, theme }) {
  const inp = [rp.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }];
  return (
    <View style={rp.row}>
      <View style={{ flex: 1 }}>
        <FieldLabel theme={theme}>{minLabel}{unit ? ` (${unit})` : ''}</FieldLabel>
        <TextInput style={inp} placeholder="Min" placeholderTextColor={theme.subtext + '80'} value={minVal} onChangeText={onMin} keyboardType="decimal-pad" />
      </View>
      <View style={{ width: 12 }} />
      <View style={{ flex: 1 }}>
        <FieldLabel theme={theme}>{maxLabel}{unit ? ` (${unit})` : ''}</FieldLabel>
        <TextInput style={inp} placeholder="Max" placeholderTextColor={theme.subtext + '80'} value={maxVal} onChangeText={onMax} keyboardType="decimal-pad" />
      </View>
    </View>
  );
}
const rp = StyleSheet.create({
  row:   { flexDirection: 'row' },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function AddCropMasterScreen({ navigation, route }) {
  const { user }  = useAuth();
  const { theme } = useTheme();

  const prefillName = route?.params?.prefillName || '';

  // ── Form state ──────────────────────────────────────────────────────────
  const [cropName,      setCropName]   = useState(prefillName);
  const [scientificName,setSciName]    = useState('');
  const [localNames,    setLocalNames] = useState('');
  const [cropCategory,  setCategory]   = useState(null);
  const [cropSeason,    setSeason]     = useState([]);
  const [soilTypes,     setSoil]       = useState([]);
  const [water,         setWater]      = useState(null);
  const [tempMin,       setTempMin]    = useState('');
  const [tempMax,       setTempMax]    = useState('');
  const [humMin,        setHumMin]     = useState('');
  const [humMax,        setHumMax]     = useState('');
  const [rainMin,       setRainMin]    = useState('');
  const [rainMax,       setRainMax]    = useState('');
  const [duration,      setDuration]   = useState('');
  const [states,        setStates]     = useState([]);
  const [icon,          setIcon]       = useState('🌱');
  const [errors,        setErrors]     = useState({});
  const [saving,        setSaving]     = useState(false);

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const normalized = normalizeCropName(cropName);

    // 1. Validate
    const errs = validateCropMasterForm({
      cropName:     normalized,
      cropCategory,
      cropSeason,
    });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      // 2. Duplicate check
      const exists = await checkCropNameExistsApi(normalized);
      if (exists) {
        Alert.alert(
          'Crop Already Exists',
          `"${normalized}" is already in the database. Search for it in the crop picker.`,
          [{ text: 'OK' }],
        );
        setSaving(false);
        return;
      }

      // 3. Build & submit
      const docId = generateCropDocId(user.id);
      const body  = buildCropMasterPayload({
        cropName: normalized,
        scientificName,
        localNames: parseCommaSeparated(localNames),
        cropCategory,
        cropSeason,
        soilTypes,
        waterRequirement: water,
        tempMin, tempMax,
        humMin,  humMax,
        rainMin, rainMax,
        cropDurationDays: duration,
        statesSupported: states,
        icon,
      });

      await addCropMasterApi(user.id, docId, body);

      // 4. Offer to immediately select the submitted crop
      Alert.alert(
        '✅ Submitted!',
        `"${normalized}" has been submitted for admin review.\n\nYou can use it right away — it will appear in your search results. Other farmers will see it after approval.`,
        [
          {
            text: 'Select This Crop',
            onPress: () =>
              navigation.navigate('AddCrop', {
                preselectedCrop: {
                  cropId:     docId,
                  cropName:   normalized,
                  icon,
                  _isPending: true,
                },
              }),
          },
          { text: 'Done', style: 'cancel', onPress: () => navigation.goBack() },
        ],
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not submit. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Add New Crop</Text>
          <Text style={s.headerSub}>Submit for community database</Text>
        </View>
        <TouchableOpacity
          style={[s.submitBtn, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.submitTxt}>Submit</Text>}
        </TouchableOpacity>
      </View>

      {/* Review notice */}
      <View style={[s.notice, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
        <Text style={{ fontSize: 13, color: '#1D4ED8', lineHeight: 18 }}>
          ℹ️  Your crop will be reviewed by the HANARAD team within 24–48 hrs. After approval it becomes visible to all farmers.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Basic Info ──────────────────────────────────────────── */}
          <SectionHeader emoji="📋" title="Basic Information" theme={theme} />

          {/* Emoji icon picker */}
          <FieldLabel theme={theme}>Crop Icon</FieldLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 6 }}
            keyboardShouldPersistTaps="handled"
          >
            {CROP_EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[
                  s.emojiBtn,
                  {
                    borderColor:     icon === e ? theme.primary : theme.border,
                    backgroundColor: icon === e ? theme.primary + '14' : theme.card,
                  },
                ]}
                onPress={() => setIcon(e)}
              >
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FieldLabel theme={theme} required>Crop Name</FieldLabel>
          <TextInput
            style={[s.input, { borderColor: errors.cropName ? '#EF4444' : theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="e.g. Dragon Fruit, Cluster Beans"
            placeholderTextColor={theme.subtext + '80'}
            value={cropName}
            onChangeText={v => { setCropName(v); setErrors(e => ({ ...e, cropName: null })); }}
            autoCapitalize="words"
          />
          {errors.cropName ? <Text style={s.errTxt}>{errors.cropName}</Text> : null}

          <FieldLabel theme={theme}>Scientific Name</FieldLabel>
          <TextInput
            style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="e.g. Selenicereus undatus"
            placeholderTextColor={theme.subtext + '80'}
            value={scientificName}
            onChangeText={setSciName}
            autoCapitalize="words"
          />

          <FieldLabel theme={theme}>Local Names (comma-separated)</FieldLabel>
          <TextInput
            style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="e.g. Pitaya, Kamalam, ड्रैगन फ्रूट"
            placeholderTextColor={theme.subtext + '80'}
            value={localNames}
            onChangeText={setLocalNames}
          />

          <FieldLabel theme={theme} required>Category</FieldLabel>
          {errors.cropCategory
            ? <Text style={s.errTxt}>{errors.cropCategory}</Text> : null}
          <ChipGroup
            options={CROP_CATEGORIES}
            value={cropCategory}
            onChange={v => { setCategory(v); setErrors(e => ({ ...e, cropCategory: null })); }}
            theme={theme}
          />

          {/* ── Growing Conditions ──────────────────────────────────── */}
          <SectionHeader emoji="🌦️" title="Growing Conditions" theme={theme} />

          <FieldLabel theme={theme} required>Season(s)</FieldLabel>
          {errors.cropSeason
            ? <Text style={s.errTxt}>{errors.cropSeason}</Text> : null}
          <ChipGroup
            options={SEASON_OPTIONS}
            value={cropSeason}
            onChange={v => { setSeason(v); setErrors(e => ({ ...e, cropSeason: null })); }}
            multi
            theme={theme}
          />

          <FieldLabel theme={theme}>Soil Type(s)</FieldLabel>
          <ChipGroup
            options={SOIL_TYPES}
            value={soilTypes}
            onChange={setSoil}
            multi
            theme={theme}
          />

          <FieldLabel theme={theme}>Water Requirement</FieldLabel>
          <ChipGroup
            options={WATER_REQUIREMENTS}
            value={water}
            onChange={setWater}
            theme={theme}
          />

          <RangePair
            minLabel="Min Temp" maxLabel="Max Temp"
            minVal={tempMin} maxVal={tempMax}
            onMin={setTempMin} onMax={setTempMax}
            unit="°C" theme={theme}
          />

          <RangePair
            minLabel="Min Humidity" maxLabel="Max Humidity"
            minVal={humMin} maxVal={humMax}
            onMin={setHumMin} onMax={setHumMax}
            unit="%" theme={theme}
          />

          <RangePair
            minLabel="Min Rainfall" maxLabel="Max Rainfall"
            minVal={rainMin} maxVal={rainMax}
            onMin={setRainMin} onMax={setRainMax}
            unit="mm" theme={theme}
          />

          <FieldLabel theme={theme}>Crop Duration (days)</FieldLabel>
          <TextInput
            style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="e.g. 120"
            placeholderTextColor={theme.subtext + '80'}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
          />

          {/* ── States ─────────────────────────────────────────────── */}
          <SectionHeader emoji="📍" title="States Supported" theme={theme} />
          <Text style={[s.hint, { color: theme.subtext }]}>
            Where is this crop commonly grown?
          </Text>
          <ChipGroup
            options={CROP_STATES.map(st => ({ key: st, label: st }))}
            value={states}
            onChange={setStates}
            multi
            small
            theme={theme}
          />

          {/* ── Submit ─────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: saving ? theme.subtext : theme.primary }]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnTxt}>Submit Crop for Review</Text>}
          </TouchableOpacity>

          <Text style={[s.disclaimer, { color: theme.subtext }]}>
            By submitting, you confirm this information is accurate to the best of your knowledge.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  backTxt:     { fontSize: 22, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  submitBtn:   { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  submitTxt:   { fontSize: 14, fontWeight: '700', color: '#fff' },

  notice: { marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 12 },

  input:   { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 4 },
  errTxt:  { fontSize: 12, color: '#EF4444', fontWeight: '600', marginBottom: 6 },
  hint:    { fontSize: 12, marginBottom: 10 },

  emojiBtn: { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 8 },

  saveBtn:    { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 32, marginBottom: 12 },
  saveBtnTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 24 },
});
