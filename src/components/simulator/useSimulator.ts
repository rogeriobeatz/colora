import { useCallback, useEffect, useRef, useState, useReducer, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { 
  Room, 
  DetectedWall, 
  SimulatorSessionData, 
  AspectMode 
} from "./types";
import { Paint } from "@/data/defaultColors";
import { 
  saveSimulatorSession, 
  getSimulatorSession, 
  listSimulatorSessions, 
  deleteSimulatorSession,
  generateUUID,
  setLastSessionId,
  getLastSessionId
} from "@/lib/simulator-db";
import { preprocessImageFile } from "@/lib/image-preprocess";

const AUTOSAVE_DELAY = 2000;

const nowIso = () => new Date().toISOString();

type State = {
  session: SimulatorSessionData | null;
  loadingSession: boolean;
  isPainting: boolean;
  hasUnsavedChanges: boolean;
};

type Action = 
  | { type: 'SET_STATE'; payload: Partial<State> }
  | { type: 'CREATE_SESSION'; payload: SimulatorSessionData }
  | { type: 'LOAD_SESSION'; payload: SimulatorSessionData }
  | { type: 'DELETE_SESSION' }
  | { type: 'START_LOADING_SESSION' }
  | { type: 'SET_SESSION_NAME'; payload: string }
  | { type: 'ADD_ROOM_START'; payload: Room }
  | { type: 'ADD_ROOM_SUCCESS'; payload: { roomId: string; walls: DetectedWall[] } }
  | { type: 'ADD_ROOM_FAILURE'; payload: { roomId: string } }
  | { type: 'UPDATE_ROOM_NAME'; payload: { roomId: string; name: string } }
  | { type: 'SELECT_ROOM'; payload: string }
  | { type: 'SELECT_WALL'; payload: string | null }
  | { type: 'SET_PAINTING'; payload: boolean }
  | { type: 'ADD_SIMULATION'; payload: { roomId: string; simulation: any } }
  | { type: 'SELECT_SIMULATION'; payload: { roomId: string; simulationId: string | null } }
  | { type: 'REMOVE_SIMULATION'; payload: { roomId: string; simulationId: string } }
  | { type: 'CLEAR_ROOM'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'START_LOADING_SESSION':
      return { ...state, loadingSession: true };
    case 'CREATE_SESSION':
    case 'LOAD_SESSION':
      return { ...state, session: action.payload, loadingSession: false, hasUnsavedChanges: false };
    case 'DELETE_SESSION':
      return { ...state, session: null, hasUnsavedChanges: false };
    case 'SET_SESSION_NAME':
      if (!state.session) return state;
      return { 
        ...state, 
        session: { ...state.session, name: action.payload, updatedAt: nowIso() }, 
        hasUnsavedChanges: true 
      };
    case 'ADD_ROOM_START':
      if (!state.session) return state;
      return {
        ...state,
        session: { ...state.session, rooms: [...state.session.rooms, action.payload], updatedAt: nowIso() },
        hasUnsavedChanges: true
      };
    case 'ADD_ROOM_SUCCESS':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          activeRoomId: action.payload.roomId,
          rooms: state.session.rooms.map(r => 
            r.id === action.payload.roomId 
              ? { ...r, walls: action.payload.walls, isAnalyzing: false, isAnalyzed: true } 
              : r
          ),
          updatedAt: nowIso()
        },
        hasUnsavedChanges: true
      };
    case 'ADD_ROOM_FAILURE':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          rooms: state.session.rooms.filter(r => r.id !== action.payload.roomId),
          updatedAt: nowIso()
        },
        hasUnsavedChanges: true
      };
    case 'UPDATE_ROOM_NAME':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          rooms: state.session.rooms.map(r => r.id === action.payload.roomId ? { ...r, name: action.payload.name } : r),
          updatedAt: nowIso()
        },
        hasUnsavedChanges: true
      };
    case 'SELECT_ROOM':
      if (!state.session) return state;
      return {
        ...state,
        session: { ...state.session, activeRoomId: action.payload, selectedWallId: null, updatedAt: nowIso() },
        hasUnsavedChanges: true
      };
    case 'SELECT_WALL':
      if (!state.session) return state;
      return {
        ...state,
        session: { ...state.session, selectedWallId: action.payload, updatedAt: nowIso() },
        hasUnsavedChanges: true
      };
    case 'SET_PAINTING':
      return { ...state, isPainting: action.payload };
    case 'ADD_SIMULATION':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          rooms: state.session.rooms.map(r => 
            r.id === action.payload.roomId 
              ? { ...r, simulations: [action.payload.simulation, ...r.simulations], activeSimulationId: action.payload.simulation.id } 
              : r
          ),
          updatedAt: nowIso()
        },
        hasUnsavedChanges: true
      };
    case 'SELECT_SIMULATION':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          rooms: state.session.rooms.map(r => 
            r.id === action.payload.roomId ? { ...r, activeSimulationId: action.payload.simulationId } : r
          ),
          updatedAt: nowIso()
        },
        hasUnsavedChanges: true
      };
    case 'REMOVE_SIMULATION':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          rooms: state.session.rooms.map(r => {
            if (r.id !== action.payload.roomId) return r;
            const simulations = r.simulations.filter(s => s.id !== action.payload.simulationId);
            return {
              ...r,
              simulations,
              activeSimulationId: r.activeSimulationId === action.payload.simulationId ? (simulations[0]?.id || null) : r.activeSimulationId
            };
          }),
          updatedAt: nowIso()
        },
        hasUnsavedChanges: true
      };
    case 'CLEAR_ROOM':
      if (!state.session) return state;
      const filteredRooms = state.session.rooms.filter(r => r.id !== action.payload);
      return {
        ...state,
        session: {
          ...state.session,
          rooms: filteredRooms,
          activeRoomId: state.session.activeRoomId === action.payload ? (filteredRooms[0]?.id || null) : state.session.activeRoomId,
          updatedAt: nowIso()
        },
        hasUnsavedChanges: true
      };
    default:
      return state;
  }
}

const initialState: State = {
  session: null,
  loadingSession: true,
  isPainting: false,
  hasUnsavedChanges: false,
};

function normalizeLoadedSession(data: any): SimulatorSessionData {
  return {
    id: data.id || generateUUID(),
    name: data.name || "Novo Projeto",
    createdAt: data.createdAt || data.created_at || nowIso(),
    updatedAt: data.updatedAt || data.updated_at || nowIso(),
    rooms: data.rooms || [],
    activeRoomId: data.activeRoomId || (data.rooms?.[0]?.id || null),
    selectedWallId: data.selectedWallId || null,
  };
}

export const useSimulator = () => {
  const { company, refreshData } = useStore();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [selectedPaint, setSelectedPaint] = useState<Paint | null>(null);
  const autosaveTimer = useRef<number | null>(null);

  const { session, loadingSession, isPainting, hasUnsavedChanges } = state;
  const rooms = session?.rooms || [];
  const activeRoom = useMemo(() => rooms.find((r) => r.id === session?.activeRoomId) || null, [rooms, session?.activeRoomId]);
  const activeRoomId = session?.activeRoomId || null;
  const selectedWallId = session?.selectedWallId || null;
  const totalSimulations = useMemo(() => rooms.reduce((acc, r) => acc + r.simulations.length, 0), [rooms]);

  const persist = useCallback(async (isAutosave = false) => {
    if (!session) return;
    try {
      await saveSimulatorSession({
        id: session.id,
        name: session.name,
        createdAt: session.createdAt,
        updatedAt: nowIso(),
        data: { ...session, updatedAt: nowIso() }
      });
      dispatch({ type: 'SET_STATE', payload: { hasUnsavedChanges: false } });
      if (!isAutosave) toast.success("Projeto salvo");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      if (!isAutosave) toast.error("Erro ao salvar");
    }
  }, [session]);

  const manualSave = useCallback(() => persist(false), [persist]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => persist(true), AUTOSAVE_DELAY);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [hasUnsavedChanges, persist]);

  const setSessionName = useCallback((name: string) => dispatch({ type: 'SET_SESSION_NAME', payload: name }), []);
  
  const createNewSession = useCallback(async (name?: string) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const id = generateUUID();
    const createdAt = nowIso();
    const s: SimulatorSessionData = { 
      id, 
      name: (name || "").trim() || "Novo Projeto", 
      createdAt, 
      updatedAt: createdAt, 
      rooms: [], 
      activeRoomId: null, 
      selectedWallId: null 
    };
    await saveSimulatorSession({ id: s.id, name: s.name, createdAt: s.createdAt, updatedAt: s.updatedAt, data: s });
    dispatch({ type: 'CREATE_SESSION', payload: s });
    await setLastSessionId(s.id);
    return s;
  }, []);

  const loadSession = useCallback(async (id: string) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    dispatch({ type: 'START_LOADING_SESSION' });
    const record = await getSimulatorSession(id);
    if (!record?.data) {
        dispatch({ type: 'SET_STATE', payload: { loadingSession: false } });
        return;
    };
    const normalized = normalizeLoadedSession(record.data as SimulatorSessionData);
    dispatch({ type: 'LOAD_SESSION', payload: normalized });
    await setLastSessionId(normalized.id);
  }, []);

  const deleteSession = useCallback(async (id: string) => {
      await deleteSimulatorSession(id);
      if (session?.id === id) dispatch({ type: 'DELETE_SESSION' });
      toast.success("Projeto excluído");
  }, [session?.id]);

  const listSessions = useCallback(async () => await listSimulatorSessions(), []);
  
  const ensureSession = useCallback(async () => {
    if (session) return session;
    return await createNewSession();
  }, [session, createNewSession]);

  const addRoom = useCallback(async (file: File, cropCoordinates?: { x: number; y: number; width: number; height: number }, aspectMode?: AspectMode) => {
    if ((company?.tokens ?? 0) <= 0) return toast.error("Créditos de IA insuficientes");
    
    // Get latest session or create one
    const currentSession = await ensureSession();
    
    const id = generateUUID();
    const imageBase64 = await preprocessImageFile(file);
    const base64Only = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const newRoom: Room = { 
      id, 
      name: "", 
      imageUrl: imageBase64, 
      originalImageUrl: imageBase64, 
      thumbnailUrl: imageBase64, // Salvar miniatura também
      walls: [], 
      isAnalyzing: true, 
      isAnalyzed: false, 
      simulations: [], 
      activeSimulationId: null, 
      cropCoordinates,
      aspectMode
    };
    
    dispatch({ type: 'ADD_ROOM_START', payload: newRoom });

    try {
      const { data, error } = await supabase.functions.invoke("analyze-room", { 
        body: { 
          imageBase64: base64Only,
          cropCoordinates: cropCoordinates || null,
          aspectMode: aspectMode || null 
        } 
      });
      if (error || data?.error) throw error || new Error(data.error);
      
      await refreshData();
      const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any, i: number) => ({ 
        id: w.id || `s${i}`, 
        label: w.label_pt || w.label, 
        englishLabel: w.label_en || "Wall", 
        description: w.description || "" 
      }));
      
      const aiRoomName = data.roomName || data.room_name || data.roomType || data.room_type || "Ambiente";
      dispatch({ type: 'UPDATE_ROOM_NAME', payload: { roomId: id, name: aiRoomName } });
      
      // Auto-set session name if it's default
      if (!currentSession.name || currentSession.name === "Novo Projeto") {
        const autoName = `Projeto ${aiRoomName}`;
        dispatch({ type: 'SET_SESSION_NAME', payload: autoName });
        // Save immediately with new name
        await saveSimulatorSession({
          id: currentSession.id,
          name: autoName,
          createdAt: currentSession.createdAt,
          updatedAt: nowIso(),
          data: { ...currentSession, name: autoName, updatedAt: nowIso() }
        });
      }
      
      dispatch({ type: 'ADD_ROOM_SUCCESS', payload: { roomId: id, walls: detectedWalls } });
    } catch (err: any) {
      dispatch({ type: 'ADD_ROOM_FAILURE', payload: { roomId: id } });
      toast.error("Erro na análise", { description: err.message });
    }
  }, [company, ensureSession, refreshData]);

  const selectRoom = useCallback((id: string) => dispatch({ type: 'SELECT_ROOM', payload: id }), []);
  const selectWall = useCallback((id: string | null) => dispatch({ type: 'SELECT_WALL', payload: id }), []);

  const applyColor = useCallback(async () => {
    if (!activeRoom || !selectedWallId || !selectedPaint) return;
    
    dispatch({ type: 'SET_PAINTING', payload: true });
    console.log("[useSimulator] Iniciando applyColor...");
    
    const wall = activeRoom.walls.find(w => w.id === selectedWallId);
    
    // Check if there's an active simulation to use as base for stacking colors
    const activeSim = activeRoom.simulations.find(s => s.id === activeRoom.activeSimulationId);
    const baseImage = activeSim?.imageUrl || activeRoom.imageUrl;
    
    console.log("[useSimulator] Imagem base:", baseImage.startsWith('http') ? "URL externa" : "Base64 local");
    
    try {
      const { data, error } = await supabase.functions.invoke("paint-wall", {
        body: {
          imageBase64: baseImage, // Enviamos a URL ou Base64, a Edge Function vai tratar
          paintColor: selectedPaint.hex,
          wallLabel: wall?.label || "Parede",
          wallLabelEn: wall?.englishLabel || "Wall",
          cropCoordinates: activeRoom.cropCoordinates || null,
          aspectMode: activeRoom.aspectMode || null
        }
      });

      if (error) {
        console.error("[useSimulator] Erro na invocação:", error);
        throw error;
      }
      
      if (data?.error) {
        console.error("[useSimulator] Erro retornado pela função:", data.error);
        throw new Error(data.error);
      }

      console.log("[useSimulator] Sucesso! Nova imagem:", data.imageUrl);

      const newSimulation = {
        id: generateUUID(),
        paint: selectedPaint,
        imageUrl: data.imageUrl,
        wallId: selectedWallId,
        wallLabel: wall?.label || "Parede"
      };

      dispatch({ type: 'ADD_SIMULATION', payload: { roomId: activeRoom.id, simulation: newSimulation } });
      toast.success("Cor aplicada com sucesso!");
    } catch (err: any) {
      console.error("[useSimulator] Falha fatal no applyColor:", err);
      toast.error("Erro ao aplicar cor", { description: err.message || "Verifique sua conexão e tente novamente." });
    } finally {
      dispatch({ type: 'SET_PAINTING', payload: false });
    }
  }, [activeRoom, selectedWallId, selectedPaint]);

  const selectSimulation = useCallback((roomId: string, simId: string | null) => {
    dispatch({ type: 'SELECT_SIMULATION', payload: { roomId, simulationId: simId } });
  }, []);

  const removeSimulation = useCallback((simId: string) => {
    if (!activeRoom) return;
    dispatch({ type: 'REMOVE_SIMULATION', payload: { roomId: activeRoom.id, simulationId: simId } });
  }, [activeRoom]);

  const retryAnalysis = useCallback(() => {
    // Implement retry logic if needed
  }, []);

  const clearRoom = useCallback((id: string) => {
    dispatch({ type: 'CLEAR_ROOM', payload: id });
  }, []);

  // Guard against closing tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        persist(true); // Attempt a last-second save
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, persist]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const pendingSessionId = localStorage.getItem("colora_pending_session");
      if (pendingSessionId) {
        localStorage.removeItem("colora_pending_session");
        if (mounted) {
          await loadSession(pendingSessionId);
          return;
        }
      }
      
      const shouldCreateNew = localStorage.getItem("colora_new_project");
      if (shouldCreateNew) {
        localStorage.removeItem("colora_new_project");
        if (mounted) {
          await createNewSession();
          window.history.replaceState({}, '', '/simulator');
          return;
        }
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('new') === '1') {
        await createNewSession();
        window.history.replaceState({}, '', '/simulator');
      } else {
        const lastId = await getLastSessionId();
        if (mounted && lastId) await loadSession(lastId);
        else dispatch({ type: 'SET_STATE', payload: { loadingSession: false } });
      }
    })();
    return () => { mounted = false; };
  }, [createNewSession, loadSession]);

  return {
    session,
    loadingSession,
    rooms,
    activeRoom,
    activeRoomId,
    selectedWallId,
    selectedPaint,
    isPainting,
    hasUnsavedChanges,
    totalSimulations,
    addRoom,
    selectRoom,
    selectWall,
    setSelectedPaint,
    applyColor,
    selectSimulation,
    removeSimulation,
    retryAnalysis,
    manualSave,
    setSessionName,
    listSessions,
    loadSession,
    deleteSession,
    createNewSession,
    clearRoom,
  };
};

function isLightColor(hex: string): boolean {
  const cleanHex = hex.replace('#', '');
  let r, g, b;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 150;
}
