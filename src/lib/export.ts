export function exportToCSV(filename: string, rows: any[], columns: { header: string; key: string }[]) {
  if (!rows || !rows.length) return;
  
  const separator = ",";
  const keys = columns.map(col => col.key);
  
  const csvContent = [
    // Header row
    columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(separator),
    // Data rows
    ...rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? "" : String(row[k]);
        // Escape double quotes
        cell = cell.replace(/"/g, '""');
        // Wrap in quotes to handle commas, newlines, etc.
        return `"${cell}"`;
      }).join(separator);
    })
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
