"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui";
import { UploadCloud, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

// The backend schema expects name, email, phone, address
const TEMPLATE_HEADERS = ["Name", "Number", "Email", "Address"];

export default function BulkUploadCustomers() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDownloadTemplate = () => {
    // Adding an example row so the template isn't empty
    const csvContent = "data:text/csv;charset=utf-8," + TEMPLATE_HEADERS.join(",") + "\nJohn Doe,9876543210,john@example.com,123 Main St";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const rows = text.split("\n").map(r => r.trim()).filter(Boolean);
    if (rows.length < 2) return [];
    
    // Assume first row is header
    // Parse subsequent rows
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const rowText = rows[i];
      // Basic CSV split, ignores commas inside quotes
      const row = rowText.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(item => item.replace(/^"|"$/g, "").trim());
      
      const [name, phone, email, address] = row;
      if (name) { // name is required
        data.push({
          name: name || "",
          phone: phone || null,
          email: email || null,
          address: address || null,
          gstin: null
        });
      }
    }
    return data;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      const customers = parseCSV(text);

      if (customers.length === 0) {
        alert("No valid customers found in CSV.");
        setIsUploading(false);
        return;
      }

      const res = await api.bulkUploadCustomers(customers);
      setUploadResult(res);
      router.refresh();
      
    } catch (error: any) {
      alert("Failed to upload: " + error.message);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        onClick={handleDownloadTemplate}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Download size={16} />
        Template
      </Button>

      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      <Button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        <UploadCloud size={16} />
        {isUploading ? "Uploading..." : "Upload CSV"}
      </Button>

      {uploadResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Upload Results</h2>
            <div className="flex gap-4 mb-6">
              <div className="px-4 py-2 bg-green-50 text-green-700 rounded-md flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} /> {uploadResult.success_count} Successful
              </div>
              <div className="px-4 py-2 bg-red-50 text-red-700 rounded-md flex items-center gap-2 font-medium">
                <AlertCircle size={16} /> {uploadResult.error_count} Failed
              </div>
            </div>

            {uploadResult.details?.filter((d: any) => d.status === "error").length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Errors Details:</h3>
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">Row</th>
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {uploadResult.details.filter((d: any) => d.status === "error").map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-2">{row.row_index}</td>
                          <td className="px-4 py-2 font-medium">{row.name}</td>
                          <td className="px-4 py-2 text-red-600">{row.error_reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setUploadResult(null)}
                className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
