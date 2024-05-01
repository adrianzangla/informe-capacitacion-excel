const fs = require("fs");
const csv = require("csv-parser");
// const csvWriter = require("csv-writer");
// const iconv = require("iconv-lite");

// const progressColumns = [
//   "Nombre y Apellido",
//   "Dirección de correo",
//   "Actividad Módulo 1",
//   "Actividad Módulo 2",
//   "Actividad Módulo 3",
//   "Actividad Módulo 4",
//   "Actividad Módulo 6",
//   "Evaluación Final",
// ];

const readCSV = (path) => {
  return new Promise((resolve, reject) => {
    const array = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (data) => array.push(data))
      .on("end", () => resolve(array))
      .on("error", reject);
  });
};

const main = async () => {
  const progress = await readCSV("progress.pe_2024.csv");
  console.log(progress);
};

main();

// const pick = (obj, keys) => {
//   return keys.reduce((newObj, key) => {
//     if (obj.hasOwnProperty(key)) {
//       newObj[key] = obj[key];
//     }
//     return newObj;
//   }, {});
// };

// let fileContent = fs.readFileSync("progress.pe_2024.csv", "utf16le");

// if (fileContent.charCodeAt(0) === 0xfeff && fileContent[1] === "\t") {
//   fileContent = '\ufeff"Nombre y Apellido"' + fileContent.slice(1);
// }

// fs.writeFileSync("progress.pe_2024.csv", fileContent, "utf-16le");

// const main = async () => {
//   const groups = [];
//   const progress = [];
//   await Promise.all([
//     readCSV("groups.csv", groups),
//     readCSV("progress.pe_2024.csv", progress),
//   ]);

//   progress.forEach((obj, index) => {
//     progress[index] = pick(obj, progressColumns);
//   });

//   const progressByGroup = progress.reduce(
//     (acc, progressRow) => {
//       const group = groups.find(
//         (group) => group.MAIL == progressRow["Dirección de correo"]
//       );
//       if (!group) return acc;
//       switch (group.GRUPO) {
//         case "Grupo 1":
//           acc.group1.push(progressRow);
//           break;
//         case "Grupo 2":
//           acc.group2.push(progressRow);
//           break;
//         case "Grupo 3":
//           acc.group3.push(progressRow);
//           break;
//         case "Grupo 4":
//           acc.group4.push(progressRow);
//           break;
//       }
//       return acc;
//     },
//     { group1: [], group2: [], group3: [], group4: [] }
//   );

//   const result = Object.keys(progressByGroup).reduce((acc, key) => {
//     const group = progressByGroup[key];
//     acc[key] = group.reduce(
//       (acc, groupRow) => {
//         if (
//           groupRow["Evaluación Final"] ==
//           "Finalizado (ha alcanzado la califiación de aprobado)"
//         ) {
//           acc.finished.push(groupRow);
//         } else {
//           acc.unfinished.push(groupRow);
//         }
//         return acc;
//       },
//       { finished: [], unfinished: [] }
//     );
//     return acc;
//   }, {});

//   for (const groupName in result) {
//     const finishedWriter = csvWriter({
//       path: `${groupName}finished.csv`,
//       header: Object.keys(result[groupName].finished[0]).map((key) => ({
//         id: key,
//         title: key,
//       })),
//       encoding: "utf16le",
//       appendBOM: true,
//     });

//     const unfinishedWriter = csvWriter({
//       path: `${groupName}unfinished.csv`,
//       header: Object.keys(result[groupName].unfinished[0]).map((key) => ({
//         id: key,
//         title: key,
//       })),
//       encoding: "utf16le",
//       appendBOM: true,
//     });

//     finishedWriter
//       .writeRecords(result[groupName].finished)
//       .then(() =>
//         console.log(
//           `The CSV file ${groupName}finished.csv was written successfully`
//         )
//       );

//     unfinishedWriter
//       .writeRecords(result[groupName].unfinished)
//       .then(() =>
//         console.log(
//           `The CSV file ${groupName}unfinished.csv was written successfully`
//         )
//       );
//   }
// };

// // main();
