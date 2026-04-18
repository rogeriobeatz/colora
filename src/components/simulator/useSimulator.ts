import { useCallback, useEffect, useRef, useState, useReducer, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Room, DetectedWall, SimulatorSessionData, AspectMode } from "./types";
import { Paint } from "@/data/defaultColors";
import { saveSimulatorSession, getSimulatorSession, listSimulatorSessions, deleteSimulatorSession, generateUUID, setLastSessionId, getLastSessionId } from "@/lib/simulator-db";
import { preprocessImageFile } from "@/lib/image-preprocess";

const AUTOSAVE_DELAY = 2000;
const nowIso = () => new Date().toISOString();

type State = { session: SimulatorSessionData | null; loadingSession: boolean; isPainting: boolean; hasUnsavedChanges: boolean; };
type Action = 
  | { type: 'SET_STATE'; payload: Partial<State> } 
  | { type: 'CREATE_SESSION'; payload: SimulatorSessionData } 
  | { type: 'LOAD_SESSION'; payload: SimulatorSessionData } 
  | { type: 'DELETE_SESSION' } 
  | { type: 'START_LOADING_SESSION' } 
  | { type: 'SET_SESSION_NAME'; payload: string } 
  | { type: 'ADD_ROOM_START'; payload: Room } 
  | { type: 'ADD_ROOM_SUCCESS'; payload: { roomId: string; walls: DetectedWall[]; lightingContext?: string } } 
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
    case 'SET_STATE': return { ...state, ...action.payload };
    case 'START_LOADING_SESSION': return { ...state, loadingSession: true };
    case 'CREATE_SESSION':
    case 'LOAD_SESSION': return { ...state, session: action.payload, loadingSession: false, hasUnsavedChanges: false };
    case 'DELETE_SESSION': return { ...state, session: null, hasUnsavedChanges: false };
    case 'SET_SESSION_NAME': if (!state.session) return state; return { ...state, session: { ...state.session, name: action.payload, updatedAt: nowIso() }, hasUnsavedChanges: true };
    case 'ADD_ROOM_START': if (!state.session) return state; return { ...state, session: { ...state.session, rooms: [...state.session.rooms, action.payload], updatedAt: nowIso() }, hasUnsavedChanges: true };
    case 'ADD_ROOM_SUCCESS': 
      if (!state.session) return state; 
      return { 
        ...state, 
        session: { 
          ...state.session, 
          activeRoomId: action.payload.roomId, 
          rooms: state.session.rooms.map(r => r.id === action.payload.roomId ? { 
            ...r, 
            walls: action.payload.walls, 
            lightingContext: action.payload.lightingContext, 
            isAnalyzing: false, 
            isAnalyzed: true 
          } : r), 
          updatedAt: nowIso() 
        }, 
        hasUnsavedChanges: true 
      };
    case 'ADD_ROOM_FAILURE': if (!state.session) return state; return { ...state, session: { ...state.session, rooms: state.session.rooms.filter(r => r.id !== action.payload.roomId), updatedAt: nowIso() }, hasUnsavedChanges: true };
    case 'UPDATE_ROOM_NAME': if (!state.session) return state; return { ...state, session: { ...state.session, rooms: state.session.rooms.map(r => r.id === action.payload.roomId ? { ...r, name: action.payload.name } : r), updatedAt: nowIso() }, hasUnsavedChanges: true };
    case 'SELECT_ROOM': if (!state.session) return state; return { ...state, session: { ...state.session, activeRoomId: action.payload, selectedWallId: null, updatedAt: nowIso() }, hasUnsavedChanges: true };
    case 'SELECT_WALL': if (!state.session) return state; return { ...state, session: { ...state.session, selectedWallId: action.payload, updatedAt: nowIso() }, hasUnsavedChanges: true };
    case 'SET_PAINTING': return { ...state, isPainting: action.payload };
    case 'ADD_SIMULATION': if (!state.session) return state; return { ...state, session: { ...state.session, rooms: state.session.rooms.map(r => r.id === action.payload.roomId ? { ...r, simulations: [action.payload.simulation, ...r.simulations], activeSimulationId: action.payload.simulation.id } : r), updatedAt: nowIso() }, hasUnsavedChanges: true };
    case 'SELECT_SIMULATION': if (!state.session) return state; return { ...state, session: { ...state.session, rooms: state.session.rooms.map(r => r.id === action.payload.roomId ? { ...r, activeSimulationId: action.payload.simulationId } : r), updatedAt: nowIso() }, hasUnsavedChanges: true };
    case 'REMOVE_SIMULATION': if (!state.session) return state; return { ...state, session: { ...state.session, rooms: state.session.rooms.map(r => { if (r.id !== action.payload.roomId) return r; const simulations = r.simulations.filter(s => s.id !== action.payload.simulationId); return { ...r, simulations, activeSimulationId: r.activeSimulationId === action.payload.simulationId ? (simulations[0]?.id || null) : r.activeSimulationId }; }), updatedAt: nowIso() }, hasUnsavedChanges: true };
    case 'CLEAR_ROOM': if (!state.session) return state; const filteredRooms = state.session.rooms.filter(r => r.id !== action.payload); return { ...state, session: { ...state.session, rooms: filteredRooms, activeRoomId: state.session.activeRoomId === action.payload ? (filteredRooms[0]?.id || null) : state.session.activeRoomId, updatedAt: nowIso() }, hasUnsavedChanges: true };
    default: return state;
  }
}

const initialState: State = { session: null, loadingSession: true, isPainting: false, hasUnsavedChanges: false };

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
      await saveSimulatorSession({ id: session.id, name: session.name, createdAt: session.createdAt, updatedAt: nowIso(), data: { ...session, updatedAt: nowIso() } });
      dispatch({ type: 'SET_STATE', payload: { hasUnsavedChanges: false } });
      if (!isAutosave) toast.success("Projeto salvo");
    } catch (err) { console.error("Erro ao salvar:", err); }
  }, [session]);

  const ensureSession = useCallback(async () => {
    if (session) return session;
    const id = generateUUID();
    const createdAt = nowIso();
    const s: SimulatorSessionData = { id, name: "Novo Projeto", createdAt, updatedAt: createdAt, rooms: [], activeRoomId: null, selectedWallId: null };
    await saveSimulatorSession({ id: s.id, name: s.name, createdAt: s.createdAt, updatedAt: s.updatedAt, data: s });
    dispatch({ type: 'CREATE_SESSION', payload: s });
    return s;
  }, [session]);

  const addRoom = useCallback(async (file: File, cropCoordinates?: any, aspectMode?: AspectMode) => {
    if ((company?.tokens ?? 0) <= 0) return toast.error("Tokens insuficientes");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Você precisa estar logado para simular.");

    const currentSession = await ensureSession();
    const id = generateUUID();
    const imageBase64 = await preprocessImageFile(file);
    
    let uploadedUrl = "";
    try {
      const fileName = `${user.id}/${id}_original.jpg`;
      const blob = await fetch(imageBase64).then(r => r.blob());
      await supabase.storage.from('images').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
      uploadedUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
    } catch (err) { console.error("Upload error:", err); }
    
    const newRoom: Room = { id, name: "", imageUrl: uploadedUrl || imageBase64, originalImageUrl: uploadedUrl || imageBase64, thumbnailUrl: imageBase64, walls: [], isAnalyzing: true, isAnalyzed: false, simulations: [], activeSimulationId: null, cropCoordinates, aspectMode };
    dispatch({ type: 'ADD_ROOM_START', payload: newRoom });

    try {
      const { data, error } = await supabase.functions.invoke("analyze-room", { 
        body: { imageUrl: uploadedUrl || null, imageBase64: uploadedUrl ? null : imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), cropCoordinates, aspectMode } 
      });
      if (error || data?.error) throw error || new Error(data.error);
      
      await refreshData();
      const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any, i: number) => ({ 
        id: w.id || `s${i}`, 
        label: w.label_pt || w.label, 
        englishLabel: w.label_en || "Wall", 
        description: w.description || "" 
      }));
      dispatch({ type: 'UPDATE_ROOM_NAME', payload: { roomId: id, name: data.roomName || "Ambiente" } });
      dispatch({ type: 'ADD_ROOM_SUCCESS', payload: { roomId: id, walls: detectedWalls, lightingContext: data.lightingContext } });
    } catch (err: any) {
      dispatch({ type: 'ADD_ROOM_FAILURE', payload: { roomId: id } });
      toast.error("Erro na análise", { description: err.message });
    }
  }, [company, ensureSession, refreshData]);

  const applyColor = useCallback(async (provider: 'kie' | 'replicate' = 'kie') => {
    if (!activeRoom || !selectedWallId || !selectedPaint) return;
    dispatch({ type: 'SET_PAINTING', payload: true });
    
    const wall = activeRoom.walls.find(w => w.id === selectedWallId);
    const activeSim = activeRoom.simulations.find(s => s.id === activeRoom.activeSimulationId);
    const baseImage = activeSim?.imageUrl || activeRoom.imageUrl;
    const isUrl = baseImage.startsWith('http');
    
    const functionName = provider === 'replicate' ? 'paint-wall-replicate' : 'paint-wall';
    const providerName = provider === 'replicate' ? 'Replicate' : 'KIE.ai';
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          imageUrl: isUrl ? baseImage : null, 
          imageBase64: isUrl ? null : baseImage.replace(/^data:image\/[a-z]+;base64,/, ''), 
          paintColor: selectedPaint.hex, 
          paintFinish: selectedPaint.finish || 'fosco',
          wallLabel: wall?.label, 
          wallLabelEn: wall?.englishLabel, 
          aspectMode: activeRoom.aspectMode,
          lightingContext: activeRoom.lightingContext
        }
      });

      if (error || data?.error) throw error || new Error(data?.error);

      // Atualiza os dados globais (incluindo saldo de tokens)
      await refreshData();

      const newSimulation = { id: generateUUID(), paint: selectedPaint, imageUrl: data.imageUrl, wallId: selectedWallId, wallLabel: wall?.label || "Parede", provider };
      dispatch({ type: 'ADD_SIMULATION', payload: { roomId: activeRoom.id, simulation: newSimulation } });
      toast.success(`Cor aplicada com ${providerName}!`);
    } catch (err: any) {
      toast.error(`Erro ao aplicar cor com ${providerName}`, { description: err.message });
    } finally {
      dispatch({ type: 'SET_PAINTING', payload: false });
    }
  }, [activeRoom, selectedWallId, selectedPaint]);

  const selectRoom = (id: string) => dispatch({ type: 'SELECT_ROOM', payload: id });
  const selectWall = (id: string | null) => dispatch({ type: 'SELECT_WALL', payload: id });
  const selectSimulation = (roomId: string, simId: string | null) => dispatch({ type: 'SELECT_SIMULATION', payload: { roomId, simulationId: simId } });
  const removeSimulation = (simId: string) => activeRoom && dispatch({ type: 'REMOVE_SIMULATION', payload: { roomId: activeRoom.id, simulationId: simId } });
  const clearRoom = (id: string) => dispatch({ type: 'CLEAR_ROOM', payload: id });
  const setSessionName = (name: string) => dispatch({ type: 'SET_SESSION_NAME', payload: name });

  const retryAnalysis = useCallback(async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    dispatch({ type: 'SET_STATE', payload: { isPainting: true } });
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-room", { 
        body: { 
          imageUrl: room.imageUrl.startsWith('http') ? room.imageUrl : null, 
          imageBase64: room.imageUrl.startsWith('http') ? null : room.imageUrl.replace(/^data:image\/[a-z]+;base64,/, ''), 
          cropCoordinates: room.cropCoordinates, 
          aspectMode: room.aspectMode 
        } 
      });
      if (error || data?.error) throw error || new Error(data.error || "Erro na análise");
      
      const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any, i: number) => ({ 
        id: w.id || `s${i}`, 
        label: w.label_pt || w.label, 
        englishLabel: w.label_en || "Wall", 
        description: w.description || "" 
      }));
      
      dispatch({ type: 'UPDATE_ROOM_NAME', payload: { roomId, name: data.roomName || "Ambiente" } });
      dispatch({ type: 'ADD_ROOM_SUCCESS', payload: { roomId, walls: detectedWalls, lightingContext: data.lightingContext } });
      toast.success("Análise concluída!");
    } catch (err: any) {
      console.error("Erro na re-análise:", err);
      toast.error("Erro na re-análise", { description: err.message });
    } finally {
      dispatch({ type: 'SET_STATE', payload: { isPainting: false } });
    }
  }, [rooms]);

  const listSessions = useCallback(async () => {
    return await listSimulatorSessions();
  }, []);

  const loadSession = useCallback(async (id: string) => {
    dispatch({ type: 'START_LOADING_SESSION' });
    const record = await getSimulatorSession(id);
    if (record?.data) {
      dispatch({ type: 'LOAD_SESSION', payload: record.data as any });
      await setLastSessionId(id);
      return true;
    }
    dispatch({ type: 'SET_STATE', payload: { loadingSession: false } });
    return false;
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await deleteSimulatorSession(id);
    const lastId = await getLastSessionId();
    if (lastId === id) {
      await setLastSessionId("");
      dispatch({ type: 'DELETE_SESSION' });
    }
  }, []);

  const createNewSession = useCallback(async () => {
    const id = generateUUID();
    const createdAt = nowIso();
    const newSession: SimulatorSessionData = {
      id,
      name: "Nova Simulação",
      rooms: [],
      createdAt,
      updatedAt: createdAt,
      activeRoomId: null,
      selectedWallId: null
    };
    dispatch({ type: 'CREATE_SESSION', payload: newSession });
    await saveSimulatorSession({ 
      id: newSession.id, 
      name: newSession.name, 
      createdAt, 
      updatedAt: createdAt, 
      data: newSession 
    });
    await setLastSessionId(newSession.id);
  }, []);

  useEffect(() => {
    (async () => {
      const pendingId = localStorage.getItem("colora_pending_session");
      const isNewProject = localStorage.getItem("colora_new_project");

      if (isNewProject === "true") {
        localStorage.removeItem("colora_new_project");
        await createNewSession();
        dispatch({ type: 'SET_STATE', payload: { loadingSession: false } });
        return;
      }

      if (pendingId) {
        localStorage.removeItem("colora_pending_session");
        const record = await getSimulatorSession(pendingId);
        if (record?.data) {
          dispatch({ type: 'LOAD_SESSION', payload: record.data as any });
          await setLastSessionId(pendingId);
          dispatch({ type: 'SET_STATE', payload: { loadingSession: false } });
          return;
        }
      }

      const lastId = await getLastSessionId();
      if (lastId) {
        const record = await getSimulatorSession(lastId);
        if (record?.data) dispatch({ type: 'LOAD_SESSION', payload: record.data as any });
      }
      dispatch({ type: 'SET_STATE', payload: { loadingSession: false } });
    })();
  }, [createNewSession]);

  return { 
    session, loadingSession, rooms, activeRoom, activeRoomId, 
    selectedWallId, selectedPaint, isPainting, hasUnsavedChanges, 
    totalSimulations, addRoom, selectRoom, selectWall, setSelectedPaint, 
    applyColor, selectSimulation, removeSimulation, 
    manualSave: () => persist(false), setSessionName, clearRoom,
    retryAnalysis, listSessions, loadSession, deleteSession, createNewSession
  };
};
