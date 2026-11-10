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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Save status notification */}
      {notice && (
        <div className="p-3 text-xs rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
          {notice}
        </div>
      )}

      {/* External Tools Diagnostics */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-indigo-400" />
            External Inspection Tooling
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={checkTools}
            className="text-xs h-7 border-neutral-700 gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Re-check
          </Button>
        </div>
        <p className="text-xs text-neutral-400">
          StackLens operates with zero required external dependencies for core detection. Optional tools enhance decompiler and resource disassembly workflows when installed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {Object.entries(tools).map(([toolName, info]) => (
            <div
              key={toolName}
              className="p-3 rounded-lg border border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-neutral-200 font-mono block">
                  {toolName}
                </span>
                <span className="text-[10px] text-neutral-400 truncate block max-w-36">
                  {info.version || (info.available ? "Installed" : "Not Found")}
                </span>
              </div>
              <Badge
                variant={info.available ? "success" : "secondary"}
                className="text-[10px]"
              >
                {info.available ? "Ready" : "Missing"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Path Configurations */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/60 space-y-4">
        <CardTitle className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <Folder className="h-4 w-4 text-indigo-400" />
          Filesystem & Execution Paths
        </CardTitle>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-neutral-300 block mb-1">
              ADB (Android Debug Bridge) Binary Path
            </label>
            <Input
              value={localSettings.adb_path}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, adb_path: e.target.value })
              }
              placeholder="adb (or /path/to/platform-tools/adb)"
              className="font-mono text-xs h-8 border-neutral-700 bg-neutral-950"
            />
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Leave as 'adb' to use system PATH, or specify exact path to platform-tools/adb.
            </span>
          </div>

          <div>
            <label className="font-semibold text-neutral-300 block mb-1">
              Pulled APKs Storage Directory
            </label>
            <Input
              value={localSettings.apk_output_dir}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, apk_output_dir: e.target.value })
              }
              className="font-mono text-xs h-8 border-neutral-700 bg-neutral-950"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-300 block mb-1">
              Report Export Directory
            </label>
            <Input
              value={localSettings.report_export_dir}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, report_export_dir: e.target.value })
              }
              className="font-mono text-xs h-8 border-neutral-700 bg-neutral-950"
            />
          </div>
        </div>
      </Card>

      {/* Analysis Engine Options */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/60 space-y-4">
        <CardTitle className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <Settings className="h-4 w-4 text-indigo-400" />
          Engine & Analysis Preferences
        </CardTitle>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-950">
            <div>
              <span className="font-semibold text-neutral-200 block">Retain Pulled Device APKs</span>
              <span className="text-[11px] text-neutral-400">
                Keep local copies of extracted application binaries in your APK storage directory after inspection.
              </span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.retain_apks}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, retain_apks: e.target.checked })
              }
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-neutral-300 block mb-1">
                Batch Concurrency Limit
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
                className="text-xs h-8 border-neutral-700 bg-neutral-950"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-300 block mb-1">
                Logging Verbosity
              </label>
              <select
                value={localSettings.log_level}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, log_level: e.target.value as AppSettings["log_level"] })
                }
                className="w-full h-8 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs text-neutral-400 border-neutral-800 hover:text-neutral-200 gap-1.5"
        >
          <RotateCcw className="h-3 w-3" /> Restore Defaults
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="text-xs px-6"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
