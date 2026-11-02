<div class="rhum-panel">
  <header><span>⛵ Route du Rhum</span><small>2026</small></header>
  <div class="intro">Saint-Malo <span>→</span> Pointe-à-Pitre</div>
  <div class="meta">Départ · 01/11/2026 · 13:02 (Paris)</div>
  <div class="toolbar">
    <button on:click={load} title="Actualiser les positions">↻</button>
    <select bind:value={filterClass} on:change={draw} aria-label="Catégorie">
      <option value="">Toutes classes</option>
      <option value="Ultim">Ultim</option>
      <option value="IMOCA">IMOCA</option>
      <option value="Ocean Fifty">Ocean Fifty</option>
      <option value="Class40">Class40</option>
      <option value="Rhum Multi">Rhum Multi</option>
      <option value="Rhum Mono">Rhum Mono</option>
    </select>
  </div>
  <div class="status" class:error={!!error}>{status}</div>
  {#if error}<p class="error-note">{error}</p>{/if}
  <div class="list">
    {#each boats.filter(b => !filterClass || b.className === filterClass) as boat (boat.id)}
      <button class:selected={selectedId === boat.id} class="boat" on:click={() => selectBoat(boat.id)}>
        <span class="flag">{boat.flag || '⛵'}</span>
        <span class="names"><strong>{boat.boatName}</strong><small>{boat.skipper}</small></span>
        <span class="speed">{boat.speedKn === undefined ? '—' : boat.speedKn.toFixed(1)} <small>nd</small></span>
      </button>
    {/each}
  </div>
  {#if !boats.length}
    <p class="empty">Aucune position importée. Configure une source JSON autorisée pour afficher la flotte.</p>
  {/if}
  <footer>
    <a href="https://carto.routedurhum.com/fr/index.html" target="_blank" rel="noreferrer">Cartographie officielle ↗</a>
    <span>{lastUpdate ? new Date(lastUpdate).toLocaleString('fr-FR') : '—'}</span>
  </footer>
</div>

<script lang="ts">
 import { onMount, onDestroy } from 'svelte';
 import { map } from '@windy/map';
 import { DATA_URL, REFRESH_MS } from './settings';
 import type { Boat } from './types';
 let boats: Boat[] = [];
 let status = 'Source non configurée';
 let error = '';
 let filterClass = '';
 let selectedId: string | null = null;
 let lastUpdate = '';
 let refreshTimer: ReturnType<typeof setInterval> | undefined;
 let abort: AbortController | undefined;
 const markers = new Map<string, L.Marker>();
 let trail: L.Polyline | undefined;
 const sanitize = (s: unknown) => String(s ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
 const validCoord = (lat:number,lon:number) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat)<=90 && Math.abs(lon)<=180;
 function parseBoat(v:any):Boat|null {
   if (!v || typeof v !== 'object') return null;
   const lat=Number(v.lat), lon=Number(v.lon);
   if (!validCoord(lat,lon)) return null;
   const id=String(v.id || ''); if (!id) return null;
   const history=Array.isArray(v.history) ? v.history.filter((p:any)=> p && validCoord(Number(p.lat),Number(p.lon))).slice(-1000).map((p:any)=>({lat:Number(p.lat),lon:Number(p.lon),time:String(p.time||'')})) : [];
   const speed=Number(v.speedKn),heading=Number(v.headingDeg);
   return {id,lat,lon,boatName:String(v.boatName||id),skipper:String(v.skipper||'—'),flag:String(v.flag||'⛵'),className:String(v.className||'—'),speedKn:v.speedKn == null||!Number.isFinite(speed)?undefined:speed,headingDeg:v.headingDeg==null||!Number.isFinite(heading)?undefined:heading,updatedAt:String(v.updatedAt||''),history};
 }
 function popup(b:Boat) {
  return `<div style="min-width:210px;font:13px/1.45 system-ui"><div style="font-size:18px;font-weight:800">${sanitize(b.flag)} ${sanitize(b.boatName)}</div><div>${sanitize(b.skipper)} · ${sanitize(b.className)}</div><hr/><div>🚀 ${b.speedKn===undefined?'—':b.speedKn.toFixed(1)+' nd'} &nbsp; 🧭 ${b.headingDeg===undefined?'—':Math.round(b.headingDeg)+'°'}</div><div style="color:#667085;font-size:11px">${sanitize(b.updatedAt ? 'Position : '+b.updatedAt : 'Date de position inconnue')}</div><div style="font-size:11px;color:#667085">Trace : ${b.history.length} relevés disponibles</div></div>`;
 }
 function clearTrail() {trail?.remove();trail=undefined;}
 function drawTrail() {
  clearTrail();
  const b=boats.find(v=>v.id===selectedId);
  if (!b || !b.history.length) return;
  const points=b.history.map(p=>[p.lat,p.lon] as [number,number]);points.push([b.lat,b.lon]);
  trail=L.polyline(points,{color:'#20c7f5',weight:3,opacity:.9,interactive:false}).addTo(map);
 }
 function draw() {
  const visible=new Set<string>();
  for(const b of boats) {
    if(filterClass && b.className!==filterClass)continue;
    visible.add(b.id);
    const icon=L.divIcon({className:'rhum-boat-marker',html:`<div style="font-size:25px;line-height:30px;filter:drop-shadow(0 2px 3px #000)">⛵</div>`,iconSize:[30,30],iconAnchor:[15,15]});
    const current=markers.get(b.id);
    if(current){current.setLatLng([b.lat,b.lon]);current.setPopupContent(popup(b));}
    else {const m=L.marker([b.lat,b.lon],{icon}).addTo(map);m.bindPopup(popup(b),{maxWidth:290});m.on('click',()=>selectBoat(b.id));markers.set(b.id,m);}
  }
  for(const [id,m] of markers){if(!visible.has(id)){m.remove();markers.delete(id);}}
  drawTrail();
 }
 function selectBoat(id:string){selectedId=id;drawTrail();const b=boats.find(x=>x.id===id);if(b){map.panTo([b.lat,b.lon]);markers.get(id)?.openPopup();}}
 async function load(){
  if(!DATA_URL){status='Source non configurée';return;}
  abort?.abort();abort=new AbortController();status='Actualisation…';error='';
  try{
   const response=await fetch(DATA_URL,{signal:abort.signal,headers:{Accept:'application/json'},cache:'no-store'});
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   const json=await response.json(); if(!json || !Array.isArray(json.boats))throw Error('Format attendu : { "boats": [...] }');
   boats=json.boats.map(parseBoat).filter((b:Boat|null):b is Boat=>!!b);
   lastUpdate=String(json.updatedAt||new Date().toISOString());
   status=`${boats.length} voiliers · dernier relevé`;draw();
  }catch(e:any){if(e?.name==='AbortError')return;error='Flux inaccessible (CORS, URL, format ou réseau). '+String(e?.message||'');status='Suivi indisponible';}
 }
 onMount(()=>{load();refreshTimer=setInterval(load,REFRESH_MS)});
 onDestroy(()=>{abort?.abort();if(refreshTimer)clearInterval(refreshTimer);markers.forEach(m=>m.remove());markers.clear();clearTrail()});
</script>

<style lang="less">
 .rhum-panel {box-sizing:border-box;width:260px;max-height:360px;overflow:hidden;border-radius:15px;background:rgba(25,29,38,.96);color:#fff;padding:12px;font:12px/1.35 system-ui;box-shadow:0 5px 25px #0005}
 header{display:flex;justify-content:space-between;align-items:center;font-size:17px;font-weight:800}header small{font-size:11px;opacity:.65}.intro{margin-top:10px;display:flex;justify-content:space-between;font-weight:700}.intro span{opacity:.45}.meta{margin-top:3px;color:#bbc4d5;font-size:10px}.toolbar{display:flex;gap:7px;margin:12px 0 8px}.toolbar button,.toolbar select{border:1px solid #ffffff23;background:#ffffff15;color:#fff;border-radius:8px;padding:7px}.toolbar select{flex:1;min-width:0}.toolbar select option{color:#111}.status{color:#a4ebcb;font-size:11px}.status.error{color:#f99}.error-note{font-size:10px;color:#fbb}.list{max-height:160px;overflow-y:auto;margin-top:7px}.boat{width:100%;display:flex;text-align:left;align-items:center;gap:7px;padding:8px 5px;background:transparent;border:0;border-bottom:1px solid #ffffff16;color:#fff;cursor:pointer}.boat.selected{background:#ffffff20}.flag{font-size:18px}.names{min-width:0;flex:1;display:flex;flex-direction:column}.names strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px}.names small{opacity:.62;font-size:10px}.speed{font-weight:800;white-space:nowrap}.speed small{font-weight:400;opacity:.6}.empty{font-size:11px;color:#c8cedb}footer{display:flex;justify-content:space-between;align-items:center;margin-top:9px;font-size:10px;gap:5px}footer a{color:#9ddaff;text-decoration:none}footer span{color:#a8b0bb}
</style>
