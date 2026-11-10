import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  Plus,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Shield,
  Layers,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import * as commands from "@/lib/commands";
import type { CustomSignature } from "@/types";

export function CustomSignaturesPage() {
  const { signatures, loadSignatures } = useAppStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [framework, setFramework] = useState("");
  const [filePatterns, setFilePatterns] = useState("");
  const [nativeLibPatterns, setNativeLibPatterns] = useState("");
  const [classPatterns, setClassPatterns] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadSignatures();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !framework.trim()) {
      setNotice("Signature name and framework identifier are required.");
      return;
    }

    const newSig: Omit<CustomSignature, "id"> = {
      name: name.trim(),
      framework: framework.trim(),
      enabled: true,
      file_patterns: filePatterns.split(",").map((s) => s.trim()).filter(Boolean),
      native_lib_patterns: nativeLibPatterns.split(",").map((s) => s.trim()).filter(Boolean),
      asset_patterns: [],
      class_patterns: classPatterns.split(",").map((s) => s.trim()).filter(Boolean),
      manifest_patterns: [],
      evidence_description: description.trim() || `Custom signature indicator for ${framework.trim()}`,
      evidence_type: "StrongIndicator",
    };

    try {
      await commands.addCustomSignature(newSig);
      await loadSignatures();
      setAddDialogOpen(false);
      resetForm();
      setNotice(`Signature '${name}' created successfully.`);
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setNotice(`Failed to save signature: ${e}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await commands.deleteCustomSignature(id);
      await loadSignatures();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (sig: CustomSignature) => {
    try {
      await commands.updateCustomSignature({ ...sig, enabled: !sig.enabled });
      await loadSignatures();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setName("");
    setFramework("");
    setFilePatterns("");
    setNativeLibPatterns("");
    setClassPatterns("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-6 border-neutral-800 bg-neutral-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-indigo-400" />
              Custom Framework Signatures
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Author user-defined pattern definitions, native library indicators, and class descriptors to extend the detection engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="text-xs h-8 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Signature
            </Button>
          </div>
        </div>
      </Card>

      {notice && (
        <div className="p-3 text-xs rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
          {notice}
        </div>
      )}

      {/* User Custom Signatures List */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Configured Signatures ({signatures.length})
        </h4>

        {signatures.length === 0 ? (
          <Card className="p-8 border-neutral-800 bg-neutral-900/40 text-center text-xs text-neutral-400">
            No custom signatures configured. Click "Add Signature" to define custom detection patterns.
          </Card>
        ) : (
          <div className="space-y-3">
            {signatures.map((sig) => (
              <Card
                key={sig.id}
                className="p-4 border-neutral-800 bg-neutral-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-100">{sig.name}</span>
                    <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-500/30">
                      {sig.framework}
                    </Badge>
                    <Badge
                      variant={sig.enabled ? "success" : "secondary"}
                      className="text-[10px] cursor-pointer"
                      onClick={() => handleToggle(sig)}
                    >
                      {sig.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-400">{sig.evidence_description}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400 pt-1">
                    {sig.native_lib_patterns.length > 0 && (
                      <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        Libs: {sig.native_lib_patterns.join(", ")}
                      </span>
                    )}
                    {sig.class_patterns.length > 0 && (
                      <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        Classes: {sig.class_patterns.join(", ")}
                      </span>
                    )}
                    {sig.file_patterns.length > 0 && (
                      <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        Files: {sig.file_patterns.join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(sig.id)}
                    className="p-1.5 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                    title="Delete signature"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Built-in Engine Signatures (Protected) */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-indigo-400" />
          Built-in Engine Signatures (Read-Only)
        </h4>

        <Card className="p-4 border-neutral-800 bg-neutral-900/40 text-xs text-neutral-400 space-y-2">
          <p>
            Built-in signatures are compiled directly into the Rust detection engine core for maximum performance, safety against regex catastrophic backtracking, and deterministic offline scoring.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Flutter",
              "React Native",
              "Unity",
              "Unreal Engine",
              "Godot",
              ".NET MAUI",
              "Xamarin",
              "Apache Cordova",
              "Capacitor",
              "Ionic",
              "NativeScript",
              "Native Android (Kotlin)",
              "Native Android (Java)",
              "Jetpack Compose",
            ].map((f) => (
              <span
                key={f}
                className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-[11px]"
              >
                {f}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Add Signature Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="Add Custom Signature"
        description="Define patterns for identifying proprietary, private, or novel application runtimes."
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-neutral-300 block mb-1">
              Signature Name
            </label>
            <Input
              placeholder="e.g. In-House Game Engine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-8 border-neutral-700 bg-neutral-950"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-300 block mb-1">
              Framework Identifier
            </label>
            <Input
              placeholder="e.g. MyCustomEngine"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="text-xs h-8 border-neutral-700 bg-neutral-950 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-300 block mb-1">
              Native Library Names (comma-separated)
            </label>
            <Input
              placeholder="e.g. libengine.so, libgame_core.so"
              value={nativeLibPatterns}
              onChange={(e) => setNativeLibPatterns(e.target.value)}
              className="text-xs h-8 border-neutral-700 bg-neutral-950 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-300 block mb-1">
              DEX Class Name Prefixes (comma-separated)
            </label>
            <Input
              placeholder="e.g. com.company.engine., org.custom.runtime."
              value={classPatterns}
              onChange={(e) => setClassPatterns(e.target.value)}
              className="text-xs h-8 border-neutral-700 bg-neutral-950 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-300 block mb-1">
              Asset File Paths (comma-separated)
            </label>
            <Input
              placeholder="e.g. assets/engine.bundle, assets/data.bin"
              value={filePatterns}
              onChange={(e) => setFilePatterns(e.target.value)}
              className="text-xs h-8 border-neutral-700 bg-neutral-950 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-300 block mb-1">
              Evidence Description
            </label>
            <Input
              placeholder="e.g. Verified proprietary in-house engine runtime"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-8 border-neutral-700 bg-neutral-950"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="text-xs border-neutral-700"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} className="text-xs">
              Save Signature
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
