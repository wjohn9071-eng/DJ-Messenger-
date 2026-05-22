import React, { useState, useEffect } from "react";
import { AppState } from "../types";
import { djStyleText, djStyleBg } from "../lib/utils";
import { CheckCircle2, Trash2, Eye, EyeOff } from "lucide-react";
import { RestrictedActionPopup } from "../components/RestrictedActionPopup";

export function SettingsMock({
  state,
  updateState,
  onLogout,
}: {
  state: AppState;
  updateState: any;
  onLogout: () => void;
}) {
  const user = state.users[state.currentUser as string];
  const [bgColor, setBgColor] = useState(user?.bgColor || "#f0f2f5");
  const [notifications, setNotifications] = useState(
    user?.notificationsEnabled || false,
  );
  const [autoHideSidebar, setAutoHideSidebar] = useState(
    user?.autoHideSidebar ?? true,
  );
  const [adminCode, setAdminCode] = useState("");
  const [superAdminCode, setSuperAdminCode] = useState("");
  const [showAdminCodeInput, setShowAdminCodeInput] = useState(false);
  const [showSuperAdminCodeInput, setShowSuperAdminCodeInput] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Focus only on the visual changes, as it is a mock

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const frenchColors: Record<string, string> = {
    "vert lime": "#32CD32",
    "vert citron": "#CCFF00",
    rose: "#FFC0CB",
    "bleu d'azur": "#007FFF",
    "bleu azur": "#007FFF",
    rouge: "#FF0000",
    bleu: "#0000FF",
    vert: "#008000",
    jaune: "#FFFF00",
    noir: "#000000",
    blanc: "#FFFFFF",
    gris: "#808080",
    orange: "#FFA500",
    violet: "#EE82EE",
    marron: "#A52A2A",
    cyan: "#00FFFF",
    magenta: "#FF00FF",
    or: "#FFD700",
    argent: "#C0C0C0",
    turquoise: "#40E0D0",
    indigo: "#4B0082",
    beige: "#F5F5DC",
    lilas: "#B666D2",
    saumon: "#FA8072",
    corail: "#FF7F50",
    kaki: "#F0E68C",
    lavande: "#E6E6FA",
    prune: "#DDA0DD",
    chocolat: "#D2691E",
    tomate: "#FF6347",
    émeraude: "#50C878",
    saphir: "#0F52BA",
    rubis: "#E0115F",
    jade: "#00A86B",
    ambre: "#FFBF00",
    bordeaux: "#800000",
    "bleu marine": "#000080",
    "bleu ciel": "#87CEEB",
    "vert olive": "#808000",
    "jaune moutarde": "#FFDB58",
    "rose poudré": "#FFD1DC",
    "vert d'eau": "#B0F2B6",
    "rouge brique": "#B22222",
    "vert menthe": "#98FF98",
    "bleu roi": "#4169E1",
    "bleu nuit": "#191970",
    "jaune citron": "#FFF700",
    "vert sapin": "#095228",
    "rose fuchsia": "#FD3F92",
    "gris anthracite": "#303030",
    "blanc cassé": "#FEFEE2",
  };

  const colorNameToHex = (color: string) => {
    const lowerColor = color.toLowerCase().trim();
    if (frenchColors[lowerColor]) return frenchColors[lowerColor];
    if (color.startsWith("#")) return color;

    // Check if it's a valid CSS color name
    const s = document.createElement("div").style;
    s.color = lowerColor;
    if (s.color !== "") {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return color;
      ctx.fillStyle = lowerColor;
      return ctx.fillStyle;
    }
    return color;
  };

  const handleColorChange = (newColor: string) => {
    setBgColor(newColor);
    const hex = colorNameToHex(newColor);

    const s = document.createElement("div").style;
    s.color = hex;
    if (s.color !== "") {
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        if (newUsers[prev.currentUser as string]) {
          newUsers[prev.currentUser as string] = {
            ...newUsers[prev.currentUser as string],
            bgColor: hex,
          };
        }
        return { users: newUsers };
      });
    }
  };

  const saveSettings = () => {
    updateState((prev: AppState) => {
      const newUsers = { ...prev.users };
      if (newUsers[prev.currentUser as string]) {
        newUsers[prev.currentUser as string] = {
          ...newUsers[prev.currentUser as string],
          bgColor: bgColor,
          notificationsEnabled: notifications,
          autoHideSidebar: autoHideSidebar,
          darkMode: state.darkMode,
        };
      }
      return { users: newUsers };
    });

    showToast("Paramètres sauvegardés (Simulation) !");
  };

  const handleAdminAuth = () => {
    if (adminCode === "Dj2024in") {
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        newUsers[prev.currentUser as string].isAdmin = true;
        return { users: newUsers };
      });
      showToast("Mode Staff activé (Simulation) !");
    } else {
      showToast("Code incorrect.");
    }
    setAdminCode("");
  };

  const handleSuperAdminAuth = () => {
    if (superAdminCode === "DJ24026IN") {
      updateState((prev: AppState) => {
        const newUsers = { ...prev.users };
        newUsers[prev.currentUser as string].isAdmin = true;
        newUsers[prev.currentUser as string].isSuperAdmin = true;
        return { users: newUsers };
      });
      showToast("Mode SUPER ADMIN activé (Simulation) !");
    } else {
      showToast("Code incorrect.");
    }
    setSuperAdminCode("");
  };

  return (
    <div className="p-6 max-w-lg mx-auto animate-in fade-in duration-300 pb-20 overflow-y-auto h-full custom-scrollbar">
      <h2
        className={`text-2xl font-bold mb-6 ${state.darkMode ? "text-white" : djStyleText}`}
      >
        Paramètres
      </h2>

      <div className="flex flex-col gap-4 mb-8">
        <button
          onClick={saveSettings}
          className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 text-lg ${djStyleBg}`}
        >
          Sauvegarder tout
        </button>

        <button
          onClick={() => {
            const newMode = !state.darkMode;
            updateState({ darkMode: newMode });
          }}
          className={`w-full py-4 rounded-2xl font-bold shadow-lg transition active:scale-95 text-lg flex items-center justify-center gap-3 ${state.darkMode ? "bg-zinc-800 text-white border border-white/10" : "bg-white text-gray-800 border border-gray-100"}`}
        >
          {state.darkMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
          {state.darkMode ? "Désactiver Mode Sombre" : "Activer Mode Sombre"}
        </button>
      </div>

      <div className="space-y-8">
        {/* Section Apparence */}
        <section
          className={`p-6 rounded-3xl shadow-sm border ${state.darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100"}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className={`text-lg font-bold ${state.darkMode ? "text-white" : "text-gray-800"}`}
            >
              Apparence
            </h3>
          </div>
          <div className="mb-4">
            <label
              className={`block text-sm font-semibold mb-4 ${state.darkMode ? "text-zinc-400" : "text-gray-700"}`}
            >
              Thème global
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setBgColor("clair");
                  updateState({ darkMode: false });
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 ${bgColor === "clair" || (!["sombre", "azur", "lime", "degrade"].includes(bgColor) && !state.darkMode) ? "border-gray-900 bg-gray-100" : "border-transparent bg-gray-50 hover:bg-gray-100 text-gray-700"}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#f8fafc] border shadow-inner"></div>
                Clair
              </button>
              <button
                onClick={() => {
                  setBgColor("sombre");
                  updateState({ darkMode: true });
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 ${bgColor === "sombre" || (!["azur", "lime", "degrade"].includes(bgColor) && state.darkMode) ? "border-white bg-zinc-800 text-white" : "border-transparent bg-zinc-900 hover:bg-zinc-800 text-gray-300"}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#09090b] border border-white/20 shadow-inner"></div>
                Sombre
              </button>
              <button
                onClick={() => {
                  setBgColor("azur");
                  updateState({ darkMode: false });
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 ${bgColor === "azur" ? "border-[#0D98BA] bg-blue-50/10" : "border-transparent bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300"}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#0D98BA] shadow-inner"></div>
                Azur
              </button>
              <button
                onClick={() => {
                  setBgColor("lime");
                  updateState({ darkMode: false });
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 ${bgColor === "lime" ? "border-[#32CD32] bg-green-50/10" : "border-transparent bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300"}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#32CD32] shadow-inner"></div>
                Lime
              </button>
              <button
                onClick={() => {
                  setBgColor("degrade");
                  updateState({ darkMode: false });
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 ${bgColor === "degrade" ? "border-[#0D98BA] bg-blue-50/10" : "border-transparent bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300"}`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0D98BA] to-[#32CD32] shadow-inner"></div>
                Dégradé
              </button>
            </div>
          </div>
        </section>

        {/* Section Notifications */}
        <section
          className={`p-6 rounded-3xl shadow-sm border ${state.darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100"}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className={`text-lg font-bold ${state.darkMode ? "text-white" : "text-gray-800"}`}
            >
              Notifications
            </h3>
            <button
              onClick={saveSettings}
              className="p-2 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 transition active:scale-90"
              title="Appliquer"
            >
              <CheckCircle2 size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex flex-col justify-center cursor-pointer">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${state.darkMode ? "text-zinc-400" : "text-gray-700"}`}
                >
                  Activer les notifications
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={notifications}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setNotifications(val);
                      saveSettings(); // Auto-save for tutorial
                    }}
                  />
                  <div
                    className={`block w-14 h-8 rounded-full transition-colors ${notifications ? "bg-[#32CD32]" : "bg-gray-300"}`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${notifications ? "transform translate-x-6" : ""}`}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Reçois des alertes comme sur WhatsApp. (Simulation)
              </p>
            </label>
          </div>
        </section>

        {/* Section Application */}
        <section
          className={`p-6 rounded-3xl shadow-sm border ${state.darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100"}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className={`text-lg font-bold ${state.darkMode ? "text-white" : "text-gray-800"}`}
            >
              Application
            </h3>
            <button
              onClick={saveSettings}
              className="p-2 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 transition active:scale-90"
              title="Appliquer"
            >
              <CheckCircle2 size={16} />
            </button>
          </div>
          <div className="mb-6 flex items-center gap-3">
            <label className="flex-1 flex flex-col justify-center cursor-pointer">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${state.darkMode ? "text-zinc-400" : "text-gray-700"}`}
                >
                  Masquer le menu automatiquement
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoHideSidebar}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setAutoHideSidebar(val);
                      saveSettings(); // Auto-save for tutorial
                    }}
                  />
                  <div
                    className={`block w-14 h-8 rounded-full transition-colors ${autoHideSidebar ? "bg-[#32CD32]" : "bg-gray-300"}`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${autoHideSidebar ? "transform translate-x-6" : ""}`}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ferme le menu après avoir cliqué sur un onglet. (Simulation)
              </p>
            </label>
          </div>
          <div>
            <label className="flex items-center justify-between pointer-events-none opacity-50">
              <span className="text-sm font-semibold text-gray-700">
                Installer l'application (PWA)
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={false}
                  onChange={() => {}}
                />
                <div className="block w-14 h-8 rounded-full bg-gray-300"></div>
                <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full"></div>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Désactivé en mode simulation.
            </p>
          </div>
        </section>

        {/* Section Droits Administrateur */}
        <section className={`p-6 rounded-3xl shadow-sm border ${state.darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100"}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${state.darkMode ? "text-white" : "text-gray-800"}`}>Droits Administrateur</h3>
            <button onClick={saveSettings} className="px-3 py-1.5 bg-[#0D98BA] text-white rounded-xl shadow-lg hover:opacity-90 font-black uppercase text-[10px] tracking-widest transition active:scale-95" title="Sauvegarder">
              Sauvegarder
            </button>
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${state.darkMode ? "text-zinc-400" : "text-gray-700"}`}>
              Code Administrateur (Staff / Grand Admin)
            </label>
            <div className="flex gap-2 relative">
              <input
                type={showAdminCodeInput ? "text" : "password"}
                placeholder="Entrer le code..."
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-xl border outline-none pr-12 ${state.darkMode ? "bg-zinc-800 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
              />
              <button
                type="button"
                onClick={() => setShowAdminCodeInput(!showAdminCodeInput)}
                className="absolute right-14 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#0D98BA]"
              >
                {showAdminCodeInput ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button onClick={handleAdminAuth} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition flex-shrink-0">
                OK
              </button>
            </div>
          </div>

          {user?.isAdmin && (
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${state.darkMode ? "text-zinc-400" : "text-gray-700"}`}>
                Code Super Admin (Temporaire)
              </label>
              <div className="flex gap-2 relative">
                <input
                  type={showSuperAdminCodeInput ? "text" : "password"}
                  placeholder="Entrer le code Super Admin..."
                  value={superAdminCode}
                  onChange={(e) => setSuperAdminCode(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-xl border outline-none pr-12 ${state.darkMode ? "bg-zinc-800 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowSuperAdminCodeInput(!showSuperAdminCodeInput)}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#0D98BA]"
                >
                  {showSuperAdminCodeInput ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button onClick={handleSuperAdminAuth} className="px-6 py-3 bg-[#0D98BA] text-white rounded-xl font-bold hover:opacity-90 transition flex-shrink-0">
                  OK
                </button>
              </div>
            </div>
          )}

          {user?.isAdmin && (
            <button
              onClick={() => showToast("Droits déclinés. (Simulation)")}
              className="w-full py-3 rounded-xl text-white font-bold bg-red-600 hover:bg-red-700 transition active:scale-95 mb-4 shadow-lg uppercase tracking-widest text-xs"
            >
              DÉCLINER LES DROIT
            </button>
          )}

          <button
            onClick={saveSettings}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 mb-4 ${djStyleBg}`}
          >
            Sauvegarder les paramètres
          </button>

          <button
            onClick={onLogout}
            className="w-full py-3 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition active:scale-95 mb-4"
          >
            Quitter la simulation (Se déconnecter)
          </button>

          <button
            onClick={() => showToast("Impossible de supprimer en simulation.")}
            className="w-full py-3 rounded-xl text-red-600 font-bold bg-red-50 hover:bg-red-100 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Trash2 size={18} /> Supprimer le compte
          </button>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 animate-in slide-in-from-bottom-5">
          {toast}
        </div>
      )}
    </div>
  );
}
