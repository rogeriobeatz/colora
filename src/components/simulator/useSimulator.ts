import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { toast } from "sonner";
import { Paint } from "@/data/defaultColors";
import { supabase } from "@/integrations/supabase/client";
import { Room, DetectedWall, WallSimulation, SimulatorSessionData } from "./types";
import { useStore } from "@/contexts/StoreContext";
import { deleteSimulatorSession, getLastSessionId, getSimulatorSession, listSimulatorSessions, saveSimulatorSession, setLastSessionId, generateUUID } from "@/lib/simulator-db";
import { preprocessImageFile } from "@/lib/image-preprocess";

// --- Helper Functions ---
const genId = () => Math.random().toString(36).substring(2, 10);
const AUTOSAVE_DELAY = 0; // 🔴 DESATIVADO - Auto-save causa sobrecarga massiva
const nowIso = () => new Date().toISOString();

const normalizeLoadedSession = (data: any): SimulatorSessionData => {
  console.log("[Simulator] Dados brutos carregados:", data); // Debug
  const normalized = {
    id: data.id || generateUUID(), // Usar generateUUID em vez de genId
    name: data.name || "", // Sem fallback genérico
    createdAt: data.createdAt || nowIso(),
    updatedAt: data.updatedAt || nowIso(),
    rooms: Array.isArray(data.rooms) ? data.rooms : [],
    activeRoomId: data.activeRoomId || null,
    selectedWallId: data.selectedWallId || null,
  };
  console.log("[Simulator] Dados normalizados:", normalized); // Debug
  return normalized;
};

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
  | { type: 'UPDATE_ROOM_NAME'; payload: { roomId: string; name: string } }
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
    case 'UPDATE_ROOM_NAME': return { ...state, rooms: state.rooms.map(r => r.id === action.payload.roomId ? { ...r, name: action.payload.name } : r), hasUnsavedChanges: true };
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
export function useSimulator({ companySlug }: { companySlug?: string } = {}) {
  const { company, refreshData } = useStore();
  const [state, dispatch] = useReducer(simulatorReducer, initialState);
  const { session, loadingSession, rooms, activeRoomId, selectedWallId, selectedPaint, isPainting, hasUnsavedChanges } = state;
  const activeRoom = useMemo(() => rooms.find((r) => r.id === activeRoomId) || null, [rooms, activeRoomId]);
  const autosaveTimer = useRef<number | null>(null);

  const persist = useCallback(async (isAutosave = false) => {
    if (!session) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    const updated = { 
      ...session, 
      updatedAt: nowIso(),
      rooms, // Incluir os rooms atualizados
      activeRoomId, // Incluir o room ativo
      selectedWallId // Incluir a parede selecionada
    };
    await saveSimulatorSession({ id: updated.id, name: updated.name, createdAt: updated.createdAt, updatedAt: updated.updatedAt, data: updated });
    dispatch({ type: 'SET_STATE', payload: { session: updated, hasUnsavedChanges: false } });
    if (!isAutosave) toast.success("Projeto salvo", { description: session.name });
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
    const id = generateUUID();
    const createdAt = nowIso();
    const s: SimulatorSessionData = { id, name: (name || "").trim(), createdAt, updatedAt: createdAt, rooms: [], activeRoomId: null, selectedWallId: null };
    await saveSimulatorSession({ id: s.id, name: s.name, createdAt: s.createdAt, updatedAt: s.updatedAt, data: s });
    dispatch({ type: 'CREATE_SESSION', payload: s });
    await setLastSessionId(s.id);
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
    await setLastSessionId(normalized.id); // Salvar como último projeto carregado
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
      // Verificar se há um projeto pendente da dashboard
      const pendingSessionId = localStorage.getItem("colora_pending_session");
      if (pendingSessionId) {
        localStorage.removeItem("colora_pending_session"); // Limpar após usar
        if (mounted) {
          await loadSession(pendingSessionId);
          return;
        }
      }
      
      // Verificar se deve criar um novo projeto
      const shouldCreateNew = localStorage.getItem("colora_new_project");
      if (shouldCreateNew) {
        localStorage.removeItem("colora_new_project"); // Limpar após usar
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

  const addRoom = useCallback(async (file: File, cropCoordinates?: { x: number; y: number; width: number; height: number }) => {
    if ((company?.tokens ?? 0) <= 0) return toast.error("Créditos de IA insuficientes");
    await ensureSession();
    
    const id = genId();
    const tempUrl = URL.createObjectURL(file);
    
    // Converter imagem para base64 para salvamento permanente
    const imageBase64 = await preprocessImageFile(file);
    // Remove o prefixo "data:image/jpeg;base64," para enviar para a API
    const base64Only = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const newRoom: Room = { 
      id, 
      name: "", // Nome vazio inicial, será atualizado pela IA
      imageUrl: imageBase64, // Salvar como data URL permanente
      originalImageUrl: imageBase64, 
      walls: [], 
      isAnalyzing: true, 
      isAnalyzed: false, 
      simulations: [], 
      activeSimulationId: null, 
      cropCoordinates 
    };
    
    dispatch({ type: 'ADD_ROOM_START', payload: newRoom });

    try {
      console.log(`[useSimulator] Enviando imagem para analyze-room...`);
      const { data, error } = await supabase.functions.invoke("analyze-room", { body: { imageBase64: base64Only } });
      if (error || data?.error) throw error || new Error(data.error);
      
      console.log(`[useSimulator] Resposta recebida:`, data);
      await refreshData();
      const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any, i: number) => ({ id: w.id || `s${i}`, label: w.label_pt || w.label, englishLabel: w.label_en || "Wall", description: w.description || "" }));
      
      // Atualiza o nome do room com o nome sugerido pela IA
      const aiRoomName = data.roomName || data.room_name || "";
      if (aiRoomName) {
        console.log(`[useSimulator] Atualizando nome do room para: "${aiRoomName}"`);
        dispatch({ type: 'UPDATE_ROOM_NAME', payload: { roomId: id, name: aiRoomName } });
      } else {
        // Fallback: usar tipo do cômodo ou nome genérico
        const fallbackName = data.roomType || data.room_type || `Ambiente ${rooms.length + 1}`;
        console.log(`[useSimulator] IA não retornou roomName, usando fallback: "${fallbackName}"`);
        dispatch({ type: 'UPDATE_ROOM_NAME', payload: { roomId: id, name: fallbackName } });
      }
      
      dispatch({ type: 'ADD_ROOM_SUCCESS', payload: { roomId: id, walls: detectedWalls } });
    } catch (err: any) {
      dispatch({ type: 'ADD_ROOM_FAILURE', payload: { roomId: id } });
      toast.error("Erro na análise", { description: err.data?.error || err.message });
    } finally {
      URL.revokeObjectURL(tempUrl);
    }
  }, [company, ensureSession, rooms.length, refreshData]);

  const applyColor = useCallback(async () => {
    if (!activeRoom || !selectedWallId || !selectedPaint) return toast.error("Selecione uma parede e uma cor");
    if ((company?.tokens ?? 0) <= 0) return toast.error("Créditos de IA insuficientes");
    const wall = activeRoom.walls.find((w) => w.id === selectedWallId);
    if (!wall) return toast.error("Parede não encontrada");

    dispatch({ type: 'APPLY_COLOR_START' });
    try {
      // Extrair base64 da data URL do ambiente
      const base64Only = activeRoom.imageUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const { data, error } = await supabase.functions.invoke("paint-wall", { 
        body: { 
          imageBase64: base64Only, 
          paintColor: selectedPaint.hex, 
          paintName: selectedPaint.name, 
          wallLabel: wall.label, 
          wallLabelEn: wall.englishLabel, 
          cropCoordinates: activeRoom.cropCoordinates 
        } 
      });
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
  const clearRoom = useCallback(async (roomId: string) => { 
  dispatch({ type: 'CLEAR_ROOM', payload: roomId });
  // Persistir a exclusão no banco
  await persist();
}, [dispatch, persist]);
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
