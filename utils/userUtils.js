const xlsx = require("xlsx");

exports.parseUsersFromFile = (file) => {
  // Use xlsx.read for buffer
  const workbook = xlsx.read(file.data, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data;
};

exports.chunkArray = (arr, size) =>
  arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);
