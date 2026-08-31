"use client";

import { useState, useEffect } from "react";
import { api, CompanySetting } from "@/lib/api";
import { useERP } from "@/lib/useERP";
import { getClientToken } from "@/lib/clientAuth";
import { Card, Input, Button, Select } from "@/components/ui";

export default function SettingsClient() {
  const token = getClientToken() ?? "";
  const { data: settingsData = [], mutate } = useERP<CompanySetting[]>("/company-settings", token);
  const { data: pickupData } = useERP<{locations: string[]}>("/shiprocket-pickup-locations", token);
  const pickupOptions = pickupData?.locations || [];
  
  const [saving, setSaving] = useState(false);
  
  // Local state for settings form
  const [pickupLocation, setPickupLocation] = useState("");
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [autoPush, setAutoPush] = useState(false);

  useEffect(() => {
    if (settingsData.length > 0) {
      const getVal = (key: string, def: string) => settingsData.find((s) => s.key === key)?.value || def;
      setPickupLocation(getVal("shiprocket_pickup_location", "Divya"));
      setLength(getVal("shiprocket_length", "10"));
      setBreadth(getVal("shiprocket_breadth", "10"));
      setHeight(getVal("shiprocket_height", "10"));
      setWeight(getVal("shiprocket_weight", "0.5"));
      setAutoPush(getVal("shiprocket_auto_push", "false") === "true");
    }
  }, [settingsData]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = [
        { key: "shiprocket_pickup_location", value: pickupLocation },
        { key: "shiprocket_length", value: length },
        { key: "shiprocket_breadth", value: breadth },
        { key: "shiprocket_height", value: height },
        { key: "shiprocket_weight", value: weight },
        { key: "shiprocket_auto_push", value: autoPush ? "true" : "false" },
      ];
      
      for (const item of payload) {
        await api.patch(`/company-settings/${item.key}`, { value: item.value }, token);
      }
      mutate();
      alert("Settings saved successfully!");
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* Shiprocket Integrations */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Shiprocket Integration</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure default package dimensions and auto-sync behavior.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Primary Pickup Location</label>
            <p className="text-xs text-muted-foreground mb-2">Must match exactly with a location name in your Shiprocket dashboard.</p>
            {pickupOptions.length > 0 ? (
              <Select 
                value={pickupLocation} 
                onChange={(e) => setPickupLocation(e.target.value)}
              >
                <option value="">Select a location...</option>
                {pickupOptions.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </Select>
            ) : (
              <Input 
                value={pickupLocation} 
                onChange={(e) => setPickupLocation(e.target.value)} 
                placeholder="Loading locations..."
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Box Length (cm)</label>
              <Input 
                type="number"
                value={length} 
                onChange={(e) => setLength(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Box Breadth (cm)</label>
              <Input 
                type="number"
                value={breadth} 
                onChange={(e) => setBreadth(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Box Height (cm)</label>
              <Input 
                type="number"
                value={height} 
                onChange={(e) => setHeight(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Box Weight (kg)</label>
              <Input 
                type="number"
                step="0.01"
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-6 flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Auto-Push on Fulfillment</label>
              <p className="text-xs text-muted-foreground">
                Automatically push order to Shiprocket and generate AWB when order is fulfilled.
              </p>
            </div>
            <input 
              type="checkbox" 
              checked={autoPush} 
              onChange={(e) => setAutoPush(e.target.checked)} 
            />
          </div>

          <div className="pt-6 flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
}
