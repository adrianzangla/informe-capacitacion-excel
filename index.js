const ExcelJS = require('exceljs');
const jschardet = require("jschardet");
const fs = require("fs");
const csv = require("csv-parser");
const iconv = require("iconv-lite");

const readCSV = (path, options) => {
  return new Promise((resolve, reject) => {
    const array = [];
    const data = fs.readFileSync(path);
    const encoding = jschardet.detect(data).encoding;

    let stream;
    if (encoding === "UTF-16LE") {
      stream = fs.createReadStream(path).pipe(iconv.decodeStream("utf-16le"));
      options = { separator: "\t", ...options };
    } else {
      stream = fs.createReadStream(path);
    }

    stream
      .pipe(csv(options))
      .on("data", (data) => array.push(data))
      .on("end", () => resolve(array))
      .on("error", reject);
  });
};

// Options for progress data
const progressOptions = {
  mapHeaders: ({ header, index }) =>
    index === 0 ? "Nombre y Apellido" : header ? header : null,
};

const main = async () => {
  // Read CSVs
  const progress = await readCSV("progress.pe_2024.csv", progressOptions);
  const groups = await readCSV("groups.csv");

  // Group progress by group
  const progressByGroup = progress.reduce(
    (acc, progressRow) => {
      const group = groups.find(
        (group) => group.MAIL == progressRow["Dirección de correo"]
      );
      if (!group) return acc;
      switch (group.GRUPO) {
        case "Grupo 1":
          acc.group1.push(progressRow);
          break;
        case "Grupo 2":
          acc.group2.push(progressRow);
          break;
        case "Grupo 3":
          acc.group3.push(progressRow);
          break;
        case "Grupo 4":
          acc.group4.push(progressRow);
          break;
      }
      return acc;
    },
    { group1: [], group2: [], group3: [], group4: [] }
  );

  // Separate finished and unfinished
  const result = Object.keys(progressByGroup).reduce((acc, key) => {
    const group = progressByGroup[key];
    acc[key] = group.reduce(
      (acc, groupRow) => {
        if (
          groupRow["Evaluación Final"] ==
          "Finalizado (ha alcanzado la califiación de aprobado)"
        ) {
          acc.finished.push(groupRow);
        } else {
          acc.unfinished.push(groupRow);
        }
        return acc;
      },
      { finished: [], unfinished: [] }
    );
    return acc;
  }, {});

  const workbook = new ExcelJS.Workbook();

  Object.keys(result).forEach((groupKey) => {
    const group = result[groupKey];
    const groupNumber = groupKey.replace("group", "");

    const finishedWorksheet = workbook.addWorksheet(
      `Grupo ${groupNumber} Finalizado`
    );
    finishedWorksheet.columns = Object.keys(group.finished[0]).map((key) => ({
      header: key,
      key,
    }));
    group.finished.forEach((item) => finishedWorksheet.addRow(item));

    const unfinishedWorksheet = workbook.addWorksheet(
      `Grupo ${groupNumber} En Progreso`
    );
    unfinishedWorksheet.columns = Object.keys(group.unfinished[0]).map(
      (key) => ({ header: key, key })
    );
    group.unfinished.forEach((item) => unfinishedWorksheet.addRow(item));
  });

  // write the file named with the current time
  await workbook.xlsx.writeFile(`Informe_${new Date().getTime()}.xlsx`);

};

main();
