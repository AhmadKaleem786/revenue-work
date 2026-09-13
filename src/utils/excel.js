import * as XLSX from "xlsx";

const safeCell = (value) => {
  if (typeof value !== "string") return value ?? "";
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
};

const worksheetFor = (rows) => {
  const data = rows.length
    ? rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, safeCell(value)]),
        ),
      )
    : [{ Message: "No data available." }];
  const worksheet = XLSX.utils.json_to_sheet(data);
  const headers = Object.keys(data[0]);
  worksheet["!cols"] = headers.map((header) => ({
    wch: Math.min(
      36,
      Math.max(
        header.length + 2,
        ...data.map((row) => String(row[header] ?? "").length + 2),
      ),
    ),
  }));
  return worksheet;
};

export const downloadExcel = ({ fileName, sheets }) => {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    XLSX.utils.book_append_sheet(workbook, worksheetFor(rows), name.slice(0, 31));
  });
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
