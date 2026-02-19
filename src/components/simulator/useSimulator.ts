import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Paint } from "@/data/defaultColors";
import { supabase } from "@/integrations/supabase/client";
import { Room, DetectedWall, WallSimulation, SimulatorSessionData } from "./types";
import {
  deleteSimulatorSession,
  getLastSessionId,
  getSimulatorSession,
  listSimulatorSessions,
  saveSimulatorSession,
  setLastSessionId,
} from "@/lib/simulator-db";
import { preprocessImageFile } from "@/lib/image-preprocess";

const genId = () => Math.random().toString(36).substring(2, 10);

function nowIso() {
  return new Date().toISOString();
}

function normalizeLoadedSession(s: SimulatorSessionData): SimulatorSessionData {
  const rooms = (s.rooms || []).map((r) => ({
    ...r,
    isAnalyzing: false,
    isPainting: false,
    activeSimulationId: r.activeSimulationId ?? null,
    simulations: (r.simulations || []).map((sim) => ({
      ...sim,
      isPainting: false,
      createdAt: sim.createdAt || nowIso(),
    })),
  }));

  return {
    ...s,
    rooms,
    activeRoomId: s.activeRoomId ?? (rooms[0]?.id ?? null),
    selectedWallId: s.selectedWallId ?? null,
  };
}

export function useSimulator() {
  const [session, setSession] = useState<SimulatorSessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedPaint, setSelectedPaint] = useState<Paint | null>(null);
  const [isPainting, setIsPainting] = useState(false);

  const activeRoom = useMemo(() => rooms.find((r) => r.id === activeRoomId) || null, [rooms, activeRoomId]);

  const autosaveTimer = useRef<number | null>(null);

  const persist = useCallback(
    async (nextSession?: SimulatorSessionData | null) => {
      const s = nextSession ?? session;
      if (!s) return;

      const payload: SimulatorSessionData = {
        ...s,
        updatedAt: nowIso(),
        rooms,
        activeRoomId,
        selectedWallId,
      };

      await saveSimulatorSession({
        id: payload.id,
        name: payload.name,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
        data: payload,
      });

      await setLastSessionId(payload.id);
      setSession(payload);
    },
    [session, rooms, activeRoomId, selectedWallId],
  );

  const manualSave = useCallback(async () => {
    if (!session) {
      toast.error("Nenhum projeto ativo para salvar");
      return;
    }

    try {
      await persist();
      toast.success("Projeto salvo", { description: session.name });
    } catch (e: any) {
      toast.error("Falha ao salvar", { description: e?.message || "Tente novamente" });
    }
  }, [persist, session]);

  const setSessionName = useCallback(
    async (name: string) => {
      if (!session) return;
      const next = { ...session, name, updatedAt: nowIso() };
      setSession(next);
      await persist(next);
      toast.success("Nome do projeto atualizado", { description: name });
    },
    [session, persist],
  );

  const createNewSession = useCallback(
    async (name?: string) => {
      const id = genId();
      const createdAt = nowIso();
      const s: SimulatorSessionData = {
        id,
        name: (name || "Projeto sem nome").trim() || "Projeto sem nome",
        createdAt,
        updatedAt: createdAt,
        rooms: [],
        activeRoomId: null,
        selectedWallId: null,
      };

      setSession(s);
      setRooms([]);
      setActiveRoomId(null);
      setSelectedWallId(null);
      setSelectedPaint(null);

      await persist(s);
      toast.success("Novo projeto criado");
    },
    [persist],
  );

  const loadSession = useCallback(async (id: string) => {
    const record = await getSimulatorSession(id);
    const data = record?.data as SimulatorSessionData | undefined;
    if (!data) return;

    const normalized = normalizeLoadedSession(data);

    setSession(normalized);
    setRooms(normalized.rooms || []);
    setActiveRoomId(normalized.activeRoomId);
    setSelectedWallId(normalized.selectedWallId);
    setSelectedPaint(null);

    await setLastSessionId(normalized.id);
    toast.success("Projeto carregado", { description: normalized.name });
  }, []);

  const deleteSession = useCallback(
    async (id: string) => {
      await deleteSimulatorSession(id);

      if (session?.id === id) {
        setSession(null);
        setRooms([]);
        setActiveRoomId(null);
        setSelectedWallId(null);
        setSelectedPaint(null);
      }

      toast.success("Projeto excluído");
    },
    [session?.id],
  );

  const listSessions = useCallback(async () => {
    const list = await listSimulatorSessions();
    return list.map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt }));
  }, []);

  // Load last session on mount
  useEffect(() => {
    let mounted = true;

    (async () => {
      const lastId = await getLastSessionId();
      if (!mounted) return;

      if (lastId) {
        const record = await getSimulatorSession(lastId);
        const data = record?.data as SimulatorSessionData | undefined;
        if (data) {
          const normalized = normalizeLoadedSession(data);
          setSession(normalized);
          setRooms(normalized.rooms || []);
          setActiveRoomId(normalized.activeRoomId);
          setSelectedWallId(normalized.selectedWallId);
        }
      }

      setLoadingSession(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Autosave (debounced)
  useEffect(() => {
    if (!session) return;
    if (loadingSession) return;

    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);

    autosaveTimer.current = window.setTimeout(() => {
      persist().catch(() => {
        // autosave silencioso (não trava UX)
      });
    }, 650);

    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [rooms, activeRoomId, selectedWallId, session, persist, loadingSession]);

  const ensureSession = useCallback(async () => {
    if (session) return session;

    const id = genId();
    const createdAt = nowIso();
    const s: SimulatorSessionData = {
      id,
      name: "Projeto sem nome",
      createdAt,
      updatedAt: createdAt,
      rooms: [],
      activeRoomId: null,
      selectedWallId: null,
    };

    setSession(s);
    await persist(s);
    return s;
  }, [session, persist]);

  const addRoom = useCallback(
    async (file: File) => {
      await ensureSession();

      const id = genId();
      const tempUrl = URL.createObjectURL(file);

      const newRoom: Room = {
        id,
        name: `Ambiente ${rooms.length + 1}`,
        imageUrl: tempUrl,
        originalImageUrl: tempUrl,
        walls: [],
        isAnalyzing: true,
        isAnalyzed: false,
        simulations: [],
        activeSimulationId: null,
      };

      setRooms((prev) => [...prev, newRoom]);
      setActiveRoomId(id);
      setSelectedWallId(null);

      let imageBase64: string;
      try {
        // Redimensiona + comprime antes de enviar para a Edge Function (reduz custo e tempo)
        imageBase64 = await preprocessImageFile(file, {
          maxDimension: 1600,
          mimeType: "image/jpeg",
          quality: 0.82,
          background: "#ffffff",
        });
      } finally {
        URL.revokeObjectURL(tempUrl);
      }

      // Atualiza a imagem do room para a versão otimizada (a partir daqui tudo usa a versão comprimida)
      setRooms((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                imageUrl: imageBase64,
                originalImageUrl: imageBase64,
              }
            : r,
        ),
      );

      try {
        const { data, error } = await supabase.functions.invoke("analyze-room", {
          body: { imageBase64 },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any, idx: number) => ({
          id: w.id || `wall_${idx}_${Date.now()}`,
          label: w.label || w.nome || w.name || "Parede",
          englishLabel: w.english_label || w.label_en || w.englishLabel || w.name_en,
          description: w.description || w.descricao || "",
        }));

        setRooms((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  walls: detectedWalls,
                  isAnalyzing: false,
                  isAnalyzed: true,
                }
              : r,
          ),
        );

        if (detectedWalls.length > 0) {
          toast.success(`${detectedWalls.length} superfícies identificadas!`, {
            description: "Selecione uma parede para pintar",
          });
          setSelectedWallId(detectedWalls[0].id);
        } else {
          toast.warning("Nenhuma parede detectada", {
            description: "Tente usar uma foto mais nítida e com boa iluminação",
          });
        }
      } catch (err: any) {
        setRooms((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isAnalyzing: false, isAnalyzed: false } : r)),
        );

        const errorMessage = err?.message || "Não foi possível analisar a imagem";
        toast.error("Erro na análise", { description: errorMessage });
      }
    },
    [ensureSession, rooms.length],
  );

  const applyColor = useCallback(async () => {
    if (!activeRoom || !selectedWallId || !selectedPaint) {
      toast.error("Selecione uma parede e uma cor");
      return;
    }

    const wall = activeRoom.walls.find((w) => w.id === selectedWallId);
    if (!wall) {
      toast.error("Parede não encontrada");
      return;
    }

    setIsPainting(true);

    try {
      const { data, error } = await supabase.functions.invoke("paint-wall", {
        body: {
          imageBase64: activeRoom.imageUrl,
          paintColor: selectedPaint.hex,
          paintName: selectedPaint.name,
          wallLabel: wall.label,
          wallLabelEn: wall.englishLabel,
          surfaceType: "wall",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("Image URL not returned");

      const simId = genId();
      const simulation: WallSimulation = {
        id: simId,
        wallId: selectedWallId,
        wallLabel: wall.label,
        paint: selectedPaint,
        imageUrl: data.imageUrl,
        createdAt: nowIso(),
        isPainting: false,
      };

      setRooms((prev) =>
        prev.map((r) =>
          r.id === activeRoom.id
            ? {
                ...r,
                imageUrl: data.imageUrl,
                simulations: [...r.simulations, simulation],
                activeSimulationId: simId,
              }
            : r,
        ),
      );

      toast.success("Cor aplicada com sucesso!", {
        description: `${selectedPaint.name} em ${wall.label}`,
      });
    } catch (err: any) {
      toast.error("Erro ao aplicar cor", {
        description: err?.message || "Tente novamente",
      });
    } finally {
      setIsPainting(false);
    }
  }, [activeRoom, selectedWallId, selectedPaint]);

  const selectSimulation = useCallback((roomId: string, simId: string | null) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;

        if (!simId) {
          return { ...r, activeSimulationId: null, imageUrl: r.originalImageUrl };
        }

        const sim = r.simulations.find((s) => s.id === simId);
        if (!sim) return r;

        return { ...r, activeSimulationId: simId, imageUrl: sim.imageUrl };
      }),
    );
  }, []);

  const removeSimulation = useCallback(
    (simId: string) => {
      if (!activeRoom) return;

      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== activeRoom.id) return r;

          const nextSims = r.simulations.filter((s) => s.id !== simId);
          const removingWasActive = r.activeSimulationId === simId;

          if (nextSims.length === 0) {
            return {
              ...r,
              simulations: [],
              activeSimulationId: null,
              imageUrl: r.originalImageUrl,
            };
          }

          if (!removingWasActive) {
            return { ...r, simulations: nextSims };
          }

          const nextActive = nextSims[nextSims.length - 1];
          return {
            ...r,
            simulations: nextSims,
            activeSimulationId: nextActive.id,
            imageUrl: nextActive.imageUrl,
          };
        }),
      );
    },
    [activeRoom],
  );

  const retryAnalysis = useCallback(() => {
    if (!activeRoom) return;

    const file = dataURLtoFile(activeRoom.originalImageUrl, `ambiente_${Date.now()}.jpg`);
    setRooms((prev) => prev.filter((r) => r.id !== activeRoom.id));
    addRoom(file);
  }, [activeRoom, addRoom]);

  const clearRoom = useCallback(
    (roomId: string) => {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (activeRoomId === roomId) {
        const remaining = rooms.filter((r) => r.id !== roomId);
        setActiveRoomId(remaining[0]?.id ?? null);
        setSelectedWallId(null);
      }
    },
    [activeRoomId, rooms],
  );

  return {
    // session
    session,
    loadingSession,
    createNewSession,
    loadSession,
    deleteSession,
    listSessions,
    manualSave,
    setSessionName,

    // simulator state
    rooms,
    activeRoom,
    activeRoomId,
    selectedWallId,
    selectedPaint,
    isPainting,
    totalSimulations: rooms.reduce((acc, r) => acc + r.simulations.length, 0),

    // actions
    addRoom,
    selectRoom: setActiveRoomId,
    selectWall: setSelectedWallId,
    setSelectedPaint,
    applyColor,
    selectSimulation,
    removeSimulation,
    retryAnalysis,
    clearRoom,
  };
}

// Helper to convert base64 to File
function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}