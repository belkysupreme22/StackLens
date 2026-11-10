import React, { useState, useEffect } from "react";
import {
  Settings,
  Folder,
  Wrench,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import * as commands from "@/lib/commands";
import type { AppSettings } from "@/types";

export function SettingsPage() {
  const { settings, loadSettings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [tools, setTools] = useState<Record<string, { available: boolean; path: string | null; version: string | null }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    checkTools();
  }, []);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const checkTools = async () => {
    try {
      const res = await commands.checkExternalTools();
      setTools(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    setNotice(null);
    try {
      await updateSettings(localSettings);
      setNotice("Settings updated successfully.");
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setNotice(`Failed to save settings: ${e}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const res = await commands.resetSettings();
      setLocalSettings(res);
      setNotice("Preferences restored to factory defaults.");
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!localSettings) {
    return <div className="text-xs text-neutral-400 p-8">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Save status notification */}
      {notice && (
        <div className="p-2.5 text-xs font-mono rounded-[20px] border border-[#26262a] bg-[#131315] text-[#47ab61]">
          {notice}
        </div>
      )}

      {/* External Tools Diagnostics */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px] space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono font-medium text-[#ffffff] flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
            External inspection tooling
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={checkTools}
            className="text-xs font-mono h-7 border-[#26262a] bg-[#0a0a0b] rounded-[20px] hover:border-[#333338] gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Re-check
          </Button>
        </div>
        <p className="text-[11px] font-mono text-[#8c8b8f]">
          StackLens operates with zero required external dependencies for core detection.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {Object.entries(tools).map(([toolName, info]) => (
            <div
              key={toolName}
              className="p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] flex items-center justify-between text-xs font-mono"
            >
              <div>
                <span className="font-medium text-[#ffffff] block">
                  {toolName}
                </span>
                <span className="text-[10px] text-[#8c8b8f] truncate block max-w-36">
                  {info.version || (info.available ? "Installed" : "Not found")}
                </span>
              </div>
              <Badge
                variant={info.available ? "success" : "secondary"}
                className="text-[9px]"
              >
                {info.available ? "Ready" : "Missing"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Path Configurations */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px] space-y-3">
        <CardTitle className="text-xs font-mono font-medium text-[#ffffff] flex items-center gap-2">
          <Folder className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
          Filesystem and execution paths
        </CardTitle>

        <div className="space-y-3 text-xs font-mono">
          <div>
            <label className="text-[#ffffff] block mb-1">
              ADB binary path
            </label>
            <Input
              value={localSettings.adb_path}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, adb_path: e.target.value })
              }
              placeholder="adb (or /path/to/platform-tools/adb)"
              className="font-mono text-xs h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px]"
            />
            <span className="text-[10px] text-[#8c8b8f] mt-0.5 block">
              Leave as 'adb' to use system PATH, or specify exact path to platform-tools/adb.
            </span>
          </div>

          <div>
            <label className="text-[#ffffff] block mb-1">
              Pulled APKs storage directory
            </label>
            <Input
              value={localSettings.apk_output_dir}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, apk_output_dir: e.target.value })
              }
              className="font-mono text-xs h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px]"
            />
          </div>

          <div>
            <label className="text-[#ffffff] block mb-1">
              Report export directory
            </label>
            <Input
              value={localSettings.report_export_dir}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, report_export_dir: e.target.value })
              }
              className="font-mono text-xs h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px]"
            />
          </div>
        </div>
      </Card>

      {/* Analysis Engine Options */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px] space-y-3">
        <CardTitle className="text-xs font-mono font-medium text-[#ffffff] flex items-center gap-2">
          <Settings className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
          Engine and analysis preferences
        </CardTitle>

        <div className="space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between p-2.5 rounded-[20px] border border-[#26262a] bg-[#0a0a0b]">
            <div>
              <span className="font-medium text-[#ffffff] block">Retain pulled device APKs</span>
              <span className="text-[10px] text-[#8c8b8f]">
                Keep local copies of extracted application binaries in storage directory.
              </span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.retain_apks}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, retain_apks: e.target.checked })
              }
              className="h-3.5 w-3.5 rounded-full border-[#26262a] bg-[#0a0a0b] text-[#47ab61] focus:ring-[#47ab61] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#ffffff] block mb-1">
                Batch concurrency limit
              </label>
              <Input
                type="number"
                min={1}
                max={16}
                value={localSettings.analysis_concurrency}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    analysis_concurrency: parseInt(e.target.value) || 4,
                  })
                }
                className="text-xs font-mono h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px]"
              />
            </div>

            <div>
              <label className="text-[#ffffff] block mb-1">
                Logging verbosity
              </label>
              <select
                value={localSettings.log_level}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, log_level: e.target.value as AppSettings["log_level"] })
                }
                className="w-full h-8 rounded-[20px] border border-[#26262a] bg-[#0a0a0b] px-2.5 text-xs font-mono text-[#ffffff] focus:outline-none focus:border-[#47ab61]"
              >
                <option value="error">Error</option>
                <option value="warn">Warn</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
                <option value="trace">Trace</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs font-mono text-[#8c8b8f] border-[#26262a] bg-[#131315] hover:text-[#ffffff] rounded-[20px] gap-1.5"
        >
          <RotateCcw className="h-3 w-3" /> Restore defaults
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="text-xs font-mono px-5 rounded-[20px]"
        >
          {isSaving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
