/** Mongoose lean docs use `_id`; the app API uses `id`. */
export function withId<T extends { _id: unknown }>(doc: T): Omit<T, "_id" | "__v"> & { id: string } {
  const { _id, __v, ...rest } = doc as T & { __v?: unknown };
  return { ...rest, id: String(_id) } as Omit<T, "_id" | "__v"> & { id: string };
}

export function mapDocs<T extends { _id: unknown }>(docs: T[]) {
  return docs.map((d) => withId(d));
}
