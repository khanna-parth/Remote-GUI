import { useEffect } from "react";
import TableView from "./TableView";
import ExpandableElement from "../components/ExpandableElement";
import { BsFiletypeCsv, BsFiletypeJson } from "react-icons/bs";

const RenderTable = ({ tableTitle, tableData }) => {
  const triggerDownload = (blob, title, suffix) => {
    const fileName = `${title.replace(/\s+/g, "_").toLowerCase()}_${suffix}.json`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const downloadToCSV = () => {
    const data = tableData;
    const headers = data.column_info.map((col) => col.label);

    const csvRows = data.rows.map((row) => {
      return headers.map((header) => {
        const entry = row.entries.find((e) => e.row_key === header);
        let value = entry ? entry.value : "";

        if (typeof value === "string" && value.includes(",")) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
    });

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${data.title.replace(/\s+/g, "_")}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCleanJSON = () => {
    const data = tableData;
    const cleanData = data.rows.map((row) => {
      const item = {};
      row.entries.forEach((entry) => {
        item[entry.row_key] = entry.value;
      });
      return item;
    });

    const blob = new Blob([JSON.stringify(cleanData, null, 2)], {
      type: "application/json",
    });
    triggerDownload(blob, data.title, "clean");
  };
  return (
    <div key={tableTitle} style={{ marginBottom: 16, width: "100%" }}>
      <ExpandableElement
        title={tableTitle}
        headerElement={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              style={{
                margin: 0,
                background: "none",
                border: "none",
                color: "black",
                padding: 0,
                cursor: "pointer",
              }}
              onClick={() => downloadToCSV()}
            >
              <BsFiletypeCsv size={20} />
            </button>

            <button
              style={{
                margin: 0,
                background: "none",
                border: "none",
                color: "black",
                padding: 0,
                cursor: "pointer",
              }}
              onClick={() => downloadCleanJSON()} 
            >
              <BsFiletypeJson size={20} />
            </button>
          </div>
        }
        innerElement={
          <>
            <TableView tableTitle={tableTitle} tableData={tableData} />
          </>
        }
      />
    </div>
  );
};

export default RenderTable;
