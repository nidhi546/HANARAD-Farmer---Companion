/**
 * SmartToolsScreen — Farm Calculators
 *
 * Four tools in a single tab-based screen:
 *   1. EMI Calculator — loan repayment planner
 *   2. Fertilizer Calculator — NPK per acre
 *   3. Seed Quantity Calculator — seeds per acre by spacing
 *   4. Land Area Converter — bigha / acre / hectare / sq-ft
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'emi',        icon: '💳', labelKey: 'toolEmi'        },
  { key: 'fertilizer', icon: '🌿', labelKey: 'toolFertilizer' },
  { key: 'seed',       icon: '🌱', labelKey: 'toolSeed'       },
  { key: 'land',       icon: '📐', labelKey: 'toolLand'       },
];

// ── Helper: safe parse float ──────────────────────────────────────────────────
const pf = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

// ═════════════════════════════════════════════════════════════════════════════
// SUB-CALCULATORS
// ═════════════════════════════════════════════════════════════════════════════

// ── 1. EMI Calculator ─────────────────────────────────────────────────────────
function EmiCalculator({ styles, theme, t }) {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate]           = useState('');
  const [months, setMonths]       = useState('');
  const [result, setResult]       = useState(null);

  const calculate = useCallback(() => {
    const P = pf(principal);
    const R = pf(rate) / 12 / 100;
    const N = pf(months);
    if (!P || !N) { setResult(null); return; }
    let emi, totalPay, totalInterest;
    if (R === 0) {
      emi = P / N;
    } else {
      emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    }
    totalPay     = emi * N;
    totalInterest = totalPay - P;
    setResult({ emi, totalPay, totalInterest });
  }, [principal, rate, months]);

  const reset = () => { setPrincipal(''); setRate(''); setMonths(''); setResult(null); };

  return (
    <View>
      <Text style={styles.toolDesc}>{t('toolEmiDesc')}</Text>
      <CalcInput label={t('toolLoanAmount')} value={principal} onChange={setPrincipal} unit="₹" placeholder="e.g. 100000" theme={theme} styles={styles} />
      <CalcInput label={t('toolAnnualRate')} value={rate}      onChange={setRate}      unit="%" placeholder="e.g. 7"      theme={theme} styles={styles} />
      <CalcInput label={t('toolLoanMonths')} value={months}    onChange={setMonths}    unit={t('months')} placeholder="e.g. 36" theme={theme} styles={styles} />
      <CalcButtons onCalc={calculate} onReset={reset} t={t} styles={styles} theme={theme} />
      {result && (
        <ResultCard theme={theme} styles={styles}>
          <ResultRow label={t('toolMonthlyEmi')} value={`₹ ${result.emi.toFixed(2)}`} primary theme={theme} styles={styles} />
          <ResultRow label={t('toolTotalPayment')} value={`₹ ${result.totalPay.toFixed(0)}`} theme={theme} styles={styles} />
          <ResultRow label={t('toolTotalInterest')} value={`₹ ${result.totalInterest.toFixed(0)}`} theme={theme} styles={styles} />
        </ResultCard>
      )}
    </View>
  );
}

// ── 2. Fertilizer Calculator ──────────────────────────────────────────────────
const FERTILIZERS = [
  { name: 'Urea',     N: 46, P: 0,  K: 0  },
  { name: 'DAP',      N: 18, P: 46, K: 0  },
  { name: 'MOP',      N: 0,  P: 0,  K: 60 },
  { name: 'NPK 12-32-16', N: 12, P: 32, K: 16 },
  { name: 'NPK 10-26-26', N: 10, P: 26, K: 26 },
  { name: 'SSP',      N: 0,  P: 16, K: 0  },
];

function FertilizerCalculator({ styles, theme, t }) {
  const [acres, setAcres]         = useState('');
  const [nReq, setNReq]           = useState('');
  const [pReq, setPReq]           = useState('');
  const [kReq, setKReq]           = useState('');
  const [selFert, setSelFert]     = useState(0);
  const [result, setResult]       = useState(null);

  const calculate = useCallback(() => {
    const a  = pf(acres)  || 1;
    const nR = pf(nReq);
    const pR = pf(pReq);
    const kR = pf(kReq);
    const f  = FERTILIZERS[selFert];
    const bags = [];
    if (f.N > 0 && nR > 0) bags.push({ name: f.name, amount: (nR / (f.N / 100) * a).toFixed(1), nutrient: 'N' });
    if (f.P > 0 && pR > 0) bags.push({ name: f.name, amount: (pR / (f.P / 100) * a).toFixed(1), nutrient: 'P' });
    if (f.K > 0 && kR > 0) bags.push({ name: f.name, amount: (kR / (f.K / 100) * a).toFixed(1), nutrient: 'K' });
    setResult(bags);
  }, [acres, nReq, pReq, kReq, selFert]);

  const reset = () => { setAcres(''); setNReq(''); setPReq(''); setKReq(''); setResult(null); };

  return (
    <View>
      <Text style={styles.toolDesc}>{t('toolFertDesc')}</Text>
      <CalcInput label={t('toolAcres')} value={acres} onChange={setAcres} unit={t('acres')} placeholder="e.g. 2" theme={theme} styles={styles} />
      <Text style={[styles.label, { marginTop: 8 }]}>{t('toolSelectFertilizer')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {FERTILIZERS.map((f, i) => (
          <TouchableOpacity
            key={f.name}
            onPress={() => setSelFert(i)}
            style={[styles.chipBtn, selFert === i && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          >
            <Text style={[styles.chipText, selFert === i && { color: '#fff' }]}>{f.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.npkRow}>{t('toolNPKRequired')} (kg/acre)</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <CalcInput label="N" value={nReq} onChange={setNReq} unit="kg" placeholder="e.g. 40" theme={theme} styles={styles} compact />
        </View>
        <View style={{ flex: 1 }}>
          <CalcInput label="P" value={pReq} onChange={setPReq} unit="kg" placeholder="e.g. 20" theme={theme} styles={styles} compact />
        </View>
        <View style={{ flex: 1 }}>
          <CalcInput label="K" value={kReq} onChange={setKReq} unit="kg" placeholder="e.g. 20" theme={theme} styles={styles} compact />
        </View>
      </View>
      <CalcButtons onCalc={calculate} onReset={reset} t={t} styles={styles} theme={theme} />
      {result && result.length > 0 && (
        <ResultCard theme={theme} styles={styles}>
          {result.map((r, i) => (
            <ResultRow key={i} label={`${r.name} (${r.nutrient})`} value={`${r.amount} kg`} primary={i === 0} theme={theme} styles={styles} />
          ))}
        </ResultCard>
      )}
    </View>
  );
}

// ── 3. Seed Quantity Calculator ───────────────────────────────────────────────
const COMMON_CROPS = [
  { name: 'Cotton',    rowSpacing: 60,  plantSpacing: 60,  seedsPerHole: 2, seedWeight: 10 },
  { name: 'Groundnut', rowSpacing: 30,  plantSpacing: 10,  seedsPerHole: 1, seedWeight: 0.5 },
  { name: 'Wheat',     rowSpacing: 22,  plantSpacing: 5,   seedsPerHole: 1, seedWeight: 0.04 },
  { name: 'Bajra',     rowSpacing: 45,  plantSpacing: 15,  seedsPerHole: 2, seedWeight: 0.01 },
  { name: 'Cumin',     rowSpacing: 30,  plantSpacing: 10,  seedsPerHole: 1, seedWeight: 0.003 },
  { name: 'Custom',    rowSpacing: null, plantSpacing: null, seedsPerHole: 1, seedWeight: null },
];

function SeedCalculator({ styles, theme, t }) {
  const [acres, setAcres]           = useState('');
  const [selCrop, setSelCrop]       = useState(0);
  const [rowSp, setRowSp]           = useState('');
  const [plantSp, setPlantSp]       = useState('');
  const [seedsHole, setSeedsHole]   = useState('1');
  const [seedWt, setSeedWt]         = useState('');
  const [result, setResult]         = useState(null);

  const crop = COMMON_CROPS[selCrop];

  const effectiveRow   = crop.rowSpacing   ?? pf(rowSp);
  const effectivePlant = crop.plantSpacing ?? pf(plantSp);
  const effectiveWt    = crop.seedWeight   ?? pf(seedWt);

  const calculate = useCallback(() => {
    const a = pf(acres) * 4047; // sq meters
    const rs = pf(String(effectiveRow)) / 100;
    const ps = pf(String(effectivePlant)) / 100;
    const sh = pf(seedsHole) || 1;
    const sw = pf(String(effectiveWt));
    if (!rs || !ps) { setResult(null); return; }
    const plants     = a / (rs * ps);
    const totalSeeds = plants * sh;
    const totalKg    = sw ? (totalSeeds * sw) / 1000 : null;
    setResult({ plants: Math.ceil(plants), totalSeeds: Math.ceil(totalSeeds), totalKg });
  }, [acres, effectiveRow, effectivePlant, seedsHole, effectiveWt]);

  const reset = () => { setAcres(''); setRowSp(''); setPlantSp(''); setSeedsHole('1'); setSeedWt(''); setResult(null); };

  return (
    <View>
      <Text style={styles.toolDesc}>{t('toolSeedDesc')}</Text>
      <CalcInput label={t('toolAcres')} value={acres} onChange={setAcres} unit={t('acres')} placeholder="e.g. 1" theme={theme} styles={styles} />
      <Text style={[styles.label, { marginTop: 8 }]}>{t('toolSelectCrop')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {COMMON_CROPS.map((c, i) => (
          <TouchableOpacity
            key={c.name}
            onPress={() => setSelCrop(i)}
            style={[styles.chipBtn, selCrop === i && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          >
            <Text style={[styles.chipText, selCrop === i && { color: '#fff' }]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {crop.rowSpacing == null && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <CalcInput label={t('toolRowSpacing')} value={rowSp} onChange={setRowSp} unit="cm" placeholder="e.g. 45" theme={theme} styles={styles} compact />
          </View>
          <View style={{ flex: 1 }}>
            <CalcInput label={t('toolPlantSpacing')} value={plantSp} onChange={setPlantSp} unit="cm" placeholder="e.g. 15" theme={theme} styles={styles} compact />
          </View>
        </View>
      )}
      {crop.seedWeight == null && (
        <CalcInput label={t('toolSeedWeightGm')} value={seedWt} onChange={setSeedWt} unit="g" placeholder="e.g. 0.5" theme={theme} styles={styles} />
      )}
      <CalcInput label={t('toolSeedsPerHole')} value={seedsHole} onChange={setSeedsHole} unit={t('seeds')} placeholder="1" theme={theme} styles={styles} />
      <CalcButtons onCalc={calculate} onReset={reset} t={t} styles={styles} theme={theme} />
      {result && (
        <ResultCard theme={theme} styles={styles}>
          <ResultRow label={t('toolTotalPlants')} value={result.plants.toLocaleString()} primary theme={theme} styles={styles} />
          <ResultRow label={t('toolTotalSeeds')} value={result.totalSeeds.toLocaleString()} theme={theme} styles={styles} />
          {result.totalKg != null && (
            <ResultRow label={t('toolSeedKg')} value={`${result.totalKg.toFixed(2)} kg`} theme={theme} styles={styles} />
          )}
        </ResultCard>
      )}
    </View>
  );
}

// ── 4. Land Area Converter ─────────────────────────────────────────────────────
const UNITS = ['Bigha', 'Acre', 'Hectare', 'Sq Ft', 'Sq Meter', 'Guntha'];
// Conversion factors to sq meters
const TO_SQM = { Bigha: 2508.38, Acre: 4046.86, Hectare: 10000, 'Sq Ft': 0.0929, 'Sq Meter': 1, Guntha: 101.17 };

function LandConverter({ styles, theme, t }) {
  const [value, setValue]       = useState('');
  const [fromUnit, setFromUnit] = useState('Bigha');
  const [result, setResult]     = useState(null);

  const calculate = useCallback(() => {
    const sqm = pf(value) * TO_SQM[fromUnit];
    const res = {};
    UNITS.forEach(u => { res[u] = sqm / TO_SQM[u]; });
    setResult(res);
  }, [value, fromUnit]);

  const reset = () => { setValue(''); setResult(null); };

  return (
    <View>
      <Text style={styles.toolDesc}>{t('toolLandDesc')}</Text>
      <CalcInput label={t('toolEnterArea')} value={value} onChange={setValue} unit={fromUnit} placeholder="e.g. 2.5" theme={theme} styles={styles} />
      <Text style={[styles.label, { marginTop: 8 }]}>{t('toolFromUnit')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {UNITS.map(u => (
          <TouchableOpacity
            key={u}
            onPress={() => setFromUnit(u)}
            style={[styles.chipBtn, fromUnit === u && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          >
            <Text style={[styles.chipText, fromUnit === u && { color: '#fff' }]}>{u}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <CalcButtons onCalc={calculate} onReset={reset} t={t} styles={styles} theme={theme} />
      {result && (
        <ResultCard theme={theme} styles={styles}>
          {UNITS.filter(u => u !== fromUnit).map((u, i) => (
            <ResultRow
              key={u}
              label={u}
              value={result[u] < 0.001 ? result[u].toFixed(6) : result[u] > 10000 ? Math.round(result[u]).toLocaleString() : result[u].toFixed(4)}
              primary={i === 0}
              theme={theme}
              styles={styles}
            />
          ))}
        </ResultCard>
      )}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════
function CalcInput({ label, value, onChange, unit, placeholder, theme, styles, compact }) {
  return (
    <View style={compact ? styles.inputRowCompact : styles.inputRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, { borderColor: theme.borderFocus }]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={theme.subtext}
          returnKeyType="done"
        />
        <Text style={styles.inputUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function CalcButtons({ onCalc, onReset, t, styles, theme }) {
  return (
    <View style={styles.btnRow}>
      <TouchableOpacity style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.primary }]} onPress={onCalc}>
        <Text style={styles.btnPrimaryText}>🧮 {t('calculate')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnSecondary, { borderColor: theme.border }]} onPress={onReset}>
        <Text style={[styles.btnSecondaryText, { color: theme.subtext }]}>↺ {t('reset')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ResultCard({ children, theme, styles }) {
  return (
    <View style={[styles.resultCard, { backgroundColor: theme.successLight, borderColor: theme.success + '44' }]}>
      <Text style={[styles.resultTitle, { color: theme.success }]}>✅ Result</Text>
      {children}
    </View>
  );
}

function ResultRow({ label, value, primary, theme, styles }) {
  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultLabel, { color: theme.subtext }]}>{label}</Text>
      <Text style={[styles.resultValue, primary && { color: theme.primary, fontSize: 20 }, { color: primary ? theme.primary : theme.text }]}>
        {value}
      </Text>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
export default function SmartToolsScreen() {
  const navigation  = useNavigation();
  const insets      = useSafeAreaInsets();
  const { theme }   = useTheme();
  const { t }       = useLanguage();
  const styles      = useMemo(() => makeStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState('emi');

  const renderTool = () => {
    switch (activeTab) {
      case 'emi':        return <EmiCalculator        styles={styles} theme={theme} t={t} />;
      case 'fertilizer': return <FertilizerCalculator styles={styles} theme={theme} t={t} />;
      case 'seed':       return <SeedCalculator       styles={styles} theme={theme} t={t} />;
      case 'land':       return <LandConverter        styles={styles} theme={theme} t={t} />;
      default:           return null;
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />

      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('smartTools')}</Text>
          <Text style={styles.headerSub}>{t('smartToolsSub')}</Text>
        </View>
        <Text style={{ fontSize: 28 }}>🔧</Text>
      </View>

      {/* ── Tab strip ─────────────────────────────────────────────── */}
      <View style={[styles.tabStrip, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: theme.primary }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? theme.primary : theme.subtext }]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tool content ──────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderTool()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({
    header: {
      backgroundColor: theme.headerBg,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    backArrow:   { fontSize: 20, color: '#fff' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

    tabStrip: {
      flexDirection: 'row',
      borderBottomWidth: 1,
    },
    tab: {
      flex: 1, alignItems: 'center', paddingVertical: 10,
      borderBottomWidth: 2.5, borderBottomColor: 'transparent',
    },
    tabIcon:  { fontSize: 20, marginBottom: 2 },
    tabLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

    content:    { padding: 16 },
    toolDesc:   { fontSize: 13, color: theme.subtext, marginBottom: 16, lineHeight: 20 },

    label:      { fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6 },
    npkRow:     { fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6, marginTop: 4 },

    inputRow:        { marginBottom: 12 },
    inputRowCompact: { marginBottom: 8 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderRadius: 12, borderWidth: 1.5,
      paddingHorizontal: 14, height: 50,
    },
    input:     { flex: 1, fontSize: 15, color: theme.text, paddingVertical: 0 },
    inputUnit: { fontSize: 13, fontWeight: '600', color: theme.subtext, marginLeft: 8 },

    chipBtn: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.card,
      marginRight: 8,
    },
    chipText: { fontSize: 13, fontWeight: '600', color: theme.text },

    btnRow:          { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 },
    btn:             { flex: 1, borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center' },
    btnPrimary:      { shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnPrimaryText:  { fontSize: 15, fontWeight: '700', color: '#fff' },
    btnSecondary:    { borderWidth: 1.5, backgroundColor: theme.card },
    btnSecondaryText:{ fontSize: 15, fontWeight: '600' },

    resultCard: {
      borderRadius: 16, padding: 16, borderWidth: 1,
      marginTop: 4,
    },
    resultTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
    resultRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    resultLabel: { fontSize: 14 },
    resultValue: { fontSize: 16, fontWeight: '800' },
  });
}
