/**
 * AddCropScreen — Add a crop to the user's farm record.
 *
 * Sections (each inside a card):
 *  1. Crop Selection  — Category → SubCategory → Crop dependent dropdowns
 *  2. Season & Dates  — season chips, sowing/harvest dates, growth stage
 *  3. Land & Soil     — area, unit, soil type, irrigation
 *  4. Location        — village, city, state
 *  5. Notes           — free-text observations
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, FlatList, Modal, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }     from '../context/AuthContext';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  CROP_SEASONS, SOIL_TYPES, IRRIGATION_TYPES, CROP_STAGES, LAND_UNITS, CROP_STATUS,
} from '../constants/cropMaster';
import { getCurrentSeason } from '../utils/cropEngine';
import {
  getCropCategoriesApi, getCropSubCategoriesApi, getCropsByMasterApi,
  addUserCropApi,
} from '../api/cropApi';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD
// Wraps each form section with a numbered badge, icon, title, and card shell.
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({ step, icon, title, accent, children, theme }) {
  return (
    <View style={[sc.card, { backgroundColor: theme.card }]}>
      <View style={sc.head}>
        <View style={[sc.badge, { backgroundColor: accent + '18' }]}>
          <Text style={[sc.badgeNum, { color: accent }]}>{step}</Text>
        </View>
        <Text style={sc.headIcon}>{icon}</Text>
        <Text style={[sc.headTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={[sc.rule, { backgroundColor: theme.border }]} />
      <View style={sc.body}>{children}</View>
    </View>
  );
}
const sc = StyleSheet.create({
  card: {
    borderRadius: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  head:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  badge:     { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  badgeNum:  { fontSize: 13, fontWeight: '900' },
  headIcon:  { fontSize: 20, marginRight: 8 },
  headTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 0.1 },
  rule:      { height: StyleSheet.hairlineWidth },
  body:      { padding: 16 },
});

// ─────────────────────────────────────────────────────────────────────────────
// FIELD LABEL
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ children, theme }) {
  return <Text style={[fl.lbl, { color: theme.subtext }]}>{children}</Text>;
}
const fl = StyleSheet.create({
  lbl: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6, textTransform: 'uppercase' },
});

// ─────────────────────────────────────────────────────────────────────────────
// STYLED INPUT — focus-aware border, optional leading icon
// ─────────────────────────────────────────────────────────────────────────────

function StyledInput({ label, icon, value, onChange, placeholder, multiline, keyboardType, theme }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <FieldLabel theme={theme}>{label}</FieldLabel> : null}
      <View
        style={[
          si.wrap,
          {
            backgroundColor: theme.background,
            borderColor: focused ? theme.primary : theme.border,
          },
          multiline && si.multilineWrap,
        ]}
      >
        {icon ? <Text style={si.leadIcon}>{icon}</Text> : null}
        <TextInput
          style={[si.input, { color: theme.text }, multiline && si.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor={theme.subtext + '55'}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          keyboardType={keyboardType || 'default'}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
}
const si = StyleSheet.create({
  wrap:          { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12 },
  multilineWrap: { alignItems: 'flex-start', paddingTop: 4 },
  leadIcon:      { fontSize: 16, marginRight: 8, opacity: 0.6 },
  input:         { flex: 1, fontSize: 14, paddingVertical: 12 },
  multilineInput:{ height: 96, paddingTop: 10 },
});

// ─────────────────────────────────────────────────────────────────────────────
// CHIP GROUP — filled style: selected = solid primary, unselected = ghost
// ─────────────────────────────────────────────────────────────────────────────

function ChipGroup({ label, options, value, onChange, multi = false, theme, horizontal = false }) {
  const chips = options.map(o => {
    const active = multi ? (value || []).includes(o.key) : value === o.key;
    return (
      <TouchableOpacity
        key={o.key}
        style={[
          cg.chip,
          active
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : { backgroundColor: theme.background, borderColor: theme.border },
        ]}
        onPress={() => {
          if (multi) {
            const cur = value || [];
            onChange(active ? cur.filter(k => k !== o.key) : [...cur, o.key]);
          } else {
            onChange(active ? null : o.key);
          }
        }}
        activeOpacity={0.75}
      >
        {o.icon ? <Text style={cg.chipIcon}>{o.icon}</Text> : null}
        <Text style={[cg.chipTxt, { color: active ? '#fff' : theme.subtext }]}>{o.label}</Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <FieldLabel theme={theme}>{label}</FieldLabel> : null}
      {horizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cg.row}>
          {chips}
        </ScrollView>
      ) : (
        <View style={cg.wrap}>{chips}</View>
      )}
    </View>
  );
}
const cg = StyleSheet.create({
  wrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row:     { gap: 8, paddingBottom: 2 },
  chip:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipIcon:{ fontSize: 13, marginRight: 5 },
  chipTxt: { fontSize: 13, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// DATE FIELD — inline calendar icon, focus-aware border
// ─────────────────────────────────────────────────────────────────────────────

function DateField({ label, value, onChange, placeholder, theme }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      <FieldLabel theme={theme}>{label}</FieldLabel>
      <View
        style={[
          df.wrap,
          {
            backgroundColor: theme.background,
            borderColor: focused ? theme.primary : (value ? theme.primary + '60' : theme.border),
          },
        ]}
      >
        <Text style={df.calIcon}>📅</Text>
        <TextInput
          style={[df.input, { color: theme.text }]}
          placeholder={placeholder || 'YYYY-MM-DD'}
          placeholderTextColor={theme.subtext + '55'}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="numbers-and-punctuation"
        />
      </View>
    </View>
  );
}
const df = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 10 },
  calIcon: { fontSize: 15, marginRight: 6, opacity: 0.5 },
  input:   { flex: 1, fontSize: 14, paddingVertical: 11 },
});

// ─────────────────────────────────────────────────────────────────────────────
// DROPDOWN FIELD — bottom-sheet modal with drag handle
// Green dot = value selected. Lock icon = disabled. Chevron = open.
// ─────────────────────────────────────────────────────────────────────────────

function DropdownField({ label, placeholder, value, items, onChange, disabled = false, loading = false, theme }) {
  const [open, setOpen] = useState(false);
  const hasValue = Boolean(value);

  return (
    <View style={{ marginBottom: 14 }}>
      <FieldLabel theme={theme}>{label}</FieldLabel>

      <TouchableOpacity
        style={[
          dd.trigger,
          {
            backgroundColor: theme.background,
            borderColor: hasValue ? theme.primary : (disabled ? theme.border + '80' : theme.border),
            opacity: disabled ? 0.55 : 1,
          },
        ]}
        onPress={() => { if (!disabled && !loading) setOpen(true); }}
        activeOpacity={0.7}
      >
        {/* Green dot when a value is selected */}
        {hasValue && <View style={[dd.selDot, { backgroundColor: theme.success }]} />}

        <Text
          style={[
            dd.valTxt,
            { color: hasValue ? theme.text : theme.subtext + '70', flex: 1 },
          ]}
          numberOfLines={1}
        >
          {value?.label || placeholder}
        </Text>

        {loading
          ? <ActivityIndicator size="small" color={theme.primary} />
          : <Text style={[dd.chevron, { color: hasValue ? theme.primary : theme.subtext + '80' }]}>
              {disabled ? '🔒' : '▼'}
            </Text>
        }
      </TouchableOpacity>

      {/* Bottom-sheet */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <TouchableOpacity style={dd.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[dd.sheet, { backgroundColor: theme.card }]}>
            {/* Drag handle */}
            <View style={[dd.handle, { backgroundColor: theme.border }]} />

            {/* Sheet header */}
            <View style={[dd.sheetHead, { borderBottomColor: theme.border }]}>
              <Text style={[dd.sheetTitle, { color: theme.text }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <View style={[dd.closeCircle, { backgroundColor: theme.background }]}>
                  <Text style={[dd.closeIcon, { color: theme.subtext }]}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              keyExtractor={item => item.value}
              renderItem={({ item }) => {
                const sel = item.value === value?.value;
                return (
                  <TouchableOpacity
                    style={[
                      dd.option,
                      { borderBottomColor: theme.border + '50' },
                      sel && { backgroundColor: theme.primary + '0D' },
                    ]}
                    onPress={() => { onChange(item); setOpen(false); }}
                    activeOpacity={0.65}
                  >
                    {sel
                      ? <View style={[dd.optDot, { backgroundColor: theme.primary }]} />
                      : <View style={[dd.optDot, { backgroundColor: 'transparent' }]} />
                    }
                    <Text style={[dd.optTxt, { color: sel ? theme.primary : theme.text }, sel && { fontWeight: '700' }]}>
                      {item.label}
                    </Text>
                    {sel && <Text style={{ color: theme.primary, fontSize: 16 }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={dd.emptyWrap}>
                  <Text style={dd.emptyEmoji}>🔍</Text>
                  <Text style={[dd.emptyTxt, { color: theme.subtext }]}>No options available</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const dd = StyleSheet.create({
  trigger:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, gap: 8 },
  selDot:     { width: 8, height: 8, borderRadius: 4 },
  valTxt:     { fontSize: 14 },
  chevron:    { fontSize: 11 },
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '65%', paddingBottom: Platform.OS === 'ios' ? 28 : 12 },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 6 },
  sheetHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 16, fontWeight: '800' },
  closeCircle:{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  closeIcon:  { fontSize: 14, fontWeight: '700' },
  option:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  optDot:     { width: 6, height: 6, borderRadius: 3 },
  optTxt:     { fontSize: 15, flex: 1 },
  emptyWrap:  { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyTxt:   { fontSize: 14 },
});

// ─────────────────────────────────────────────────────────────────────────────
// CROP BREADCRUMB — progressive path shown as crop is selected
// Food Crop  ›  Cereal  ›  Rice
// ─────────────────────────────────────────────────────────────────────────────

function CropBreadcrumb({ category, subCategory, crop, theme }) {
  if (!category) return null;
  const catName  = category.label.split(' (')[0];
  const subName  = subCategory?.label.split(' (')[0];
  const cropName = crop?.cropName;

  return (
    <View style={[bc.pill, { backgroundColor: theme.success + '12', borderColor: theme.success + '35' }]}>
      <Text style={bc.checkmark}>✓</Text>
      <Text style={[bc.catTxt,  { color: theme.success }]}>{catName}</Text>
      {subName ? (
        <>
          <Text style={[bc.sep, { color: theme.subtext }]}> › </Text>
          <Text style={[bc.catTxt, { color: theme.success }]}>{subName}</Text>
        </>
      ) : null}
      {cropName ? (
        <>
          <Text style={[bc.sep, { color: theme.subtext }]}> › </Text>
          <Text style={[bc.cropTxt, { color: theme.primary }]}>{cropName}</Text>
        </>
      ) : null}
    </View>
  );
}
const bc = StyleSheet.create({
  pill:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 },
  checkmark:{ fontSize: 13, color: '#10B981', marginRight: 6 },
  catTxt:   { fontSize: 12, fontWeight: '600' },
  cropTxt:  { fontSize: 12, fontWeight: '800' },
  sep:      { fontSize: 12, opacity: 0.45 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function AddCropScreen({ navigation, route }) {
  const { theme }    = useTheme();
  const { language } = useLanguage();
  const { user }     = useAuth();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const currentSeason = getCurrentSeason();

  // ── Master data ────────────────────────────────────────────────────────
  const [loadingData,           setLoadingData]     = useState(true);
  const [categories,            setCategories]      = useState([]);
  const [subCategories,         setSubCategories]   = useState([]);
  const [crops,                 setCrops]           = useState([]);
  const [filteredSubCategories, setFilteredSubCats] = useState([]);
  const [filteredCrops,         setFilteredCrops]   = useState([]);

  // ── Selections ─────────────────────────────────────────────────────────
  const [selectedCategory,    setSelectedCategory]    = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedCrop,        setSelectedCrop]        = useState(null);
  const [cropError,           setCropError]           = useState('');

  // ── Season & Dates ─────────────────────────────────────────────────────
  const [season,      setSeason]  = useState(currentSeason);
  const [sowingDate,  setSowing]  = useState('');
  const [harvestDate, setHarvest] = useState('');
  const [stage,       setStage]   = useState('seedling');

  // ── Land & Soil ────────────────────────────────────────────────────────
  const [landArea,   setArea]    = useState('');
  const [landUnit,   setUnit]    = useState('acre');
  const [soilType,   setSoil]    = useState(null);
  const [irrigation, setIrrType] = useState(null);

  // ── Location ───────────────────────────────────────────────────────────
  const [village, setVillage] = useState(user?.village || '');
  const [city,    setCity]    = useState(user?.city    || '');
  const [state,   setState_]  = useState(user?.state   || '');

  // ── Notes ──────────────────────────────────────────────────────────────
  const [notes,  setNotes]  = useState('');

  // ── UI ─────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  const cropId   = selectedCrop?.value    || null;
  const cropName = selectedCrop?.cropName || '';
  const cropIcon = '🌱';

  // ── Fetch all 3 datasets on mount ──────────────────────────────────────
  useEffect(() => {
    async function fetchMasterData() {
      setLoadingData(true);
      try {
        const [cats, subCats, cropList] = await Promise.all([
          getCropCategoriesApi(),
          getCropSubCategoriesApi(),
          getCropsByMasterApi(),
        ]);
        setCategories(cats.map(c => ({
          label: c.localCategoryName ? `${c.category} (${c.localCategoryName})` : c.category,
          value: c._id,
        })));
        setSubCategories(subCats);
        setCrops(cropList);
      } catch {
        Alert.alert('Error', 'Could not load crop data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    }
    fetchMasterData();
  }, []);

  // ── Filter subcategories on category change ────────────────────────────
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredSubCats([]); setSelectedSubCategory(null);
      setSelectedCrop(null);  setFilteredCrops([]);
      return;
    }
    setFilteredSubCats(
      subCategories
        .filter(s => s.category === selectedCategory.value)
        .map(s => ({
          label: s.localSubCategoryName ? `${s.subcategory} (${s.localSubCategoryName})` : s.subcategory,
          value: s._id,
        }))
    );
    setSelectedSubCategory(null); setSelectedCrop(null); setFilteredCrops([]);
  }, [selectedCategory, subCategories]);

  // ── Filter crops on subcategory change ────────────────────────────────
  useEffect(() => {
    if (!selectedSubCategory) { setFilteredCrops([]); setSelectedCrop(null); return; }
    setFilteredCrops(
      crops
        .filter(c => c.subcategory === selectedSubCategory.value)
        .map(c => ({
          label:    c.localCropName ? `${c.cropName} (${c.localCropName})` : c.cropName,
          value:    c._id,
          cropName: c.cropName,
        }))
    );
    setSelectedCrop(null);
  }, [selectedSubCategory, crops]);

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedCrop) { setCropError('Please select a crop to continue.'); return; }
    setCropError('');
    setSaving(true);
    try {
      // Generate a unique docId so the API creates a new record
      const docId = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      // Await the API call directly — if it fails the user sees the error
      // and stays on screen. We never navigate back on silent failure.
      await addUserCropApi(user.id, docId, {
        cropId:        cropId || 'custom',
        cropName,
        cropIcon,
        categoryId:    selectedCategory?.value    || null,
        subCategoryId: selectedSubCategory?.value || null,
        cropSeason:    season,
        sowingDate:    sowingDate  || null,
        harvestDate:   harvestDate || null,
        landArea:      parseFloat(landArea) || null,
        landUnit,
        soilType:      soilType   || null,
        irrigationType:irrigation || null,
        currentStage:  stage,
        village:       village.trim() || null,
        city:          city.trim()    || null,
        state:         state.trim()   || null,
        notes:         notes.trim()   || null,
        cropStatus:    CROP_STATUS.ACTIVE,
      });

      // Only navigate back after the API confirms the save
      navigation.goBack();
    } catch (e) {
      Alert.alert('Save Failed', e.message || 'Could not save crop. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Add New Crop</Text>
          <Text style={styles.headerSub}>Fill in details to track your crop</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={theme.primary} />
            : <Text style={[styles.saveBtnTxt, { color: theme.primary }]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── 1. CROP SELECTION ───────────────────────────────── */}
          <SectionCard step="1" icon="🌱" title="Select Crop" accent={theme.primary} theme={theme}>
            {loadingData ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.primary} size="small" />
                <Text style={[styles.loadingTxt, { color: theme.subtext }]}>Loading crop data…</Text>
              </View>
            ) : (
              <>
                <DropdownField
                  label="CATEGORY"
                  placeholder="Select a category…"
                  value={selectedCategory}
                  items={categories}
                  onChange={item => { setSelectedCategory(item); setCropError(''); }}
                  theme={theme}
                />
                <DropdownField
                  label="SUB CATEGORY"
                  placeholder={selectedCategory ? 'Select a subcategory…' : 'Select a category first'}
                  value={selectedSubCategory}
                  items={filteredSubCategories}
                  onChange={item => { setSelectedSubCategory(item); setCropError(''); }}
                  disabled={!selectedCategory}
                  theme={theme}
                />
                <DropdownField
                  label="CROP"
                  placeholder={selectedSubCategory ? 'Select a crop…' : 'Select a subcategory first'}
                  value={selectedCrop}
                  items={filteredCrops}
                  onChange={item => { setSelectedCrop(item); setCropError(''); }}
                  disabled={!selectedSubCategory}
                  theme={theme}
                />

                {/* Breadcrumb path */}
                <CropBreadcrumb
                  category={selectedCategory}
                  subCategory={selectedSubCategory}
                  crop={selectedCrop}
                  theme={theme}
                />

                {cropError ? (
                  <View style={[styles.errorRow, { backgroundColor: theme.danger + '12' }]}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={[styles.errorTxt, { color: theme.danger }]}>{cropError}</Text>
                  </View>
                ) : null}
              </>
            )}
          </SectionCard>

          {/* ── 2. SEASON & DATES ───────────────────────────────── */}
          <SectionCard step="2" icon="📅" title="Season & Dates" accent="#F59E0B" theme={theme}>
            <ChipGroup
              label="SEASON"
              options={Object.values(CROP_SEASONS).map(s => ({ key: s, label: s }))}
              value={season}
              onChange={setSeason}
              horizontal
              theme={theme}
            />

            <View style={styles.twoCol}>
              <DateField label="SOWING DATE"  value={sowingDate}  onChange={setSowing}  placeholder="YYYY-MM-DD" theme={theme} />
              <View style={{ width: 10 }} />
              <DateField label="HARVEST DATE" value={harvestDate} onChange={setHarvest} placeholder="YYYY-MM-DD" theme={theme} />
            </View>

            <View style={{ height: 12 }} />

            <ChipGroup
              label="CURRENT STAGE"
              options={CROP_STAGES}
              value={stage}
              onChange={setStage}
              horizontal
              theme={theme}
            />
          </SectionCard>

          {/* ── 3. LAND & SOIL ──────────────────────────────────── */}
          <SectionCard step="3" icon="🌍" title="Land & Soil" accent="#10B981" theme={theme}>
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <StyledInput
                  label="LAND AREA"
                  icon="📐"
                  placeholder="e.g. 2.5"
                  value={landArea}
                  onChange={setArea}
                  keyboardType="decimal-pad"
                  theme={theme}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <ChipGroup
                  label="UNIT"
                  options={LAND_UNITS}
                  value={landUnit}
                  onChange={setUnit}
                  horizontal
                  theme={theme}
                />
              </View>
            </View>

            <ChipGroup
              label="SOIL TYPE"
              options={SOIL_TYPES}
              value={soilType}
              onChange={setSoil}
              horizontal
              theme={theme}
            />

            <ChipGroup
              label="IRRIGATION"
              options={IRRIGATION_TYPES}
              value={irrigation}
              onChange={setIrrType}
              horizontal
              theme={theme}
            />
          </SectionCard>

          {/* ── 4. LOCATION ─────────────────────────────────────── */}
          <SectionCard step="4" icon="📍" title="Location" accent="#06B6D4" theme={theme}>
            <StyledInput
              label="VILLAGE / TOWN"
              icon="🏘️"
              placeholder="e.g. Anand"
              value={village}
              onChange={setVillage}
              theme={theme}
            />
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <StyledInput
                  label="CITY"
                  icon="🏙️"
                  placeholder="City"
                  value={city}
                  onChange={setCity}
                  theme={theme}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <StyledInput
                  label="STATE"
                  icon="🗺️"
                  placeholder="State"
                  value={state}
                  onChange={setState_}
                  theme={theme}
                />
              </View>
            </View>
          </SectionCard>

          {/* ── 5. NOTES ────────────────────────────────────────── */}
          <SectionCard step="5" icon="📝" title="Notes" accent="#8B5CF6" theme={theme}>
            <StyledInput
              placeholder="Variety used, fertilizer plan, observations…"
              value={notes}
              onChange={setNotes}
              multiline
              theme={theme}
            />
          </SectionCard>

          {/* ── Save Crop button ─────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: saving ? theme.subtext : theme.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={styles.submitInner}>
                  <Text style={styles.submitTxt}>Save Crop</Text>
                  <Text style={styles.submitArrow}>→</Text>
                </View>
              )
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme) {
  return StyleSheet.create({
    root:   { flex: 1 },
    scroll: { padding: 14, paddingBottom: 52 },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    backArrow:   { fontSize: 24, color: '#fff', fontWeight: '700', lineHeight: 28 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.1 },
    headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 1 },
    saveBtn: {
      backgroundColor: '#fff',
      borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8,
      minWidth: 64, alignItems: 'center',
    },
    saveBtnTxt: { fontSize: 14, fontWeight: '800' },

    // Loading
    loadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 10 },
    loadingTxt: { fontSize: 13 },

    // Error
    errorRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 6, gap: 6 },
    errorIcon: { fontSize: 14 },
    errorTxt:  { fontSize: 12, fontWeight: '600', flex: 1 },

    // Layout helpers
    twoCol: { flexDirection: 'row', marginBottom: 4 },

    // Submit
    submitBtn: {
      borderRadius: 16, paddingVertical: 17, alignItems: 'center',
      marginTop: 8, marginBottom: 8,
      shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    submitInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    submitTxt:   { fontSize: 17, fontWeight: '900', color: '#fff' },
    submitArrow: { fontSize: 18, color: 'rgba(255,255,255,0.8)' },
  });
}
