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
    <div className="space-y-4">
      {/* Top Header Card */}
      <Card className="p-4 border-[#26262a] bg-[#131315] rounded-[20px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-mono font-medium text-[#ffffff] flex items-center gap-2">
              <Fingerprint className="h-3.5 w-3.5 text-[#47ab61]" strokeWidth={1.5} />
              Custom framework signatures
            </h3>
            <p className="text-[11px] font-mono text-[#8c8b8f] mt-0.5">
              Author pattern definitions, native library indicators, and class descriptors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="text-xs font-mono h-8 rounded-[20px] gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add signature
            </Button>
          </div>
        </div>
      </Card>

      {notice && (
        <div className="p-2.5 text-xs font-mono rounded-[20px] border border-[#26262a] bg-[#131315] text-[#47ab61]">
          {notice}
        </div>
      )}

      {/* User Custom Signatures List */}
      <div>
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8c8b8f] mb-2.5">
          Configured signatures ({signatures.length})
        </h4>

        {signatures.length === 0 ? (
          <Card className="p-6 border-[#26262a] bg-[#131315] rounded-[20px] text-center text-xs font-mono text-[#8c8b8f]">
            No custom signatures configured. Click "Add signature" to define custom detection patterns.
          </Card>
        ) : (
          <div className="space-y-2">
            {signatures.map((sig) => (
              <Card
                key={sig.id}
                className="p-3.5 border-[#26262a] bg-[#131315] rounded-[20px] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-[#ffffff]">{sig.name}</span>
                    <Badge variant="outline" className="text-[9px] text-[#47ab61] border-[#26262a]">
                      {sig.framework}
                    </Badge>
                    <Badge
                      variant={sig.enabled ? "success" : "secondary"}
                      className="text-[9px] cursor-pointer"
                      onClick={() => handleToggle(sig)}
                    >
                      {sig.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#8c8b8f]">{sig.evidence_description}</p>
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-[#8c8b8f] pt-0.5">
                    {sig.native_lib_patterns.length > 0 && (
                      <span className="bg-[#0a0a0b] px-1.5 py-0.5 rounded-full border border-[#26262a]">
                        Libs: {sig.native_lib_patterns.join(", ")}
                      </span>
                    )}
                    {sig.class_patterns.length > 0 && (
                      <span className="bg-[#0a0a0b] px-1.5 py-0.5 rounded-full border border-[#26262a]">
                        Classes: {sig.class_patterns.join(", ")}
                      </span>
                    )}
                    {sig.file_patterns.length > 0 && (
                      <span className="bg-[#0a0a0b] px-1.5 py-0.5 rounded-full border border-[#26262a]">
                        Files: {sig.file_patterns.join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(sig.id)}
                    className="p-1 rounded-full text-[#8c8b8f] hover:text-rose-400 hover:bg-[#1f1f23] transition-colors"
                    title="Delete signature"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Built-in Engine Signatures (Protected) */}
      <div>
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8c8b8f] mb-2.5 flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-[#47ab61]" strokeWidth={1.5} />
          Built-in signatures (read-only)
        </h4>

        <Card className="p-3.5 border-[#26262a] bg-[#131315] rounded-[20px] text-xs font-mono text-[#8c8b8f] space-y-2">
          <p>
            Built-in signatures are compiled directly into the Rust detection engine core for maximum performance, safety against regex backtracking, and deterministic offline scoring.
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
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
                className="px-2 py-0.5 rounded-full bg-[#0a0a0b] border border-[#26262a] text-[#8c8b8f] font-mono text-[10px]"
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
        title="Add custom signature"
        description="Define patterns for identifying proprietary or private runtimes."
      >
        <div className="space-y-3 text-xs font-mono">
          <div>
            <label className="text-[#ffffff] block mb-1">
              Signature name
            </label>
            <Input
              placeholder="e.g. In-house game engine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px]"
            />
          </div>

          <div>
            <label className="text-[#ffffff] block mb-1">
              Framework identifier
            </label>
            <Input
              placeholder="e.g. MyCustomEngine"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="text-xs h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px] font-mono"
            />
          </div>

          <div>
            <label className="text-[#ffffff] block mb-1">
              Native library names (comma-separated)
            </label>
            <Input
              placeholder="e.g. libengine.so, libgame_core.so"
              value={nativeLibPatterns}
              onChange={(e) => setNativeLibPatterns(e.target.value)}
              className="text-xs h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px] font-mono"
            />
          </div>

          <div>
            <label className="text-[#ffffff] block mb-1">
              DEX class name prefixes (comma-separated)
            </label>
            <Input
              placeholder="e.g. com.company.engine., org.custom.runtime."
              value={classPatterns}
              onChange={(e) => setClassPatterns(e.target.value)}
              className="text-xs h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px] font-mono"
            />
          </div>

          <div>
            <label className="text-[#ffffff] block mb-1">
              Asset file paths (comma-separated)
            </label>
            <Input
              placeholder="e.g. assets/engine.bundle, assets/data.bin"
              value={filePatterns}
              onChange={(e) => setFilePatterns(e.target.value)}
              className="text-xs h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px] font-mono"
            />
          </div>

          <div>
            <label className="text-[#ffffff] block mb-1">
              Evidence description
            </label>
            <Input
              placeholder="e.g. Verified proprietary in-house engine runtime"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-8 border-[#26262a] bg-[#0a0a0b] rounded-[20px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="text-xs font-mono h-8 border-[#26262a] bg-[#131315] rounded-[20px]"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} className="text-xs font-mono h-8 rounded-[20px]">
              Save signature
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
