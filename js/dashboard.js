if(!sessionStorage.ok)location="index.html";

const SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/1K0BwNSe0Q8b1wC5dNCQ_k5WeC2LmdJxk7GmTp9hZv-A/edit?usp=sharing";

let charts=[];

// ===============================
// CSV PARSER
// ===============================
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

    }else if(char==="," && !quote){

      row.push(cell);
      cell="";

    }else if((char==="\n" || char==="\r") && !quote){

      if(char==="\r" && text[i+1]==="\n")i++;

      row.push(cell);

      if(row.some(x=>x.trim()!=="")){
        rows.push(row);
      }

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

  if(!rows.length)return[];

  // Hilangkan BOM + spasi
  const headers=rows.shift().map(x=>
    x.replace(/^\uFEFF/,"").trim()
  );

  console.log("HEADER:",headers);

  return rows.map(r=>{

    const obj={};

    headers.forEach((header,index)=>{
      obj[header]=(r[index]||"").trim();
    });

    return obj;

  });
}

// ===============================
// MONEY
// ===============================
function money(value){

  if(!value)return 0;

  let s=String(value)
    .replace(/Rp/gi,"")
    .replace(/\s/g,"")
    .replace(/[^\d.,-]/g,"");

  if(!s)return 0;

  // Contoh:
  // 120.000.000
  // 120,000,000
  // 120000000

  if(s.includes(".") && s.includes(",")){

    s=s.replace(/\./g,"");
    s=s.replace(",", ".");

  }else if(s.includes(".")){

    s=s.replace(/\./g,"");

  }else if(s.includes(",")){

    s=s.replace(/,/g,"");

  }

  return Number(s)||0;
}

// ===============================
// LOAD DATA GOOGLE SHEET
// ===============================
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
      throw new Error("Google Sheet tidak bisa diakses.");
    }

    const text=await response.text();

    const rows=parseCSV(text);

    console.log("Jumlah data:",rows.length);
    console.log("Data pertama:",rows[0]);

    if(!rows.length){
      throw new Error("Data Google Sheet kosong.");
    }

    render(rows);

  }catch(error){

    console.error(error);

    alert(
      "Gagal membaca Google Sheet.\n\n"+
      "Pastikan URL CSV benar dan Spreadsheet sudah dipublish."
    );

  }

}

// ===============================
// RENDER DASHBOARD
// ===============================
function render(r){

  // =============================
  // TOTAL HARGA SEWA
  // =============================

  const total=r.reduce(
    (sum,row)=>
      sum+
      money(row["Total Harga Sewa (Rp.)"]),
    0
  );

  // =============================
  // SEWA AKTIF
  // =============================

  const active=r.filter(row=>
    String(row["Status Sewa"]||"")
      .trim()
      .toLowerCase()==="aktif"
  ).length;

  // =============================
  // KPI
  // =============================

  document.getElementById("k1").textContent=
    r.length.toLocaleString("id-ID");

  document.getElementById("k2").textContent=
    "Rp "+
    (total/1000000).toFixed(1)+
    " jt";

  document.getElementById("k3").textContent=
    "Rp "+
    (
      r.length
      ? total/r.length/1000000
      : 0
    ).toFixed(1)+
    " jt";

  document.getElementById("k4").textContent=
    active.toLocaleString("id-ID");

  // =============================
  // HAPUS CHART LAMA
  // =============================

  charts.forEach(chart=>chart.destroy());

  charts=[];

  // =============================
  // GROUP DATA
  // =============================

  function group(column,sumMoney=false){

    const result={};

    r.forEach(row=>{

      const key=
        row[column] &&
        row[column].trim()!==""
        ? row[column]
        : "-";

      if(!result[key]){
        result[key]=0;
      }

      result[key]+=
        sumMoney
        ? money(row["Total Harga Sewa (Rp.)"])
        : 1;

    });

    return result;
  }

  // =============================
  // CREATE CHART
  // =============================

  function createChart(
    id,
    type,
    data,
    options={}
  ){

    const canvas=
      document.getElementById(id);

    if(!canvas)return;

    charts.push(
      new Chart(
        canvas,
        {
          type:type,
          data:data,
          options:{
            responsive:true,
            maintainAspectRatio:false,
            ...options
          }
        }
      )
    );

  }

  // =============================
  // 1. TOTAL SEWA / REGIONAL
  // =============================

  const regional=
    group("Regional Office",true);

  createChart(
    "c1",
    "bar",
    {
      labels:Object.keys(regional),

      datasets:[
        {
          data:Object.values(regional),
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

  // =============================
  // 2. STATUS SEWA
  // =============================

  const status=
    group("Status Sewa");

  createChart(
    "c2",
    "doughnut",
    {
      labels:Object.keys(status),

      datasets:[
        {
          data:Object.values(status)
        }
      ]
    }
  );

  // =============================
  // 3. TOTAL SEWA / PROVINSI
  // =============================

  const province=
    group("Nama Provinsi",true);

  createChart(
    "c3",
    "bar",
    {
      labels:Object.keys(province),

      datasets:[
        {
          data:Object.values(province),
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

  // =============================
  // 4. JENIS KANTOR
  // =============================

  const officeType=
    group("Status Kantor / Jenis Uker");

  createChart(
    "c4",
    "pie",
    {
      labels:Object.keys(officeType),

      datasets:[
        {
          data:Object.values(officeType)
        }
      ]
    }
  );

  // =============================
  // 5. TOP 10 KANTOR
  // =============================

  const top=[
    ...r
  ]
  .sort(
    (a,b)=>
      money(b["Total Harga Sewa (Rp.)"])-
      money(a["Total Harga Sewa (Rp.)"])
  )
  .slice(0,10);

  createChart(
    "c5",
    "bar",
    {
      labels:top.map(
        row=>
          row["Nama Kantor Unit Kerja"]||"-"
      ),

      datasets:[
        {
          data:top.map(
            row=>
              money(
                row["Total Harga Sewa (Rp.)"]
              )
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

// ===============================
// LOGOUT
// ===============================
function logout(){

  sessionStorage.clear();

  location="index.html";

}

// ===============================
// START
// ===============================
loadData();
