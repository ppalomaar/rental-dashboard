if(!sessionStorage.ok)location="index.html";
const SHEET_CSV_URL="PASTE_GOOGLE_SHEET_CSV_URL_DI_SINI";
let charts=[];
const dummy=`Regional Office,Nama Kantor Unit Kerja,Status Kantor / Jenis Uker,Status Sewa,Total Harga Sewa (Rp.),Nama Provinsi
RO Surabaya,KCP Darmo,KCP,Aktif,120000000,Jawa Timur
RO Surabaya,KK Wonokromo,KK,Aktif,85000000,Jawa Timur
RO Malang,KCP Malang,KCP,Expired,95000000,Jawa Timur
RO Jakarta,Kanca Sudirman,Kanca,Aktif,220000000,DKI Jakarta
RO Bandung,KCP Dago,KCP,Aktif,110000000,Jawa Barat
RO Bandung,KK Cimahi,KK,Expired,70000000,Jawa Barat`;
const parse=t=>{const l=t.trim().split(/\r?\n/);const h=l.shift().split(",");return l.map(r=>{const c=r.split(",");let o={};h.forEach((k,i)=>o[k]=c[i]);return o})}
async function loadData(){let rows;try{if(SHEET_CSV_URL.startsWith("http")){const t=await(await fetch(SHEET_CSV_URL)).text();rows=parse(t)}else rows=parse(dummy)}catch{rows=parse(dummy)}render(rows)}
function render(r){const money=x=>Number(String(x).replace(/[^\d]/g,""))||0;const total=r.reduce((a,b)=>a+money(b["Total Harga Sewa (Rp.)"]),0);k1.textContent=r.length;k2.textContent="Rp "+(total/1e6).toFixed(1)+" jt";k3.textContent="Rp "+(total/r.length/1e6).toFixed(1)+" jt";k4.textContent=r.filter(x=>x["Status Sewa"]==="Aktif").length;charts.forEach(c=>c.destroy());charts=[];const grp=(key,sum)=>{let m={};r.forEach(x=>{let k=x[key]||"-";m[k]=(m[k]||0)+(sum?money(x["Total Harga Sewa (Rp.)"]):1)});return m};const mk=(id,type,data,opt={})=>charts.push(new Chart(document.getElementById(id),{type,data,options:{responsive:true,maintainAspectRatio:false,...opt}}));let a=grp("Regional Office",1);mk("c1","bar",{labels:Object.keys(a),datasets:[{data:Object.values(a),borderRadius:8}]},{plugins:{legend:{display:false}}});let s=grp("Status Sewa",0);mk("c2","doughnut",{labels:Object.keys(s),datasets:[{data:Object.values(s)}]});let p=grp("Nama Provinsi",1);mk("c3","bar",{labels:Object.keys(p),datasets:[{data:Object.values(p),borderRadius:8}]},{plugins:{legend:{display:false}}});let j=grp("Status Kantor / Jenis Uker",0);mk("c4","pie",{labels:Object.keys(j),datasets:[{data:Object.values(j)}]});let top=[...r].sort((x,y)=>money(y["Total Harga Sewa (Rp.)"])-money(x["Total Harga Sewa (Rp.)"])).slice(0,10);mk("c5","bar",{labels:top.map(x=>x["Nama Kantor Unit Kerja"]),datasets:[{data:top.map(x=>money(x["Total Harga Sewa (Rp.)"])),borderRadius:8}]},{indexAxis:"y",plugins:{legend:{display:false}}})}
function logout(){sessionStorage.clear();location="index.html"};loadData();
