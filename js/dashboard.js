if(!sessionStorage.ok)location="index.html";

const SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/1K0BwNSe0Q8b1wC5dNCQ_k5WeC2LmdJxk7GmTp9hZv-A/edit?usp=sharing";

let charts=[];

function parseCSV(text){
  const rows=[];
  let row=[];
  let cell="";
  let quote=false;

  for(let i=0;i<text.length;i++){
    const char=text[i];

    if(char==='"'){
      if(quote && text[i+1]==='"'){
        cell+='"';
        i++;
      }else{
        quote=!quote;
      }
    }else if(char===',' && !quote){
      row.push(cell);
      cell="";
    }else if((char==='\n' || char==='\r') && !quote){
      if(char==='\r' && text[i+1]==='\n')i++;
      row.push(cell);
      if(row.some(x=>x.trim()!==""))rows.push(row);
      row=[];
      cell="";
    }else{
      cell+=char;
    }
  }

  if(cell!=="" || row.length){
    row.push(cell);
    rows.push(row);
  }

  const headers=rows.shift().map(x=>x.trim());

  return rows.map(r=>{
    const obj={};
    headers.forEach((h,i)=>{
      obj[h]=(r[i]||"").trim();
    });
    return obj;
  });
}

async function loadData(){
  try{
    if(!SHEET_CSV_URL.startsWith("http")){
      throw new Error("URL Google Sheet belum diisi.");
    }

    const response=await fetch(
      SHEET_CSV_URL+
      (SHEET_CSV_URL.includes("?")?"&":"?")+
      "_="+Date.now()
    );

    if(!response.ok){
      throw new Error("Google Sheet tidak dapat diakses.");
    }

    const text=await response.text();
    const rows=parseCSV(text);

    if(!rows.length){
      throw new Error("Data Google Sheet kosong.");
    }

    console.log("Data berhasil dimuat:",rows.length,"baris");

    render(rows);

  }catch(error){
    console.error(error);

    alert(
      "Gagal mengambil data Google Sheet.\n\n"+
      "Pastikan Google Sheet sudah dipublish sebagai CSV dan URL-nya benar."
    );
  }
}

function render(r){

  const money=x=>
    Number(String(x||"").replace(/[^\d]/g,""))||0;

  const total=r.reduce(
    (a,b)=>a+money(b["Total Harga Sewa (Rp.)"]),
    0
  );

  k1.textContent=r.length;

  k2.textContent=
    "Rp "+(total/1e6).toFixed(1)+" jt";

  k3.textContent=
    "Rp "+
    (r.length?total/r.length/1e6:0).toFixed(1)+
    " jt";

  k4.textContent=
    r.filter(
      x=>String(x["Status Sewa"]).trim().toLowerCase()==="aktif"
    ).length;

  charts.forEach(c=>c.destroy());
  charts=[];

  const grp=(key,sum)=>{
    let m={};

    r.forEach(x=>{
      let k=x[key]||"-";

      m[k]=(m[k]||0)+
        (sum?money(x["Total Harga Sewa (Rp.)"]):1);
    });

    return m;
  };

  const mk=(id,type,data,opt={})=>{
    const canvas=document.getElementById(id);

    if(!canvas)return;

    charts.push(
      new Chart(canvas,{
        type,
        data,
        options:{
          responsive:true,
          maintainAspectRatio:false,
          ...opt
        }
      })
    );
  };

  // 1. TOTAL HARGA SEWA PER REGIONAL OFFICE
  let a=grp("Regional Office",1);

  mk(
    "c1",
    "bar",
    {
      labels:Object.keys(a),
      datasets:[
        {
          data:Object.values(a),
          borderRadius:8
        }
      ]
    },
    {
      plugins:{
        legend:{
          display:false
        }
      }
    }
  );

  // 2. STATUS SEWA
  let s=grp("Status Sewa",0);

  mk(
    "c2",
    "doughnut",
    {
      labels:Object.keys(s),
      datasets:[
        {
          data:Object.values(s)
        }
      ]
    }
  );

  // 3. TOTAL HARGA SEWA PER PROVINSI
  let p=grp("Nama Provinsi",1);

  mk(
    "c3",
    "bar",
    {
      labels:Object.keys(p),
      datasets:[
        {
          data:Object.values(p),
          borderRadius:8
        }
      ]
    },
    {
      plugins:{
        legend:{
          display:false
        }
      }
    }
  );

  // 4. JENIS KANTOR
  let j=grp("Status Kantor / Jenis Uker",0);

  mk(
    "c4",
    "pie",
    {
      labels:Object.keys(j),
      datasets:[
        {
          data:Object.values(j)
        }
      ]
    }
  );

  // 5. TOP 10 KANTOR BERDASARKAN HARGA SEWA
  let top=[
    ...r
  ]
  .sort(
    (x,y)=>
      money(y["Total Harga Sewa (Rp.)"])-
      money(x["Total Harga Sewa (Rp.)"])
  )
  .slice(0,10);

  mk(
    "c5",
    "bar",
    {
      labels:top.map(
        x=>x["Nama Kantor Unit Kerja"]
      ),
      datasets:[
        {
          data:top.map(
            x=>money(x["Total Harga Sewa (Rp.)"])
          ),
          borderRadius:8
        }
      ]
    },
    {
      indexAxis:"y",
      plugins:{
        legend:{
          display:false
        }
      }
    }
  );
}

function logout(){
  sessionStorage.clear();
  location="index.html";
}

loadData();
