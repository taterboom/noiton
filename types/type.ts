export type NoteNode = {
  id: string,
  name: string,
  raw: string,
  cids: Array<string>,
  pid: string | null,
}