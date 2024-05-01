const ExcelJS = require("exceljs");
const jschardet = require("jschardet");
const fs = require("fs");
const csv = require("csv-parser");
const iconv = require("iconv-lite");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("participants.db", (err) => {
  if (err) {
    return console.error(err.message);
  }
  ``;
  console.log("Connected to the SQlite database.");
});

const path = "progress.pe_2024.csv";
const options = {
  mapHeaders: ({ header, index }) =>
    index === 0 ? "Nombre y Apellido" : header ? header : null,
};
const encoding = jschardet.detect(fs.readFileSync(path)).encoding;
let stream;
try {
  if (encoding === "UTF-16LE") {
    stream = fs.createReadStream(path).pipe(iconv.decodeStream("utf-16le"));
    options.separator = "\t";
  } else {
    stream = fs.createReadStream(path);
  }
} catch (error) {
  console.error(`An error occurred: ${error.message}`);
}

const result = {};
stream
  .pipe(csv(options))
  .on("data", (data) => {
    db.get(
      `SELECT * FROM participantes WHERE mail = ?`,
      [data["Dirección de correo"]],
      (err, row) => {
        if (err) {
          console.error(err.message);
          return;
        }
        if (!row) return;
        if (!result[row.grupo]) {
          result[row.grupo] = { finished: [], unfinished: [] };
        }
        data["Evaluación Final"] ==
        "Finalizado (ha alcanzado la califiación de aprobado)"
          ? result[row.grupo].finished.push(data)
          : result[row.grupo].unfinished.push(data);
      }
    );
  })
  .on("end", () => {
    db.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log("Close the database connection.");
    });
    try {
      const workbook = new ExcelJS.Workbook();
      const groups = Object.entries(result);
      groups.sort((a, b) => a[0].localeCompare(b[0]));
      groups.forEach(([groupKey, group]) => {
        const finishedWorksheet = workbook.addWorksheet(`${groupKey} Finalizado`);
        finishedWorksheet.columns = Object.keys(group.finished[0]).map((key) => ({
          header: key,
          key,
          width: 12,
        }));
        group.finished.forEach((item) => finishedWorksheet.addRow(item));
        const unfinishedWorksheet = workbook.addWorksheet(
          `${groupKey} En Progreso`
        );
        unfinishedWorksheet.columns = Object.keys(group.unfinished[0]).map(
          (key) => ({ header: key, key, width: 12 })
        );
        group.unfinished.forEach((item) => unfinishedWorksheet.addRow(item));
      });
      workbook.xlsx.writeFile(`Informe${new Date()}.xlsx`).then(() => {
        console.log("Excel file created.");
      });
    } catch (error) {
      console.error(`An error occurred: ${error.message}`);
    }
  })
  .on("error", (err) => {
    console.error(err.message);
  });
