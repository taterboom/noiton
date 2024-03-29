import type { NextPage } from 'next';
import { RecoilRoot } from 'recoil';
import { useState, useEffect, useCallback } from 'react';
import { Add, ChevronRight, Delete, ExpandMore, Sync } from "@mui/icons-material"
import { Alert, Button, Collapse, Dialog, DialogActions, DialogTitle, Fade, Menu, MenuItem, Portal, Snackbar, TextField } from "@mui/material"
import produce, { enableMapSet } from "immer"
import { atom, selector, useRecoilSnapshot, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import { TransitionProps } from '@mui/material/transitions';
import { useSpring, animated } from 'react-spring'
import { createDoc, deleteDocs, readAllDocs, saveDoc } from '../utils/api';
import { NoteNode } from '../types/type';
import useLoading from '../hooks/useLoading';
import { LoadingButton } from '@mui/lab';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DropDown from '../components/DropDown';
import { useLocalStorage } from 'react-use';
import { toast } from '../components/Toast';
import Editor from '../components/Editor';

enableMapSet();

const getName = (str: string) => {
  const res = str.match(/#\s+(.+)[\r\n]+/);
  if (!res) return;
  return res[1];
}

const noteNodesMapTraverse = (tree: NoteNodesMap, pid: string, cb: (id: string) => void) => {
  const handler = (id: string) => {
    cb(id)
    tree.get(id)?.cids.forEach(cid => {
      handler(cid)
    })
  }
  handler(pid)
}
const getChildrenIds = (tree: NoteNodesMap, pid: string, includeParentId: boolean = true) => {
  const ids: Array<string> = [];
  noteNodesMapTraverse(tree, pid, id => ids.push(id))
  return ids;
}

type Note = {
  id: string,
  name: string,
  raw: string,
  children: Array<Note>,
  parent: NoteNode | null,
}

const createNoteNode = (id: string, options?: Partial<Omit<NoteNode, 'id'>>): NoteNode => ({
  id,
  name: `default ${id}`,
  cids: [],
  pid: null,
  raw: `# default ${id}`,
  ...options,
});

const currentNoteIdState = atom<string | null>({
  key: 'currentNoteIdState',
  default: null,
})

type SyncingNoteIdsSet = Set<string>
const currentSyncingNoteIdsSetState = atom<SyncingNoteIdsSet>({
  key: 'currentSyncingNoteIdsState',
  default: new Set(),
})

const searchState = atom<string>({
  key: 'searchState',
  default: '',
})

const currentNoteSelector = selector({
  key: 'currentNoteSelector',
  get: ({ get }) => {
    const noteNodesMap = get(noteNodesMapState);
    const currentNoteId = get(currentNoteIdState);
    if (!currentNoteId) return null;
    return noteNodesMap.get(currentNoteId);
  },
})

type NoteNodesMap = Map<string, NoteNode>
const noteNodesMapState = atom<NoteNodesMap>({
  key: 'noteNodesMapState',
  default: new Map(),
});

const notesTreeSelector = selector({
  key: 'notesTree',
  get: ({ get }) => {
    const noteNodes = get(noteNodesMapState);
    const roots = [];

    for (const note of noteNodes.values()) {
      if (note.pid === null) {
        roots.push(note);
      }
    }

    const fillChildren = (noteNode: NoteNode): Note => {
      return {
        id: noteNode.id,
        name: noteNode.name,
        raw: noteNode.raw,
        children: noteNode.cids.filter(id => noteNodes.get(id)).map(id => fillChildren(noteNodes.get(id)!)),
        parent: noteNode.pid ? noteNodes.get(noteNode.pid)! : null,
      };
    }

    const tree = roots.map(fillChildren);

    return tree;
  }
})

const needSaveState = atom({
  key: 'needSaveSelector',
  default: false,
})

const AUTO_SAVE_TIME = 60;

const autoSaveCountDownState = atom({
  key: 'autoSaveCountDownState',
  default: AUTO_SAVE_TIME,
})

const autoSaveTimerState = atom<number | null>({
  key: 'autoSaveTimerState',
  default: null,
})

const useCheckNeedSave = () => {
  const needSave = useRecoilValue(needSaveState);
  return () => {
    if (needSave) {
      toast('save current editor!', { alertProps: { severity: 'error' } })
      return true;
    }
    return false;
  }
}

const ActionBar: React.FC = () => {
  const [loading, withLoading] = useLoading()
  const setNotesState = useSetRecoilState(noteNodesMapState)
  const [searchValue, setSearchValue] = useRecoilState(searchState)
  const checkNeedSave = useCheckNeedSave();
  const handleAdd = async () => {
    if (checkNeedSave()) return;
    const res = await withLoading(createDoc(id => createNoteNode(id)))
    setNotesState((origin) => produce(origin, draft => {
      draft.set(res.id, res)
    }))
  }
  return (
    <div className="flex h-16 py-3 px-2">
      <TextField label="search" size="small" value={searchValue} onChange={e => setSearchValue(e.target.value)}></TextField>
      <LoadingButton loading={loading} disabled={loading} className="ml-2 px-2.5 min-w-0" variant="outlined" size="small" onClick={handleAdd}><Add></Add></LoadingButton>
    </div>
  )
}

const TransitionComponent: React.FC<TransitionProps> = (props) => {
  const style = useSpring({
    from: {
      opacity: 0,
      transform: 'translate3d(20px,0,0)',
    },
    to: {
      opacity: props.in ? 1 : 0,
      transform: `translate3d(${props.in ? 0 : 20}px,0,0)`,
    },
  });

  return (
    <animated.div style={style}>
      <Collapse {...props} />
    </animated.div>
  );
}

const useSyncer = () => {
  const [currentSyncingNoteIdsSet, setCurrentSyncingNoteIdsSet] = useRecoilState(currentSyncingNoteIdsSetState);
  const noteNodesMap = useRecoilValue(noteNodesMapState);
  const start = useCallback((id: string) => {
    const ids = getChildrenIds(noteNodesMap, id);
    setCurrentSyncingNoteIdsSet(origin => produce(origin, draft => {
      ids.forEach(id => draft.add(id))
    }));
    return ids;
  }, [setCurrentSyncingNoteIdsSet, noteNodesMap]);
  const stop = useCallback((id: string) => {
    const ids = getChildrenIds(noteNodesMap, id);
    setCurrentSyncingNoteIdsSet(origin => produce(origin, draft => {
      ids.forEach(id => draft.delete(id))
    }));
    return ids;
  }, [setCurrentSyncingNoteIdsSet, noteNodesMap]);
  const getSyncing = useCallback((id: string) => currentSyncingNoteIdsSet.has(id), [currentSyncingNoteIdsSet]);

  return {
    getSyncing,
    start,
    stop,
  }
}

const NoteTreeItem: React.FC<{ note: Note | NoteNode }> = ({ note, children }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentDeleteId, setCurrentDeleteId] = useState<string | null>(null);
  const currentNoteId = useRecoilValue(currentNoteIdState);
  const noteNodesMap = useRecoilValue(noteNodesMapState);
  const setNeedSave = useSetRecoilState(needSaveState);
  const [loading, withLoading] = useLoading()
  const setNotesState = useSetRecoilState(noteNodesMapState)
  const checkNeedSave = useCheckNeedSave();
  const syncer = useSyncer();
  const handleAdd = async (currentId: NoteNode['id']) => {
    if (checkNeedSave()) return;
    syncer.start(currentId)
    const res = await withLoading(createDoc(id => createNoteNode(id, { pid: currentId })))
    syncer.stop(currentId)
    setNotesState((origin) => produce(origin, draft => {
      const currentNoteNode = origin.get(currentId)!;
      draft.set(res.id, res);
      draft.set(currentId, { ...currentNoteNode, cids: [...currentNoteNode.cids, res.id] })
    }))
  }
  const handleDelete = async (currentId: NoteNode['id']) => {
    const isCurrentDeleteIdAlsoCurrentNoteId = currentNoteId === currentId;
    if (isCurrentDeleteIdAlsoCurrentNoteId && checkNeedSave()) return;
    const ids = syncer.start(currentId)
    await withLoading(deleteDocs(ids))
    syncer.stop(currentId)
    setNotesState((origin) => produce(origin, draft => {
      const currentNoteNode = origin.get(currentId)!;
      noteNodesMapTraverse(noteNodesMap, currentId, id => draft.delete(id))
      if (currentNoteNode.pid) {
        const parentNoteNode = origin.get(currentNoteNode.pid)!;
        draft.set(parentNoteNode.id, { ...parentNoteNode, cids: parentNoteNode.cids.filter(cid => cid !== currentId) })
      }
    }))
    if (isCurrentDeleteIdAlsoCurrentNoteId) {
      setNeedSave(false);
    }
  }

  const syncing = syncer.getSyncing(note.id);

  return (
    <TreeItem
      nodeId={note.id}
      label={(
        <div className="group flex items-center justify-between">
          {note.name}
          <DropDown
            menu={(
              <Menu
                open={menuVisible}
                onClose={() => setMenuVisible(false)}
              >
                <MenuItem className="text-xs" onClick={() => { handleAdd(note.id); setMenuVisible(false) }}><Add className="mr-2 text-base" />Add</MenuItem>
                <MenuItem className="text-xs" onClick={(e) => { e.stopPropagation(); setCurrentDeleteId(note.id); setMenuVisible(false) }}><Delete className="mr-2 text-base" />Delete</MenuItem>
              </Menu>
            )}
          >
            <LoadingButton
              loading={syncing}
              disabled={syncing}
              className={`p-0 min-w-0 transition-opacity ${(syncing || menuVisible) ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}
              variant="text"
              onClick={(e) => { e.stopPropagation(); setMenuVisible(true) }}
            >
              <MoreHorizIcon></MoreHorizIcon>
            </LoadingButton>
          </DropDown>
          <Dialog open={currentDeleteId !== null} onClose={() => setCurrentDeleteId(null)}>
            <DialogTitle>Are you sure to delete the note and its children?</DialogTitle>
            <DialogActions>
              <Button onClick={(e) => { e.stopPropagation(); setCurrentDeleteId(null) }}>Cancel</Button>
              <Button color="error" onClick={(e) => { e.stopPropagation(); handleDelete(currentDeleteId!); setCurrentDeleteId(null); }}>Delete</Button>
            </DialogActions>
          </Dialog>
        </div>
      )}
      TransitionComponent={TransitionComponent}
    >
      {children}
    </TreeItem>
  )
}

const NotesTree: React.FC = () => {
  const noteNodesMap = useRecoilValue(noteNodesMapState)
  const notesTree = useRecoilValue(notesTreeSelector);
  const [currentNoteId, setCurrentNoteId] = useRecoilState(currentNoteIdState);
  const searchValue = useRecoilValue(searchState);
  const checkNeedSave = useCheckNeedSave();

  const renderTree = useCallback((notes: Array<Note>) => {
    if (notes.length === 0) return null;
    return notes.map(note => (
      <NoteTreeItem
        key={'tree' + note.id}
        note={note}
      >
        {renderTree(note.children)}
      </NoteTreeItem>
    )
    );
  }, [])

  const renderMap = useCallback((noteNodes: NoteNodesMap) => {
    return [...noteNodes.values()].filter(noteNode => noteNode.name.includes(searchValue)).map(noteNode => (
      <NoteTreeItem
        key={'map' + noteNode.id}
        note={noteNode}
      >
      </NoteTreeItem>
    )
    )
  }, [searchValue])

  const onTreeNodeSelect = (e: any, id: string) => {
    if (checkNeedSave()) return;
    setCurrentNoteId(id);
  };

  return <div>
    <TreeView
      selected={currentNoteId || ''}
      defaultCollapseIcon={<ExpandMore />}
      defaultExpandIcon={<ChevronRight />}
      onNodeSelect={onTreeNodeSelect}
    >
      {
        searchValue ? renderMap(noteNodesMap) : renderTree(notesTree)
      }
    </TreeView>
  </div>
}

const Sider: React.FC = () => {
  return (
    <div className="h-screen w-72 shrink-0 bg-[#1e1c1e]">
      <ActionBar />
      <NotesTree />
    </div>
  )
}

const useSave = () => {
  const currentNote = useRecoilValue(currentNoteSelector);
  const setNeedSave = useSetRecoilState(needSaveState);
  const syncer = useSyncer();
  return async () => {
    if (!currentNote) return;
    syncer.start(currentNote.id);
    await saveDoc(currentNote.id, currentNote)
    syncer.stop(currentNote.id);
    setNeedSave(false);
  }
}

const Save: React.FC = () => {
  const [successVisible, setSuccessVisible] = useState(false);
  const currentNote = useRecoilValue(currentNoteSelector);
  const syncer = useSyncer();
  const { stop } = useAutoSave();
  const save = useSave();
  const handleSave = async () => {
    if (!currentNote) return;
    await save();
    setSuccessVisible(true);
    stop();
  }
  const loading = currentNote ? syncer.getSyncing(currentNote.id) : false;
  return (
    <>
      <Fade in={!!currentNote}>
        <LoadingButton
          loading={loading}
          disabled={loading}
          className='absolute bottom-10 right-4 min-w-0 w-12 h-12 rounded-full z-10'
          variant='contained'
          onClick={() => handleSave()}
        ><Sync /></LoadingButton>
      </Fade>
      <Portal>
        <Snackbar open={successVisible} autoHideDuration={3000} onClose={() => setSuccessVisible(false)}>
          <Alert onClose={() => setSuccessVisible(false)} severity="success" sx={{ width: '100%' }}>
            Save success
          </Alert>
        </Snackbar>
      </Portal>
    </>
  )
}

const useAutoSave = () => {
  const [countDown, setCountDown] = useRecoilState(autoSaveCountDownState);
  const [autoSaveTimer, setAutoSaveTimer] = useRecoilState(autoSaveTimerState);

  const clearAutoSaveTimer = () => {
    if (autoSaveTimer) {
      window.clearInterval(autoSaveTimer)
      setAutoSaveTimer(null)
    }
  }

  useEffect(() => {
    if (countDown === 0 && autoSaveTimer) {
      clearAutoSaveTimer()
    }
  }, [countDown])

  return {
    start: () => {
      setCountDown(AUTO_SAVE_TIME)
      clearAutoSaveTimer()
      setAutoSaveTimer(window.setInterval(() => {
        setCountDown(v => v - 1)
      }, 1000))
    },
    stop: () => {
      clearAutoSaveTimer();
      setCountDown(AUTO_SAVE_TIME)
    },
    countDown,
  }
}

const Content: React.FC = () => {
  const currentNoteId = useRecoilValue(currentNoteIdState);
  const currentNote = useRecoilValue(currentNoteSelector);
  const setNoteNodesMap = useSetRecoilState(noteNodesMapState);
  const setNeedSave = useSetRecoilState(needSaveState);
  const { start } = useAutoSave();

  return (
    <div className="flex flex-1 bg-[#26272d]">
      {
        currentNote && currentNoteId ? <>
          <div className="relative flex-1">
            <Editor
              key={currentNoteId}
              initialValue={currentNote.raw}
              onChange={(editorValue) => {
                setNoteNodesMap((origin) => produce(origin, draft => {
                  draft.set(currentNoteId, { ...draft.get(currentNoteId)!, name: getName(editorValue) || '', raw: editorValue })
                }));
                start();
                setNeedSave(true)
              }}
            >
            </Editor>
            <Save></Save>
            <AutoSave></AutoSave>
          </div>
        </> : 'Pick a Note'
      }
    </div>
  )
}

const useDataInitializer = () => {
  const setNoteNodeMap = useSetRecoilState(noteNodesMapState)
  useEffect(() => {
    readAllDocs().then(data => {
      setNoteNodeMap(data)
    })
  }, [])
}

const AutoSave: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { countDown, stop } = useAutoSave();
  const save = useSave();
  useEffect(() => {
    if (countDown <= 0) {
      save()
      setOpen(false)
    } else if (countDown <= 10) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [countDown])
  return (
    <Snackbar open={open} autoHideDuration={6000} transitionDuration={0}>
      <Alert severity="info" sx={{ width: '100%' }} onClose={() => { setOpen(false); stop() }}>
        auto save after {countDown}s
      </Alert>
    </Snackbar>
  )
}

const Note: React.FC = () => {
  const snapshot = useRecoilSnapshot();
  const needSave = useRecoilValue(needSaveState);
  useDataInitializer()
  useEffect(() => {
    console.debug('The following atoms were modified:');
    for (const node of snapshot.getNodes_UNSTABLE({ isModified: true })) {
      console.debug(node.key, snapshot.getLoadable(node));
    }
  }, [snapshot]);

  useEffect(() => {
    window.onbeforeunload = needSave ? function (e) {
      e.returnValue = ("确定离开当前页面吗？");
    } : null
  }, [needSave]);

  return <div key="Note" className="flex min-h-screen text-slate-100 bg-stone-900">
    <Sider></Sider>
    <Content></Content>
  </div>
}

const NotePage: NextPage = () => {
  const [inputPassword, setInputPassword] = useLocalStorage('_drowssap', '')
  const isMe = inputPassword === process.env.notesPassword
  if (typeof window === "undefined") return <p>Loading...</p>
  return (
    isMe
      ? <RecoilRoot><Note /></RecoilRoot>
      : <div key="password" className="flex min-h-screen justify-center items-center text-slate-100 bg-stone-900"><TextField label="password" variant="standard" onChange={e => setInputPassword(e.target.value)} /></div>
  )
}

export default NotePage

