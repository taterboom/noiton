import { collection, getDocs, setDoc, doc, addDoc, DocumentData, writeBatch, arrayUnion, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { NoteNode } from "../types/type";

const COLLECTION_NAME = process.env.collectionName as string;

const parse = (rawDoc: DocumentData) => {
  const noteNode = {
    id: rawDoc.id,
    ...rawDoc.data(),
  } as NoteNode
  return noteNode
}

const format = (object: Partial<NoteNode>, useFallback: boolean = true) => {
  return {
    name: object.name,
    raw: object.raw,
    cids: object.cids ?? (useFallback ? [] : undefined),
    pid: object.pid ?? (useFallback ? null: undefined),
  }
}

export const readAllDocs = async () => {
  const data = await getDocs(collection(db, COLLECTION_NAME))
  const formattedData = new Map<string, NoteNode>(data.docs.map((doc) => ([doc.id, parse(doc)])))
  return formattedData
}

export const createDoc = async (objectCreatator: (id: string) => NoteNode) => {
  const batch = writeBatch(db);
  // 添加doc
  const newObjectRef = doc(collection(db, COLLECTION_NAME))
  const noteNode = objectCreatator(newObjectRef.id)
  const formattedObject = format(noteNode)
  batch.set(newObjectRef, formattedObject)
  // 父元素添加cid
  if (formattedObject.pid) {
    batch.update(doc(db, COLLECTION_NAME, formattedObject.pid), {
      cids: arrayUnion(newObjectRef.id),
    });
  }
  await batch.commit();
  return noteNode;
}

export const deleteDocs = async (ids: Array<string>) => {
  const batch = writeBatch(db);
  ids.forEach(id => batch.delete(doc(db, COLLECTION_NAME, id)))
  await batch.commit();
}

export const saveDoc = async (id: NoteNode['id'], object: Partial<NoteNode>) => {
  await updateDoc(doc(db, COLLECTION_NAME, id), format(object));
}