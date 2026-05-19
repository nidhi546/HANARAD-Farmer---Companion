/**
 * LeafletMapView — WebView-based map using Leaflet.js + MapTiler tiles.
 * Works on Android and iOS without any Google Maps API key.
 *
 * Ref methods:
 *   fly(lat, lon, zoom?)         — animate map to location
 *   setLine(pts, color?)         — draw a polyline  pts = [[lat,lon],...]
 *   setPoly(pts, color?)         — draw a filled polygon
 *   addMark(id, lat, lon, color, label) — add/replace a marker
 *   moveMark(id, lat, lon)       — move an existing marker
 *   removeMark(id)               — remove a marker
 *   clear()                      — remove all overlays + markers
 *   fitBounds(pts)               — zoom/pan to fit all pts
 */
import React, {
  forwardRef, useRef, useImperativeHandle,
  useMemo, useState, useCallback,
} from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { MAP_API_KEY } from '../config/mapConfig';

// ── Build the Leaflet HTML string ─────────────────────────────────────────────
function buildLeafletHTML(lat, lon, zoom, tileUrl) {
  // Use JSON.stringify to safely embed values that contain special chars
  const T  = JSON.stringify(tileUrl);
  const LA = lat.toFixed(6);
  const LO = lon.toFixed(6);
  const Z  = Math.max(5, Math.min(19, zoom));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;overflow:hidden;background:#d4e8c2}
.leaflet-control-attribution,.leaflet-control-zoom{display:none!important}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"></script>
<script>
(function(){
"use strict";
var TILE=${T};
var m=null,pl=null,pg=null,lrs={},q=[],ok=false;

function post(t,d){
  try{window.ReactNativeWebView.postMessage(JSON.stringify({type:t,data:d||{}}));}catch(e){}
}

function divIco(color,txt){
  return L.divIcon({
    html:'<div style="background:'+color+
      ';width:32px;height:32px;border-radius:50%;border:3px solid #fff'+
      ';display:flex;align-items:center;justify-content:center'+
      ';color:#fff;font-weight:900;font-size:13px'+
      ';box-shadow:0 3px 8px rgba(0,0,0,.45)">'+txt+'</div>',
    className:'',iconSize:[32,32],iconAnchor:[16,16]
  });
}
function userIco(){
  return L.divIcon({
    html:'<div style="width:22px;height:22px;background:#2563EB;border-radius:50%;border:3px solid #fff'+
      ';box-shadow:0 0 0 7px rgba(37,99,235,.22)"></div>',
    className:'',iconSize:[22,22],iconAnchor:[11,11]
  });
}

function run(c){
  if(!ok){q.push(c);return;}
  try{
    if(c.t==='fly'){
      m.flyTo([c.lat,c.lon],c.z||17,{animate:true,duration:0.6});
    }
    else if(c.t==='pline'){
      if(pl)m.removeLayer(pl);pl=null;
      if(c.pts&&c.pts.length>=2)
        pl=L.polyline(c.pts,{color:c.color||'#059669',weight:4,opacity:0.9}).addTo(m);
    }
    else if(c.t==='poly'){
      if(pg)m.removeLayer(pg);pg=null;
      if(c.pts&&c.pts.length>=3)
        pg=L.polygon(c.pts,{color:c.color||'#059669',weight:3,fillOpacity:0.18}).addTo(m);
    }
    else if(c.t==='mark'){
      if(lrs[c.id])m.removeLayer(lrs[c.id]);
      var ico=c.id==='user'?userIco():divIco(c.color||'#059669',c.txt||'');
      lrs[c.id]=L.marker([c.lat,c.lon],{icon:ico,zIndexOffset:c.id==='user'?999:0}).addTo(m);
    }
    else if(c.t==='mv'){
      if(lrs[c.id])lrs[c.id].setLatLng([c.lat,c.lon]);
    }
    else if(c.t==='rmm'){
      if(lrs[c.id]){m.removeLayer(lrs[c.id]);delete lrs[c.id];}
    }
    else if(c.t==='clear'){
      if(pl){m.removeLayer(pl);pl=null;}
      if(pg){m.removeLayer(pg);pg=null;}
      Object.keys(lrs).forEach(function(k){m.removeLayer(lrs[k]);delete lrs[k];});
    }
    else if(c.t==='fit'){
      if(c.pts&&c.pts.length>=2)m.fitBounds(c.pts,{padding:[50,50],animate:true});
    }
  }catch(e){}
}

function onMsg(e){try{run(JSON.parse(e.data));}catch(x){}}
document.addEventListener('message',onMsg);
window.addEventListener('message',onMsg);

function init(){
  if(m||!window.L||!document.getElementById('map'))return;
  m=L.map('map',{
    center:[${LA},${LO}],zoom:${Z},
    zoomControl:false,attributionControl:false,tap:true,
    preferCanvas:true
  });
  L.tileLayer(TILE,{maxZoom:20,tileSize:256,keepBuffer:2}).addTo(m);
  m.on('click',function(e){post('press',{lat:e.latlng.lat,lon:e.latlng.lng});});
  m.on('load',function(){post('tilesloaded',{});});
  ok=true;
  post('ready',{});
  var tmp=q;q=[];tmp.forEach(run);
}

if(typeof L!=='undefined')init();
else document.addEventListener('DOMContentLoaded',init);
})();
</script>
</body>
</html>`;
}

// ── React component ───────────────────────────────────────────────────────────
const LeafletMapView = forwardRef(function LeafletMapView(
  { initialRegion, onPress, onReady, satellite = false, style },
  ref,
) {
  const wvRef  = useRef(null);
  const [ready, setReady] = useState(false);

  const lat   = initialRegion?.latitude       ?? 22.2587;
  const lon   = initialRegion?.longitude      ?? 71.1924;
  const delta = initialRegion?.latitudeDelta  ?? 0.01;
  // Convert latitudeDelta to zoom level (approximate)
  const zoom  = Math.round(14 - Math.log(Math.max(delta, 0.0001)) / Math.log(2));

  const tileUrl = satellite
    ? `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`
    : `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAP_API_KEY}`;

  // Build HTML once — memo with empty deps so WebView never reloads
  const html = useMemo(
    () => buildLeafletHTML(lat, lon, zoom, tileUrl),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Send a command to Leaflet inside the WebView
  const cmd = useCallback((data) => {
    wvRef.current?.injectJavaScript(
      `(function(){run(${JSON.stringify(data)});})();void(0);`,
    );
  }, []);

  useImperativeHandle(ref, () => ({
    fly:        (la, lo, z)              => cmd({ t: 'fly',  lat: la, lon: lo, z }),
    setLine:    (pts, color)             => cmd({ t: 'pline', pts, color }),
    setPoly:    (pts, color)             => cmd({ t: 'poly',  pts, color }),
    addMark:    (id, la, lo, color, txt) => cmd({ t: 'mark',  id, lat: la, lon: lo, color, txt }),
    moveMark:   (id, la, lo)             => cmd({ t: 'mv',    id, lat: la, lon: lo }),
    removeMark: (id)                     => cmd({ t: 'rmm',   id }),
    clear:      ()                       => cmd({ t: 'clear' }),
    fitBounds:  (pts)                    => cmd({ t: 'fit',   pts }),
  }), [cmd]);

  const onMsg = useCallback((e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') {
        setReady(true);
        onReady?.();
      } else if (msg.type === 'press') {
        onPress?.({ latitude: msg.data.lat, longitude: msg.data.lon });
      }
    } catch {}
  }, [onPress, onReady]);

  return (
    <View style={[styles.root, style]}>
      <WebView
        ref={wvRef}
        source={{ html }}
        style={styles.wv}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        onMessage={onMsg}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        androidLayerType="hardware"
      />
      {!ready && (
        <View style={styles.loader}>
          <Text style={styles.loaderEmoji}>🗺️</Text>
          <ActivityIndicator size="large" color="#059669" style={{ marginTop: 12 }} />
          <Text style={styles.loaderText}>Loading Map…</Text>
          <Text style={styles.loaderSub}>Make sure you have internet</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root:       { flex: 1, overflow: 'hidden', backgroundColor: '#d4e8c2' },
  wv:         { flex: 1 },
  loader:     { ...StyleSheet.absoluteFillObject, backgroundColor: '#d4e8c2', alignItems: 'center', justifyContent: 'center' },
  loaderEmoji:{ fontSize: 52, marginBottom: 8 },
  loaderText: { marginTop: 12, fontSize: 16, color: '#059669', fontWeight: '800' },
  loaderSub:  { fontSize: 13, color: '#6B7280', marginTop: 6 },
});

export default LeafletMapView;
