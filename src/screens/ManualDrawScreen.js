/**
 * ManualDrawScreen — Satellite boundary marker with land-type intelligence.
 *
 * Core marking:
 *  • Tap satellite map to place numbered, draggable corner markers
 *  • Auto-close polygon when tapping within 15 m of first corner
 *  • fitToCoordinates zoom-to-fit on "Complete Boundary"
 *  • Live area bar (acres · bigha · sq ft) while marking
 *  • Done panel: Acres / Bigha / Vigha / Sq Ft / Sq Meter / Perimeter
 *
 * Land detection (🔍 Detect Land toggle):
 *  • Long-press anywhere → Nominatim reverse geocode → land type popup
 *  • OSM Overpass landuse/natural/building polygon overlay
 *  • Colour-coded overlay (green=farm, orange=residential, blue=water …)
 *  • Building/residential count warning when completing boundary
 *
 * Other:
 *  • 📖 Legend card explaining satellite colours
 *  • 🎯 My Location button
 *  • Satellite / Hybrid / Standard map type cycling
 *  • Voice guidance in En / Hi / Gu
 *  • route.params.viewFarm → pre-load an existing farm's coords
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import { DEFAULT_REGION } from '../config/mapConfig';
import { reverseGeocode, fetchLandusePolygons } from '../api/osmApi';
import { LEGEND_ITEMS } from '../utils/osmLanduse';
import useFarmValidation, { VS }           from '../hooks/useFarmValidation';
import FarmBoundaryWarning                 from '../components/FarmBoundaryWarning';
import ValidationStatusBar                 from '../components/ValidationStatusBar';
import InvalidAreaOverlay                  from '../components/InvalidAreaOverlay';

const PROVIDER   = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
const AUTO_CLOSE = 15;   // metres — snap-close threshold
const MAP_TYPES  = ['satellite', 'hybrid', 'standard'];

// ── Geo helpers ───────────────────────────────────────────────────────────────
const toRad = d => d * Math.PI / 180;

function haversine(a, b) {
  const R    = 6371000;
  const dLat = toRad(b.latitude  - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x    = Math.sin(dLat / 2) ** 2 +
               Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function calcAreaSqm(coords) {
  const R = 6371000, n = coords.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j    = (i + 1) % n;
    const dLon = toRad(coords[j].longitude - coords[i].longitude);
    area += dLon * (2 + Math.sin(toRad(coords[i].latitude)) + Math.sin(toRad(coords[j].latitude)));
  }
  return Math.abs(area) * R * R / 2;
}

function calcPerimeterM(coords) {
  let p = 0;
  for (let i = 0; i < coords.length; i++) {
    p += haversine(coords[i], coords[(i + 1) % coords.length]);
  }
  return p;
}

function toAllUnits(sqm) {
  return {
    sqm:      Math.round(sqm),
    sqFt:     Math.round(sqm * 10.7639),
    acres:    (sqm * 0.000247105).toFixed(3),
    hectares: (sqm * 0.0001).toFixed(4),
    bigha:    (sqm / 1011.7).toFixed(2),
    vigha:    (sqm / 2023.4).toFixed(2),
  };
}


// ─────────────────────────────────────────────────────────────────────────────
export default function ManualDrawScreen({ navigation, route }) {
  const insets       = useSafeAreaInsets();
  const { theme }    = useTheme();
  const { language } = useLanguage();
  const { location } = useLocation();

  const mapRef          = useRef(null);
  const mapRegionRef    = useRef(null);   // latest region without triggering re-renders
  const overlayDebounce = useRef(null);

  // ── Pre-load an existing farm if opened with viewFarm param ───────────────
  const preloaded  = route?.params?.viewFarm;
  const initCoords = preloaded?.coords?.length >= 3 ? preloaded.coords : [];

  // ── Core marking state ────────────────────────────────────────────────────
  const [points,     setPoints]     = useState(initCoords);
  const [mode,       setMode]       = useState(initCoords.length >= 3 ? 'done' : 'marking');
  const [mapReady,   setMapReady]   = useState(false);
  const [mapType,    setMapType]    = useState('satellite');
  const [gpsLoading, setGpsLoading] = useState(false);

  // ── Farm boundary validation ──────────────────────────────────────────────
  const {
    status:           validationStatus,
    overlaps:         validationOverlaps,
    totalOverlap:     validationOverlapPct,
    showModal:        showValidationModal,
    debouncedValidate,
    validateNow,
    dismissModal:     dismissValidationModal,
    reset:            resetValidation,
  } = useFarmValidation();

  // ── Land detection state ──────────────────────────────────────────────────
  const [detectMode,     setDetectMode]     = useState(false);
  const [overlayPolygons,setOverlayPolygons]= useState([]);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [tapLandInfo,    setTapLandInfo]    = useState(null);    // {type,label,coord}
  const [loadingDetect,  setLoadingDetect]  = useState(false);
  const [showLegend,     setShowLegend]     = useState(false);

  const lang = language === 'hi' ? 'hi' : language === 'gu' ? 'gu' : 'en';

  const userLocation = location
    ? { latitude: location.lat, longitude: location.lon }
    : null;

  const initialRegion = userLocation
    ? { ...userLocation,   latitudeDelta: 0.003, longitudeDelta: 0.003 }
    : { ...DEFAULT_REGION, latitudeDelta: 0.003, longitudeDelta: 0.003 };

  // ── Zoom to fit on mount for pre-loaded farms ────────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    if (points.length >= 2) setTimeout(() => fitMap(points), 400);
  }, [mapReady]);

  // ── Debounced validation as corners are added / moved ────────────────────
  useEffect(() => {
    if (points.length >= 3) {
      debouncedValidate(points);
    } else {
      resetValidation();
    }
  }, [points]);

  // ── Map type cycling ──────────────────────────────────────────────────────
  const mapTypeLabel = { satellite: 'Satellite', hybrid: 'Hybrid', standard: 'Standard' }[mapType];

  function cycleMapType() {
    setMapType(prev => {
      const i = MAP_TYPES.indexOf(prev);
      return MAP_TYPES[(i + 1) % MAP_TYPES.length];
    });
  }

  // ── Map region tracking (no state write — avoids re-renders on pan) ───────
  function onRegionChangeComplete(region) {
    mapRegionRef.current = region;
  }

  // ── Fit map to polygon coords ─────────────────────────────────────────────
  function fitMap(pts) {
    mapRef.current?.fitToCoordinates(pts, {
      edgePadding: { top: 80, right: 40, bottom: 280, left: 40 },
      animated:    true,
    });
  }

  // ── Short tap — place corner (marking mode only) ──────────────────────────
  function handleMapPress(e) {
    if (mode !== 'marking') return;
    const coord = e?.nativeEvent?.coordinate;
    if (!coord) return;

    // Auto-close when tapping within AUTO_CLOSE m of first corner
    if (points.length >= 3 && haversine(points[0], coord) < AUTO_CLOSE) {
      completeBoundary();
      return;
    }

    setPoints(prev => [...prev, coord]);
  }

  // ── Long press — detect land type (detect mode only) ─────────────────────
  async function handleLongPress(e) {
    if (!detectMode) return;
    const coord = e?.nativeEvent?.coordinate;
    if (!coord || loadingDetect) return;

    setTapLandInfo({ type: '…', label: { en: 'Detecting…', hi: 'पहचान…', gu: 'ઓળખ…' }, coord });
    setLoadingDetect(true);
    try {
      const info = await reverseGeocode(coord.latitude, coord.longitude);
      setTapLandInfo({ ...info, coord });
    } catch {
      setTapLandInfo({
        type:  'unknown',
        label: { en: 'Could not detect', hi: 'पहचान नहीं हुई', gu: 'ઓળખ ન થઈ' },
        coord,
      });
    } finally {
      setLoadingDetect(false);
    }
  }

  // ── GPS button — mark current device position as a corner ────────────────
  async function markGPSCorner() {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Allow location access to mark where you are standing.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const pt  = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setPoints(prev => [...prev, pt]);
      mapRef.current?.animateToRegion({ ...pt, latitudeDelta: 0.002, longitudeDelta: 0.002 }, 400);
    } catch {
      Alert.alert('GPS Error', 'Could not get your location. Tap on the map instead.');
    } finally {
      setGpsLoading(false);
    }
  }

  // ── My Location button — pan map to GPS position ─────────────────────────
  async function goToMyLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.animateToRegion(
        { latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.003, longitudeDelta: 0.003 },
        500,
      );
    } catch { /* ignore */ }
  }

  // ── Detect Land toggle — load OSM overlay ────────────────────────────────
  async function toggleDetect() {
    if (detectMode) {
      setDetectMode(false);
      setOverlayPolygons([]);
      setTapLandInfo(null);
      return;
    }
    setDetectMode(true);
    const region = mapRegionRef.current ?? initialRegion;
    await loadOsmOverlay(region);
  }

  async function loadOsmOverlay(region) {
    setLoadingOverlay(true);
    try {
      const polygons = await fetchLandusePolygons(region);
      setOverlayPolygons(polygons);
      if (polygons.length === 0) {
        Alert.alert(
          'No Map Data',
          'OpenStreetMap has no land-type data for this area yet. You can still tap to check individual spots.',
          [{ text: 'OK' }],
        );
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        Alert.alert(
          'Could Not Load Land Data',
          'Check your internet connection and try again.',
          [{ text: 'OK' }],
        );
        setDetectMode(false);
      }
    } finally {
      setLoadingOverlay(false);
    }
  }

  // ── Drag end — update a corner position ──────────────────────────────────
  function updatePoint(idx, coord) {
    setPoints(prev => prev.map((p, i) => i === idx ? coord : p));
  }

  // ── Undo / Reset ──────────────────────────────────────────────────────────
  function undoLast() {
    if (mode === 'done') { setMode('marking'); return; }
    setPoints(prev => prev.slice(0, -1));
  }

  function clearAll() {
    Alert.alert('Clear All Corners?', 'Remove all markers and start over.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive',
        onPress: () => { setPoints([]); setMode('marking'); setTapLandInfo(null); resetValidation(); } },
    ]);
  }

  // ── Complete boundary — zoom to fit + optional building check ─────────────
  function completeBoundary() {
    if (points.length < 3) {
      Alert.alert('Need More Corners', `Mark at least 3 corners. You have ${points.length} so far.`);
      return;
    }
    setMode('done');
    setTapLandInfo(null);
    setTimeout(() => fitMap(points), 300);
    // Run validation immediately (skip the debounce) on boundary completion
    validateNow(points);
  }

  // ── Save → FarmResultScreen ───────────────────────────────────────────────
  function goToSave() {
    navigation.navigate('FarmResult', {
      areaSqm:         calcAreaSqm(points),
      perimeterM:      calcPerimeterM(points),
      method:          'manual',
      coords:          points,
      warningDetected: validationStatus === VS.WARNING,
      warningTypes:    validationOverlaps.map(o => o.landuse),
    });
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const closed = points.length >= 3;
  const sqm    = closed ? calcAreaSqm(points)    : 0;
  const perimM = closed ? calcPerimeterM(points) : 0;
  const units  = closed ? toAllUnits(sqm)        : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
    <View style={styles.root}>

      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        onPress={handleMapPress}
        onLongPress={handleLongPress}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        mapType={mapType}
      >
        {/* OSM landuse / natural / building overlay polygons */}
        {overlayPolygons.map(p => (
          <Polygon
            key={`osm-${p.id}`}
            coordinates={p.coords}
            fillColor={p.fill}
            strokeColor={p.stroke}
            strokeWidth={1}
          />
        ))}

        {/* Highlight intersection zones with non-agricultural land */}
        <InvalidAreaOverlay overlaps={validationOverlaps} />

        {/* Transparent fill for drawn farm polygon */}
        {closed && (
          <Polygon
            coordinates={points}
            fillColor="rgba(5,150,105,0.18)"
            strokeColor="#059669"
            strokeWidth={3}
          />
        )}

        {/* Connecting / preview lines */}
        {points.length >= 2 && (
          <Polyline
            coordinates={[...points, points[0]]}
            strokeColor="#059669"
            strokeWidth={2.5}
            lineDashPattern={closed ? undefined : [8, 4]}
          />
        )}

        {/* Numbered draggable corner markers */}
        {points.map((pt, i) => (
          <Marker
            key={`c-${i}`}
            coordinate={pt}
            draggable
            onDragEnd={e => updatePoint(i, e.nativeEvent.coordinate)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.markerDot, { backgroundColor: i === 0 ? '#DC2626' : '#059669' }]}>
              <Text style={styles.markerNum}>{i + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Top bar ── */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity style={styles.backBubble} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>

        <View style={styles.topCenter} pointerEvents="none">
          <Text style={styles.topTitle}>📍 Mark Farm Boundary</Text>
          <Text style={styles.topSub}>
            {mode === 'done'
              ? `✅ ${points.length} corners — boundary complete`
              : points.length === 0
                ? 'Tap satellite map to mark corners'
                : `${points.length} corner${points.length > 1 ? 's' : ''} marked`}
          </Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* ── Live area bar (marking mode, 3+ corners) ── */}
      {units && mode === 'marking' && (
        <View style={styles.liveBar} pointerEvents="none">
          <Text style={styles.liveTxt}>
            📐 {units.acres} ac · {units.bigha} bigha · {Number(units.sqFt).toLocaleString()} sq ft
          </Text>
        </View>
      )}

      {/* ── First-tap hint — pointerEvents none: MUST NOT block map taps ── */}
      {points.length === 0 && mapReady && (
        <View style={styles.hintCard} pointerEvents="none">
          <Text style={styles.hintMain}>👆 Tap each corner of your farm</Text>
          <Text style={styles.hintSub}>
            ખેતરના ખૂણાઓ પર ટેપ કરો{'\n'}खेत के कोनों पर टैप करें
          </Text>
        </View>
      )}

      {/* ── Detect Land hint (when detect mode is on and 0 polygons) ── */}
      {detectMode && !loadingOverlay && overlayPolygons.length === 0 && (
        <View style={[styles.detectHint]} pointerEvents="none">
          <Text style={styles.detectHintTxt}>
            🔍 Long-press anywhere to identify land type
          </Text>
        </View>
      )}

      {/* ── Right-side floating buttons ── */}
      <View
        style={[styles.floatCol, { top: insets.top + 72 }]}
        pointerEvents="box-none"
      >
        {/* My Location */}
        <TouchableOpacity style={styles.floatBtn} onPress={goToMyLocation} activeOpacity={0.8}>
          <Text style={styles.floatIcon}>🎯</Text>
        </TouchableOpacity>

        {/* Legend toggle */}
        <TouchableOpacity
          style={[styles.floatBtn, showLegend && styles.floatBtnActive]}
          onPress={() => setShowLegend(v => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.floatIcon}>📖</Text>
        </TouchableOpacity>

        {/* Detect Land toggle */}
        <TouchableOpacity
          style={[styles.floatBtn, detectMode && styles.floatBtnActive, { opacity: loadingOverlay ? 0.6 : 1 }]}
          onPress={toggleDetect}
          disabled={loadingOverlay}
          activeOpacity={0.8}
        >
          {loadingOverlay
            ? <ActivityIndicator size="small" color={detectMode ? '#fff' : '#059669'} />
            : <Text style={styles.floatIcon}>🔍</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Legend card ── */}
      {showLegend && (
        <View style={[styles.legendCard, { top: insets.top + 72 }]}>
          <Text style={styles.legendTitle}>
            {lang === 'gu' ? 'નકશા માર્ગદર્શન' : lang === 'hi' ? 'नक्शा मार्गदर्शन' : 'Map Guide'}
          </Text>
          {LEGEND_ITEMS.map((item, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: item.fill }]} />
              <Text style={styles.legendLabel}>{item.label[lang]}</Text>
            </View>
          ))}
          {detectMode && (
            <Text style={styles.legendHint}>
              {lang === 'gu' ? '🔍 ટેપ રોકો = ભૂ-પ્રકાર' : lang === 'hi' ? '🔍 लंबे दबाएं = भूमि पहचान' : '🔍 Long press = identify land'}
            </Text>
          )}
        </View>
      )}

      {/* ── Land type popup (shown after long press in detect mode) ── */}
      {tapLandInfo && (
        <View style={[styles.landPopup, { bottom: mode === 'done' ? 285 : 165 }]}>
          <TouchableOpacity
            style={styles.popupClose}
            onPress={() => setTapLandInfo(null)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Text style={styles.popupCloseTxt}>✕</Text>
          </TouchableOpacity>

          {loadingDetect
            ? <ActivityIndicator color="#fff" style={{ marginVertical: 8 }} />
            : (
              <>
                <Text style={styles.popupType}>{tapLandInfo.label[lang]}</Text>
                <Text style={styles.popupCoord}>
                  {tapLandInfo.coord?.latitude?.toFixed(5)},  {tapLandInfo.coord?.longitude?.toFixed(5)}
                </Text>
                {/* Warn colour */}
                {(tapLandInfo.type === 'building' || tapLandInfo.type === 'road') && (
                  <Text style={styles.popupWarn}>⚠️ Not suitable for farm boundary</Text>
                )}
              </>
            )}
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          DONE MODE — results panel
      ────────────────────────────────────────────────────────────────────── */}
      {mode === 'done' && units && (
        <View style={[styles.donePanel, { paddingBottom: insets.bottom + 14 }]}>

          {/* Primary units */}
          <View style={styles.bigRow}>
            <View style={styles.bigUnit}>
              <Text style={styles.bigVal}>{units.acres}</Text>
              <Text style={styles.bigLbl}>ACRES</Text>
            </View>
            <View style={styles.vDivider} />
            <View style={styles.bigUnit}>
              <Text style={styles.bigVal}>{units.bigha}</Text>
              <Text style={styles.bigLbl}>BIGHA</Text>
            </View>
            <View style={styles.vDivider} />
            <View style={styles.bigUnit}>
              <Text style={styles.bigVal}>{units.vigha}</Text>
              <Text style={styles.bigLbl}>VIGHA</Text>
            </View>
          </View>

          {/* Secondary units */}
          <View style={styles.smallRow}>
            <View style={styles.smallUnit}>
              <Text style={styles.smallVal}>{Number(units.sqFt).toLocaleString()}</Text>
              <Text style={styles.smallLbl}>Sq Feet</Text>
            </View>
            <View style={styles.smallUnit}>
              <Text style={styles.smallVal}>{Number(units.sqm).toLocaleString()}</Text>
              <Text style={styles.smallLbl}>Sq Meter</Text>
            </View>
            <View style={styles.smallUnit}>
              <Text style={styles.smallVal}>{perimM.toFixed(0)}</Text>
              <Text style={styles.smallLbl}>Perimeter (m)</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => setMode('marking')}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionTxt, { color: '#374151' }]}>✏️ Edit Corners</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.saveBtn]}
              onPress={goToSave}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionTxt, { color: '#fff' }]}>💾 Save Farm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          MARKING MODE — bottom toolbar
      ────────────────────────────────────────────────────────────────────── */}
      {mode === 'marking' && (
        <View style={[styles.toolbar, { paddingBottom: insets.bottom + 10 }]}>

          <ValidationStatusBar status={validationStatus} language={lang} />

      {/* Row 1: Undo · Reset · Mark Here · Map Type */}
          <View style={styles.toolRow}>
            <TouchableOpacity
              style={[styles.toolBtn, styles.btnRed, { opacity: points.length === 0 ? 0.35 : 1 }]}
              onPress={undoLast}
              disabled={points.length === 0}
              activeOpacity={0.75}
            >
              <Text style={styles.toolIcon}>↩</Text>
              <Text style={[styles.toolLbl, { color: '#B91C1C' }]}>Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, styles.btnRed, { opacity: points.length === 0 ? 0.35 : 1 }]}
              onPress={clearAll}
              disabled={points.length === 0}
              activeOpacity={0.75}
            >
              <Text style={styles.toolIcon}>🗑️</Text>
              <Text style={[styles.toolLbl, { color: '#B91C1C' }]}>Reset All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, styles.btnBlue, { opacity: gpsLoading ? 0.55 : 1 }]}
              onPress={markGPSCorner}
              disabled={gpsLoading}
              activeOpacity={0.75}
            >
              <Text style={styles.toolIcon}>{gpsLoading ? '⏳' : '📍'}</Text>
              <Text style={[styles.toolLbl, { color: '#0369A1' }]}>
                {gpsLoading ? 'Getting…' : 'Mark Here'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, styles.btnGray]}
              onPress={cycleMapType}
              activeOpacity={0.75}
            >
              <Text style={styles.toolIcon}>🛰️</Text>
              <Text style={[styles.toolLbl, { color: '#374151' }]}>{mapTypeLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Complete Boundary */}
          <TouchableOpacity
            style={[styles.completeBtn, { opacity: closed ? 1 : 0.35 }]}
            onPress={completeBoundary}
            disabled={!closed}
            activeOpacity={0.82}
          >
            <Text style={styles.completeTxt}>
              {closed
                ? `✅ Complete Boundary  (${points.length} corners)`
                : `Mark ${Math.max(0, 3 - points.length)} more corner${3 - points.length === 1 ? '' : 's'} to complete`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>

    {/* ── Farm boundary warning modal ── */}
    <FarmBoundaryWarning
      visible={showValidationModal}
      overlaps={validationOverlaps}
      totalOverlap={validationOverlapPct}
      language={lang}
      onEdit={() => { dismissValidationModal(); setMode('marking'); }}
      onContinueAnyway={dismissValidationModal}
    />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  map:  { flex: 1 },

  // ── Top bar ────────────────────────────────────────────────────────────────
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backBubble: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  backTxt:   { fontSize: 26, color: '#fff', fontWeight: '300', marginTop: -2 },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle:  { fontSize: 15, fontWeight: '900', color: '#fff' },
  topSub:    { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // ── Live area bar ──────────────────────────────────────────────────────────
  liveBar: {
    position: 'absolute', top: 110, alignSelf: 'center',
    backgroundColor: 'rgba(5,150,105,0.93)', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  liveTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // ── First-tap hint (pointerEvents="none" set inline) ──────────────────────
  hintCard: {
    position: 'absolute', bottom: 155, left: 20, right: 76,
    backgroundColor: 'rgba(0,0,0,0.74)', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 16, alignItems: 'center',
  },
  hintMain: { fontSize: 15, fontWeight: '800', color: '#fff', textAlign: 'center' },
  hintSub:  { fontSize: 12, color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginTop: 8, lineHeight: 19 },

  // ── Detect mode hint ───────────────────────────────────────────────────────
  detectHint: {
    position: 'absolute', bottom: 155, left: 20, right: 76,
    backgroundColor: 'rgba(5,100,80,0.82)', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center',
  },
  detectHintTxt: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center' },

  // ── Corner markers ─────────────────────────────────────────────────────────
  markerDot: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },
  markerNum: { fontSize: 12, fontWeight: '900', color: '#fff' },

  // ── Right floating buttons ─────────────────────────────────────────────────
  floatCol: {
    position: 'absolute', right: 12,
    gap: 8,
  },
  floatBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 5,
  },
  floatBtnActive: { backgroundColor: '#059669' },
  floatIcon:      { fontSize: 20 },

  // ── Legend card ────────────────────────────────────────────────────────────
  legendCard: {
    position: 'absolute', left: 12,
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 14,
    padding: 12, minWidth: 168,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
  },
  legendTitle:  { fontSize: 11, fontWeight: '900', color: '#374151', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  legendRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  legendSwatch: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  legendLabel:  { fontSize: 12, fontWeight: '600', color: '#374151' },
  legendHint:   { fontSize: 11, color: '#059669', fontWeight: '700', marginTop: 6 },

  // ── Land type tap popup ────────────────────────────────────────────────────
  landPopup: {
    position: 'absolute', left: 20, right: 76,
    backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: 16,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  popupClose:    { position: 'absolute', top: 10, right: 12 },
  popupCloseTxt: { fontSize: 16, color: 'rgba(255,255,255,0.65)', fontWeight: '800' },
  popupType:     { fontSize: 16, fontWeight: '900', color: '#fff', textAlign: 'center', marginTop: 4 },
  popupCoord:    { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  popupWarn:     { fontSize: 12, color: '#FCA5A5', fontWeight: '700', marginTop: 6, textAlign: 'center' },

  // ── Done panel ─────────────────────────────────────────────────────────────
  donePanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingTop: 20, paddingHorizontal: 18, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14, shadowRadius: 14, elevation: 16,
  },
  bigRow:   { flexDirection: 'row', alignItems: 'center' },
  bigUnit:  { flex: 1, alignItems: 'center' },
  bigVal:   { fontSize: 30, fontWeight: '900', color: '#059669' },
  bigLbl:   { fontSize: 10, fontWeight: '900', color: '#6B7280', letterSpacing: 1.2, marginTop: 2 },
  vDivider: { width: 1, height: 48, backgroundColor: '#E5E7EB' },

  smallRow:  { flexDirection: 'row', backgroundColor: '#F0FDF4', borderRadius: 14, padding: 12 },
  smallUnit: { flex: 1, alignItems: 'center' },
  smallVal:  { fontSize: 16, fontWeight: '900', color: '#065F46' },
  smallLbl:  { fontSize: 10, fontWeight: '700', color: '#6B7280', marginTop: 3 },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  editBtn:   { backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#D1D5DB' },
  saveBtn:   { backgroundColor: '#059669' },
  actionTxt: { fontSize: 16, fontWeight: '900' },

  // ── Marking toolbar ────────────────────────────────────────────────────────
  toolbar:     { backgroundColor: '#fff', paddingHorizontal: 14, paddingTop: 12, gap: 9 },
  toolRow:     { flexDirection: 'row', gap: 6 },
  toolBtn:     { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 3 },
  btnRed:      { backgroundColor: '#FEE2E2' },
  btnBlue:     { backgroundColor: '#E0F2FE' },
  btnGray:     { backgroundColor: '#F3F4F6' },
  toolIcon:    { fontSize: 19 },
  toolLbl:     { fontSize: 10, fontWeight: '800' },
  completeBtn: { borderRadius: 16, paddingVertical: 18, backgroundColor: '#059669', alignItems: 'center' },
  completeTxt: { fontSize: 15, fontWeight: '900', color: '#fff' },
});
