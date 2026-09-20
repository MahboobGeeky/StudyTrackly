/** Mongoose lean docs use `_id`; the app API uses `id`. */
export function withId(doc) {
  const { _id, __v, ...rest } = doc;
  return { ...rest, id: String(_id) };
}

export function mapDocs(docs) {
  return docs.map((d) => withId(d));
}
