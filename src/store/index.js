import {
  configureStore,
  createAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { firebaseEnabled } from "../services/firebase/config";
import { deleteRecord, deleteRecords, saveRecord } from "../services/api";
import { errorText } from "../utils/error";
import { normalizeTransactions } from "../utils/finance";

const saved = firebaseEnabled
  ? {}
  : JSON.parse(localStorage.getItem("rw-data") || "{}");

export const resetWorkspace = createAction("workspace/reset");

export const saveRecordThunk = createAsyncThunk(
  "records/save",
  async ({ collection, item, userId }, { rejectWithValue }) => {
    try {
      return {
        collection,
        item: await saveRecord(collection, item, userId),
      };
    } catch (error) {
      return rejectWithValue(errorText(error, "Could not save this record."));
    }
  },
);

export const deleteRecordThunk = createAsyncThunk(
  "records/delete",
  async ({ collection, id, related = [] }, { rejectWithValue }) => {
    try {
      await deleteRecord(collection, id);
      if (related.length) await deleteRecords(related);
      return { collection, id, related };
    } catch (error) {
      return rejectWithValue(errorText(error, "Could not delete this record."));
    }
  },
);

export const saveFirestoreRecord = saveRecordThunk;
export const deleteFirestoreRecord = deleteRecordThunk;

const applyRecordThunks = (builder, collection) => {
  builder
    .addCase(resetWorkspace, () => [])
    .addCase(saveRecordThunk.fulfilled, (state, action) => {
      if (action.payload.collection !== collection) return;
      const item = action.payload.item;
      const index = state.findIndex((row) => row.id === item.id);
      if (index > -1) state[index] = item;
      else state.unshift(item);
    })
    .addCase(deleteRecordThunk.fulfilled, (state, action) => {
      const { collection: name, id, related = [] } = action.payload;
      const relatedIds = related
        .filter((row) => row.collection === collection)
        .map((row) => row.id);
      return state.filter(
        (row) =>
          !(name === collection && row.id === id) &&
          !relatedIds.includes(row.id),
      );
    });
};

const createDataSlice = (name) =>
  createSlice({
    name,
    initialState:
      name === "expenses"
        ? normalizeTransactions(saved[name] || [])
        : saved[name] || [],
    reducers: {
      set: (_, a) =>
        name === "expenses" ? normalizeTransactions(a.payload) : a.payload,
      add: (s, a) => {
        s.unshift(a.payload);
      },
      update: (s, a) => {
        const i = s.findIndex((x) => x.id === a.payload.id);
        if (i > -1) s[i] = a.payload;
      },
      remove: (s, a) => s.filter((x) => x.id !== a.payload),
    },
    extraReducers: (builder) => applyRecordThunks(builder, name),
  });

export const projectsSlice = createDataSlice("projects"),
  costCentersSlice = createDataSlice("costCenters"),
  projectStatusesSlice = createDataSlice("projectStatuses"),
  expensesSlice = createDataSlice("expenses");

const authSlice = createSlice({
  name: "auth",
  initialState: firebaseEnabled
    ? null
    : JSON.parse(localStorage.getItem("rw-user") || "null"),
  reducers: {
    login: (_, a) => a.payload,
    logout: () => null,
    updateProfile: (s, a) => ({ ...s, ...a.payload }),
  },
});

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    dark: localStorage.getItem("rw-dark") === "true",
    accent: localStorage.getItem("rw-accent") || "emerald",
    dataReady: !firebaseEnabled,
  },
  reducers: {
    toggleDark: (s) => ({ ...s, dark: !s.dark }),
    setDark: (s, a) => ({ ...s, dark: a.payload }),
    setAccent: (s, a) => ({ ...s, accent: a.payload }),
    setDataReady: (s, a) => ({ ...s, dataReady: a.payload }),
  },
});

export const { login, logout, updateProfile } = authSlice.actions;
export const { toggleDark, setDark, setAccent, setDataReady } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    projects: projectsSlice.reducer,
    costCenters: costCentersSlice.reducer,
    projectStatuses: projectStatusesSlice.reducer,
    expenses: expensesSlice.reducer,
    ui: uiSlice.reducer,
  },
});

store.subscribe(() => {
  const s = store.getState();
  if (!firebaseEnabled) {
    localStorage.setItem(
      "rw-data",
      JSON.stringify({
        projects: s.projects,
        costCenters: s.costCenters,
        projectStatuses: s.projectStatuses,
        expenses: s.expenses,
      }),
    );
  }
  localStorage.setItem("rw-user", JSON.stringify(s.auth));
  localStorage.setItem("rw-dark", s.ui.dark);
  localStorage.setItem("rw-accent", s.ui.accent);
});
