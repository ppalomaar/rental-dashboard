if (sessionStorage.getItem("rentalLoggedIn") !== "true") {
  location.href = "index.html";
}

// =====================================================
// MASUKKAN URL GOOGLE SHEET CSV DI SINI
// =====================================================
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1K0BwNSe0Q8b1wC5dNCQ_k5WeC2LmdJxk7GmTp9hZv-A/edit?usp=sharing";

let charts = [];

// =====================================================
// LOAD DATA
// =====================================================
async function loadData() {
  try {
    const response = await fetch(
      SHEET_CSV_URL + (SHEET_CSV_URL.includes("?") ? "&" : "?") + "_=" + Date.now()
    );

    if (!response.ok) {
      throw new Error("Google Spreadsheet tidak bisa diakses.");
    }

    const text = await response.text();
    const rows = parseCSV(text);

    if (!rows.length) {
      throw new Error("Data Google Spreadsheet kosong.");
    }

    render(rows);

    console.log("Data berhasil dimuat:", rows.length, "baris");

  } catch (error) {
    console.error(error);
    alert(
      "Gagal mengambil data Google Spreadsheet.\n\n" +
      "Pastikan Spreadsheet sudah dipublish sebagai CSV dan URL-nya benar."
    );
  }
}

// =====================================================
// CSV PARSER
// Aman untuk data yang mempunyai koma di dalam cell
// =====================================================
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);

  return lines
    .slice(1)
    .filter(line => line.trim() !== "")
    .map(line => {
      const values = parseCSVLine(line);
      const obj = {};

      headers.forEach((header, index) => {
        obj[header.trim()] = (values[index] || "").trim();
      });

      return obj;
    });
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    }

    else if (char === '"') {
      insideQuotes = !insideQuotes;
    }

    else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    }

    else {
      current += char;
    }
  }

  result.push(current);

  return result;
}

// =====================================================
// RENDER DASHBOARD
// =====================================================
function render(r) {

  const money = x =>
    Number(String(x || "").replace(/[^\d]/g, "")) || 0;

  const total = r.reduce(
    (a, b) => a + money(b["Total Harga Sewa (Rp.)"]),
    0
  );

  const average = r.length ? total / r.length : 0;

  const active = r.filter(
    x => String(x["Status Sewa"] || "").trim().toLowerCase() === "aktif"
  ).length;

  // KPI
  document.getElementById("k1").textContent =
    r.length.toLocaleString("id-ID");

  document.getElementById("k2").textContent =
    "Rp " + (total / 1000000).toFixed(1) + " jt";

  document.getElementById("k3").textContent =
    "Rp " + (average / 1000000).toFixed(1) + " jt";

  document.getElementById("k4").textContent =
    active.toLocaleString("id-ID");

  // Hapus chart lama
  charts.forEach(chart => chart.destroy());
  charts = [];

  // GROUPING
  const group = (column, sumMoney = false) => {

    const result = {};

    r.forEach(row => {

      const key = row[column] || "-";

      if (!result[key]) {
        result[key] = 0;
      }

      result[key] += sumMoney
        ? money(row["Total Harga Sewa (Rp.)"])
        : 1;
    });

    return result;
  };

  // CREATE CHART
  const createChart = (id, type, data, options = {}) => {

    const canvas = document.getElementById(id);

    if (!canvas) {
      console.warn("Canvas tidak ditemukan:", id);
      return;
    }

    charts.push(
      new Chart(canvas, {
        type: type,
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...options
        }
      })
    );
  };

  // ===================================================
  // 1. TOTAL SEWA / REGIONAL OFFICE
  // ===================================================

  const regional = group("Regional Office", true);

  createChart(
    "c1",
    "bar",
    {
      labels: Object.keys(regional),
      datasets: [
        {
          data: Object.values(regional),
          borderRadius: 8
        }
      ]
    },
    {
      plugins: {
        legend: {
          display: false
        }
      }
    }
  );

  // ===================================================
  // 2. STATUS SEWA
  // ===================================================

  const status = group("Status Sewa");

  createChart(
    "c2",
    "doughnut",
    {
      labels: Object.keys(status),
      datasets: [
        {
          data: Object.values(status)
        }
      ]
    }
  );

  // ===================================================
  // 3. TOTAL SEWA / PROVINSI
  // ===================================================

  const province = group("Nama Provinsi", true);

  createChart(
    "c3",
    "bar",
    {
      labels: Object.keys(province),
      datasets: [
        {
          data: Object.values(province),
          borderRadius: 8
        }
      ]
    },
    {
      plugins: {
        legend: {
          display: false
        }
      }
    }
  );

  // ===================================================
  // 4. JENIS KANTOR
  // ===================================================

  const officeType = group("Status Kantor / Jenis Uker");

  createChart(
    "c4",
    "pie",
    {
      labels: Object.keys(officeType),
      datasets: [
        {
          data: Object.values(officeType)
        }
      ]
    }
  );

  // ===================================================
  // 5. TOP 10 KANTOR
  // ===================================================

  const top = [...r]
    .sort(
      (a, b) =>
        money(b["Total Harga Sewa (Rp.)"]) -
        money(a["Total Harga Sewa (Rp.)"])
    )
    .slice(0, 10);

  createChart(
    "c5",
    "bar",
    {
      labels: top.map(
        x => x["Nama Kantor Unit Kerja"] || "-"
      ),
      datasets: [
        {
          data: top.map(
            x => money(x["Total Harga Sewa (Rp.)"])
          ),
          borderRadius: 8
        }
      ]
    },
    {
      indexAxis: "y",
      plugins: {
        legend: {
          display: false
        }
      }
    }
  );
}

// =====================================================
// LOGOUT
// =====================================================
function logout() {
  sessionStorage.removeItem("rentalLoggedIn");
  location.href = "index.html";
}

// =====================================================
// JALANKAN
// =====================================================
loadData();
