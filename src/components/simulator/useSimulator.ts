import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { toast } from "sonner";
import { Paint } from "@/data/defaultColors";
import { supabase } from "@/integrations/supabase/client";
import { Room, DetectedWall, WallSimulation, SimulatorSessionData } from "./types";
import { useStore } from "@/contexts/StoreContext";
import { deleteSimulatorSession, getLastSessionId, getSimulatorSession, listSimulatorSessions, saveSimulatorSession, setLastSessionId } from "@/lib/simulator-db";
import { preprocessImageFile } from "@/lib/image-preprocess";

// --- Helper Functions ---
const genId = () => Math.random().toString(36).substring(2, 10);
const AUTOSAVE_DELAY = 2500;
const nowIso = () => new Date().toISOString();

// --- State, Actions, and Reducer ---
interface SimulatorState {
  session: SimulatorSessionData | null;
  loadingSession: boolean;
  rooms: Room[];
  activeRoomId: string | null;
  selectedWallId: string | null;
  selectedPaint: Paint | null;
  isPainting: boolean;
  hasUnsavedChanges: boolean;
}

type Action =
  | { type: 'SET_STATE'; payload: Partial<SimulatorState> }
  | { type: 'START_LOADING_SESSION' }
  | { type: 'LOAD_SESSION'; payload: SimulatorSessionData }
  | { type: 'CREATE_SESSION'; payload: SimulatorSessionData }
  | { type: 'DELETE_SESSION' }
  | { type: 'SET_SESSION_NAME'; payload: string }
  | { type: 'ADD_ROOM_START'; payload: Room }
  | { type: 'ADD_ROOM_SUCCESS'; payload: { roomId: string; walls: DetectedWall[] } }
  | { type: 'ADD_ROOM_FAILURE'; payload: { roomId: string } }
  | { type: 'SET_ACTIVE_ROOM'; payload: string | null }
  | { type: 'SET_SELECTED_WALL'; payload: string | null }
  | { type: 'SET_SELECTED_PAINT'; payload: Paint | null }
  | { type: 'APPLY_COLOR_START' }
  | { type: 'APPLY_COLOR_SUCCESS'; payload: { roomId: string; simulation: WallSimulation } }
  | { type: 'APPLY_COLOR_FAILURE' }
  | { type: 'SELECT_SIMULATION'; payload: { roomId: string; simId: string | null } }
  | { type: 'REMOVE_SIMULATION'; payload: { roomId: string; simId: string } }
  | { type: 'CLEAR_ROOM'; payload: string }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean };


const initialState: SimulatorState = {
  session: null,
  loadingSession: true,
  rooms: [],
  activeRoomId: null,
  selectedWallId: null,
  selectedPaint: null,
  isPainting: false,
  hasUnsavedChanges: false,
};

function simulatorReducer(state: SimulatorState, action: Action): SimulatorState {
  switch (action.type) {
    case 'SET_STATE': return { ...state, ...action.payload };
    case 'START_LOADING_SESSION': return { ...state, loadingSession: true };
    case 'LOAD_SESSION': {
      const s = action.payload;
      const rooms = (s.rooms || []).map(r => ({...r, isAnalyzing: false, isPainting: false}));
      return { ...initialState, session: s, rooms, activeRoomId: s.activeRoomId, selectedWallId: s.selectedWallId, loadingSession: false };
    }
    case 'CREATE_SESSION': return { ...initialState, session: action.payload, loadingSession: false };
    case 'DELETE_SESSION': return { ...initialState, loadingSession: false };
    case 'SET_SESSION_NAME': return { ...state, session: state.session ? { ...state.session, name: action.payload } : null, hasUnsavedChanges: true };
    case 'ADD_ROOM_START': return { ...state, rooms: [...state.rooms, action.payload], activeRoomId: action.payload.id, selectedWallId: null, hasUnsavedChanges: true };
    case 'ADD_ROOM_SUCCESS': return { ...state, rooms: state.rooms.map(r => r.id === action.payload.roomId ? { ...r, walls: action.payload.walls, isAnalyzing: false, isAnalyzed: true } : r), selectedWallId: action.payload.walls[0]?.id ?? null, hasUnsavedChanges: true };
    case 'ADD_ROOM_FAILURE': return { ...state, rooms: state.rooms.map(r => r.id === action.payload.roomId ? { ...r, isAnalyzing: false } : r) };
    case 'SET_ACTIVE_ROOM': return { ...state, activeRoomId: action.payload };
    case 'SET_SELECTED_WALL': return { ...state, selectedWallId: action.payload };
    case 'SET_SELECTED_PAINT': return { ...state, selectedPaint: action.payload };
    case 'APPLY_COLOR_START': return { ...state, isPainting: true };
    case 'APPLY_COLOR_SUCCESS': {
        const { roomId, simulation } = action.payload;
        return { ...state, isPainting: false, hasUnsavedChanges: true, rooms: state.rooms.map(r => r.id === roomId ? { ...r, imageUrl: simulation.imageUrl, simulations: [...r.simulations, simulation], activeSimulationId: simulation.id } : r )};
    }
    case 'APPLY_COLOR_FAILURE': return { ...state, isPainting: false };
    case 'SELECT_SIMULATION': {
        const { roomId, simId } = action.payload;
        return { ...state, hasUnsavedChanges: true, rooms: state.rooms.map(r => {
            if (r.id !== roomId) return r;
            const sim = simId ? r.simulations.find(s => s.id === simId) : null;
            return { ...r, activeSimulationId: simId, imageUrl: sim ? sim.imageUrl : r.originalImageUrl };
        })};
    }
    case 'REMOVE_SIMULATION': {
        const { roomId, simId } = action.payload;
        return { ...state, hasUnsavedChanges: true, rooms: state.rooms.map(r => {
            if (r.id !== roomId) return r;
            const nextSims = r.simulations.filter(s => s.id !== simId);
            if (r.activeSimulationId !== simId) return { ...r, simulations: nextSims };
            const nextActive = nextSims[nextSims.length - 1];
            return { ...r, simulations: nextSims, activeSimulationId: nextActive?.id ?? null, imageUrl: nextActive?.imageUrl ?? r.originalImageUrl };
        })};
    }
    case 'CLEAR_ROOM': {
        const remaining = state.rooms.filter(r => r.id !== action.payload);
        return { ...state, rooms: remaining, activeRoomId: state.activeRoomId === action.payload ? remaining[0]?.id ?? null : state.activeRoomId, hasUnsavedChanges: true };
    }
    case 'SET_UNSAVED_CHANGES': return { ...state, hasUnsavedChanges: action.payload };
    default: return state;
  }
}

// --- The Hook ---
export function useSimulator() {
  const { company, refreshData } = useStore();
  const [state, dispatch] = useReducer(simulatorReducer, initialState);
  const { session, loadingSession, rooms, activeRoomId, selectedWallId, selectedPaint, isPainting, hasUnsavedChanges } = state;
  const activeRoom = useMemo(() => rooms.find((r) => r.id === activeRoomId) || null, [rooms, activeRoomId]);
  const autosaveTimer = useRef<number | null>(null);

  const persist = useCallback(async (isAutosave = false) => {
    if (!session) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    const payload: SimulatorSessionData = { ...session, updatedAt: nowIso(), rooms, activeRoomId, selectedWallId };
    const result = await saveSimulatorSession({ id: payload.id, name: payload.name, createdAt: payload.createdAt, updatedAt: payload.updatedAt, data: payload });
    
    if (result) {
      dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
      if (!isAutosave) toast.success("Projeto salvo!", { description: session.name });
    }
  }, [session, rooms, activeRoomId, selectedWallId]);

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
    const id = genId();
    const createdAt = nowIso();
    const s: SimulatorSessionData = { id, name: (name || "Projeto sem nome").trim(), createdAt, updatedAt: createdAt, rooms: [], activeRoomId: null, selectedWallId: null };
    await saveSimulatorSession({ id: s.id, name: s.name, createdAt: s.createdAt, updatedAt: s.updatedAt, data: s });
    await setLastSessionId(s.id);
    dispatch({ type: 'CREATE_SESSION', payload: s });
    toast.success("Novo projeto criado");
    return s;
  }, []);

  const loadSession = useCallback(async (id: string) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    dispatch({ type: 'START_LOADING_SESSION' });
    const record = await getSimulatorSession(id);
    if (!record?.data) {
        toast.error("Não foi possível carregar o projeto.");
        await deleteSimulatorSession(id);
        dispatch({ type: 'DELETE_SESSION' });
        return;
    };
    const normalized = normalizeLoadedSession(record.data as SimulatorSessionData);
    dispatch({ type: 'LOAD_SESSION', payload: normalized });
    await setLastSessionId(normalized.id);
    toast.success("Projeto carregado", { description: normalized.name });
  }, []);

  const deleteSession = useCallback(async (id: string) => {
      await deleteSimulatorSession(id);
      if (session?.id === id) dispatch({ type: 'DELETE_SESSION' });
      toast.success("Projeto excluído");
    }, [session?.id]);

  const listSessions = useCallback(async () => await listSimulatorSessions(), []);
  
  const ensureSession = useCallback(async () => session || createNewSession(), [session, createNewSession]);

  useEffect(() => {
    let mounted = true;
    (async () => {
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

  const addRoom = useCallback(async (file: File, cropCoordinates?: { x: number; y: number; width: number; height: number }) => {
    if ((company?.aiCredits ?? 0) <= 0) return toast.error("Créditos de IA insuficientes");
    await ensureSession();
    
    const id = genId();
    const tempUrl = URL.createObjectURL(file);
    const newRoom: Room = { id, name: `Ambiente ${rooms.length + 1}`, imageUrl: tempUrl, originalImageUrl: tempUrl, walls: [], isAnalyzing: true, isAnalyzed: false, simulations: [], activeSimulationId: null, cropCoordinates };
    
    dispatch({ type: 'ADD_ROOM_START', payload: newRoom });

    let imageBase64: string;
    try {
      imageBase64 = await preprocessImageFile(file);
    } finally {
      URL.revokeObjectURL(tempUrl);
    }
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-room", { body: { imageBase64 } });
      if (error || data?.error) throw error || new Error(data.error);
      
      await refreshData();
      const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any, i: number) => ({ id: w.id || `s${i}`, label: w.label_pt || w.label, englishLabel: w.label_en || "Wall", description: w.description || "" }));
      dispatch({ type: 'ADD_ROOM_SUCCESS', payload: { roomId: id, walls: detectedWalls } });
    } catch (err: any) {
      dispatch({ type: 'ADD_ROOM_FAILURE', payload: { roomId: id } });
      toast.error("Erro na análise", { description: err.data?.error || err.message });
    }
  }, [company, ensureSession, rooms.length, refreshData]);

  const applyColor = useCallback(async () => {
    if (!activeRoom || !selectedWallId || !selectedPaint) return toast.error("Selecione uma parede e uma cor");
    if ((company?.aiCredits ?? 0) <= 0) return toast.error("Créditos de IA insuficientes");
    const wall = activeRoom.walls.find((w) => w.id === selectedWallId);
    if (!wall) return toast.error("Parede não encontrada");

    dispatch({ type: 'APPLY_COLOR_START' });
    try {
      const { data, error } = await supabase.functions.invoke("paint-wall", { body: { imageBase64: activeRoom.imageUrl, paintColor: selectedPaint.hex, paintName: selectedPaint.name, wallLabel: wall.label, wallLabelEn: wall.englishLabel, cropCoordinates: activeRoom.cropCoordinates } });
      if (error || data?.error) throw error || new Error(data.error);
      if (!data?.imageUrl) throw new Error("Image URL not returned");

      await refreshData();
      const simId = genId();
      const simulation: WallSimulation = { id: simId, wallId: selectedWallId, wallLabel: wall.label, paint: selectedPaint, imageUrl: data.imageUrl, createdAt: nowIso(), isPainting: false };
      dispatch({ type: 'APPLY_COLOR_SUCCESS', payload: { roomId: activeRoom.id, simulation }});
      toast.success("Cor aplicada com sucesso!");
    } catch (err: any) {
      const errorMessage = (err as any)?.data?.error || (err as any)?.message || "Tente novamente";
      toast.error("Erro ao aplicar cor", { description: errorMessage });
      dispatch({ type: 'APPLY_COLOR_FAILURE' });
    }
  }, [activeRoom, selectedWallId, selectedPaint, company, refreshData]);

  // --- Wrapper functions that dispatch actions ---
  const selectRoom = useCallback((id: string | null) => dispatch({ type: 'SET_ACTIVE_ROOM', payload: id }), []);
  const selectWall = useCallback((id: string | null) => dispatch({ type: 'SET_SELECTED_WALL', payload: id }), []);
  const setSelectedPaint = useCallback((paint: Paint | null) => dispatch({ type: 'SET_SELECTED_PAINT', payload: paint }), []);
  const selectSimulation = useCallback((roomId: string, simId: string | null) => dispatch({ type: 'SELECT_SIMULATION', payload: { roomId, simId } }), []);
  const removeSimulation = useCallback((simId: string) => { if(activeRoom) dispatch({ type: 'REMOVE_SIMULATION', payload: { roomId: activeRoom.id, simId } }) }, [activeRoom]);
  const clearRoom = useCallback((roomId: string) => dispatch({ type: 'CLEAR_ROOM', payload: roomId }), []);
  const retryAnalysis = useCallback(() => {
      if (!activeRoom) return;
      const file = dataURLtoFile(activeRoom.originalImageUrl, `ambiente_${Date.now()}.jpg`);
      dispatch({ type: 'CLEAR_ROOM', payload: activeRoom.id });
      addRoom(file, activeRoom.cropCoordinates);
  }, [activeRoom, addRoom]);

  return {
    session, loadingSession, rooms, activeRoom, activeRoomId, selectedWallId, selectedPaint, isPainting, hasUnsavedChanges,
    totalSimulations: rooms.reduce((acc, r) => acc + r.simulations.length, 0),
    createNewSession, loadSession, deleteSession, listSessions, manualSave, setSessionName, addRoom, selectRoom, 
    selectWall, setSelectedPaint, applyColor, selectSimulation, removeSimulation, retryAnalysis, clearRoom,
  };
}

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Invalid data URL");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
