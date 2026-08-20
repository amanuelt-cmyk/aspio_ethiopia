"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { mediaUrl } from "@/lib/api/config";
import { demoImageForSalon } from "../../data";
import { AdminApiError } from "../api";
import type { FeaturedPlace, Salon } from "../types";
import type { ManagerContext } from "./AdminApp";
import Icon from "./Icon";

const imageURL = (salon: Salon) => demoImageForSalon(
  salon.slug,
  salon.category,
  mediaUrl(salon.imageUrl),
);

export default function FeaturedManager({ salons, context }: { salons: Salon[]; context: ManagerContext }) {
  const [items,setItems]=useState<FeaturedPlace[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [editor,setEditor]=useState<FeaturedPlace|"new"|null>(null);
  const salonMap=useMemo(()=>new Map(salons.map((salon)=>[salon.id,salon])),[salons]);
  const eligible=useMemo(()=>salons.filter((salon)=>salon.status==="published" && (salon.category==="salon"||salon.category==="barbershop")),[salons]);
  const load=useCallback(async()=>{setLoading(true);setError("");try{setItems((await context.request<{items:FeaturedPlace[]}>("/admin/featured-places")).items);}catch(e){setError(e instanceof Error?e.message:"Could not load featured places.");}finally{setLoading(false);}},[context]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer);},[load]);
  async function remove(item:FeaturedPlace){const salon=salonMap.get(item.salonId);if(!window.confirm(`Remove ${salon?.nameEn||"this place"} from Featured Places?`))return;try{await context.request(`/admin/featured-places/${item.id}`,{method:"DELETE"});await load();context.notify("Place removed from the featured collection.");}catch(e){setError(e instanceof Error?e.message:"Could not remove this place.");}}
  return <div className="et-admin-view et-featured-admin"><header className="et-view-heading"><div><span className="et-eyebrow">CURATED PARTNERS</span><h1>Places worth knowing.</h1><p>This collection is intentionally separate from the marketplace. Select established Aspio salon and barbershop partners, then control their story and order on the landing page.</p></div><button className="et-primary-button" onClick={()=>setEditor("new")}><Icon name="plus"/>Feature a place</button></header>
    <section className="et-featured-summary"><div><b>{items.filter(i=>i.active).length}</b><span>Live partners</span></div><p><i/>Only published salons and barbershops can appear on the website.</p></section>
    {error&&<div className="et-gallery-error">{error}<button onClick={()=>void load()}>Try again</button></div>}
    {loading?<div className="et-account-loading"><i/>Loading curated places…</div>:items.length?<section className="et-featured-admin-grid">{items.map((item,index)=>{const salon=salonMap.get(item.salonId);return <article key={item.id} className={!item.active?"disabled":""}><div className="et-featured-image">{salon?<img src={imageURL(salon)} alt=""/>:<span>?</span>}<i>{String(index+1).padStart(2,"0")}</i></div><div><span>{item.badgeEn||"Aspio partner"}</span><h2>{salon?.nameEn||"Salon unavailable"}</h2><p>{item.descriptionEn||`${salon?.category||"Place"} · ${salon?.areaEn||"Addis Ababa"}`}</p><small>{item.active?"Visible on website":"Hidden"} · order {item.sortOrder}</small></div><footer><button onClick={()=>setEditor(item)}><Icon name="edit"/>Manage</button><button className="danger" onClick={()=>void remove(item)}><Icon name="trash"/></button></footer></article>})}</section>:<div className="et-gallery-empty"><i><Icon name="featured" size={28}/></i><h2>No featured partners yet.</h2><p>Select a published salon or barbershop to build the curated landing-page collection.</p></div>}
    {editor&&<FeaturedEditor key={editor==="new"?"new":editor.id} item={editor==="new"?null:editor} eligible={eligible} used={items.map(i=>i.salonId)} context={context} onClose={()=>setEditor(null)} onSaved={async()=>{setEditor(null);await load();}}/>}
  </div>;
}

function FeaturedEditor({item,eligible,used,context,onClose,onSaved}:{item:FeaturedPlace|null;eligible:Salon[];used:string[];context:ManagerContext;onClose:()=>void;onSaved:()=>Promise<void>}){
  const choices=eligible.filter(s=>s.id===item?.salonId||!used.includes(s.id)); const [form,setForm]=useState({salonId:item?.salonId||choices[0]?.id||"",badgeEn:item?.badgeEn||"Aspio partner",badgeAm:item?.badgeAm||"",descriptionEn:item?.descriptionEn||"",descriptionAm:item?.descriptionAm||"",sortOrder:String(item?.sortOrder??used.length),active:item?.active??true}); const [saving,setSaving]=useState(false);const[error,setError]=useState("");
  async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{await context.request(item?`/admin/featured-places/${item.id}`:"/admin/featured-places",{method:item?"PUT":"POST",body:JSON.stringify({...form,sortOrder:Number(form.sortOrder)})});context.notify(item?"Featured place updated.":"Place added to the featured collection.");await onSaved();}catch(saveError){setError(saveError instanceof AdminApiError?saveError.message:"Could not save this featured place.");}finally{setSaving(false);}}
  return <div className="et-editor-layer"><button className="et-editor-scrim" onClick={onClose}/><aside className="et-editor et-featured-editor"><header><div><span>FEATURED PLACE</span><h2>{item?"Refine this partner.":"Choose a standout partner."}</h2></div><button onClick={onClose}><Icon name="close"/></button></header><form onSubmit={submit}>{error&&<p className="et-editor-error">{error}</p>}<div className="et-form-grid"><label className="wide"><span>Salon or barbershop</span><select value={form.salonId} onChange={e=>setForm({...form,salonId:e.target.value})} required disabled={!!item}>{choices.map(s=><option key={s.id} value={s.id}>{s.nameEn||s.nameAm} · {s.areaEn||s.areaAm}</option>)}</select><small>Publish the salon first if it is not in this list.</small></label><label><span>English badge</span><input value={form.badgeEn} onChange={e=>setForm({...form,badgeEn:e.target.value})}/></label><label lang="am"><span>የአማርኛ መለያ</span><input value={form.badgeAm} onChange={e=>setForm({...form,badgeAm:e.target.value})}/></label><label className="wide"><span>English feature note</span><textarea rows={4} value={form.descriptionEn} onChange={e=>setForm({...form,descriptionEn:e.target.value})} placeholder="Why this place belongs in the curated collection…"/></label><label className="wide" lang="am"><span>የአማርኛ መግለጫ</span><textarea rows={4} value={form.descriptionAm} onChange={e=>setForm({...form,descriptionAm:e.target.value})}/></label><label><span>Display order</span><input type="number" value={form.sortOrder} onChange={e=>setForm({...form,sortOrder:e.target.value})}/></label><label className="et-featured-active"><span>Visible on website</span><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/></label></div><footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving||!form.salonId}>{saving?"Saving…":item?"Save feature":"Add featured place"}<Icon name="arrow"/></button></footer></form></aside></div>;
}
